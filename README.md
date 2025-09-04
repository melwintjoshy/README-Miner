# 📌 Readme Miner - Automated README Generation

## 🧠 Overview

Readme Miner is a project designed to automate the creation of comprehensive and informative README.md files for software projects. It leverages the power of Large Language Models (LLMs), specifically Google Gemini, to analyze code, generate summaries, and assemble a complete project documentation file.  The backend is built using FastAPI, offering endpoints for generating and downloading READMEs, along with user authentication using Google OAuth. The frontend is built using React. The project utilizes various Python libraries for tasks such as code analysis, file handling, Git repository interaction, and database management.

## ⚙️ Features

*   **Automated README Generation:**  Automatically generates a README.md file based on a given GitHub repository URL.
*   **Code Analysis:** Analyzes Python, Markdown, and Jupyter Notebook files within the repository.
*   **LLM-Powered Summarization:**  Utilizes Google Gemini LLM to summarize individual files and the overall project.
*   **Database Integration:** Stores user information (Google ID, email, name) for authentication and potential future features.
*   **User Authentication:** Implements Google OAuth for secure user login and access.
*   **CORS Configuration:**  Allows requests from a specified React frontend origin.
*   **File Handling:**  Handles file cloning, conversion, and cleanup.
*   **Download Functionality:** Provides an endpoint to download the generated README.md file.

## 🛠️ Installation Steps

1.  **Clone the repository:**

    ```bash
    git clone "https://github.com/melwintjoshy/README-Miner"
    cd <README-Miner>
    ```

2.  **Set up your environment:**

    *   **Python Version:** This project requires Python 3.10 or later.
    *   **Create a virtual environment:**
        ```bash
        python -m venv .venv
        source .venv/bin/activate  # Linux/macOS
        # or
        .venv\Scripts\activate   # Windows
        ```
    *   **Install dependencies:**

        ```bash
        pip install -r requirements.txt
        ```
        (Note: The `requirements.txt` file, which includes the packages listed in the project summary, must be present in the project root.)

3.  **Configure Environment Variables:**

    *   Create a `.env` file in the project root.
    *   Populate the `.env` file with the following variables (replace placeholders with your actual values):

        ```
        DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database_name>
        GOOGLE_CLIENT_ID=<your_google_client_id>
        GOOGLE_CLIENT_SECRET=<your_google_client_secret>
        ALLOWED_ORIGINS="http://localhost:3000" # Example:  Add your frontend's origin here
        ```

4.  **Initialize the Database:**

    *   Run the database initialization script (This step is likely included in your main FastAPI application's startup).

        ```bash
        # Example (assuming a script named "init_db.py" exists):
        python init_db.py
        ```

        (Alternatively, this could be handled within the FastAPI application itself.)

## 🚀 How to Run / Usage Instructions

1.  **Run the Backend (FastAPI):**

    ```bash
    uvicorn main:app --reload
    ```

    This command starts the FastAPI backend, making it accessible.  The `--reload` flag enables automatic reloading upon code changes during development.

2.  **Run the React Frontend :**

    *   Navigate to your React frontend directory (if separate from the backend).
    *   Run the start command provided in the Create React App guide:

        ```bash
        npm start
        ```

3.  **Using the API:**

    *   **Generate README:**  Send a POST request to the `/get_readme` endpoint, providing the GitHub repository URL as a parameter (e.g., in the request body or as a query parameter).
    *   **Download README:**  After the README is generated, send a GET request to the `/download_readme` endpoint to download the file.
    *   **User Authentication:**  Use the `/store_user` endpoint to handle user authentication via Google OAuth. This will likely involve a Google login flow.  Details on how to implement this flow will be in the frontend code.
