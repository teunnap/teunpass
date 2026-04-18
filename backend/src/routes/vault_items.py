from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from backend.src.config.database import get_db
from backend.src.models.vault_item import VaultItem, CustomField
from backend.src.schemas.vault_item import VaultItemCreate, VaultItemResponse
from typing import List
import uuid
import re

router = APIRouter(prefix="/vaultitems", tags=["Vault Items"])

@router.get("/", response_model=List[VaultItemResponse])
def get_vault_items(db: Session = Depends(get_db)):
    """
    Geeft alle vaultitems van gebruiker terug.
    Authenticated: Yes
    """
    user_id = uuid.UUID(int=1)
    items = db.query(VaultItem).options(joinedload(VaultItem.custom_fields)).filter(VaultItem.user_id == user_id).all()
    return items

@router.post("/create", response_model=VaultItemResponse, status_code=status.HTTP_201_CREATED)
def create_vault_item(new_item_data: VaultItemCreate, db: Session = Depends(get_db)):
    """
    Maakt een nieuw vaultitem aan gelinkt aan gebruiker.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal hashed)
    """
    user_id = uuid.UUID(int=1)
    
    custom_fields_db = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value) 
        for cf in new_item_data.custom_fields
    ] if new_item_data.custom_fields else []

    if new_item_data.e_url:
        if not re.match(r"^https?://[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$", new_item_data.e_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL format"
            )

    db_item = VaultItem(
        user_id=user_id,
        e_title=new_item_data.e_title,
        e_url=new_item_data.e_url,
        e_username=new_item_data.e_username,
        e_password=new_item_data.e_password,
        custom_fields=custom_fields_db
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item

@router.patch("/{id}")
def update_vault_item(id: uuid.UUID, new_item_data: VaultItemCreate, db: Session = Depends(get_db)):
    """
    Update een vaultitem.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal hashed, optioneel)
    """
    user_id = uuid.UUID(int=1)
    item = db.query(VaultItem).filter(VaultItem.vaultitem_id == id, VaultItem.user_id == user_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vault item not found"
        )
    
    item.e_title = new_item_data.e_title
    item.e_url = new_item_data.e_url
    item.e_username = new_item_data.e_username
    item.e_password = new_item_data.e_password
    item.custom_fields = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value) 
        for cf in new_item_data.custom_fields
    ] if new_item_data.custom_fields else []
    
    db.commit()
    db.refresh(item)
    
    return item

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vault_item(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Verwijdert een vaultitem.
    Authenticated: Yes
    """
    user_id = uuid.UUID(int=1)
    item = db.query(VaultItem).filter(VaultItem.vaultitem_id == id, VaultItem.user_id == user_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # voor Maarten
            detail="Vault item not found"
        )
    
    db.delete(item)
    db.commit()
    return None
