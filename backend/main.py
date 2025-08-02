from fastapi import FastAPI, Request,Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
from pathlib import Path
import sys
from google.oauth2 import id_token
from db import SessionLocal, init_db
from models import User
from sqlalchemy.orm import Session
from google.auth.transport import requests as grequests
import os

init_db()  # creates tables on app startup

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.utils.main_utils import * 

app = FastAPI()

# Allow React frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://readme-miner.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    repo_url: str

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))  # one level above backend/

@app.post("/get_readme")
async def get_readme(request: RepoRequest):
    repo_url = f"{request.repo_url}.git"

    clone_to = os.path.join(BASE_DIR, "output", "cloned_repo")
    output_md = os.path.join(BASE_DIR, "output", "project_summary.md")
    output_readme = os.path.join(BASE_DIR, "output", "README.md")


    clone_to = Path(clone_to)

    if clone_to.exists():
        print("Removing old cloned_repo folder...")
        remove_path(clone_to)
        
    print("Cloning repo...")
    repo_path = clone_repo(repo_url, clone_to)

    print("Collecting files...")
    files = get_all_files(repo_path)

    print("Generating summaries...")
    summary_markdown = generate_summaries(files, repo_path)
    save_markdown(summary_markdown, output_md)

    print("Generating README...")
    readme_content = generate_readme(summary_markdown)
    save_markdown(readme_content, output_readme)

    print("Done ✅")
    return
@app.get("/download_readme")
def download_readme():
    filepath = os.path.join(BASE_DIR, "output", "README.md")

    if not os.path.exists(filepath):
        return {"error": "README.md not found"}

    return FileResponse(
        path=filepath,
        media_type='text/markdown',
        filename='README.md',
    )
    
GOOGLE_CLIENT_ID = "123890995190-pm9va1aupc6hotk1veu0cbr723kqck8o.apps.googleusercontent.com"

class UserIn(BaseModel):
    token: str

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserIn(BaseModel):
    token: str

@app.post("/store_user")
async def store_user(user_in: UserIn, db: Session = Depends(get_db)):
    try:
        # Verify token
        idinfo = id_token.verify_oauth2_token(user_in.token, grequests.Request(), GOOGLE_CLIENT_ID)

        user_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")

        # Check if user exists
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            user = User(id=user_id, email=email, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ New user created: {email}")
        else:
            print(f"ℹ️ User already exists: {email}")

        return {"message": "User verified & stored", "email": email}

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID token")
