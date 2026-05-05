from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    authentication_hash: str

class LoginSaltRequest(BaseModel):
    email: EmailStr

class LoginSaltResponse(BaseModel):
    auth_salt: str

class LoginRequest(BaseModel):
    email: EmailStr
    authentication_hash: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
