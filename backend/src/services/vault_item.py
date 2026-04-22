import re
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.src.models.vault_item import VaultItem, CustomField
from backend.src.schemas.vault_item import VaultItemCreate


def get_items_for_user(db: Session, user_id: uuid.UUID) -> list[VaultItem]:
    """
    Haalt alle vaultitems op voor de opgegeven gebruiker.
    """
    return (
        db.query(VaultItem)
        .options(joinedload(VaultItem.custom_fields))
        .filter(VaultItem.user_id == user_id)
        .all()
    )


def create_item(db: Session, user_id: uuid.UUID, data: VaultItemCreate) -> VaultItem:
    """
    Maakt een nieuw vaultitem aan gelinkt aan de opgegeven gebruiker.
    Valideert het URL-formaat indien aanwezig.
    """
    if data.e_url:
        if not re.match(r"^https?://[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$", data.e_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid URL format",
            )

    custom_fields = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value)
        for cf in (data.custom_fields or [])
    ]

    item = VaultItem(
        user_id=user_id,
        e_title=data.e_title,
        e_url=data.e_url,
        e_username=data.e_username,
        e_password=data.e_password,
        custom_fields=custom_fields,
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(
    db: Session, item_id: uuid.UUID, user_id: uuid.UUID, data: VaultItemCreate
) -> VaultItem:
    """
    Update een vaultitem. Gooit 404 als het item niet gevonden wordt voor de gebruiker.
    """
    item = (
        db.query(VaultItem)
        .filter(VaultItem.vaultitem_id == item_id, VaultItem.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found",
        )

    item.e_title = data.e_title
    item.e_url = data.e_url
    item.e_username = data.e_username
    item.e_password = data.e_password
    item.custom_fields = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value)
        for cf in (data.custom_fields or [])
    ]

    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """
    Verwijdert een vaultitem. Gooit 404 als het item niet gevonden wordt voor de gebruiker.
    """
    item = (
        db.query(VaultItem)
        .filter(VaultItem.vaultitem_id == item_id, VaultItem.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found",
        )

    db.delete(item)
    db.commit()
