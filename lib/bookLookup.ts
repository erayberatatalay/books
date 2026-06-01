import { fetchJson } from "./fetchJson";
import { getIsbnVariants } from "./isbnConvert";
import { normalizeIsbn } from "./isbn";
import { lookupHarikakitap } from "./providers/harikakitap";
import type { BookLookupResponse, LookupBook, LookupSource } from "./types";

// ---------------------------------------------------------------------------
// Hardcover.app — GraphQL, ücretsiz hesap tokeni ile çalışır
// https://hardcover.app/account/api  →  HARDCOVER_API_TOKEN
// ---------------------------------------------------------------------------

type HardcoverEdition = {
  isbn_13?: string | null;
  isbn_10?: string | null;
  title?: string | null;
  subtitle?: string | null;
  pages?: number | null;
  release_date?: string | null;
  publisher?: { name?: string } | null;
};

type HardcoverBook = {
  title?: string | null;
  description?: string | null;
  pages?: number | null;
  release_year?: number | null;
  image?: { url?: string } | null;
  contributions?: { author?: { name?: string } }[];
  editions?: HardcoverEdition[];
};

type HardcoverResponse = {
  data?: { books?: HardcoverBook[] };
  errors?: { message: string }[];
};

const HARDCOVER_QUERY = /* graphql */ `
  query BookByIsbn($isbn: String!) {
    books(
      where: {
        editions: {
          _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }]
        }
      }
      limit: 1
    ) {
      title
      description
      pages
      release_year
      image { url }
      contributions { author { name } }
      editions(
        where: {
          _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }]
        }
        limit: 1
      ) {
        isbn_13
        isbn_10
        title
        subtitle
        pages
        release_date
        publisher { name }
      }
    }
  }
`;

async function lookupHardcover(isbn: string): Promise<LookupBook | null> {
  const token = process.env.HARDCOVER_API_TOKEN?.trim();
  if (!token) return null;

  const res = await fetch("https://api.hardcover.app/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: HARDCOVER_QUERY, variables: { isbn } }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as HardcoverResponse;
  const book = json.data?.books?.[0];
  if (!book?.title) return null;

  const edition = book.editions?.[0];
  const authors = (book.contributions ?? [])
    .map((c) => c.author?.name)
    .filter((n): n is string => Boolean(n));

  const publisherName =
    edition?.publisher?.name ?? undefined;

  const publishedYear = edition?.release_date
    ? edition.release_date.slice(0, 4)
    : book.release_year
    ? String(book.release_year)
    : undefined;

  return {
    title: edition?.title ?? book.title,
    subtitle: edition?.subtitle ?? undefined,
    author: authors.join(", ") || undefined,
    isbn_10: edition?.isbn_10 ?? undefined,
    isbn_13: edition?.isbn_13 ?? undefined,
    publisher: publisherName,
    published_year: publishedYear,
    page_count: edition?.pages ?? book.pages ?? undefined,
    description: book.description ?? undefined,
    cover_url: book.image?.url ?? undefined,
  };
}

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

type GoogleResponse = {
  totalItems?: number;
  items?: GoogleVolume[];
  error?: { message?: string; code?: number };
};

type OpenLibraryBook = {
  title?: string;
  subtitle?: string;
  authors?: { name?: string; key?: string }[];
  publishers?: { name?: string }[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: { large?: string; medium?: string; small?: string };
  subjects?: { name?: string }[];
  identifiers?: { isbn_10?: string[]; isbn_13?: string[] };
  notes?: string | { value?: string };
};

type OpenLibrarySearchDoc = {
  title?: string;
  subtitle?: string;
  author_name?: string[];
  publisher?: string[];
  publish_year?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  first_sentence?: string[];
};

type OpenLibraryEdition = {
  title?: string | { value?: string };
  subtitle?: string | { value?: string };
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  covers?: number[];
  authors?: { key?: string }[];
  works?: { key?: string }[];
  subjects?: string[];
  description?: string | { value?: string };
};

type OpenLibraryAuthor = {
  name?: string;
};

type OpenLibraryWork = {
  description?: string | { value?: string };
  subjects?: string[];
};

function extractYear(date?: string): string | undefined {
  if (!date) return undefined;
  const match = date.match(/\d{4}/);
  return match ? match[0] : undefined;
}

function textField(value?: string | { value?: string }): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.value;
}

function coverFromId(id?: number): string | undefined {
  if (!id) return undefined;
  return `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
}

function coverFromOl(cover?: OpenLibraryBook["cover"]): string | undefined {
  return cover?.large ?? cover?.medium ?? cover?.small;
}

function mapGoogleVolume(info: NonNullable<GoogleVolume["volumeInfo"]>): LookupBook {
  let isbn10: string | undefined;
  let isbn13: string | undefined;
  for (const id of info.industryIdentifiers ?? []) {
    if (id.type === "ISBN_10") isbn10 = id.identifier;
    if (id.type === "ISBN_13") isbn13 = id.identifier;
  }
  const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
  return {
    title: info.title!,
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

async function lookupGoogleBooks(isbn: string): Promise<LookupBook | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `isbn:${isbn}`);
  url.searchParams.set("key", apiKey);

  const result = await fetchJson<GoogleResponse>(url.toString());
  if (!result.ok) {
    // Anahtarsız kullanımda paylaşılan kota hızla doluyor (429).
    return null;
  }

  const data = result.data;
  if (!data.items?.length) return null;

  const info = data.items[0].volumeInfo;
  if (!info?.title) return null;

  return mapGoogleVolume(info);
}

async function lookupOpenLibraryData(isbn: string): Promise<LookupBook | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
  const result = await fetchJson<Record<string, OpenLibraryBook>>(url);
  if (!result.ok) return null;

  const entry = result.data[`ISBN:${isbn}`];
  if (!entry?.title) return null;

  const description =
    typeof entry.notes === "string" ? entry.notes : entry.notes?.value;

  return {
    title: entry.title,
    subtitle: entry.subtitle,
    author:
      entry.authors?.map((a) => a.name).filter(Boolean).join(", ") || undefined,
    isbn_10: entry.identifiers?.isbn_10?.[0],
    isbn_13: entry.identifiers?.isbn_13?.[0],
    publisher:
      entry.publishers?.map((p) => p.name).filter(Boolean).join(", ") ||
      undefined,
    published_year: extractYear(entry.publish_date),
    page_count: entry.number_of_pages,
    description,
    cover_url: coverFromOl(entry.cover),
    category: entry.subjects?.[0]?.name,
  };
}

async function lookupOpenLibrarySearch(isbn: string): Promise<LookupBook | null> {
  const url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`;
  const result = await fetchJson<{ numFound?: number; docs?: OpenLibrarySearchDoc[] }>(
    url
  );
  if (!result.ok) return null;

  const doc = result.data.docs?.[0];
  if (!doc?.title) return null;

  const isbns = doc.isbn ?? [];
  const isbn13 = isbns.find((x) => x.length === 13) ?? (isbn.length === 13 ? isbn : undefined);
  const isbn10 = isbns.find((x) => x.length === 10) ?? (isbn.length === 10 ? isbn : undefined);

  return {
    title: doc.title,
    subtitle: doc.subtitle,
    author: doc.author_name?.join(", "),
    isbn_10: isbn10,
    isbn_13: isbn13,
    publisher: doc.publisher?.join(", "),
    published_year: doc.publish_year ? String(doc.publish_year) : undefined,
    page_count: doc.number_of_pages_median,
    description: doc.first_sentence?.join(" "),
    cover_url: coverFromId(doc.cover_i),
    category: doc.subject?.[0],
  };
}

async function fetchOpenLibraryAuthorName(key: string): Promise<string | undefined> {
  const result = await fetchJson<OpenLibraryAuthor>(
    `https://openlibrary.org${key}.json`
  );
  if (!result.ok) return undefined;
  return result.data.name;
}

async function lookupOpenLibraryEdition(isbn: string): Promise<LookupBook | null> {
  const result = await fetchJson<OpenLibraryEdition>(
    `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`
  );
  if (!result.ok) return null;

  const edition = result.data;
  const title = textField(edition.title);
  if (!title) return null;

  const authorKeys = (edition.authors ?? [])
    .map((a) => a.key)
    .filter((k): k is string => Boolean(k));

  const authorNames = await Promise.all(
    authorKeys.slice(0, 5).map((k) => fetchOpenLibraryAuthorName(k))
  );
  const author = authorNames.filter(Boolean).join(", ") || undefined;

  let description = textField(edition.description);
  const workKey = edition.works?.[0]?.key;
  if (!description && workKey) {
    const workResult = await fetchJson<OpenLibraryWork>(
      `https://openlibrary.org${workKey}.json`
    );
    if (workResult.ok) {
      description = textField(workResult.data.description);
    }
  }

  const coverId = edition.covers?.[0];

  return {
    title,
    subtitle: textField(edition.subtitle),
    author,
    isbn_10: isbn.length === 10 ? isbn : undefined,
    isbn_13: isbn.length === 13 ? isbn : undefined,
    publisher: edition.publishers?.join(", "),
    published_year: extractYear(edition.publish_date),
    page_count: edition.number_of_pages,
    description,
    cover_url: coverFromId(coverId),
    category: edition.subjects?.[0],
  };
}

type Provider = {
  name: LookupSource;
  lookup: (isbn: string) => Promise<LookupBook | null>;
};

/**
 * Arama sırası:
 * 1. Harikakitap.com (Türkçe yayınlar — API anahtarı gerekmez)
 * 2. Hardcover.app (HARDCOVER_API_TOKEN)
 * 3. Google Books (GOOGLE_BOOKS_API_KEY)
 * 4. Open Library — bibkeys, search.json, isbn/{isbn}.json
 */
const PROVIDERS: Provider[] = [
  { name: "harikakitap", lookup: lookupHarikakitap },
  { name: "hardcover", lookup: lookupHardcover },
  { name: "google_books", lookup: lookupGoogleBooks },
  { name: "open_library", lookup: lookupOpenLibraryData },
  { name: "open_library", lookup: lookupOpenLibrarySearch },
  { name: "open_library", lookup: lookupOpenLibraryEdition },
];

function ensureIsbn(book: LookupBook, searched: string): LookupBook {
  const result = { ...book };
  const normalized = normalizeIsbn(searched);
  if (normalized.length === 13 && !result.isbn_13) result.isbn_13 = normalized;
  if (normalized.length === 10 && !result.isbn_10) result.isbn_10 = normalized;
  return result;
}

/**
 * ISBN ile kitap bilgisi arar.
 * Sıra: Harikakitap → Hardcover → Google Books → Open Library.
 * Her sağlayıcıda ISBN-10/13 varyantları denenir.
 */
export async function lookupBookByIsbn(rawIsbn: string): Promise<BookLookupResponse> {
  const variants = getIsbnVariants(rawIsbn);

  for (const provider of PROVIDERS) {
    for (const isbn of variants) {
      try {
        const book = await provider.lookup(isbn);
        if (book?.title) {
          return {
            found: true,
            source: provider.name,
            book: ensureIsbn(book, rawIsbn),
          };
        }
      } catch {
        // Bir sonraki sağlayıcı/varyanta geç.
      }
    }
  }

  return { found: false };
}

/**
 * Google Books API anahtarı tanımlı mı?
 * Anahtarsız kullanımda paylaşılan kota çok düşük; üretimde anahtar önerilir.
 */
export function hasGoogleBooksApiKey(): boolean {
  return Boolean(process.env.GOOGLE_BOOKS_API_KEY?.trim());
}

/**
 * Hardcover.app API tokeni tanımlı mı?
 * https://hardcover.app/account/api adresinden ücretsiz alınır.
 */
export function hasHardcoverToken(): boolean {
  return Boolean(process.env.HARDCOVER_API_TOKEN?.trim());
}
