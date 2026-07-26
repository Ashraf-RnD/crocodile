import { useEffect, useState } from "react";

interface LinkEntry {
  topic: string;
  url: string;
  notes?: string;
}

export default function LinksManager() {
  const [links, setLinks] = useState<LinkEntry[] | null>(null);
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json())
      .then(setLinks);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, url, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add link.");
        return;
      }
      setLinks(data);
      setTopic("");
      setUrl("");
      setNotes("");
    } catch {
      setError("Failed to reach the server. Is the dev server running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          alignItems: "flex-start",
          margin: "1rem 0 1.5rem",
        }}
      >
        <input
          type="text"
          placeholder="Topic name"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid var(--accent)",
            background: "var(--accent-soft)",
            color: "var(--accent)",
            cursor: submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "Adding…" : "Add link"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: "-1rem" }}>{error}</p>
      )}

      {links === null ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading…</p>
      ) : (
        <ul className="topic-list">
          {links.map((link) => (
            <li key={`${link.topic}-${link.url}`} className="topic-card">
              <div>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.topic}
                </a>
                {link.notes && <div className="topic-card-meta">{link.notes}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.7rem",
  fontSize: "0.85rem",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
};
