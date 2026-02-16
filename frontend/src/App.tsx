import { useEffect, useMemo, useState } from "react";
import type { Book, Note } from "./api";
import { createBook, createNote, listBooks, listNotes, searchNotes, recomputeClusters } from "./api";


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

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ note: Note; score: number }[]>([]);
  const [searching, setSearching] = useState(false);

  const [clusters, setClusters] = useState<any[]>([]);
  const [k, setK] = useState(3);
  const [perCluster, setPerCluster] = useState(2);
  const [clustering, setClustering] = useState(false);



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

  async function onSearch() {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    try {
      const bookFilter =
        selectedBookId === "none" ? null : (selectedBookId as number);

      const results = await searchNotes({
        q,
        k: 10,
        book_id: bookFilter,
      });

      setHits(results);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function onRecomputeClusters() {
    setClustering(true);
    try {
      const bookFilter =
        selectedBookId === "none" ? null : (selectedBookId as number);

      const data = await recomputeClusters({
        k,
        per_cluster: perCluster,
        book_id: bookFilter,
      });

      setClusters(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setClustering(false);
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

          <hr style={{ margin: "16px 0" }} />

          <h3>Semantic Search</h3>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Search by meaning (not keywords). Uses local embeddings.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "slow start but beautiful prose"'
              style={{ flex: 1, padding: 10 }}
            />
            <button onClick={onSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {hits.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                Showing top {hits.length} results
                {selectedBookId === "none" ? "" : " (filtered to selected book)"}
              </div>
              <ul style={{ paddingLeft: 18 }}>
                {hits.map((h) => {
                  const book = h.note.book_id ? booksById.get(h.note.book_id) : null;
                  return (
                    <li key={`hit-${h.note.id}`} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        score: {h.score.toFixed(4)}
                        {book ? ` • ${book.title}` : ""}
                      </div>
                      <div>{h.note.text}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          
          <hr style={{ margin: "16px 0" }} />

          <h3>Themes (Clustering)</h3>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Groups your notes into themes using embeddings + KMeans.
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>
              k:&nbsp;
              <input
                type="number"
                value={k}
                min={2}
                max={20}
                onChange={(e) => setK(Number(e.target.value))}
                style={{ width: 70, padding: 6 }}
              />
            </label>

            <label style={{ fontSize: 12, opacity: 0.8 }}>
              reps/cluster:&nbsp;
              <input
                type="number"
                value={perCluster}
                min={1}
                max={10}
                onChange={(e) => setPerCluster(Number(e.target.value))}
                style={{ width: 110, padding: 6 }}
              />
            </label>

            <button onClick={onRecomputeClusters} disabled={clustering}>
              {clustering ? "Clustering..." : "Recompute themes"}
            </button>

            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {selectedBookId === "none" ? "Across all books" : "Filtered to selected book"}
            </span>
          </div>

          {clusters.length > 0 ? (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {clusters.map((c: any) => (
                <div
                  key={`cluster-${c.cluster_id}`}
                  style={{ border: "1px solid #e0e0e0", borderRadius: 12, padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong>Theme #{c.cluster_id}</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{c.size} notes</span>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                    <strong>Keywords:</strong> {Array.isArray(c.keywords) ? c.keywords.join(", ") : ""}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <strong style={{ fontSize: 12, opacity: 0.9 }}>Representative notes</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                      {c.representatives?.map((r: any) => {
                        const book = r.note.book_id ? booksById.get(r.note.book_id) : null;
                        return (
                          <li key={`rep-${c.cluster_id}-${r.note.id}`} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                              score: {Number(r.score).toFixed(4)}
                              {book ? ` • ${book.title}` : ""}
                            </div>
                            <div>{r.note.text}</div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : null}









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
