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


settings = Settings()
