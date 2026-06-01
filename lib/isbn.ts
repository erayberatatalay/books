/**
 * ISBN'i normalize eder: tire, boşluk ve geçersiz karakterleri temizler.
 * ISBN-10 sonundaki 'X' kontrol karakterini korur.
 */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(isbn: string): boolean {
  const normalized = normalizeIsbn(isbn);
  return normalized.length === 10 || normalized.length === 13;
}

export function isIsbn13(isbn: string): boolean {
  return normalizeIsbn(isbn).length === 13;
}

export function isIsbn10(isbn: string): boolean {
  return normalizeIsbn(isbn).length === 10;
}
