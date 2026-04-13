import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from routers.auth import ALGORITHM, SECRET_KEY
from schemas.vault import VaultItemCreate, VaultItemOut, VaultItemUpdate

router = APIRouter()
bearer_scheme = HTTPBearer()

# In-memory store — replace with a real database
# Structure: {user_email: {item_id: VaultItemOut}}
_vault: dict[str, dict[str, VaultItemOut]] = {}


def _current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> str:
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return email


@router.get("/", response_model=list[VaultItemOut])
def list_items(user: Annotated[str, Depends(_current_user)]) -> list[VaultItemOut]:
    return list(_vault.get(user, {}).values())


@router.post("/", response_model=VaultItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    body: VaultItemCreate,
    user: Annotated[str, Depends(_current_user)],
) -> VaultItemOut:
    item_id = str(uuid.uuid4())
    item = VaultItemOut(id=item_id, **body.model_dump())
    _vault.setdefault(user, {})[item_id] = item
    return item


@router.put("/{item_id}", response_model=VaultItemOut)
def update_item(
    item_id: str,
    body: VaultItemUpdate,
    user: Annotated[str, Depends(_current_user)],
) -> VaultItemOut:
    items = _vault.get(user, {})
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    existing = items[item_id]
    updated = existing.model_copy(update={k: v for k, v in body.model_dump().items() if v is not None})
    items[item_id] = updated
    return updated


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: str,
    user: Annotated[str, Depends(_current_user)],
) -> None:
    items = _vault.get(user, {})
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    del items[item_id]
