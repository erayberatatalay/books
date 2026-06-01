"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LookupBook } from "@/lib/types";
import { resolveCoverUrl } from "@/lib/normalizeCoverUrl";
import { ErrorMessage } from "@/components/common/ErrorMessage";

type FormState = {
  title: string;
  subtitle: string;
  author: string;
  isbn_13: string;
  isbn_10: string;
  publisher: string;
  published_year: string;
  page_count: string;
  category: string;
  cover_url: string;
  description: string;
};

function toFormState(initial?: Partial<LookupBook>): FormState {
  return {
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    author: initial?.author ?? "",
    isbn_13: initial?.isbn_13 ?? "",
    isbn_10: initial?.isbn_10 ?? "",
    publisher: initial?.publisher ?? "",
    published_year: initial?.published_year ?? "",
    page_count: initial?.page_count ? String(initial.page_count) : "",
    category: initial?.category ?? "",
    cover_url: resolveCoverUrl(initial?.cover_url) ?? "",
    description: initial?.description ?? "",
  };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function BookForm({
  initial,
  source,
  bookId,
  mode = "create",
  submitLabel,
  onSuccess,
  onCancel,
}: {
  initial?: Partial<LookupBook>;
  source?: string;
  bookId?: string;
  mode?: "create" | "edit";
  submitLabel?: string;
  onSuccess?: (result: { bookId: string; duplicate?: boolean }) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Kitap adı zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      author: form.author || undefined,
      isbn_13: form.isbn_13 || undefined,
      isbn_10: form.isbn_10 || undefined,
      publisher: form.publisher || undefined,
      published_year: form.published_year || undefined,
      page_count: form.page_count ? Number(form.page_count) : undefined,
      category: form.category || undefined,
      cover_url: resolveCoverUrl(form.cover_url) ?? undefined,
      description: form.description || undefined,
    };

    try {
      if (mode === "edit" && bookId) {
        const res = await fetch(`/api/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Kitap güncellenemedi.");
          return;
        }
        if (onSuccess) {
          onSuccess({ bookId });
        } else {
          router.refresh();
        }
        return;
      }

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, source: source ?? "manual" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kitap eklenemedi.");
        return;
      }
      if (data.book_id) {
        if (onSuccess) {
          onSuccess({ bookId: data.book_id, duplicate: data.duplicate });
        } else {
          router.push(`/books/${data.book_id}`);
          router.refresh();
        }
      } else {
        router.push("/books");
        router.refresh();
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {form.cover_url && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.cover_url}
            alt="Kapak"
            className="h-40 rounded-lg border border-gray-200 object-cover"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Kitap Adı *
        </label>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Alt Başlık
        </label>
        <input
          className={inputClass}
          value={form.subtitle}
          onChange={(e) => update("subtitle", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Yazar
        </label>
        <input
          className={inputClass}
          value={form.author}
          onChange={(e) => update("author", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ISBN-13
          </label>
          <input
            className={inputClass}
            value={form.isbn_13}
            onChange={(e) => update("isbn_13", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ISBN-10
          </label>
          <input
            className={inputClass}
            value={form.isbn_10}
            onChange={(e) => update("isbn_10", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Yayınevi
          </label>
          <input
            className={inputClass}
            value={form.publisher}
            onChange={(e) => update("publisher", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Yayın Yılı
          </label>
          <input
            className={inputClass}
            value={form.published_year}
            onChange={(e) => update("published_year", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sayfa Sayısı
          </label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.page_count}
            onChange={(e) => update("page_count", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Kategori
          </label>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Kapak Görseli URL
        </label>
        <input
          className={inputClass}
          value={form.cover_url}
          onChange={(e) => update("cover_url", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Açıklama
        </label>
        <textarea
          rows={4}
          className={inputClass}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <ErrorMessage message={error} />

      <div className="flex flex-col gap-2 sm:flex-row">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving
            ? "Kaydediliyor..."
            : submitLabel ??
              (mode === "edit" ? "Değişiklikleri Kaydet" : "Kitabı Kaydet")}
        </button>
      </div>
    </form>
  );
}
