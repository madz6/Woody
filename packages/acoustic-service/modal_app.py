"""
Woody Acoustic Service — Modal.com Deployment
==============================================
Deploys service.py as a serverless endpoint on Modal.

Setup:
  pip install modal
  modal token new   # authenticate once
  modal deploy modal_app.py

After deploy, Modal prints your endpoint URL:
  https://<your-workspace>--woody-acoustic-service-fastapi-app.modal.run

Add it to .env.local:
  ACOUSTIC_SERVICE_URL=https://<your-workspace>--woody-acoustic-service-fastapi-app.modal.run
"""

import modal

# Build image with all audio processing dependencies
# ffmpeg is required by librosa for MP3 decoding
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install(
        "fastapi[standard]==0.115.0",
        "uvicorn==0.30.0",
        "librosa==0.10.2",
        "numpy==1.26.4",
        "httpx==0.27.0",
        "pydantic==2.7.0",
        "scipy==1.13.0",
        "soundfile==0.12.1",
    )
)

app = modal.App("woody-acoustic-service", image=image)


@app.function(
    # Cold start time is acceptable for discovery — not a real-time playback dependency
    container_idle_timeout=120,
    # CPU is sufficient for librosa — no GPU needed
    cpu=2.0,
    memory=1024,
    # Timeout generous enough for 20 concurrent 30s audio downloads + analysis
    timeout=120,
)
@modal.asgi_app()
def fastapi_app():
    # Import here so Modal serializes the function with the image context
    from service import app as _app  # noqa: PLC0415
    return _app
