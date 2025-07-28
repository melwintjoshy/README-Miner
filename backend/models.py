from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean # Import Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False) # NEW: Verification status
    verification_token = Column(String, unique=True, nullable=True) # NEW: Token for email verification
    verification_token_expires = Column(DateTime(timezone=True), nullable=True) # NEW: Token expiration time
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    readmes = relationship("Readme", back_populates="owner")

class Readme(Base):
    __tablename__ = "readmes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    readme_content = Column(Text, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="readmes")