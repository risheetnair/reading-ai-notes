import { useEffect, useMemo, useState } from "react";
import type { Book, Note } from "./api";
import { createBook, createNote, listBooks, listNotes } from "./api";


export default function App() {
  const [status, setStatus] = useState<string>("Connected ✅");

  // data
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // create book form
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");

  // create note form
  const [noteText, setNoteText] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<number | "none">("none");

  const booksById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  async function refreshAll() {
    try {
      const [b, n] = await Promise.all([listBooks(), listNotes()]);
      setBooks(b);
      setNotes(n);
      setStatus("Connected ✅");
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function onCreateBook() {
    const title = bookTitle.trim();
    const author = bookAuthor.trim();
    if (!title) return;

    try {
      await createBook({ title, author: author ? author : null });
      setBookTitle("");
      setBookAuthor("");
      await refreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function onCreateNote() {
    const text = noteText.trim();
    if (!text) return;

    try {
      await createNote({
        text,
        book_id: selectedBookId === "none" ? null : selectedBookId,
      });
      setNoteText("");
      await refreshAll();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Reading AI Notes</h1>
      <p>Status: {status}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Books */}
        <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Books</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Title"
              style={{ flex: 2, padding: 10 }}
            />
            <input
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              placeholder="Author (optional)"
              style={{ flex: 1, padding: 10 }}
            />
          </div>

          <button onClick={onCreateBook}>Add book</button>

          <hr style={{ margin: "16px 0" }} />

          <ul>
            {books.length === 0 ? (
              <li>No books yet.</li>
            ) : (
              books.map((b) => (
                <li key={b.id} style={{ marginBottom: 8 }}>
                  <strong>{b.title}</strong>
                  {b.author ? <span style={{ opacity: 0.75 }}> — {b.author}</span> : null}
                  <div style={{ fontSize: 12, opacity: 0.65 }}>id: {b.id}</div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Notes */}
        <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Notes</h2>

          <label style={{ display: "block", marginBottom: 6 }}>Attach to book (optional)</label>
          <select
            value={selectedBookId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedBookId(v === "none" ? "none" : Number(v));
            }}
            style={{ width: "100%", padding: 10 }}
          >
            <option value="none">No book</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 10 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a note..."
              rows={4}
              style={{ width: "100%", padding: 10, resize: "vertical" }}
            />
            <button onClick={onCreateNote} style={{ marginTop: 10 }}>
              Add note
            </button>
          </div>

          <hr style={{ margin: "16px 0" }} />

          <ul>
            {notes.length === 0 ? (
              <li>No notes yet.</li>
            ) : (
              notes.map((n) => {
                const book = n.book_id ? booksById.get(n.book_id) : null;
                return (
                  <li key={n.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      #{n.id} • {new Date(n.created_at).toLocaleString()}
                      {book ? ` • ${book.title}` : ""}
                    </div>
                    <div>{n.text}</div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
