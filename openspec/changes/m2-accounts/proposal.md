# Proposal

## Why

M1 proved the product with device-local storage (IndexedDB, a prototyping stand-in). M2 makes it real: **accounts + a server database**, so a user's explorations follow them across devices, and a **shared analysis cache** so an already-processed paper is never re-analyzed. IndexedDB is removed — Postgres becomes the single source of truth.

## What Changes

- **Cloud SQL (Postgres) + SQLAlchemy** as the single persistence layer. **Remove IndexedDB** and all client-local storage.
- **Google sign-in** via Google Identity Services: the frontend gets a Google ID token, the FastAPI BFF verifies it and issues an app **session cookie** (httpOnly).
- **Guest sessions**: anonymous users get a server-side guest identity (httpOnly cookie) and can explore up to **5 papers**; beyond that they must sign in. Signed-in users are unlimited.
- **Sign-in starts fresh**: a guest's data is not migrated into their new account.
- **Server-backed topics + familiar terms**, per user (guest or account), read/written through the API; signed-in data syncs across devices.
- **Persistent shared analysis cache**: What/Why/How (+ salient terms, title) are stored in Postgres keyed by arXiv id. `/api/extract` reuses a stored analysis instead of calling Gemini again — across users and restarts.
- Deploy the DB-backed service to Cloud Run with Cloud SQL.

## Capabilities

### New Capabilities
- `accounts`: Google sign-in (ID-token verification), guest sessions, current-user lookup, sign-out, and the 5-paper guest limit.
- `sync`: server-backed storage of a user's topics and familiar terms (Postgres), replacing IndexedDB — cross-device for signed-in users, capped for guests.

### Modified Capabilities
- `content-extraction`: reuse a paper's previously-computed analysis (persistent, shared cache keyed by arXiv id) instead of re-running the model.

## Impact

- New `backend/` modules: SQLAlchemy models + Cloud SQL connection, auth (GIS verify + session cookie), topics/familiar CRUD, and an analysis-cache table.
- Frontend: a Google sign-in button + auth state, all persistence moved from IndexedDB to the API, and a sign-in prompt when a guest hits the 5-paper limit. `idb` and the IndexedDB layer are deleted.
- New infra/config: a Cloud SQL Postgres instance, a Google OAuth **Client ID** (for GIS), a session-signing secret — all via env / Secret Manager.
