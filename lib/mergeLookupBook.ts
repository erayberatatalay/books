import type { LookupBook } from "./types";

function isEmpty(value?: string | null): boolean {
  return value == null || value.trim() === "";
}

function isMissingPages(value?: number | null): boolean {
  return value == null || value <= 0;
}

/** Harikakitap bazen yalnızca "Başlık - Yazar" döndürür; zenginleştirmeye açık say. */
export function isWeakDescription(book: LookupBook): boolean {
  const description = book.description?.trim();
  if (!description) return true;

  const title = book.title?.trim();
  const author = book.author?.trim();
  if (title && description === title) return true;
  if (title && author) {
    const patterns = [`${title} - ${author}`, `${title} – ${author}`];
    if (patterns.includes(description)) return true;
  }
  if (title && description.length < 40 && description.includes(title)) {
    return true;
  }
  return false;
}

/** Birleştirme için hâlâ eksik alan var mı? */
export function bookNeedsEnrichment(book: LookupBook): boolean {
  return (
    isMissingPages(book.page_count) ||
    isEmpty(book.subtitle) ||
    isEmpty(book.published_year) ||
    isWeakDescription(book) ||
    isEmpty(book.category) ||
    isEmpty(book.cover_url)
  );
}

/**
 * `base` önceliklidir; `extra` yalnızca boş alanları doldurur.
 */
export function mergeLookupBooks(
  base: LookupBook,
  extra: LookupBook
): LookupBook {
  return {
    title: base.title,
    subtitle: isEmpty(base.subtitle) ? extra.subtitle : base.subtitle,
    author: isEmpty(base.author) ? extra.author : base.author,
    isbn_10: isEmpty(base.isbn_10) ? extra.isbn_10 : base.isbn_10,
    isbn_13: isEmpty(base.isbn_13) ? extra.isbn_13 : base.isbn_13,
    publisher: isEmpty(base.publisher) ? extra.publisher : base.publisher,
    published_year: isEmpty(base.published_year)
      ? extra.published_year
      : base.published_year,
    page_count: isMissingPages(base.page_count)
      ? extra.page_count
      : base.page_count,
    description: isWeakDescription(base) ? extra.description : base.description,
    cover_url: isEmpty(base.cover_url) ? extra.cover_url : base.cover_url,
    category: isEmpty(base.category) ? extra.category : base.category,
  };
}
