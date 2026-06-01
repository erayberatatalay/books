"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABELS, READING_STATUS_ORDER } from "@/lib/constants";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export function ReadingStatusSelect({
  bookId,
  initialStatus,
}: {
  bookId: string;
  initialStatus: ReadingStatus | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ReadingStatus>(initialStatus ?? "not_read");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: ReadingStatus) {
    setStatus(next);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/books/${bookId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Okuma Durumum
      </label>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as ReadingStatus)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
      >
        {READING_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {READING_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {saving && <p className="text-xs text-gray-400">Kaydediliyor...</p>}
      <ErrorMessage message={error} />
    </div>
  );
}
