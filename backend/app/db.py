from __future__ import annotations

import json
import uuid
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


def _get_existing_user_columns() -> set[str]:
    with ENGINE.begin() as conn:
        if ENGINE.dialect.name == "postgresql":
            rows = conn.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'users'
                    """
                )
            ).mappings().all()
            return {str(row["column_name"]).lower() for row in rows}

        rows = conn.execute(text("PRAGMA table_info(users)")).mappings().all()
        return {str(row["name"]).lower() for row in rows}


def _ensure_users_columns() -> None:
    existing = _get_existing_user_columns()
    with ENGINE.begin() as conn:
        if "email" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN email TEXT"))
        if "password_hash" not in existing:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash TEXT"))


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
                email TEXT,
                password_hash TEXT,
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
                email TEXT,
                password_hash TEXT,
                auth_provider TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """

        conn.execute(text(state_store_sql))
        conn.execute(text(users_sql))

    _ensure_users_columns()

    with ENGINE.begin() as conn:
        if ENGINE.dialect.name == "postgresql":
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_state_store_user_key ON state_store (user_id, key)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_provider ON users (auth_provider)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email) WHERE email IS NOT NULL"))
        else:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email)"))


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


def get_user_by_email(email: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    if not normalized:
        return None

    with ENGINE.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, email, display_name, auth_provider, password_hash
                FROM users
                WHERE lower(email) = :email
                LIMIT 1
                """
            ),
            {"email": normalized},
        ).mappings().first()

    if row is None:
        return None
    return dict(row)


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    with ENGINE.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, email, display_name, auth_provider
                FROM users
                WHERE id = :user_id
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()

    if row is None:
        return None
    return dict(row)


def create_local_user(email: str, password_hash: str, display_name: str | None = None) -> dict[str, Any]:
    user_id = str(uuid.uuid4())
    normalized_email = email.strip().lower()
    normalized_name = (display_name or "").strip() or None

    with ENGINE.begin() as conn:
        if ENGINE.dialect.name == "postgresql":
            conn.execute(
                text(
                    """
                    INSERT INTO users(id, display_name, email, password_hash, auth_provider, created_at, updated_at)
                    VALUES (:id, :display_name, :email, :password_hash, 'email', NOW(), NOW())
                    """
                ),
                {
                    "id": user_id,
                    "display_name": normalized_name,
                    "email": normalized_email,
                    "password_hash": password_hash,
                },
            )
        else:
            conn.execute(
                text(
                    """
                    INSERT INTO users(id, display_name, email, password_hash, auth_provider, created_at, updated_at)
                    VALUES (:id, :display_name, :email, :password_hash, 'email', datetime('now'), datetime('now'))
                    """
                ),
                {
                    "id": user_id,
                    "display_name": normalized_name,
                    "email": normalized_email,
                    "password_hash": password_hash,
                },
            )

    return {
        "id": user_id,
        "email": normalized_email,
        "display_name": normalized_name,
        "auth_provider": "email",
    }
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
