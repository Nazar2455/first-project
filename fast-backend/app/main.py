from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_KEYS, API_PREFIX, DEFAULT_USER_ID, REQUIRE_USER_CONTEXT_FOR_STATE
from .db import init_db, load_state, save_state
from .schemas import StatePayload, StateResponse

PROTECTED_NUMERIC_FIELDS = {
    "points",
    "level",
    "xp",
    "bestRoom",
    "titleClicks",
    "streamDays",
    "streak_days",
    "sessions",
    "wins",
    "losses",
    "tasksCompleted",
    "totalTasks",
    "botBuilderXP",
    "parserDefenseXP",
    "dungeonXP",
    "dealMakerXP",
    "statsCraftXP",
    "coins",
    "shards",
    "playTime",
    "minutesPlayed",
    "hoursPlayed",
}


def _safe_merge(existing: dict, incoming: dict) -> dict:
    if not isinstance(existing, dict):
        existing = {}
    if not isinstance(incoming, dict):
        incoming = {}

    merged = dict(existing)
    for key, new_value in incoming.items():
        old_value = existing.get(key)

        if isinstance(old_value, dict) and isinstance(new_value, dict):
            merged[key] = _safe_merge(old_value, new_value)
            continue

        if key in PROTECTED_NUMERIC_FIELDS and isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
            merged[key] = old_value if old_value > new_value else new_value
            continue

        merged[key] = new_value

    return merged

app = FastAPI(title="Plan FastAPI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    resolved = (x_user_id or user_id or "").strip()
    if not resolved and REQUIRE_USER_CONTEXT_FOR_STATE:
        raise HTTPException(status_code=401, detail="User context is required for state access")
    resolved = resolved or DEFAULT_USER_ID
    return resolved or DEFAULT_USER_ID


@app.get(f"{API_PREFIX}/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def get_state(
    key: str,
    user_id: str = Query(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id)
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
) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    resolved_user_id = resolve_user_id(user_id=user_id, x_user_id=x_user_id)
    existing_value = load_state(key, resolved_user_id) or {}
    incoming_value = dict(payload.value or {})
    force_reset = bool(incoming_value.pop("__reset", False))

    if force_reset:
        final_value = {}
    else:
        if not incoming_value and existing_value:
            final_value = existing_value
        else:
            final_value = _safe_merge(existing_value, incoming_value)

    save_state(key, final_value, resolved_user_id)
    return StateResponse(key=key, user_id=resolved_user_id, value=final_value)
