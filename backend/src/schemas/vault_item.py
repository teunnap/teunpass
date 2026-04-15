from pydantic import BaseModel
from typing import Optional, List

class CustomFieldCreate(BaseModel):
    e_key: str
    e_value: Optional[str] = None

class VaultItemCreate(BaseModel):
    e_title: str
    e_url: Optional[str] = None
    e_username: Optional[str] = None
    e_password: Optional[str] = None
    custom_fields: Optional[List[CustomFieldCreate]] = []

class CustomFieldResponse(CustomFieldCreate):
    customfield_id: int

    class Config:
        from_attributes = True

class VaultItemResponse(VaultItemCreate):
    vaultitem_id: int
    custom_fields: List[CustomFieldResponse] = []

    class Config:
        from_attributes = True
