from typing import Annotated
from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints
import uuid
from backend.src.models.user import UserRole

Hex64Str = Annotated[
    str,
    StringConstraints(min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]{64}$")
]

class RegisterRequest(BaseModel):
    email: EmailStr
    authentication_hash: Hex64Str
    auth_salt: Hex64Str

class LoginSaltRequest(BaseModel):
    email: EmailStr

class LoginSaltResponse(BaseModel):
    auth_salt: str

class LoginRequest(BaseModel):
    email: EmailStr
    authentication_hash: Hex64Str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    model_config = ConfigDict(from_attributes=True)

class SetRoleRequest(BaseModel):
    role: UserRole
