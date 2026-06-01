"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { BookLookupResponse } from "@/lib/types";
import { normalizeIsbn, isValidIsbn } from "@/lib/isbn";
import { BarcodeScanner } from "./BarcodeScanner";
import { BookLookupPreview } from "./BookLookupPreview";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorMessage } from "@/components/common/ErrorMessage";

type Phase = "scanning" | "looking" | "found" | "notfound";

export function ScanFlow() {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [isbn, setIsbn] = useState<string>("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const [result, setResult] = useState<BookLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookupIsbn = useCallback(async (normalized: string) => {
    setIsbn(normalized);
    setPhase("looking");
    setError(null);

    try {
      const res = await fetch(
        `/api/books/lookup?isbn=${encodeURIComponent(normalized)}`
      );
      const data = (await res.json()) as BookLookupResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Arama sırasında bir hata oluştu.");
        setScanKey((k) => k + 1);
        setPhase("scanning");
        return;
      }
      setResult(data);
      setPhase(data.found ? "found" : "notfound");
    } catch {
      setError("Kitap bilgisi alınamadı.");
      setPhase("notfound");
    }
  }, []);

  const handleDetected = useCallback(
    (code: string): boolean => {
      const normalized = normalizeIsbn(code);
      if (!isValidIsbn(normalized)) {
        setError("Okunan kod geçerli bir ISBN değil. Tekrar deneyin.");
        return false;
      }

      setError(null);
      void lookupIsbn(normalized);
      return true;
    },
    [lookupIsbn]
  );

  function rescan() {
    setResult(null);
    setError(null);
    setIsbn("");
    setManualIsbn("");
    setScanKey((k) => k + 1);
    setPhase("scanning");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeIsbn(manualIsbn);
    if (!isValidIsbn(normalized)) {
      setError("Geçerli bir ISBN girin (10 veya 13 hane).");
      return;
    }
    setError(null);
    await lookupIsbn(normalized);
  }

  return (
    <div className="space-y-4">
      {phase === "scanning" && (
        <>
          <BarcodeScanner
            key={scanKey}
            onDetected={handleDetected}
            active
          />
          <ErrorMessage message={error} />

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Kamera okumuyor mu? ISBN’i elle gir
            </p>
            <form onSubmit={submitManual} className="flex gap-2">
              <input
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
                placeholder="9786057897503"
                inputMode="numeric"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!manualIsbn.trim()}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                Ara
              </button>
            </form>
          </div>
        </>
      )}

      {phase === "looking" && (
        <LoadingState message={`Kitap aranıyor (${isbn})...`} />
      )}

      {phase === "found" && result?.book && result.source && (
        <div className="space-y-3">
          <BookLookupPreview book={result.book} source={result.source} />
          <button
            onClick={rescan}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Yeniden Tara
          </button>
        </div>
      )}

      {phase === "notfound" && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p>
            {isbn ? `${isbn} için ` : ""}kitap bilgisi bulunamadı. Bilgileri elle
            girebilirsin.
          </p>
          {result?.hint && (
            <p className="text-xs text-amber-700">{result.hint}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/books/add"
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-600"
            >
              Manuel Ekle
            </Link>
            <button
              onClick={rescan}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Yeniden Tara
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
