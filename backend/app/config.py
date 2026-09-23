import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()  # loads backend/.env (and .env.local via python-dotenv if present)
load_dotenv(".env.local", override=True)


@dataclass(frozen=True)
class Settings:
    gcp_project: str = os.getenv("GCP_PROJECT", "topic-explorer-509403")
    gcp_location: str = os.getenv("GCP_LOCATION", "us-central1")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    # Postgres (async). Local dev default points at the Docker instance on 5433.
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://postgres:dev@localhost:5433/topic_explorer"
    )
    # Session cookie signing secret (override in every real environment).
    session_secret: str = os.getenv("SESSION_SECRET", "dev-insecure-secret-change-me")
    # Google OAuth Web client id + secret (authorization-code redirect flow).
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    # Public base URL of the app (for OAuth redirect_uri and post-login redirect).
    app_base_url: str = os.getenv("APP_BASE_URL", "http://localhost:5173")
    guest_paper_limit: int = int(os.getenv("GUEST_PAPER_LIMIT", "5"))


settings = Settings()
