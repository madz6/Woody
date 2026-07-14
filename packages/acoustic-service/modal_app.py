"""Woody Acoustic Service — Modal.com Deployment.

Deploys main.py (CLAP + arc + legacy /analyze) as a Modal ASGI endpoint.

Setup:
  pip install modal
  modal token new           # one-time auth
  modal deploy modal_app.py

Modal prints your endpoint URL after deploy:
  https://<workspace>--woody-acoustic-clap-fastapi-app.modal.run

Add it to .env.local:
  ACOUSTIC_SERVICE_URL=https://<workspace>--woody-acoustic-clap-fastapi-app.modal.run

GPU notes:
  - T4 (gpu="T4") is sufficient for CLAP inference; ~$0.59/hr per Modal pricing
  - scaledown_window=120 lets the container shut down 2 min after
    last request, keeping costs near $0 for idle dev work
  - First request to a cold container pays the model download + load (~30-60s)
  - WOODY_PRELOAD_CLAP=1 forces eager load at container start (preferred for
    deploys where you control idle-down timing)
"""

from __future__ import annotations

import modal

APP_NAME = "woody-acoustic-clap"

# Image: Python 3.11, ffmpeg/libsndfile for librosa, then pip from requirements.txt
# baked into the image so cold start doesn't re-resolve dependencies.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install(
        # FastAPI/web
        "fastapi[standard]==0.115.0",
        "uvicorn[standard]==0.30.0",
        "pydantic==2.7.0",
        # Audio (Layer 1 legacy + CLAP audio decode)
        "librosa==0.10.2",
        "soundfile==0.12.1",
        "scipy==1.13.0",
        # CLAP — Layer 2 navigation
        "torch>=2.2,<3",
        "transformers>=4.45.0,<5",
        # Embedding storage
        "sqlite-vec==0.1.6",
        # Networking
        "httpx==0.27.0",
        "numpy==1.26.4",
    )
    # Whitelist runtime source only. Do not upload local data, test output, docs,
    # environment files, or the rest of the repository.
    .add_local_file("main.py", "/woody-acoustic/main.py")
    .add_local_file("service.py", "/woody-acoustic/service.py")
    .add_local_dir("routers", "/woody-acoustic/routers")
    .add_local_dir("services", "/woody-acoustic/services")
    .add_local_dir("db", "/woody-acoustic/db")
)

app = modal.App(APP_NAME, image=image, include_source=False)
corpus_volume = modal.Volume.from_name("woody-corpus", create_if_missing=True)
service_secret = modal.Secret.from_name("woody-acoustic-service", required_keys=["WOODY_SERVICE_TOKEN"])


@app.function(
    gpu="T4",                       # CLAP inference — T4 is plenty
    scaledown_window=120,           # idle-down after 2 min, keeps dev cost low
    timeout=300,                    # allow 5-min requests (batch of 50 tracks on CPU edge case)
    memory=4096,                    # CLAP ~1.5GB model + processing headroom
    cpu=2.0,
    secrets=[service_secret],
    volumes={"/data": corpus_volume},
)
@modal.asgi_app()
def fastapi_app():
    """Mount the local main.py FastAPI app inside the Modal container."""
    import os
    import sys

    # The container has the source at /woody-acoustic — put it on path
    sys.path.insert(0, "/woody-acoustic")
    # Preload CLAP on container start so the first inference doesn't pay the load cost
    os.environ["WOODY_PRELOAD_CLAP"] = "1"
    os.environ["WOODY_DB_PATH"] = "/data/woody.db"

    from main import app as _app  # noqa: PLC0415
    return _app


# ─── Parity test helper ──────────────────────────────────────────────────────
# Run this LOCALLY after deploying to confirm Modal embeddings match the local
# service within 1e-4 cosine. Same input text -> very similar 512D vector.
#
#   python -m modal_app parity_test --local http://localhost:8765 \
#                                    --modal https://<workspace>--woody-acoustic-clap-fastapi-app.modal.run

if __name__ == "__main__":
    import argparse
    import asyncio

    import httpx
    import numpy as np

    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["parity_test"])
    parser.add_argument("--local", default="http://localhost:8765")
    parser.add_argument("--modal", required=True)
    args = parser.parse_args()

    async def parity() -> int:
        async with httpx.AsyncClient(timeout=60.0) as client:
            tests = [
                "late night drive on an empty highway",
                "deep focus coding session no lyrics",
                "morning run",
            ]
            for text in tests:
                local_resp = await client.post(f"{args.local}/embed/text", json={"text": text})
                modal_resp = await client.post(f"{args.modal}/embed/text", json={"text": text})
                local_vec = np.asarray(local_resp.json()["embedding"], dtype=np.float32)
                modal_vec = np.asarray(modal_resp.json()["embedding"], dtype=np.float32)
                cos = float(np.dot(local_vec, modal_vec))  # both unit-norm
                cosine_dist = 1.0 - cos
                ok = cosine_dist < 1e-4
                marker = "OK " if ok else "FAIL"
                print(f"  {marker}  '{text}'  cosine_distance={cosine_dist:.6f}")
        return 0

    if args.command == "parity_test":
        raise SystemExit(asyncio.run(parity()))
