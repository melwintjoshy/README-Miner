import argparse
from src.utils.main_utils import *

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate README from GitHub repo")
    parser.add_argument('--repo', required=True, help="GitHub repository URL")
    args = parser.parse_args()

    repo_url = args.repo  
    clone_to = "./cloned_repo"
    output_md = "./project_summary.md"
    output_readme = "./README.md"

    print(f"📥 Cloning repo from: {repo_url}")
    repo_path = clone_repo(repo_url, clone_to)

    print("Collecting files...")
    files = get_all_files(repo_path)

    print("Generating summaries...")
    summary_markdown = generate_summaries(files, repo_path)
    save_markdown(summary_markdown, output_md)

    print("Generating README...")
    readme_content = generate_readme(summary_markdown)
    save_markdown(readme_content, output_readme)

    print("✅ All done! Check README.md and project_summary.md")

    # delete_old_files(output_md)
    # delete_old_files(output_readme)
    # delete_old_files(clone_to)