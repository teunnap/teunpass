import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from schemas.auth import Token, UserCreate, UserLogin

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory store — replace with a real database
_users: dict[str, str] = {}  # email -> hashed master password hash


def _create_access_token(sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": sub, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: UserCreate) -> dict:
    if body.email in _users:
        raise HTTPException(status_code=400, detail="Email already registered")
    _users[body.email] = pwd_context.hash(body.master_password_hash)
    return {"message": "User created"}


@router.post("/login", response_model=Token)
def login(body: UserLogin) -> Token:
    hashed = _users.get(body.email)
    if not hashed or not pwd_context.verify(body.master_password_hash, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(access_token=_create_access_token(body.email))
