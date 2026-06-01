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
  const [result, setResult] = useState<BookLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetected = useCallback(async (code: string) => {
    const normalized = normalizeIsbn(code);
    if (!isValidIsbn(normalized)) {
      setError("Okunan kod geçerli bir ISBN değil. Tekrar deneyin.");
      return;
    }

    setIsbn(normalized);
    setPhase("looking");
    setError(null);

    try {
      const res = await fetch(`/api/books/lookup?isbn=${normalized}`);
      const data = (await res.json()) as BookLookupResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Arama sırasında bir hata oluştu.");
        setPhase("scanning");
        return;
      }
      setResult(data);
      if (data.found) {
        setPhase("found");
      } else {
        setPhase("notfound");
      }
    } catch {
      setError("Kitap bilgisi alınamadı.");
      setPhase("notfound");
    }
  }, []);

  function rescan() {
    setResult(null);
    setError(null);
    setIsbn("");
    setPhase("scanning");
  }

  return (
    <div className="space-y-4">
      {phase === "scanning" && (
        <>
          <BarcodeScanner onDetected={handleDetected} active />
          <ErrorMessage message={error} />
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
              href={`/books/add`}
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
