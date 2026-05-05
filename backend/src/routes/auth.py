import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.src.config.database import get_db
from backend.src.schemas.auth import RegisterRequest, LoginSaltRequest, LoginSaltResponse, LoginRequest, TokenResponse
from backend.src.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService.register_user(db, data.email, data.authentication_hash)

@router.post("/salt", response_model=LoginSaltResponse)
def get_salt(data: LoginSaltRequest, db: Session = Depends(get_db)):
    salt = AuthService.get_user_salt(db, data.email)
    if not salt:
        salt = secrets.token_hex(32)
    return {"auth_salt": salt}

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token = AuthService.authenticate_user(db, data.email, data.authentication_hash)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": token, "token_type": "bearer"}
