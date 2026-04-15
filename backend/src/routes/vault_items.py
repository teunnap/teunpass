from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.src.config.database import get_db
from backend.src.models.vault_item import VaultItem

router = APIRouter(prefix="/vaultitems", tags=["Vault Items"])

@router.get("/")
def get_vault_items(db: Session = Depends(get_db)):
    """
    Geeft alle vaultitems van gebruiker terug.
    Authenticated: Yes
    """
    user_id = 1
    items = db.query(VaultItem).filter(VaultItem.user_id == user_id).all()
    return items

@router.post("/create")
def create_vault_item(new_item: VaultItem, db: Session = Depends(get_db)):
    """
    Maakt een nieuw vaultitem aan gelinkt aan gebruiker.
    Authenticated: Yes
    Body: Title, url, username, password, customfields (allemaal hashed)
    """
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


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
