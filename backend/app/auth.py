from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta

import jwt  # type: ignore[import-not-found]

from .config import ACCESS_TOKEN_EXPIRES_MINUTES, AUTH_SECRET, ENVIRONMENT

ALGORITHM = "HS256"


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 120_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False

    try:
        algo, iterations_raw, salt_b64, digest_b64 = stored_hash.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False

        iterations = int(iterations_raw)
        salt = _b64url_decode(salt_b64)
        expected = _b64url_decode(digest_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def create_access_token(user_id: str) -> tuple[str, int]:
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    expires_at = datetime.now(UTC) + expires_delta
    payload = {
        "sub": user_id,
        "exp": expires_at,
        "iat": datetime.now(UTC),
        "iss": "plan-backend",
    }
    token = jwt.encode(payload, AUTH_SECRET, algorithm=ALGORITHM)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, AUTH_SECRET, algorithms=[ALGORITHM], issuer="plan-backend")
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id.strip():
            return None
        return user_id
    except jwt.PyJWTError:
        return None


def is_auth_config_valid() -> bool:
    if ENVIRONMENT == "production" and AUTH_SECRET == "dev-secret-change-me":
        return False
    return True
