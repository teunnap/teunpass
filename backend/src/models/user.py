import enum
import uuid
from sqlalchemy import Boolean, Column, String, DateTime, Enum, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.config.database import Base

class UserRole(str, enum.Enum):
    premium = "premium"
    default = "default"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    email = Column(String, unique=True, index=True)
    master_password_hash = Column(String(length=64))
    auth_salt = Column(String(length=64))
    role = Column(Enum(UserRole), default=UserRole.default, nullable=False)
    zero_knowledge_accepted = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    vault_items = relationship("VaultItem", back_populates="owner", cascade="all, delete-orphan")
