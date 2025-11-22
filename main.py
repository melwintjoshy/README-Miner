# Root entrypoint to avoid module path confusion in deployment
# Run with: uvicorn main:app --host 0.0.0.0 --port 8000
from backend.main import app  # noqa: F401
