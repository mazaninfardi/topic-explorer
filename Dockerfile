# --- Stage 1: build the frontend ---
FROM node:22-bookworm-slim AS fe
RUN npm install -g pnpm@10.15.1
WORKDIR /fe
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build   # -> /fe/dist

# --- Stage 2: backend runtime (FastAPI serving the API + built FE) ---
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

# Install Python dependencies from the lockfile (deps only; app isn't a package)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# App code + built frontend
COPY backend/ ./
COPY --from=fe /fe/dist /app/static

ENV STATIC_DIR=/app/static \
    PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
# Cloud Run provides $PORT (defaults to 8080 locally).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
