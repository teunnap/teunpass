import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from backend.src.config.limiter import limiter
from sqlalchemy.orm import Session
from backend.src.config.database import get_db
from backend.src.schemas.auth import RegisterRequest, LoginSaltRequest, LoginSaltResponse, LoginRequest, TokenResponse, UserResponse
from backend.src.services.auth import AuthService
from backend.src.middleware.auth import get_current_user
from backend.src.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
@limiter.limit("3/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService.register_user(db, data.email, data.authentication_hash, data.auth_salt)

@router.post("/salt", response_model=LoginSaltResponse)
@limiter.limit("3/minute")
def get_salt(request: Request, data: LoginSaltRequest, db: Session = Depends(get_db)):
    salt = AuthService.get_user_salt(db, data.email)
    if not salt:
        salt = secrets.token_hex(32)
    return {"auth_salt": salt}

@router.post("/login", response_model=TokenResponse)
@limiter.limit("3/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    token = AuthService.authenticate_user(db, data.email, data.authentication_hash)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
@limiter.limit("30/minute")
def get_me(request: Request, current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me/upgrade", response_model=UserResponse)
@limiter.limit("10/minute")
def upgrade_me(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.role = UserRole.premium
    db.commit()
    db.refresh(current_user)
    return current_user
