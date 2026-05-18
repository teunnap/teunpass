import uuid
from typing import List

from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from backend.src.config.database import get_db
from backend.src.schemas.vault_item import VaultItemCreate, VaultItemResponse
from backend.src.services import vault_item as vault_item_service
from backend.src.config.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/vaultitems", tags=["Vault Items"])
from backend.src.config.limiter import limiter

from backend.src.middleware.auth import get_current_user
from backend.src.models.user import User


@router.get("/", response_model=List[VaultItemResponse])
@limiter.limit("10/minute")
def get_vault_items(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Geeft alle vaultitems van gebruiker terug.
    Authenticated: Yes
    """
    logger.info(f"Fetching vault items for user: {current_user.id}")
    return vault_item_service.get_items_for_user(db, user_id=current_user.id)


@router.post("/create", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_vault_item(request: Request, data: VaultItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Maakt een nieuw vaultitem aan gelinkt aan gebruiker.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal encrypted)
    """
    logger.info(f"Creating vault item for user: {current_user.id}")
    return vault_item_service.create_item(db, user=current_user, data=data)


@router.put("/{id}", response_model=VaultItemResponse)
@limiter.limit("10/minute")
def update_vault_item(request: Request, id: uuid.UUID, data: VaultItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Update een vaultitem.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal encrypted)
    """
    logger.info(f"Updating vault item: {id} for user: {current_user.id}")
    return vault_item_service.update_item(db, item_id=id, user=current_user, data=data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def delete_vault_item(request: Request, id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Verwijdert een vaultitem.
    Authenticated: Yes
    """
    logger.info(f"Deleting vault item: {id} for user: {current_user.id}")
    vault_item_service.delete_item(db, item_id=id, user_id=current_user.id)
