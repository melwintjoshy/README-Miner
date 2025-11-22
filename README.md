# Readme Miner

FastAPI + React application that generates a high-quality README.md from a GitHub repository using LLM (Gemini) summarization.

## Features
- Google OAuth credential exchange -> backend-issued JWT (12h expiry)
- Protected README generation job endpoints
- Background job pattern (upgrade path: Celery + Redis)
- Strict GitHub repo URL validation
- Centralized configuration via `backend/config.py`
- Pooled SQLAlchemy engine (production Postgres recommended)
- Health endpoint `/healthz`

## High-Level Flow
1. Frontend obtains Google credential via Google One Tap / OAuth.
2. Frontend POST `/auth/google` with credential -> receives JWT.
3. Frontend POST `/get_readme` (Authorization: Bearer <JWT>) with repo_url -> receives job_id.
4. Frontend polls `/readme/{job_id}` until `{ status: "completed" }` then downloads README.md.

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| POST | `/auth/google` | Exchange Google credential for JWT |
| POST | `/get_readme` | Start README generation job (auth required) |
| GET | `/readme/{job_id}` | Poll job or download README when complete |

## Environment Variables (set in hosting platform, not committed)
```
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
GOOGLE_CLIENT_ID=<google_oauth_client_id>
GEMINI_API_KEY=<gemini_api_key>
JWT_SECRET=<long_random_secret>
FRONTEND_URL=https://your-frontend-domain
MAX_REPO_SIZE_MB=200
LOG_LEVEL=info
```

## Local Development
```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
# frontend
cd frontend
npm install
npm start
```

## Production Hardening Checklist
- Use managed Postgres (Neon / Railway / Supabase / Render)
- Rotate all secrets regularly (JWT_SECRET, GEMINI_API_KEY)
- Restrict CORS to `FRONTEND_URL`
- Rate-limit `/get_readme` (slowapi or similar)
- Add cleanup task to remove old `backend/output/job_*` directories
- Structured JSON logging + monitoring (Sentry / OpenTelemetry optional)
- Optional: Migrate background tasks to Celery + Redis for scalability

## Deployment Options
Backend: Render, Railway, Fly.io, AWS ECS/Fargate, Azure Container Apps.
Frontend: Vercel or Netlify.

Example backend start command (Render/Railway):
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Repo URL Validation
Only accepts HTTPS GitHub URLs; automatically appends `.git` if missing.

## Future Enhancements
- Incremental README regeneration
- Caching summaries by file hash
- Multi-language support
- Rate limiting & abuse protection metrics

## License
Add a license file (MIT or Apache-2.0) for clarity.
