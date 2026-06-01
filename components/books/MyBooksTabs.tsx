"use client";

import { useMemo, useState } from "react";
import type { ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABELS } from "@/lib/constants";
import { BookCard, type BookCardData } from "./BookCard";
import { EmptyState } from "@/components/common/EmptyState";

const TABS: ReadingStatus[] = [
  "reading",
  "read",
  "not_read",
  "want_to_read",
  "abandoned",
];

export function MyBooksTabs({ items }: { items: BookCardData[] }) {
  const [active, setActive] = useState<ReadingStatus>("reading");

  const filtered = useMemo(
    () => items.filter((it) => it.readingStatus === active),
    [items, active]
  );

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
              active === tab
                ? "bg-brand-500 text-white"
                : "bg-white text-gray-600 ring-1 ring-gray-200"
            }`}
          >
            {READING_STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={`"${READING_STATUS_LABELS[active]}" durumunda kitap yok.`}
          description="Bir kitabın detay sayfasından okuma durumunu güncelleyebilirsin."
          icon="📖"
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
