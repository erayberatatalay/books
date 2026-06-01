import type { LookupBook } from "./types";

export type BookImportItem = LookupBook & {
  source?: string;
};

export type BookImportPayload = {
  books: BookImportItem[];
};

export type ParsedBookImport = {
  items: BookImportItem[];
};

export type BookImportRowResult = {
  index: number;
  title: string;
  success: boolean;
  book_id?: string;
  created?: boolean;
  updated?: boolean;
  unchanged?: boolean;
  error?: string;
};

export type BookImportResponse = {
  total: number;
  succeeded: number;
  failed: number;
  results: BookImportRowResult[];
};

/** Ayarlar panelinde gösterilecek örnek JSON. */
export const BOOK_IMPORT_EXAMPLE_JSON = `{
  "books": [
    {
      "title": "Hikaye Tadında Biyografiler 1",
      "author": "Kolektif",
      "isbn_13": "9786056514906",
      "publisher": "Aras Yayıncılık",
      "published_year": "2014",
      "page_count": 272,
      "category": "Biyografi",
      "source": "manual"
    },
    {
      "title": "Amok Koşucusu",
      "author": "Stefan Zweig",
      "isbn_13": "9786057897503",
      "page_count": 95
    }
  ]
}`;

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asPageCount(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function normalizeItem(raw: unknown, index: number): BookImportItem {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Satır ${index + 1}: Kitap nesnesi geçersiz.`);
  }

  const row = raw as Record<string, unknown>;
  const title = asTrimmedString(row.title);
  if (!title) {
    throw new Error(`Satır ${index + 1}: "title" zorunludur.`);
  }

  return {
    title,
    subtitle: asTrimmedString(row.subtitle),
    author: asTrimmedString(row.author),
    isbn_10: asTrimmedString(row.isbn_10),
    isbn_13: asTrimmedString(row.isbn_13),
    publisher: asTrimmedString(row.publisher),
    published_year: asTrimmedString(row.published_year),
    page_count: asPageCount(row.page_count),
    description: asTrimmedString(row.description),
    cover_url: asTrimmedString(row.cover_url),
    category: asTrimmedString(row.category),
    source: asTrimmedString(row.source) ?? "json_import",
  };
}

/**
 * Yapıştırılan JSON metnini içe aktarma listesine çevirir.
 * Desteklenen biçimler: `{ "books": [...] }` veya doğrudan `[...]`.
 */
export function parseBookImportJson(text: string): ParsedBookImport {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("JSON boş.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Geçersiz JSON. Virgül, tırnak ve parantezleri kontrol edin.");
  }

  let rows: unknown[];
  if (Array.isArray(parsed)) {
    rows = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as BookImportPayload).books)
  ) {
    rows = (parsed as BookImportPayload).books;
  } else {
    throw new Error(
      'JSON ya "books" dizisi içermeli ya da doğrudan kitap dizisi olmalı.'
    );
  }

  if (rows.length === 0) {
    throw new Error("En az bir kitap gerekli.");
  }
  if (rows.length > 200) {
    throw new Error("Tek seferde en fazla 200 kitap eklenebilir.");
  }

  const items = rows.map((row, index) => normalizeItem(row, index));
  return { items };
}
