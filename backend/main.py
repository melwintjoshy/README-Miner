from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
from pathlib import Path
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.utils.main_utils import * 


app = FastAPI()

# Allow React frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    import os

    

    clone_to = os.path.join(BASE_DIR, "output", "cloned_repo")
    output_md = os.path.join(BASE_DIR, "output", "project_summary.md")
    output_readme = os.path.join(BASE_DIR, "output", "README.md")


    clone_to = Path("output/cloned_repo")

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
