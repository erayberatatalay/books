"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookLookupResponse } from "@/lib/types";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingState } from "@/components/common/LoadingState";
import { BookForm } from "./BookForm";
import { BookLookupPreview } from "./BookLookupPreview";

type Tab = "isbn" | "manual";

export function AddBookTabs() {
  const [tab, setTab] = useState<Tab>("isbn");
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookLookupResponse | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!isbn.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/books/lookup?isbn=${encodeURIComponent(isbn.trim())}`
      );
      const data = (await res.json()) as BookLookupResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Arama sırasında bir hata oluştu.");
        return;
      }
      setResult(data);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href="/books/scan"
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
      >
        📷 Barkod Tara
      </Link>

      <div className="flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
        <button
          onClick={() => setTab("isbn")}
          className={`flex-1 rounded-md py-1.5 font-medium ${
            tab === "isbn" ? "bg-brand-50 text-brand-700" : "text-gray-500"
          }`}
        >
          ISBN ile Ara
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-md py-1.5 font-medium ${
            tab === "manual" ? "bg-brand-50 text-brand-700" : "text-gray-500"
          }`}
        >
          Manuel Ekle
        </button>
      </div>

      {tab === "isbn" && (
        <div className="space-y-4">
          <form onSubmit={search} className="flex gap-2">
            <input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="ISBN girin (10 veya 13 haneli)"
              inputMode="numeric"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading || !isbn.trim()}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              Ara
            </button>
          </form>

          <ErrorMessage message={error} />
          {loading && <LoadingState message="Kitap aranıyor..." />}

          {result && result.found && result.book && result.source && (
            <BookLookupPreview book={result.book} source={result.source} />
          )}

          {result && !result.found && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>
                Bu ISBN için kitap bilgisi bulunamadı. Bilgileri elle
                girebilirsin.
              </p>
              {result.hint && (
                <p className="text-xs text-amber-700">{result.hint}</p>
              )}
              <button
                onClick={() => setTab("manual")}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Manuel Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "manual" && (
        <BookForm
          initial={isbn.trim() ? { isbn_13: isbn.trim() } : undefined}
          source="manual"
        />
      )}
    </div>
  );
}
