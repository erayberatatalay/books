"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LookupBook, LookupSource } from "@/lib/types";
import { normalizeExternalCoverUrl } from "@/lib/normalizeCoverUrl";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { BookForm } from "./BookForm";

type SavedState = {
  bookId: string;
  duplicate?: boolean;
  title: string;
};

export function BookLookupPreview({
  book,
  source,
  onContinueScan,
}: {
  book: LookupBook;
  source: LookupSource;
  /** Kayıttan sonra barkod ekranına dönmek için */
  onContinueScan?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedState | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...book, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kitap eklenemedi.");
        return;
      }
      if (data.book_id && onContinueScan) {
        setSaved({
          bookId: data.book_id,
          duplicate: data.duplicate,
          title: book.title,
        });
        return;
      }
      if (data.book_id) {
        router.push(`/books/${data.book_id}`);
      } else {
        router.push("/books");
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  if (saved && onContinueScan) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="space-y-1">
          <p className="font-semibold text-green-900">
            {saved.duplicate ? "Kopya eklendi" : "Kitap kaydedildi"}
          </p>
          <p className="text-sm text-green-800">{saved.title}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onContinueScan}
            className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Seriye Devam Et — Yeni Barkod Tara
          </button>
          <Link
            href={`/books/${saved.bookId}`}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Kitaba Git
          </Link>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Bilgileri kontrol edip kaydedebilirsin.
        </p>
        <BookForm
          initial={book}
          source={source}
          onSuccess={
            onContinueScan
              ? ({ bookId, duplicate }) =>
                  setSaved({ bookId, duplicate, title: book.title })
              : undefined
          }
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-32 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeExternalCoverUrl(book.cover_url) ?? book.cover_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-32 w-20 items-center justify-center text-2xl text-gray-300">
              📕
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold text-gray-900">{book.title}</h3>
          {book.subtitle && (
            <p className="text-sm text-gray-600">{book.subtitle}</p>
          )}
          {book.author && (
            <p className="text-sm text-gray-500">{book.author}</p>
          )}
          {book.publisher && (
            <p className="text-xs text-gray-400">
              {book.publisher}
              {book.published_year ? ` · ${book.published_year}` : ""}
            </p>
          )}
          {(book.isbn_13 || book.isbn_10) && (
            <p className="text-xs text-gray-400">
              ISBN: {book.isbn_13 ?? book.isbn_10}
            </p>
          )}
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kitabı Kaydet"}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Bilgileri Düzenle
        </button>
      </div>
    </div>
  );
}
