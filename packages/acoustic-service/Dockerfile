# Python 3.12 on Linux: NumPy/SciPy install from wheels (avoids Fortran/toolchain builds
# that happen on Windows with unsupported interpreters like 3.14).
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py service.py ./
COPY routers ./routers
COPY services ./services
COPY db ./db

EXPOSE 8765

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8765"]
