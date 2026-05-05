import secrets
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.src.models.user import User
from backend.src.config.settings import settings

class AuthService:
    @staticmethod
    def register_user(db: Session, email: str, authentication_hash: str):
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        auth_salt = secrets.token_hex(32)
        new_user = User(
            email=email,
            master_password_hash=authentication_hash,
            auth_salt=auth_salt
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User registered successfully"}

    @staticmethod
    def get_user_salt(db: Session, email: str) -> Optional[str]:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return user.auth_salt
        return None

    @staticmethod
    def authenticate_user(db: Session, email: str, authentication_hash: str) -> Optional[str]:
        user = db.query(User).filter(User.email == email).first()
        if not user or user.master_password_hash != authentication_hash:
            return None
        
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode = {"sub": str(user.id), "exp": expire}
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
