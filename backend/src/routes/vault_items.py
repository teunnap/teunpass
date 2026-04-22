import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.src.config.database import get_db
from backend.src.schemas.vault_item import VaultItemCreate, VaultItemResponse
from backend.src.services import vault_item as vault_item_service

router = APIRouter(prefix="/vaultitems", tags=["Vault Items"])

# TODO: vervang met goede authentication
_PLACEHOLDER_USER_ID = uuid.UUID(int=1)


@router.get("/", response_model=List[VaultItemResponse])
def get_vault_items(db: Session = Depends(get_db)):
    """
    Geeft alle vaultitems van gebruiker terug.
    Authenticated: Yes
    """
    return vault_item_service.get_items_for_user(db, user_id=_PLACEHOLDER_USER_ID)


@router.post("/create", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
def create_vault_item(data: VaultItemCreate, db: Session = Depends(get_db)):
    """
    Maakt een nieuw vaultitem aan gelinkt aan gebruiker.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal encrypted)
    """
    return vault_item_service.create_item(db, user_id=_PLACEHOLDER_USER_ID, data=data)


@router.patch("/{id}", response_model=VaultItemResponse)
def update_vault_item(id: uuid.UUID, data: VaultItemCreate, db: Session = Depends(get_db)):
    """
    Update een vaultitem.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal encrypted, optioneel)
    """
    return vault_item_service.update_item(db, item_id=id, user_id=_PLACEHOLDER_USER_ID, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vault_item(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Verwijdert een vaultitem.
    Authenticated: Yes
    """
    vault_item_service.delete_item(db, item_id=id, user_id=_PLACEHOLDER_USER_ID)
