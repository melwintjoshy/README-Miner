from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,EmailStr
from fastapi.responses import FileResponse,RedirectResponse
from pathlib import Path
import sys
import os
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.utils.main_utils import *
from backend.database import engine, Base, get_db
from backend.models import User, Readme
from backend.auth import (
    create_access_token, get_password_hash,
    get_current_active_verified_user, get_current_user_unverified,
    ACCESS_TOKEN_EXPIRE_MINUTES, VERIFICATION_TOKEN_EXPIRE_HOURS,
    verify_password, create_verification_token
)
from backend.email_utils import send_verification_email

app = FastAPI()

# Allow React frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

class RepoRequest(BaseModel):
    repo_url: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@app.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        if db_user.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered and verified.")
        else:
            raise HTTPException(status_code=400, detail="Email already registered but not verified. Check your inbox.")

    hashed_password = get_password_hash(user_data.password)
    verification_token = create_verification_token()
    verification_token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_token_expires
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_link = f"{FRONTEND_URL}/verify?token={verification_token}"
    send_verification_email(new_user.email, new_user.email.split('@')[0], verification_link)

    return {"message": "Registration successful! Please check your email to verify your account."}

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please check your email for a verification link."
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/verify")
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        return RedirectResponse(url=f"{FRONTEND_URL}/verification-status?status=invalid_token", status_code=302)

    if user.is_verified:
        return RedirectResponse(url=f"{FRONTEND_URL}/verification-status?status=already_verified", status_code=302)

    if user.verification_token_expires and datetime.utcnow() > user.verification_token_expires:
        return RedirectResponse(url=f"{FRONTEND_URL}/verification-status?status=expired_token", status_code=302)

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    db.refresh(user)

    return RedirectResponse(url=f"{FRONTEND_URL}/verification-status?status=success", status_code=302)

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_active_verified_user)):
    return current_user

@app.post("/get_readme")
async def get_readme(request: RepoRequest, current_user: User = Depends(get_current_active_verified_user), db: Session = Depends(get_db)):
    repo_url = f"{request.repo_url}.git"

    clone_to = os.path.join(BASE_DIR, "output", "cloned_repo")
    output_md = os.path.join(BASE_DIR, "output", "project_summary.md")
    output_readme_path = os.path.join(BASE_DIR, "output", "README.md")

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
    save_markdown(readme_content, output_readme_path)

    new_readme_entry = Readme(
        user_id=current_user.id,
        repo_url=request.repo_url,
        readme_content=readme_content
    )
    db.add(new_readme_entry)
    db.commit()
    db.refresh(new_readme_entry)

    print("Done ✅")
    return {"message": "README generated and saved!"}

@app.get("/download_readme")
def download_readme(current_user: User = Depends(get_current_active_verified_user)):
    filepath = os.path.join(BASE_DIR, "output", "README.md")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="README.md not found. Please generate it first.")

    return FileResponse(
        path=filepath,
        media_type='text/markdown',
        filename='README.md',
    )

@app.get("/history")
async def get_user_readmes(current_user: User = Depends(get_current_active_verified_user), db: Session = Depends(get_db)):
    user_readmes = db.query(Readme).filter(Readme.user_id == current_user.id).order_by(Readme.generated_at.desc()).all()
    return [{"id": readme.id, "repo_url": readme.repo_url, "generated_at": readme.generated_at} for readme in user_readmes]

@app.get("/history/{readme_id}")
async def get_single_readme_from_history(readme_id: int, current_user: User = Depends(get_current_active_verified_user), db: Session = Depends(get_db)):
    readme = db.query(Readme).filter(Readme.id == readme_id, Readme.user_id == current_user.id).first()
    if not readme:
        raise HTTPException(status_code=404, detail="README not found or you don't have access to it.")
    return {"repo_url": readme.repo_url, "readme_content": readme.readme_content, "generated_at": readme.generated_at}

@app.post("/cleanup")
async def cleanup_old_files(current_user: User = Depends(get_current_active_verified_user)):
    output_folder = os.path.join(BASE_DIR, "output")
    delete_old_files(output_folder, max_age_minutes=5)
    cloned_repo_path = Path(os.path.join(BASE_DIR, "output", "cloned_repo"))
    if cloned_repo_path.exists():
        pass
    return {"message": "Old files cleaned up."}