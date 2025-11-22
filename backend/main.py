from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import os
import uuid
from sqlalchemy.orm import Session
from backend.db import SessionLocal, init_db
from backend.config import get_settings
from backend.auth import exchange_google_credential, verify_jwt
from backend.main_utils import clone_repo, get_all_files, generate_summaries, generate_readme, save_markdown, remove_path

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.FRONTEND_URL)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GoogleAuthPayload(BaseModel):
    credential: str

class RepoRequest(BaseModel):
    repo_url: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.post("/auth/google")
def auth_google(payload: GoogleAuthPayload, db: Session = Depends(get_db)):
    token = exchange_google_credential(payload.credential, db)
    return {"access_token": token, "token_type": "bearer"}

def require_jwt(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    raw = authorization.split(" ", 1)[1]
    verify_jwt(raw)
    return True

_jobs: dict[str, dict] = {}

# Resolve output directory relative to this module to avoid CWD issues
BACKEND_DIR = Path(__file__).resolve().parent
OUTPUT_ROOT = BACKEND_DIR / "output"

def validate_repo_url(url: str) -> str:
    if not url.startswith("https://github.com/"):
        raise ValueError("Only GitHub repositories allowed")
    return url if url.endswith(".git") else url + ".git"

def generate_job(job_id: str, repo_url: str):
    try:
        safe_url = validate_repo_url(repo_url)
        base_dir = OUTPUT_ROOT / f"job_{job_id}"
        repo_dir = base_dir / "repo"
        readme_path = base_dir / "README.md"
        base_dir.mkdir(parents=True, exist_ok=True)
        if repo_dir.exists():
            remove_path(repo_dir)
        repo_path = clone_repo(safe_url, repo_dir)
        files = get_all_files(repo_path)
        summaries = generate_summaries(files, repo_path)
        content = generate_readme(summaries)
        save_markdown(content, readme_path)
        _jobs[job_id]["status"] = "completed"
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)

@app.post("/get_readme")
def get_readme(req: RepoRequest, background: BackgroundTasks, _=Depends(require_jwt)):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "pending"}
    background.add_task(generate_job, job_id, req.repo_url)
    return {"job_id": job_id, "status": "pending"}

@app.get("/readme/{job_id}")
def readme_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "completed":
        return job
    readme_path = OUTPUT_ROOT / f"job_{job_id}" / "README.md"
    if not readme_path.exists():
        raise HTTPException(status_code=404, detail="README missing")
    return FileResponse(str(readme_path), media_type="text/markdown", filename="README.md")
