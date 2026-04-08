from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from .config import DB_PATH


def _ensure_data_dir(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_data_dir(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        # legacy schema check: old table had only key/value without user_id
        row = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='state_store'"
        ).fetchone()
        if row is not None:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(state_store)").fetchall()]
            if 'user_id' not in cols:
                conn.execute("ALTER TABLE state_store RENAME TO state_store_legacy")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS state_store (
                user_id TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, key)
            )
            """
        )

        legacy_exists = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='state_store_legacy'"
        ).fetchone()
        if legacy_exists is not None:
            conn.execute(
                """
                INSERT OR REPLACE INTO state_store (user_id, key, value, updated_at)
                SELECT 'local', key, value, updated_at
                FROM state_store_legacy
                """
            )
            conn.execute("DROP TABLE state_store_legacy")

        conn.commit()


def load_state(key: str, user_id: str = "local") -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT value FROM state_store WHERE user_id = ? AND key = ?",
            (user_id, key),
        ).fetchone()

    if row is None:
        return None

    try:
        parsed = json.loads(row["value"])
    except json.JSONDecodeError:
        return {}

    if isinstance(parsed, dict):
        return parsed
    return {}


def save_state(key: str, value: dict[str, Any], user_id: str = "local") -> None:
    payload = json.dumps(value, ensure_ascii=False)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO state_store (user_id, key, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, key, payload),
        )
        conn.commit()
