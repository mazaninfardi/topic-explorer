from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from .config import settings
from .db import SessionLocal
from .models import User

COOKIE = "te_session"
_ALG = "HS256"
_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _make_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(seconds=_MAX_AGE)
    return jwt.encode({"uid": user_id, "exp": exp}, settings.session_secret, algorithm=_ALG)


def _read_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        return jwt.decode(token, settings.session_secret, algorithms=[_ALG]).get("uid")
    except jwt.PyJWTError:
        return None


def set_session_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        COOKIE, _make_token(user_id), httponly=True, samesite="lax", max_age=_MAX_AGE, path="/"
    )


async def current_user(request: Request, response: Response) -> User:
    """Resolve the session cookie to a user, creating a guest if there is none."""
    uid = _read_token(request.cookies.get(COOKIE))
    async with SessionLocal() as s:
        user = await s.get(User, uid) if uid else None
        if user is None:
            user = User(is_guest=True)
            s.add(user)
            await s.commit()
            await s.refresh(user)
            set_session_cookie(response, user.id)
        s.expunge(user)  # usable after the session closes
    return user


def verify_google_token(credential: str) -> dict:
    """Verify a Google ID token; returns its claims (raises on failure)."""
    return google_id_token.verify_oauth2_token(
        credential, google_requests.Request(), settings.google_client_id
    )
