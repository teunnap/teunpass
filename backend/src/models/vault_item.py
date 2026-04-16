import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.config.database import Base

class VaultItem(Base):
    __tablename__ = "vault_items"

    vaultitem_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    e_title = Column(String, nullable=False)
    e_url = Column(String)
    e_username = Column(String)
    e_password = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="vault_items")
    custom_fields = relationship("CustomField", back_populates="vault_item", cascade="all, delete-orphan")


class CustomField(Base):
    __tablename__ = "custom_fields"

    customfield_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    vaultitem_id = Column(UUID(as_uuid=True), ForeignKey("vault_items.vaultitem_id"), nullable=False, index=True)
    
    e_key = Column(String, nullable=False)
    e_value = Column(String)

    vault_item = relationship("VaultItem", back_populates="custom_fields")
