from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class StatePayload(BaseModel):
    value: dict[str, Any] = Field(default_factory=dict)


class StateResponse(BaseModel):
    key: str
    user_id: str | None = None
    value: dict[str, Any]


class AuthRegisterPayload(BaseModel):
    email: str
    password: str
    display_name: str | None = None


class AuthLoginPayload(BaseModel):
    email: str
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    display_name: str | None = None


class AuthMeResponse(BaseModel):
    user_id: str
    email: str
    display_name: str | None = None
    auth_provider: str
