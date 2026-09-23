import os
import secrets
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()  # backend/.env
load_dotenv(".env.local", override=True)


def _session_secret(is_prod: bool) -> str:
    """The cookie-signing secret. Never ship a hardcoded one: require it in prod,
    and use an ephemeral per-process secret in dev (sessions reset on restart)."""
    value = os.getenv("SESSION_SECRET")
    if value:
        return value
    if is_prod:
        raise RuntimeError("SESSION_SECRET must be set in production — cookies would otherwise be forgeable.")
    return secrets.token_urlsafe(32)


@dataclass(frozen=True)
class Settings:
    gcp_project: str
    gcp_location: str
    gemini_model: str
    database_url: str
    # Cloud SQL (prod): when set, db.py connects via the Cloud SQL Python
    # Connector instead of DATABASE_URL. Format: project:region:instance.
    instance_connection_name: str
    db_user: str
    db_pass: str
    db_name: str
    session_secret: str
    google_client_id: str
    google_client_secret: str
    # Public base URL (OAuth redirect_uri + post-login redirect).
    app_base_url: str
    guest_paper_limit: int


def _load() -> Settings:
    instance_connection_name = os.getenv("INSTANCE_CONNECTION_NAME", "")
    return Settings(
        gcp_project=os.getenv("GCP_PROJECT", "topic-explorer-509403"),
        gcp_location=os.getenv("GCP_LOCATION", "us-central1"),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        # Local dev default points at the Docker Postgres on 5433.
        database_url=os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:dev@localhost:5433/topic_explorer"),
        instance_connection_name=instance_connection_name,
        db_user=os.getenv("DB_USER", "postgres"),
        db_pass=os.getenv("DB_PASS", ""),
        db_name=os.getenv("DB_NAME", "topic_explorer"),
        session_secret=_session_secret(is_prod=bool(instance_connection_name)),
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
        app_base_url=os.getenv("APP_BASE_URL", "http://localhost:5173"),
        guest_paper_limit=int(os.getenv("GUEST_PAPER_LIMIT", "5")),
    )


settings = _load()
