"use client";

import { useState } from "react";
import type { BookNote } from "@/lib/types";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { EmptyState } from "@/components/common/EmptyState";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BookNotes({
  bookId,
  initialNotes,
}: {
  bookId: string;
  initialNotes: BookNote[];
}) {
  const [notes, setNotes] = useState<BookNote[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not eklenemedi.");
        return;
      }
      setNotes((prev) => [data.note as BookNote, ...prev]);
      setDraft("");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(noteId: string) {
    if (!editText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: noteId, note: editText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not güncellenemedi.");
        return;
      }
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, note: editText.trim() } : n))
      );
      setEditingId(null);
      setEditText("");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(noteId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/books/${bookId}/notes?note_id=${noteId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not silinemedi.");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={addNote} className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Kişisel notunu yaz..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          Not Ekle
        </button>
      </form>

      <ErrorMessage message={error} />

      {notes.length === 0 ? (
        <EmptyState title="Henüz kişisel not eklemedin." icon="📝" />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              {editingId === n.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(n.id)}
                      disabled={busy}
                      className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {n.note}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {formatDate(n.created_at)}
                    </span>
                    <div className="flex gap-3 text-[11px]">
                      <button
                        onClick={() => {
                          setEditingId(n.id);
                          setEditText(n.note);
                        }}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteNote(n.id)}
                        disabled={busy}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
