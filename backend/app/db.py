from __future__ import annotations

import json
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from .config import DATABASE_URL, DB_PATH


def _build_sqlite_url() -> str:
    return f"sqlite+pysqlite:///{DB_PATH.as_posix()}"


def get_engine() -> Engine:
    database_url = DATABASE_URL or _build_sqlite_url()
    if database_url.startswith("sqlite"):
        return create_engine(
            database_url,
            future=True,
            connect_args={"check_same_thread": False},
        )

    return create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
    )


ENGINE = get_engine()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ENGINE.begin() as conn:
        if ENGINE.dialect.name == "sqlite":
            state_store_sql = """
            CREATE TABLE IF NOT EXISTS state_store (
                user_id TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, key)
            )
            """
            users_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                display_name TEXT,
                auth_provider TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
            """
        else:
            state_store_sql = """
            CREATE TABLE IF NOT EXISTS state_store (
                user_id TEXT NOT NULL,
                key TEXT NOT NULL,
                value JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, key)
            )
            """
            users_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                display_name TEXT,
                auth_provider TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """

        conn.execute(text(state_store_sql))
        conn.execute(text(users_sql))

        if ENGINE.dialect.name == "postgresql":
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_state_store_user_key ON state_store (user_id, key)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_provider ON users (auth_provider)"))


def load_state(key: str, user_id: str = "local") -> dict[str, Any] | None:
    with ENGINE.begin() as conn:
        row = conn.execute(
            text("SELECT value FROM state_store WHERE user_id = :user_id AND key = :key"),
            {"user_id": user_id, "key": key},
        ).mappings().first()
    if row is None:
        return None

    raw = row["value"]
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        return None
    return None


def save_state(key: str, value: dict[str, Any], user_id: str = "local") -> None:
    payload = json.dumps(value, ensure_ascii=False)
    with ENGINE.begin() as conn:
        if ENGINE.dialect.name == "postgresql":
            conn.execute(
                text(
                    """
                    INSERT INTO state_store(user_id, key, value, updated_at)
                    VALUES (:user_id, :key, CAST(:value AS JSONB), NOW())
                    ON CONFLICT(user_id, key) DO UPDATE SET
                        value = EXCLUDED.value,
                        updated_at = NOW()
                    """
                ),
                {"user_id": user_id, "key": key, "value": payload},
            )
        else:
            conn.execute(
                text(
                    """
                    INSERT INTO state_store(user_id, key, value, updated_at)
                    VALUES (:user_id, :key, :value, datetime('now'))
                    ON CONFLICT(user_id, key) DO UPDATE SET
                        value = excluded.value,
                        updated_at = datetime('now')
                    """
                ),
                {"user_id": user_id, "key": key, "value": payload},
            )
