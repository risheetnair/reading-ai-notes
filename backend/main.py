from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from db import Base, engine, SessionLocal
from models import Note, Book, NoteEmbedding
from typing import Optional
from embedding import embed_text
from search import load_vec, cosine_sim
import numpy as np


app = FastAPI(title="Reading AI Notes API", version="0.1.0")
Base.metadata.create_all(bind=engine)

class NoteCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    book_id: Optional[int] = None

class NoteOut(BaseModel):
    id: int
    book_id: Optional[int]
    text: str
    created_at: datetime

    class Config:
        from_attributes = True

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: Optional[str] = Field(default=None, max_length=255)

class BookOut(BaseModel):
    id: int
    title: str
    author: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class NoteSearchHit(BaseModel):
    note: NoteOut
    score: float



@app.post("/notes", response_model=NoteOut, status_code=201)
def create_note(payload: NoteCreate):
    with SessionLocal() as db:
        if payload.book_id is not None:
            exists = db.get(Book, payload.book_id)
            if exists is None:
                raise HTTPException(status_code=400, detail="book_id does not exist")
            
        note = Note(text=payload.text, book_id=payload.book_id)
        db.add(note)
        db.commit()
        db.refresh(note)

        model_name, embedding_json = embed_text(note.text)
        emb = NoteEmbedding(note_id=note.id, model_name=model_name, embedding_json=embedding_json)
        db.add(emb)
        db.commit()

        return note

@app.get("/notes", response_model=List[NoteOut])
def list_notes(limit: int = 50, offset: int = 0, book_id: Optional[int] = None):
    if not (1 <= limit <= 200):
        raise HTTPException(status_code=400, detail="limit must be 1..200")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    with SessionLocal() as db:
        stmt = select(Note)
        if book_id is not None:
            stmt = stmt.where(Note.book_id == book_id)

        stmt = stmt.order_by(Note.created_at.desc()).limit(limit).offset(offset)
        return list(db.scalars(stmt).all())
    
@app.post("/books", response_model=BookOut, status_code=201)
def create_book(payload: BookCreate):
    with SessionLocal() as db:
        book = Book(title=payload.title, author=payload.author)
        db.add(book)
        db.commit()
        db.refresh(book)
        return book

@app.get("/books", response_model=List[BookOut])
def list_books(limit: int = 50, offset: int = 0):
    if not (1 <= limit <= 200):
        raise HTTPException(status_code=400, detail="limit must be 1..200")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    with SessionLocal() as db:
        stmt = select(Book).order_by(Book.created_at.desc()).limit(limit).offset(offset)
        return list(db.scalars(stmt).all())
    
@app.get("/search/notes", response_model=List[NoteSearchHit])
def search_notes(q: str, k: int = 10, book_id: Optional[int] = None):
    if not q.strip():
        raise HTTPException(status_code=400, detail="q must not be empty")
    if not (1 <= k <= 50):
        raise HTTPException(status_code=400, detail="k must be 1..50")

    model_name, q_emb_json = embed_text(q)
    q_vec = load_vec(q_emb_json)

    with SessionLocal() as db:
        # Pull notes + embeddings for the specified model (and book, if given)
        stmt = (
            select(Note, NoteEmbedding)
            .join(NoteEmbedding, NoteEmbedding.note_id == Note.id)
            .where(NoteEmbedding.model_name == model_name)
        )
        if book_id is not None:
            stmt = stmt.where(Note.book_id == book_id)

        rows = db.execute(stmt).all()

        scored = []
        for note, emb in rows:
            vec = load_vec(emb.embedding_json)
            score = cosine_sim(q_vec, vec)
            score = round(score, 4)
            scored.append((score, note))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:k]

        return [
            NoteSearchHit(note=NoteOut.model_validate(note), score=score)
            for score, note in top
        ]


# tests embedding retrieval
@app.get("/notes/{note_id}/embedding")
def get_embedding(note_id: int):
    with SessionLocal() as db:
        emb = db.execute(select(NoteEmbedding).where(NoteEmbedding.note_id == note_id)).scalar_one_or_none()
        if emb is None:
            raise HTTPException(status_code=404, detail="embedding not found")
        return {"note_id": note_id, "model_name": emb.model_name, "embedding_len": len(__import__("json").loads(emb.embedding_json))}
