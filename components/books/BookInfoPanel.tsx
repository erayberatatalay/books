"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Book, BookCopy } from "@/lib/types";
import {
  COPY_STATUS_LABELS,
  LOOKUP_SOURCE_LABELS,
} from "@/lib/constants";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { BookForm } from "./BookForm";

const EMPTY = "—";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSource(source: string | null | undefined): string {
  if (!source) return EMPTY;
  return LOOKUP_SOURCE_LABELS[source] ?? source;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const text =
    value === null || value === undefined || value === ""
      ? EMPTY
      : String(value);
  const isEmpty = text === EMPTY;

  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span
        className={`min-w-0 break-words text-right font-medium ${
          isEmpty ? "text-gray-400" : "text-gray-800"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const text = value?.trim() ? value : EMPTY;
  const isEmpty = text === EMPTY;

  return (
    <div className="border-b border-gray-100 py-2.5 last:border-0">
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <p
        className={`whitespace-pre-wrap text-sm ${
          isEmpty ? "text-gray-400" : "text-gray-800"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function copySummary(copies: BookCopy[]): string {
  if (copies.length === 0) return EMPTY;
  const onShelf = copies.filter((c) => c.status === "on_shelf").length;
  const withMember = copies.filter((c) => c.status === "with_member").length;
  const parts = [`${copies.length} kopya`];
  if (onShelf > 0) parts.push(`${onShelf} rafta`);
  if (withMember > 0) parts.push(`${withMember} üyede`);
  const other = copies.filter(
    (c) => c.status !== "on_shelf" && c.status !== "with_member"
  );
  for (const c of other) {
    parts.push(COPY_STATUS_LABELS[c.status].toLowerCase());
  }
  return parts.join(" · ");
}

export function BookInfoPanel({
  book,
  copies = [],
  canEdit,
  canDelete,
}: {
  book: Book;
  copies?: BookCopy[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kitap silinemedi.");
        return;
      }
      router.push("/books");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (editing) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Kitap Bilgilerini Düzenle
        </h2>
        <BookForm
          mode="edit"
          bookId={book.id}
          initial={{
            title: book.title,
            subtitle: book.subtitle ?? undefined,
            author: book.author ?? undefined,
            isbn_13: book.isbn_13 ?? undefined,
            isbn_10: book.isbn_10 ?? undefined,
            publisher: book.publisher ?? undefined,
            published_year: book.published_year ?? undefined,
            page_count: book.page_count ?? undefined,
            category: book.category ?? undefined,
            cover_url: book.cover_url ?? undefined,
            description: book.description ?? undefined,
          }}
          onSuccess={() => {
            setEditing(false);
            router.refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Kitap Bilgileri</h2>
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Düzenle
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Sil
              </button>
            )}
          </div>
        )}
      </div>

      <DetailRow label="Kitap Adı" value={book.title} />
      <DetailRow label="Alt Başlık" value={book.subtitle} />
      <DetailRow label="Yazar" value={book.author} />
      <DetailRow label="ISBN-13" value={book.isbn_13} />
      <DetailRow label="ISBN-10" value={book.isbn_10} />
      <DetailRow label="Yayınevi" value={book.publisher} />
      <DetailRow label="Yayın Yılı" value={book.published_year} />
      <DetailRow
        label="Sayfa Sayısı"
        value={book.page_count != null ? book.page_count : null}
      />
      <DetailRow label="Kategori" value={book.category} />
      <DetailRow label="Kaynak" value={formatSource(book.source)} />
      <DetailRow label="Kopya Durumu" value={copySummary(copies)} />
      <DetailRow label="Eklenme Tarihi" value={formatDate(book.created_at)} />
      <DetailRow
        label="Son Güncelleme"
        value={formatDate(book.updated_at)}
      />

      <DetailBlock label="Açıklama" value={book.description} />

      <ErrorMessage message={error} />

      {confirmDelete && (
        <div className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            <strong>{book.title}</strong> kitabını ve tüm kopyalarını silmek
            istediğine emin misin? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Siliniyor..." : "Evet, Sil"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
