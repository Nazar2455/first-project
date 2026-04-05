from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional locally
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()

API_PREFIX = "/api"

ALLOWED_KEYS = {
    "main_tracker",
    "verification",
    "burnout",
    "character_profile",
    "profile_cosmetics",
    "shop_achievements",
    "code_dungeon",
    "bot_builder",
    "game_stats",
    "parser_defense",
}

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "plan_site.db"

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL and DATABASE_URL.startswith(("postgresql://", "postgres://", "postgresql+psycopg://")):
    parts = urlsplit(DATABASE_URL)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.setdefault("sslmode", "require")

    normalized_scheme = parts.scheme
    if parts.scheme in {"postgres", "postgresql"}:
        normalized_scheme = "postgresql+psycopg"

    DATABASE_URL = urlunsplit((normalized_scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "local")
ENVIRONMENT = os.getenv("ENV", "development")
AUTH_SECRET = os.getenv("AUTH_SECRET", "dev-secret-change-me")
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "10080"))

RAW_CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [origin.strip() for origin in RAW_CORS_ORIGINS.split(",") if origin.strip()]
if not CORS_ORIGINS:
    CORS_ORIGINS = ["*"]
