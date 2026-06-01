"use client";

import { useMemo, useState } from "react";
import type { ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABELS, READING_STATUS_ORDER } from "@/lib/constants";
import { BookCard, type BookCardData } from "./BookCard";
import { EmptyState } from "@/components/common/EmptyState";

export function BookList({ items }: { items: BookCardData[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ReadingStatus | "">("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.book.category) set.add(it.book.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return items.filter((it) => {
      if (category && it.book.category !== category) return false;
      if (status && it.readingStatus !== status) return false;
      if (q) {
        const haystack = [
          it.book.title,
          it.book.author,
          it.book.isbn_10,
          it.book.isbn_13,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr");
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, category, status]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kitap adı, yazar veya ISBN ara..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus | "")}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Tüm durumlar</option>
            {READING_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {READING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Kitap bulunamadı"
          description="Arama veya filtre kriterlerine uygun kitap yok."
          icon="🔍"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((it) => (
            <BookCard key={it.book.id} {...it} />
          ))}
        </div>
      )}
    </div>
  );
}
