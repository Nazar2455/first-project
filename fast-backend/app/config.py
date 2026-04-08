from __future__ import annotations

import os
from pathlib import Path

API_PREFIX = "/api"
DEFAULT_USER_ID = "local"
ENVIRONMENT = os.getenv("ENV", "development")

_state_ctx_raw = os.getenv("REQUIRE_USER_CONTEXT_FOR_STATE", "").strip().lower()
if _state_ctx_raw in {"1", "true", "yes", "on"}:
    REQUIRE_USER_CONTEXT_FOR_STATE = True
elif _state_ctx_raw in {"0", "false", "no", "off"}:
    REQUIRE_USER_CONTEXT_FOR_STATE = False
else:
    REQUIRE_USER_CONTEXT_FOR_STATE = False

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
