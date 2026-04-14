import enum
from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from backend.src.config.database import Base

class UserRole(str, enum.Enum):
    premium = "premium"
    default = "default"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)
    verification_hash = Column(String(length=64))
    role = Column(Enum(UserRole), default=UserRole.default, nullable=False)
    zero_knowledge_accepted = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
