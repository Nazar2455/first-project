from __future__ import annotations

from pathlib import Path

API_PREFIX = "/api"
DEFAULT_USER_ID = "local"

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
