from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class StatePayload(BaseModel):
    value: dict[str, Any] = Field(default_factory=dict)


class StateResponse(BaseModel):
    key: str
    user_id: str | None = None
    value: dict[str, Any]
