import { normalizeIsbn } from "./isbn";
import type { BookLookupResponse, LookupBook } from "./types";

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    description?: string;
    categories?: string[];
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

function extractYear(date?: string): string | undefined {
  if (!date) return undefined;
  const match = date.match(/\d{4}/);
  return match ? match[0] : undefined;
}

async function lookupGoogleBooks(isbn: string): Promise<LookupBook | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `isbn:${isbn}`);
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { totalItems?: number; items?: GoogleVolume[] };
  if (!data.items || data.items.length === 0) {
    return null;
  }

  const info = data.items[0].volumeInfo;
  if (!info || !info.title) {
    return null;
  }

  let isbn10: string | undefined;
  let isbn13: string | undefined;
  for (const id of info.industryIdentifiers ?? []) {
    if (id.type === "ISBN_10") isbn10 = id.identifier;
    if (id.type === "ISBN_13") isbn13 = id.identifier;
  }

  const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;

  return {
    title: info.title,
    subtitle: info.subtitle,
    author: info.authors?.join(", "),
    isbn_10: isbn10,
    isbn_13: isbn13,
    publisher: info.publisher,
    published_year: extractYear(info.publishedDate),
    page_count: info.pageCount,
    description: info.description,
    cover_url: cover ? cover.replace("http://", "https://") : undefined,
    category: info.categories?.[0],
  };
}

type OpenLibraryBook = {
  title?: string;
  subtitle?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: { large?: string; medium?: string; small?: string };
  subjects?: { name?: string }[];
  identifiers?: { isbn_10?: string[]; isbn_13?: string[] };
  notes?: string | { value?: string };
};

async function lookupOpenLibrary(isbn: string): Promise<LookupBook | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as Record<string, OpenLibraryBook>;
  const entry = data[`ISBN:${isbn}`];
  if (!entry || !entry.title) {
    return null;
  }

  const cover = entry.cover?.large ?? entry.cover?.medium ?? entry.cover?.small;
  const description =
    typeof entry.notes === "string" ? entry.notes : entry.notes?.value;

  return {
    title: entry.title,
    subtitle: entry.subtitle,
    author: entry.authors?.map((a) => a.name).filter(Boolean).join(", ") || undefined,
    isbn_10: entry.identifiers?.isbn_10?.[0],
    isbn_13: entry.identifiers?.isbn_13?.[0],
    publisher: entry.publishers?.map((p) => p.name).filter(Boolean).join(", ") || undefined,
    published_year: extractYear(entry.publish_date),
    page_count: entry.number_of_pages,
    description,
    cover_url: cover,
    category: entry.subjects?.[0]?.name,
  };
}

/**
 * ISBN ile kitap bilgisi arar. Önce Google Books, bulunamazsa Open Library.
 */
export async function lookupBookByIsbn(rawIsbn: string): Promise<BookLookupResponse> {
  const isbn = normalizeIsbn(rawIsbn);

  try {
    const google = await lookupGoogleBooks(isbn);
    if (google) {
      const book = ensureIsbn(google, isbn);
      return { found: true, source: "google_books", book };
    }
  } catch {
    // Google Books hatası: Open Library fallback'ine devam et.
  }

  try {
    const openLib = await lookupOpenLibrary(isbn);
    if (openLib) {
      const book = ensureIsbn(openLib, isbn);
      return { found: true, source: "open_library", book };
    }
  } catch {
    // Open Library hatası: bulunamadı olarak dön.
  }

  return { found: false };
}

/**
 * API'den ISBN gelmezse, aranan ISBN'i uzunluğuna göre doldurur.
 */
function ensureIsbn(book: LookupBook, isbn: string): LookupBook {
  const result = { ...book };
  if (isbn.length === 13 && !result.isbn_13) {
    result.isbn_13 = isbn;
  }
  if (isbn.length === 10 && !result.isbn_10) {
    result.isbn_10 = isbn;
  }
  return result;
}
