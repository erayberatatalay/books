"use client";

import { useState } from "react";
import {
  BOOK_IMPORT_EXAMPLE_JSON,
  parseBookImportJson,
  type BookImportResponse,
} from "@/lib/bookImport";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export function JsonBookImportPanel() {
  const [jsonText, setJsonText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookImportResponse | null>(null);

  function loadExample() {
    setJsonText(BOOK_IMPORT_EXAMPLE_JSON);
    setError(null);
    setResult(null);
  }

  async function handleImport() {
    setError(null);
    setResult(null);

    try {
      parseBookImportJson(jsonText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON geçersiz.");
      return;
    }

    setRunning(true);
    try {
      const res = await fetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: jsonText }),
      });
      const data = (await res.json()) as BookImportResponse & {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "İçe aktarma başarısız.");
        return;
      }
      setResult(data);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section
      id="json-import"
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 scroll-mt-20"
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          JSON ile Toplu Kitap Ekle
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Aşağıdaki formata uygun JSON yapıştırın ve çalıştırın. Aynı ISBN
          sistemde kayıtlıysa yalnızca eksik alanlar doldurulur.
        </p>
      </div>

      <details className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-gray-700">
          JSON formatı
        </summary>
        <div className="mt-3 space-y-3 text-gray-600">
          <p>
            Kök nesne <code className="rounded bg-white px-1">books</code>{" "}
            dizisi içermeli. Alternatif olarak doğrudan kitap dizisi de
            kullanılabilir: <code className="rounded bg-white px-1">[...]</code>
          </p>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-1 pr-2">Alan</th>
                <th className="py-1 pr-2">Zorunlu</th>
                <th className="py-1">Açıklama</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr>
                <td className="py-1 pr-2 font-mono">title</td>
                <td className="py-1 pr-2">Evet</td>
                <td className="py-1">Kitap adı</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">author</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Yazar</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">isbn_13</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">13 haneli ISBN</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">isbn_10</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">10 haneli ISBN</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">subtitle</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Alt başlık</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">publisher</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Yayınevi</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">published_year</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Örn. &quot;2014&quot;</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">page_count</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Sayfa sayısı (sayı)</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">description</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Kitap açıklaması</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">cover_url</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Kapak görseli URL</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">category</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Kategori</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-mono">source</td>
                <td className="py-1 pr-2">Hayır</td>
                <td className="py-1">Kaynak etiketi (varsayılan: json_import)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder='{ "books": [ { "title": "...", "isbn_13": "..." } ] }'
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={loadExample}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Örnek JSON Yükle
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={running || !jsonText.trim()}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {running ? "Ekleniyor..." : "JSON'u Çalıştır ve Kaydet"}
        </button>
      </div>

      <ErrorMessage message={error} />

      {result && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-medium text-green-900">
            {result.succeeded}/{result.total} kayıt eklendi
            {result.failed > 0 ? ` · ${result.failed} hata` : ""}
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-green-800">
            {result.results.map((row) => (
              <li key={row.index}>
                {row.success ? "✓" : "✗"} {row.title}
                {row.success && row.created ? " (yeni)" : ""}
                {row.success && row.updated ? " (güncellendi)" : ""}
                {row.success && row.unchanged ? " (değişiklik yok)" : ""}
                {row.error ? ` — ${row.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
