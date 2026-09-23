# Deploy

Topic Explorer runs as a **single Cloud Run container** (the root `Dockerfile`
builds the frontend with Node, then serves the static assets + API from
FastAPI/uv).

- **GCP project:** `topic-explorer-509403` · **region:** `us-central1`
- **Service:** `topic-explorer` · **URLs:**
  [topic-explorer.mazanin.com](https://topic-explorer.mazanin.com) (custom domain
  mapping) and the generated `*.run.app` URL.

## Deploy from source

```bash
gcloud config set project topic-explorer-509403
gcloud run deploy topic-explorer --source . --region us-central1
```

`--source .` builds the root `Dockerfile` via Cloud Build. An image-only deploy
**preserves** the service's env vars, Secret Manager bindings, Cloud SQL
connection, and the domain mapping — don't re-pass them. A full build + deploy
takes ~2–4 minutes.

## Configuration (on the service, not in git)

Runtime config and secrets live on the Cloud Run service and in Secret Manager,
never in the repo. The local `backend/.env` holds only dev values (see
`backend/.env.example`). Key settings:

- `INSTANCE_CONNECTION_NAME` — Cloud SQL instance; reached via the Python
  Connector (`asyncpg`).
- `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — session cookies
  and Google OAuth.
- `DB_USER` / `DB_PASS` / `DB_NAME`, `GCP_PROJECT`, `GEMINI_MODEL`.

## OAuth redirect URIs

The Google OAuth client must list the callback for each origin, e.g.
`https://topic-explorer.mazanin.com/api/auth/callback` and
`http://localhost:5173/api/auth/callback` for local dev.
