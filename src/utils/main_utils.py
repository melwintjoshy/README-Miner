import os
import time
import git
import markdown
from pathlib import Path
from typing import List
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import nbformat
from nbconvert import MarkdownExporter
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pathlib import Path
import os
import stat

def clone_repo(repo_url: str, clone_to: str) -> str:
    git.Repo.clone_from(repo_url, clone_to)
    return clone_to

def get_all_files(repo_path: str) -> List[str]:
    files = []
    for root, _, filenames in os.walk(repo_path):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            if filepath.endswith(('.py', '.md', '.txt', '.ipynb')):  # You can customize this
                files.append(filepath)
    return files

#ok
def summarize_with_llm(file_content: str) -> str:
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite", google_api_key = "AIzaSyBrSDa5b2XtiKTnxQfV5SujuRL-Zoiowho")

    template = (
        "You're a coding assistant. Summarize the functionality of the following code file:\n\n"
        "```python\n{code}\n```\n\n"
        "Summary:"
    )

    prompt = PromptTemplate(
        input_variables=["code"],
        template=template
    )

    llm_chain = prompt | llm

    summary = llm_chain.invoke({
        "code": file_content
    })

    return f"###{summary.content}\n"

#ok
def convert_file_to_markdown(file_path: str) -> str:
    """Convert .py or .ipynb to markdown. Other text files are returned as-is."""
    if file_path.endswith('.py'):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            code = f.read()
        # Wrap code in markdown code block
        return f"```python\n{code}\n```"

    elif file_path.endswith('.ipynb'):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            nb = nbformat.read(f, as_version=4)
        exporter = MarkdownExporter()
        body, _ = exporter.from_notebook_node(nb)
        return body

    else:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

def generate_summaries(files: List[str], repo_path: str) -> str:
    summary_md = "# 📄 Project File Summaries\n\n"
    for file_path in files:
        try:
            content_md = convert_file_to_markdown(file_path)
            summary = summarize_with_llm(content_md)
            summary_md += summary + "\n"
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    return summary_md

def generate_readme(project_details: str) -> str:
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite", google_api_key = "AIzaSyBrSDa5b2XtiKTnxQfV5SujuRL-Zoiowho")

    template = (
        "You're a github readme generator expert. Generate the readme file for the project with following project details:\n\n"
        "Project details: {project_details}\n\n"
        "It should contain only the following:"
        "ReadMe: "
    )

    prompt = PromptTemplate(
        input_variables=["project_details"],
        template=template
    )

    llm_chain = prompt | llm

    file = llm_chain.invoke({
        "project_details": project_details,
    })

    return f"###README : {file.content}\n"

def save_markdown(content: str, path: str):
    with open(path, 'w', encoding='utf-8') as f:  # ✅ use utf-8
        f.write(content)

def delete_old_files(folder_path: str, max_age_minutes: int = 2):
    current_time = time.time()
    deleted_files = []

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)

        if os.path.isfile(file_path):
            # Get the time of last modification or creation (platform dependent)
            file_creation_time = os.path.getctime(file_path)  # In seconds

            # Calculate file age in minutes
            file_age_minutes = (current_time - file_creation_time) / 60

            if file_age_minutes > max_age_minutes:
                try:
                    os.remove(file_path)
                    deleted_files.append(filename)
                    print("Deleted created files.")
                except Exception as e:
                    print(f"Failed to delete {file_path}: {e}")

def remove_path(path: Path):
    for sub in path.iterdir():
        if sub.is_dir():
            remove_path(sub)
        else:
            # Make file writable and delete
            sub.chmod(stat.S_IWRITE)
            sub.unlink()
    path.rmdir()


if __name__ == "__main__":
    repo_url = "https://github.com/your/repo.git"
    clone_to = "./cloned_repo"
    output_md = "./project_summary.md"
    output_readme = "./README.md"

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
