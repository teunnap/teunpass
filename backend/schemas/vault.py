from pydantic import BaseModel


class VaultItemCreate(BaseModel):
    name: str
    username: str | None = None
    encrypted_password: str  # AES-encrypted on the client
    url: str | None = None
    notes: str | None = None


class VaultItemUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
    encrypted_password: str | None = None
    url: str | None = None
    notes: str | None = None


class VaultItemOut(BaseModel):
    id: str
    name: str
    username: str | None = None
    encrypted_password: str
    url: str | None = None
    notes: str | None = None
