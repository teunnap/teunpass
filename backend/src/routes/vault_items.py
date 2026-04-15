from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from backend.src.config.database import get_db
from backend.src.models.vault_item import VaultItem, CustomField
from backend.src.schemas.vault_item import VaultItemCreate, VaultItemResponse
from typing import List

router = APIRouter(prefix="/vaultitems", tags=["Vault Items"])

@router.get("/", response_model=List[VaultItemResponse])
def get_vault_items(db: Session = Depends(get_db)):
    """
    Geeft alle vaultitems van gebruiker terug.
    Authenticated: Yes
    """
    import uuid
    user_id = uuid.UUID(int=1)
    items = db.query(VaultItem).options(joinedload(VaultItem.custom_fields)).filter(VaultItem.user_id == user_id).all()
    return items

@router.post("/create", response_model=VaultItemResponse)
def create_vault_item(new_item_data: VaultItemCreate, db: Session = Depends(get_db)):
    """
    Maakt een nieuw vaultitem aan gelinkt aan gebruiker.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal hashed)
    """
    import uuid
    user_id = uuid.UUID(int=1)
    
    custom_fields_db = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value) 
        for cf in new_item_data.custom_fields
    ] if new_item_data.custom_fields else []

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


@router.put("/{id}")
def update_vault_item(id: int, db: Session = Depends(get_db)):
    """
    Update een vaultitem.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal hashed, optioneel)
    """
    pass

@router.delete("/{id}")
def delete_vault_item(id: int, db: Session = Depends(get_db)):
    """
    Verwijdert een vaultitem.
    Authenticated: Yes
    """
    pass
