const API = "http://127.0.0.1:8000";

export type Book = {
  id: number;
  title: string;
  author: string | null;
  created_at: string;
};

export type Note = {
  id: number;
  book_id: number | null;
  text: string;
  created_at: string;
};

export async function listBooks(): Promise<Book[]> {
  const res = await fetch(`${API}/books?limit=200&offset=0`);
  if (!res.ok) throw new Error(`GET /books failed (HTTP ${res.status})`);
  return res.json();
}

export async function createBook(payload: { title: string; author?: string | null }): Promise<Book> {
  const res = await fetch(`${API}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /books failed (HTTP ${res.status})`);
  return res.json();
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch(`${API}/notes?limit=20&offset=0`);
  if (!res.ok) throw new Error(`GET /notes failed (HTTP ${res.status})`);
  return res.json();
}

export async function createNote(payload: { text: string; book_id?: number | null }): Promise<Note> {
  const res = await fetch(`${API}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `POST /notes failed (HTTP ${res.status})`);
  }
  return res.json();
}

export type NoteSearchHit = {
  note: Note;
  score: number;
};

export async function searchNotes(params: {
  q: string;
  k?: number;
  book_id?: number | null;
}): Promise<NoteSearchHit[]> {
  const q = params.q.trim();
  const k = params.k ?? 10;

  const url = new URL(`${API}/search/notes`);
  url.searchParams.set("q", q);
  url.searchParams.set("k", String(k));
  if (params.book_id !== undefined && params.book_id !== null) {
    url.searchParams.set("book_id", String(params.book_id));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GET /search/notes failed (HTTP ${res.status})`);
  return res.json();
}
