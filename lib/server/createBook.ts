import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeIsbn } from "@/lib/isbn";
import { mergeLookupBooks } from "@/lib/mergeLookupBook";
import { resolveCoverUrl } from "@/lib/normalizeCoverUrl";
import {
  repairCoverIfNeeded,
  saveBookCoverIfNeeded,
} from "@/lib/server/coverStorage";
import type { LookupBook } from "@/lib/types";

export type CreateBookInput = LookupBook & { source?: string };

export type CreateBookResult = {
  book_id: string;
  duplicate: boolean;
  cover_url: string | null;
};

export type ImportBookResult = {
  book_id: string;
  /** Yeni kitap kaydı oluşturuldu. */
  created: boolean;
  /** Mevcut kitapta eksik alanlar dolduruldu. */
  updated: boolean;
  /** ISBN eşleşti ancak güncellenecek alan yoktu. */
  unchanged?: boolean;
  cover_url: string | null;
};

type ExistingBookRow = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  isbn_10: string | null;
  isbn_13: string | null;
  publisher: string | null;
  published_year: string | null;
  page_count: number | null;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  source: string | null;
};

const EXISTING_BOOK_SELECT =
  "id, title, subtitle, author, isbn_10, isbn_13, publisher, published_year, page_count, description, cover_url, category, source";

function rowToLookup(row: ExistingBookRow): LookupBook {
  return {
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    author: row.author ?? undefined,
    isbn_10: row.isbn_10 ?? undefined,
    isbn_13: row.isbn_13 ?? undefined,
    publisher: row.publisher ?? undefined,
    published_year: row.published_year ?? undefined,
    page_count: row.page_count ?? undefined,
    description: row.description ?? undefined,
    cover_url: row.cover_url ?? undefined,
    category: row.category ?? undefined,
  };
}

async function findBookByIsbn(
  supabase: SupabaseClient,
  isbn13: string | null,
  isbn10: string | null
): Promise<ExistingBookRow | null> {
  if (!isbn13 && !isbn10) return null;

  const orFilters: string[] = [];
  if (isbn13) orFilters.push(`isbn_13.eq.${isbn13}`);
  if (isbn10) orFilters.push(`isbn_10.eq.${isbn10}`);

  const { data } = await supabase
    .from("books")
    .select(EXISTING_BOOK_SELECT)
    .or(orFilters.join(","))
    .limit(1)
    .maybeSingle();

  return (data as ExistingBookRow | null) ?? null;
}

function buildEnrichmentPatch(
  existing: ExistingBookRow,
  incoming: CreateBookInput
): Record<string, string | number | null> {
  const merged = mergeLookupBooks(rowToLookup(existing), incoming);
  const patch: Record<string, string | number | null> = {};

  if (merged.subtitle && merged.subtitle !== (existing.subtitle ?? undefined)) {
    patch.subtitle = merged.subtitle;
  }
  if (merged.author && merged.author !== (existing.author ?? undefined)) {
    patch.author = merged.author;
  }
  if (merged.isbn_10 && merged.isbn_10 !== (existing.isbn_10 ?? undefined)) {
    patch.isbn_10 = merged.isbn_10;
  }
  if (merged.isbn_13 && merged.isbn_13 !== (existing.isbn_13 ?? undefined)) {
    patch.isbn_13 = merged.isbn_13;
  }
  if (merged.publisher && merged.publisher !== (existing.publisher ?? undefined)) {
    patch.publisher = merged.publisher;
  }
  if (
    merged.published_year &&
    merged.published_year !== (existing.published_year ?? undefined)
  ) {
    patch.published_year = merged.published_year;
  }
  if (
    merged.page_count != null &&
    merged.page_count !== (existing.page_count ?? undefined)
  ) {
    patch.page_count = merged.page_count;
  }
  if (
    merged.description &&
    merged.description !== (existing.description ?? undefined)
  ) {
    patch.description = merged.description;
  }
  if (merged.category && merged.category !== (existing.category ?? undefined)) {
    patch.category = merged.category;
  }
  if (incoming.source?.trim() && !existing.source?.trim()) {
    patch.source = incoming.source.trim();
  }

  return patch;
}

async function ensureUserBookStatus(
  supabase: SupabaseClient,
  userId: string,
  bookId: string
): Promise<void> {
  await supabase
    .from("user_book_statuses")
    .upsert(
      { user_id: userId, book_id: bookId, status: "not_read" },
      { onConflict: "user_id,book_id", ignoreDuplicates: true }
    );
}

/**
 * JSON içe aktarma: ISBN eşleşirse eksik alanları doldurur; yoksa yeni kitap ekler.
 */
export async function importBookRecord(
  supabase: SupabaseClient,
  userId: string,
  body: CreateBookInput
): Promise<ImportBookResult> {
  if (!body.title?.trim()) {
    throw new Error("Kitap adı zorunludur.");
  }

  const isbn13 = body.isbn_13 ? normalizeIsbn(body.isbn_13) : null;
  const isbn10 = body.isbn_10 ? normalizeIsbn(body.isbn_10) : null;
  const existing = await findBookByIsbn(supabase, isbn13, isbn10);

  if (existing) {
    const patch = buildEnrichmentPatch(existing, body);
    let coverUrl = existing.cover_url;

    const coverRepair = await repairCoverIfNeeded(
      existing.id,
      existing.cover_url,
      body.cover_url
    );
    if (coverRepair.changed && coverRepair.coverUrl) {
      patch.cover_url = coverRepair.coverUrl;
      coverUrl = coverRepair.coverUrl;
    }

    const hasFieldUpdates = Object.keys(patch).length > 0;

    if (hasFieldUpdates) {
      const { error } = await supabase
        .from("books")
        .update(patch)
        .eq("id", existing.id);
      if (error) {
        throw new Error("Kitap güncellenirken bir hata oluştu.");
      }
    }

    await ensureUserBookStatus(supabase, userId, existing.id);

    return {
      book_id: existing.id,
      created: false,
      updated: hasFieldUpdates,
      unchanged: !hasFieldUpdates,
      cover_url: coverUrl,
    };
  }

  const { data: newBook, error: bookError } = await supabase
    .from("books")
    .insert({
      title: body.title.trim(),
      subtitle: body.subtitle ?? null,
      author: body.author ?? null,
      isbn_10: isbn10,
      isbn_13: isbn13,
      publisher: body.publisher ?? null,
      published_year: body.published_year ?? null,
      page_count: body.page_count ?? null,
      description: body.description ?? null,
      cover_url: body.cover_url ? resolveCoverUrl(body.cover_url) : null,
      category: body.category ?? null,
      source: body.source ?? null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (bookError || !newBook) {
    throw new Error("Kitap eklenirken bir hata oluştu.");
  }

  const bookId = newBook.id as string;

  const { error: copyError } = await supabase.from("book_copies").insert({
    book_id: bookId,
    status: "on_shelf",
  });
  if (copyError) {
    throw new Error("Kitap kopyası eklenirken bir hata oluştu.");
  }

  let coverUrl: string | null = body.cover_url ?? null;
  if (body.cover_url) {
    coverUrl = await saveBookCoverIfNeeded(bookId, body.cover_url, null);
  }

  await ensureUserBookStatus(supabase, userId, bookId);

  return {
    book_id: bookId,
    created: true,
    updated: false,
    cover_url: coverUrl,
  };
}

/**
 * Tek kitap kaydı oluşturur veya aynı ISBN varsa yeni kopya ekler.
 */
export async function createBookRecord(
  supabase: SupabaseClient,
  userId: string,
  body: CreateBookInput
): Promise<CreateBookResult> {
  if (!body.title?.trim()) {
    throw new Error("Kitap adı zorunludur.");
  }

  const isbn13 = body.isbn_13 ? normalizeIsbn(body.isbn_13) : null;
  const isbn10 = body.isbn_10 ? normalizeIsbn(body.isbn_10) : null;

  const existing = await findBookByIsbn(supabase, isbn13, isbn10);

  let bookId = existing?.id ?? null;
  let duplicate = false;
  let coverUrl: string | null = body.cover_url ?? null;

  if (existing) {
    duplicate = true;
    const patch = buildEnrichmentPatch(existing, body);
    coverUrl = existing.cover_url;

    const coverRepair = await repairCoverIfNeeded(
      existing.id,
      existing.cover_url,
      body.cover_url
    );
    if (coverRepair.changed && coverRepair.coverUrl) {
      patch.cover_url = coverRepair.coverUrl;
      coverUrl = coverRepair.coverUrl;
    }

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase
        .from("books")
        .update(patch)
        .eq("id", existing.id);
      if (updateError) {
        throw new Error("Kitap güncellenirken bir hata oluştu.");
      }
    }

    const { error: copyError } = await supabase.from("book_copies").insert({
      book_id: existing.id,
      status: "on_shelf",
    });
    if (copyError) {
      throw new Error("Kitap kopyası eklenirken bir hata oluştu.");
    }
  } else {
    const { data: newBook, error: bookError } = await supabase
      .from("books")
      .insert({
        title: body.title.trim(),
        subtitle: body.subtitle ?? null,
        author: body.author ?? null,
        isbn_10: isbn10,
        isbn_13: isbn13,
        publisher: body.publisher ?? null,
        published_year: body.published_year ?? null,
        page_count: body.page_count ?? null,
        description: body.description ?? null,
        cover_url: body.cover_url ? resolveCoverUrl(body.cover_url) : null,
        category: body.category ?? null,
        source: body.source ?? null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (bookError || !newBook) {
      throw new Error("Kitap eklenirken bir hata oluştu.");
    }

    bookId = newBook.id as string;

    const { error: copyError } = await supabase.from("book_copies").insert({
      book_id: bookId,
      status: "on_shelf",
    });
    if (copyError) {
      throw new Error("Kitap kopyası eklenirken bir hata oluştu.");
    }

    if (body.cover_url) {
      coverUrl = await saveBookCoverIfNeeded(bookId, body.cover_url, null);
    }
  }

  if (bookId) {
    await ensureUserBookStatus(supabase, userId, bookId);
  }

  return {
    book_id: bookId!,
    duplicate,
    cover_url: coverUrl,
  };
}
