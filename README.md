# Topic Explorer

A web app that makes complex scientific research accessible to the curious,
regardless of background. Enter a **topic** or paste an **arXiv link** and
explore the paper as a graph: a concise **What** first, then **Why** and **How**
on demand, with any highlighted word expandable into a plain-language
definition — recursively.

Live at **[topic-explorer.mazanin.com](https://topic-explorer.mazanin.com)**
(Google sign-in; guests can explore a few papers). See [`plan.md`](./plan.md)
for the plan and milestones, and [`openspec/`](./openspec) for specs and change
history. Deploy details are in [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Stack

- **Frontend:** React + Vite + Tailwind v4 + React Flow (Zustand store) — `frontend/`
- **Backend:** FastAPI BFF (async) + SQLAlchemy/Postgres (Cloud SQL) — `backend/`
- **Model:** Gemini `gemini-2.5-flash` via **Vertex AI** (auth via ADC — no API key)
- **Deploy:** single Cloud Run container (FastAPI serves the built frontend + API)

## Prerequisites

- **Node** 25 + **pnpm** 10 (`corepack enable` or install pnpm directly)
- **uv** (Python package manager) — https://astral.sh/uv (after installing, open a **new terminal** so `uv` is on your `PATH`)
- **Docker** — runs the local Postgres the backend connects to.
- **gcloud** with Application Default Credentials for Vertex AI:

  ```bash
  gcloud auth application-default login
  gcloud auth application-default set-quota-project topic-explorer-509403
  gcloud services enable aiplatform.googleapis.com --project topic-explorer-509403
  ```

  GCP project `topic-explorer-509403`, region `us-central1` (defaults; override
  via `backend/.env`).

## Run locally

Three processes. **Postgres** (Docker, port 5433 — matches the dev default in `.env.example`):

```bash
docker run -d --name te-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=topic_explorer -p 5433:5432 postgres:16
```

**Backend** (port 8000):

```bash
cd backend
cp .env.example .env   # defaults target the Docker Postgres above
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend** (port 5173, proxies `/api` → :8000):

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:5173, enter a topic (e.g. `diffusion models`) or paste an
arXiv link (e.g. `https://arxiv.org/abs/1512.03385`), and click **Explore**. A
first-time extraction can take up to ~90s; the **What** node appears first, then
**Why**/**How** stream in. Already-analyzed papers load from the cache instantly.

You can explore as a guest without signing in. Google sign-in additionally
needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (and a matching OAuth redirect
URI) in `backend/.env`.

## Tests

```bash
cd frontend && pnpm test        # Vitest
cd backend  && uv run pytest    # pytest
```

## Layout

```
frontend/     React app (graph UI, ContentSource seam)
backend/      FastAPI BFF (arXiv ingestion, Gemini/Vertex extraction, Postgres)
spikes/       Throwaway experiments (see spikes/FINDINGS.md)
openspec/     Specs and change proposals
docs/         Deploy notes and archived working docs (docs/archive/)
plan.md       Living plan and milestones
```
