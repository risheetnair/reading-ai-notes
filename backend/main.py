from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from db import Base, engine, SessionLocal
from models import Note

app = FastAPI(title="Reading AI Notes API", version="0.1.0")
Base.metadata.create_all(bind=engine)

class NoteCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)

class NoteOut(BaseModel):
    id: int
    text: str
    created_at: datetime

    class Config:
        from_attributes = True

@app.post("/notes", response_model=NoteOut, status_code=201)
def create_note(payload: NoteCreate):
    with SessionLocal() as db:
        note = Note(text=payload.text)
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

@app.get("/notes", response_model=List[NoteOut])
def list_notes(limit: int = 50, offset: int = 0):
    if not (1 <= limit <= 200):
        raise HTTPException(status_code=400, detail="limit must be 1..200")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    with SessionLocal() as db:
        stmt = select(Note).order_by(Note.created_at.desc()).limit(limit).offset(offset)
        return list(db.scalars(stmt).all())