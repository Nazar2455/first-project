from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .auth import create_access_token, decode_access_token, hash_password, is_auth_config_valid, verify_password
from .config import ALLOWED_KEYS, API_PREFIX, CORS_ORIGINS, DEFAULT_USER_ID, ENVIRONMENT
from .db import create_local_user, get_user_by_email, get_user_by_id, init_db, load_state, save_state
from .schemas import (
    AuthLoginPayload,
    AuthMeResponse,
    AuthRegisterPayload,
    AuthTokenResponse,
    StatePayload,
    StateResponse,
)

app = FastAPI(title="Plan Website Backend", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "plan-backend", "health": f"{API_PREFIX}/health"}


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = parts[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


def _resolve_auth_user_id(authorization: str | None) -> str | None:
    token = _extract_bearer_token(authorization)
    if not token:
        return None

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


def resolve_user_id(
    user_id: str | None = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> str:
    auth_user_id = _resolve_auth_user_id(authorization)
    resolved = (auth_user_id or x_user_id or user_id or DEFAULT_USER_ID).strip()
    return resolved or DEFAULT_USER_ID


@app.get(f"{API_PREFIX}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": ENVIRONMENT}


@app.post(f"{API_PREFIX}/auth/register", response_model=AuthTokenResponse)
def register(payload: AuthRegisterPayload) -> AuthTokenResponse:
    if not is_auth_config_valid():
        raise HTTPException(status_code=500, detail="AUTH_SECRET is not configured for production")

    email = payload.email.strip().lower()
    password = payload.password.strip()
    display_name = payload.display_name

    if "@" not in email or len(email) < 5:
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must contain at least 8 characters")
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="User with this email already exists")

    user = create_local_user(email=email, password_hash=hash_password(password), display_name=display_name)
    token, expires_in = create_access_token(user["id"])
    return AuthTokenResponse(
        access_token=token,
        expires_in=expires_in,
        user_id=user["id"],
        email=user["email"],
        display_name=user.get("display_name"),
    )


@app.post(f"{API_PREFIX}/auth/login", response_model=AuthTokenResponse)
def login(payload: AuthLoginPayload) -> AuthTokenResponse:
    if not is_auth_config_valid():
        raise HTTPException(status_code=500, detail="AUTH_SECRET is not configured for production")

    email = payload.email.strip().lower()
    user = get_user_by_email(email)
    if not user or not verify_password(payload.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["id"])
    token, expires_in = create_access_token(user_id)
    return AuthTokenResponse(
        access_token=token,
        expires_in=expires_in,
        user_id=user_id,
        email=str(user.get("email") or ""),
        display_name=user.get("display_name"),
    )


@app.get(f"{API_PREFIX}/auth/me", response_model=AuthMeResponse)
def me(authorization: str | None = Header(default=None, alias="Authorization")) -> AuthMeResponse:
    user_id = _resolve_auth_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authorization is required")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return AuthMeResponse(
        user_id=str(user["id"]),
        email=str(user.get("email") or ""),
        display_name=user.get("display_name"),
        auth_provider=str(user.get("auth_provider") or "email"),
    )


@app.get(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def get_state(
    key: str,
    user_id: str = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id, authorization=authorization)
    value = load_state(key, resolved_user_id)
    if value is None:
        value = {}
    return StateResponse(key=key, user_id=resolved_user_id, value=value)


@app.put(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def put_state(
    key: str,
    payload: StatePayload,
    user_id: str = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id, authorization=authorization)
    save_state(key, payload.value, resolved_user_id)
    return StateResponse(key=key, user_id=resolved_user_id, value=payload.value)
