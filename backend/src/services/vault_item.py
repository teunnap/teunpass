import re
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.src.models.vault_item import VaultItem, CustomField
from backend.src.models.user import User, UserRole
from backend.src.schemas.vault_item import VaultItemCreate
from backend.src.config.logger import get_logger

logger = get_logger(__name__)

URL_PATTERN = re.compile(r"^https?://[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$")


def _validate_url(url: str | None) -> None:
    if url and not URL_PATTERN.fullmatch(url):
        logger.warning(f"Invalid URL format attempted: {url}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL format",
        )


def get_items_for_user(db: Session, user_id: uuid.UUID) -> list[VaultItem]:
    """
    Haalt alle vaultitems op voor de opgegeven gebruiker.
    """
    logger.debug(f"Querying vault items for user {user_id}")
    return (
        db.query(VaultItem)
        .options(joinedload(VaultItem.custom_fields))
        .filter(VaultItem.user_id == user_id)
        .all()
    )


def get_item_count_for_user(db: Session, user_id: uuid.UUID) -> int:
    """
    Geeft het totaal aantal vaultitems van de gebruiker terug.
    """
    return db.query(VaultItem).filter(VaultItem.user_id == user_id).count()


def create_item(db: Session, user: User, data: VaultItemCreate) -> VaultItem:
    """
    Maakt een nieuw vaultitem aan gelinkt aan de opgegeven gebruiker.
    Valideert het URL-formaat indien aanwezig.
    """
    if user.role == UserRole.default:
        if data.custom_fields and len(data.custom_fields) > 0:
            logger.warning(f"User {user.id} attempted to use custom fields but is not premium")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Custom fields are a premium feature."
            )

        item_count = get_item_count_for_user(db, user.id)
        if item_count >= 5:
            logger.warning(f"User {user.id} has reached the maximum number of vault items")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maximum amount of vaultitems reached"
            )

    _validate_url(data.e_url)

    custom_fields = [
        CustomField(e_key=cf.e_key, e_value=cf.e_value)
        for cf in (data.custom_fields or [])
    ]

    item = VaultItem(
        user_id=user.id,
        e_title=data.e_title,
        e_url=data.e_url,
        e_username=data.e_username,
        e_password=data.e_password,
        custom_fields=custom_fields,
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    logger.debug(f"Created new vault item {item.vaultitem_id} for user {user.id}")
    return item


def update_item(
    db: Session, item_id: uuid.UUID, user: User, data: VaultItemCreate
) -> VaultItem:
    """
    Vervangt een vaultitem volledig
    """
    if user.role == UserRole.default and data.custom_fields and len(data.custom_fields) > 0:
        logger.warning(f"User {user.id} attempted to use custom fields during update but is not premium")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Custom fields are a premium feature."
        )

    _validate_url(data.e_url)

    item = (
        db.query(VaultItem)
        .filter(VaultItem.vaultitem_id == item_id, VaultItem.user_id == user.id)
        .first()
    )
    if not item:
        logger.warning(f"Vault item {item_id} not found for user {user.id} during update")
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
    logger.debug(f"Updated vault item {item_id} for user {user.id}")
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
        logger.warning(f"Vault item {item_id} not found for user {user_id} during delete")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vault item not found",
        )

    db.delete(item)
    db.commit()
    logger.debug(f"Deleted vault item {item_id} for user {user_id}")
