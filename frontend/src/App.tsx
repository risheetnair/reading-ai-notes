import { useState } from "react";

const API = "http://127.0.0.1:8000";

type Note = {
  id: number;
  book_id: number | null;
  text: string;
  created_at: string;
};

export default function App() {
  const [status, setStatus] = useState<string>("Not tested");
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState<string>("");

  async function refreshNotes() {
    const res = await fetch(`${API}/notes?limit=5&offset=0`);
    if (!res.ok) throw new Error(`GET /notes failed (HTTP ${res.status})`);
    const data = (await res.json()) as Note[];
    setNotes(data);
  }

  async function testApi() {
    try {
      await refreshNotes();
      setStatus("✅ Connected to backend");
    } catch (e: any) {
      setStatus(`❌ Failed: ${e.message}`);
    }
  }

  async function createNote() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const res = await fetch(`${API}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!res.ok) {
      const err = await res.text();
      alert(err);
      return;
    }

    setText("");
    await testApi();
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Reading AI Notes</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={testApi}>Test backend connection</button>
        <span>Status: {status}</span>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Create a note</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a note..."
        style={{ width: "100%", padding: 10, fontSize: 16 }}
      />
      <button onClick={createNote} style={{ marginTop: 10 }}>
        Create
      </button>

      <hr style={{ margin: "24px 0" }} />

      <h2>Latest notes</h2>
      {notes.length === 0 ? (
        <p>No notes yet. Create one above, then test connection.</p>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n.id} style={{ marginBottom: 8 }}>
              <strong>#{n.id}</strong>{" "}
              <span style={{ opacity: 0.7 }}>
                ({new Date(n.created_at).toLocaleString()})
              </span>
              <div>{n.text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
