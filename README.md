# Trinetra Mini

Full-stack mini “Creator Intelligence Engine”:

- **Backend:** FastAPI + SQLAlchemy + Postgres + lightweight ML (Scikit-Learn)
- **Frontend:** Next.js (App Router) dashboard that calls the backend

## Repo structure

- `backend/` — FastAPI app, DB models, scoring + ranking engine, ML training/prediction
- `frontend/` — Next.js UI (leaderboard, creator analytics, admin actions)
- `data/` — sample data file(s) for upload
- `docker-compose.yml` — local dev stack (db + backend + frontend)

## Architecture (local)

- Next.js runs on `http://localhost:3000`
- FastAPI runs on `http://localhost:8000`
- Postgres runs on `localhost:5432`

The frontend calls the backend via an API base URL:

- Browser (client-side): `NEXT_PUBLIC_API_URL`
- Server (SSR on Netlify / Node runtime): `INTERNAL_API_URL`

## Quickstart (Docker – recommended)

Prereqs: Docker Desktop

From the repo root:

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend docs (Swagger UI): http://localhost:8000/docs

Notes:

- `docker-compose.yml` runs `python scripts/seed_data.py` before starting the API. The seed script **clears existing tables and re-inserts demo data**.
- The backend also runs a background task that recalculates creator scores roughly every 60 seconds.

## Run locally (without Docker)

### 1) Start Postgres

You need a Postgres instance and a `DATABASE_URL`.

Example:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trinetra
```

### 2) Backend (FastAPI)

Prereqs: Python 3.10+

```bash
cd backend
python -m venv .venv
# activate your venv
pip install -r requirements.txt

# seed demo data (optional but useful)
python scripts/seed_data.py

# run API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend URLs:

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

### 3) Frontend (Next.js)

Prereqs: Node 20+

```bash
cd frontend
npm install

# point the UI at your backend
# Windows PowerShell example:
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api"

npm run dev
```

Open: http://localhost:3000

## API overview (used by the frontend)

Base: `http://<backend-host>:8000/api`

- `GET /leaderboard` — leaderboard list, optional filters: `genre`, `language`, `year`
- `GET /creators/{creator_id}` — creator analytics + episodes
- `POST /creators/{creator_id}/calculate-score` — recompute score for a creator
- `POST /ml/train` — train the view prediction model (writes `backend/app/ml/model.pkl`)
- `GET /ml/predict/{creator_id}` — predict next 7 days views (may return `null` if not enough data/model)
- `POST /upload/csv` — upload CSV/XLS/XLSX data and ingest episodes

## Environment variables

### Backend

- `DATABASE_URL` (required in production)
  - Example: `postgresql://user:pass@host:5432/dbname`

### Frontend

- `NEXT_PUBLIC_API_URL` (required in production)
  - Example: `https://your-backend.example.com/api`
- `INTERNAL_API_URL` (recommended for SSR builds)
  - Same value as `NEXT_PUBLIC_API_URL`

## Deploy

### Frontend → Netlify

This repo includes a Netlify config at `netlify.toml` (repo root) that builds from `frontend/`.

On Netlify, set environment variables:

- `NEXT_PUBLIC_API_URL` = `https://your-backend.example.com/api`
- `INTERNAL_API_URL` = `https://your-backend.example.com/api`

### Backend + DB → a backend host (Render/Fly/Railway/etc.)

Netlify does not host long-running FastAPI services with Postgres. Deploy the backend separately.

Typical start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Render note (fix for “Running ''” / exits immediately)

If you deploy on Render and see logs like `Running ''` then the **Start Command is empty** in the service settings.
This repo includes a Render Blueprint at `render.yaml` plus `backend/start.sh`.

On Render you can either:

- Use **Blueprint** deploy (recommended): create a new Blueprint from the repo, or
- Configure a Python Web Service manually with:
  - **Root Directory:** `backend`
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `bash start.sh`

Also set `DATABASE_URL` to your managed Postgres connection string.

Production notes:

- Don’t run `--reload` in production.
- If you restrict CORS, allow your frontend origin (e.g. `https://your-site.netlify.app`).
- ML training writes a pickle model to disk (`backend/app/ml/model.pkl`). On some hosts the filesystem is ephemeral; you may need persistent storage if you want the trained model to survive restarts.

## Troubleshooting

- **Frontend can’t reach backend:** verify `NEXT_PUBLIC_API_URL` points to the backend `/api` base.
- **CORS errors:** backend currently allows `*` (dev-friendly). If you change it for production, add your Netlify domain.
- **Empty predictions:** the model requires enough historical stats; try seeding data or uploading a CSV and then calling `POST /api/ml/train`.
