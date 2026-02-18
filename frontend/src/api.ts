import { supabase } from "./supabaseClient";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}


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
  const res = await fetch(`${API}/books?limit=200&offset=0`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`GET /books failed (HTTP ${res.status})`);
  return res.json();
}

export async function createBook(payload: { title: string; author?: string | null }): Promise<Book> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const res = await fetch(`${API}/books`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `POST /books failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch(`${API}/notes?limit=20&offset=0`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`GET /notes failed (HTTP ${res.status})`);
  return res.json();
}

export async function createNote(payload: { text: string; book_id?: number | null }): Promise<Note> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };

  const res = await fetch(`${API}/notes`, {
    method: "POST",
    headers,
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

  const res = await fetch(url.toString(), {
    headers: await authHeaders(),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `GET /search/notes failed (HTTP ${res.status})`);
  }
  return res.json();
}

export type ClusterNote = {
  note: Note;
  score: number;
};

export type ClusterOut = {
  cluster_id: number;
  size: number;
  keywords: string[];
  representatives: ClusterNote[];
};

export async function recomputeClusters(params: {
  k?: number;
  per_cluster?: number;
  book_id?: number | null;
}): Promise<ClusterOut[]> {
  const url = new URL(`${API}/clusters/recompute`);
  url.searchParams.set("k", String(params.k ?? 3));
  url.searchParams.set("per_cluster", String(params.per_cluster ?? 2));
  if (params.book_id !== undefined && params.book_id !== null) {
    url.searchParams.set("book_id", String(params.book_id));
  }

  const res = await fetch(url.toString(), {
    headers: await authHeaders(),
  });
  
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `GET /clusters/recompute failed (HTTP ${res.status})`);
  }
  return res.json();
}
