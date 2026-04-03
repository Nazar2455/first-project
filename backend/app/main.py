from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_KEYS, API_PREFIX, CORS_ORIGINS, DEFAULT_USER_ID, ENVIRONMENT
from .db import init_db, load_state, save_state
from .schemas import StatePayload, StateResponse

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


def resolve_user_id(
    user_id: str | None = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
) -> str:
    resolved = (x_user_id or user_id or DEFAULT_USER_ID).strip()
    return resolved or DEFAULT_USER_ID


@app.get(f"{API_PREFIX}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": ENVIRONMENT}


@app.get(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def get_state(key: str, user_id: str = Query(default=None), x_user_id: str | None = Header(default=None, alias="X-User-ID")) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id)
    value = load_state(key, resolved_user_id)
    if value is None:
        value = {}
    return StateResponse(key=key, user_id=resolved_user_id, value=value)


@app.put(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def put_state(key: str, payload: StatePayload, user_id: str = Query(default=None), x_user_id: str | None = Header(default=None, alias="X-User-ID")) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id)
    save_state(key, payload.value, resolved_user_id)
    return StateResponse(key=key, user_id=resolved_user_id, value=payload.value)
