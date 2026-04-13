from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    master_password_hash: str  # client-side hashed master password


class UserLogin(BaseModel):
    email: EmailStr
    master_password_hash: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
