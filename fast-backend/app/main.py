from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_KEYS, API_PREFIX
from .db import init_db, load_state, save_state
from .schemas import StatePayload, StateResponse

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


@app.get(f"{API_PREFIX}/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def get_state(key: str) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    value = load_state(key)
    if value is None:
        value = {}
    return StateResponse(key=key, value=value)


@app.put(f"{API_PREFIX}/state/{{key}}", response_model=StateResponse)
def put_state(key: str, payload: StatePayload) -> StateResponse:
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=404, detail="Unknown state key")

    save_state(key, payload.value)
    return StateResponse(key=key, value=payload.value)
