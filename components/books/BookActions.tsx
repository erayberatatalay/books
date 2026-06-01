"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export function BookActions({
  bookId,
  isWithMember,
  heldByMe,
  isAdmin,
  isArchived,
}: {
  bookId: string;
  isWithMember: boolean;
  heldByMe: boolean;
  isAdmin: boolean;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "İşlem başarısız oldu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {!isWithMember || !heldByMe ? (
          <button
            onClick={() => call(`/api/books/${bookId}/take`, "POST")}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            Kitap Şu An Bende
          </button>
        ) : null}

        {isWithMember ? (
          <button
            onClick={() => call(`/api/books/${bookId}/return`, "POST")}
            disabled={busy}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Rafa Geri Koy
          </button>
        ) : null}
      </div>

      {isAdmin && (
        <button
          onClick={() =>
            call(`/api/books/${bookId}`, "PATCH", { is_archived: !isArchived })
          }
          disabled={busy}
          className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {isArchived ? "Arşivden Çıkar" : "Kitabı Arşivle"}
        </button>
      )}

      <ErrorMessage message={error} />
    </div>
  );
}
