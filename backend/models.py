from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from db import Base

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True, index=True)
    book = relationship("Book", back_populates="notes")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now
    (timezone.utc), nullable=False)
    notes = relationship("Note", back_populates="book", cascade="all, delete-orphan")
