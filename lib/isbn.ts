import { convertIsbn10To13, convertIsbn13To10 } from "./isbnConvert";

/**
 * ISBN'i normalize eder: tire, boşluk ve geçersiz karakterleri temizler.
 * ISBN-10 sonundaki 'X' kontrol karakterini korur.
 */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function isValidIsbn10CheckDigit(isbn10: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(isbn10[i], 10);
    if (Number.isNaN(d)) return false;
    sum += d * (10 - i);
  }
  const check = isbn10[9];
  const expected =
    (11 - (sum % 11)) % 11 === 10 ? "X" : String((11 - (sum % 11)) % 11);
  return check === expected;
}

function isValidIsbn13CheckDigit(isbn13: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(isbn13[i], 10);
    if (Number.isNaN(d)) return false;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  const expected = String((10 - (sum % 10)) % 10);
  return isbn13[12] === expected;
}

/** Uzunluk ve kontrol hanesi doğrulaması. */
export function isValidIsbn(isbn: string): boolean {
  const normalized = normalizeIsbn(isbn);
  if (normalized.length === 10) {
    return /^\d{9}[\dX]$/.test(normalized) && isValidIsbn10CheckDigit(normalized);
  }
  if (normalized.length === 13) {
    return /^\d{13}$/.test(normalized) && isValidIsbn13CheckDigit(normalized);
  }
  return false;
}

/** Kullanıcıya gösterilecek doğrulama mesajı. */
export function validateIsbnMessage(raw: string): string | null {
  const normalized = normalizeIsbn(raw);
  if (!normalized) {
    return "ISBN boş olamaz.";
  }
  if (normalized.length !== 10 && normalized.length !== 13) {
    return "ISBN 10 veya 13 haneli olmalıdır (tire/boşluk otomatik temizlenir).";
  }
  if (!isValidIsbn(raw)) {
    return "Girilen ISBN geçersiz görünüyor. Lütfen kontrol hanesini doğrulayın.";
  }
  return null;
}

export function isIsbn13(isbn: string): boolean {
  return normalizeIsbn(isbn).length === 13;
}

export function isIsbn10(isbn: string): boolean {
  return normalizeIsbn(isbn).length === 10;
}

export { convertIsbn10To13, convertIsbn13To10 };
