import { normalizeIsbn } from "./isbn";

/** ISBN-13 kontrol hanesi hesaplar. */
function isbn13CheckDigit(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(digits12[i], 10);
    sum += n * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/** ISBN-10 kontrol hanesi hesaplar (10 için X). */
function isbn10CheckDigit(digits9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits9[i], 10) * (10 - i);
  }
  const rem = (11 - (sum % 11)) % 11;
  return rem === 10 ? "X" : String(rem);
}

/** ISBN-10 → ISBN-13 (978 prefiksli). */
export function convertIsbn10To13(isbn10: string): string | null {
  const n = normalizeIsbn(isbn10);
  if (n.length !== 10) return null;
  const core = n.slice(0, 9);
  if (!/^\d{9}$/.test(core)) return null;
  const body = "978" + core;
  return body + String(isbn13CheckDigit(body));
}

/** 978 ile başlayan ISBN-13 → ISBN-10. */
export function convertIsbn13To10(isbn13: string): string | null {
  const n = normalizeIsbn(isbn13);
  if (n.length !== 13 || !n.startsWith("978")) return null;
  const core = n.slice(3, 12);
  if (!/^\d{9}$/.test(core)) return null;
  return core + isbn10CheckDigit(core);
}

/**
 * Arama için denenecek benzersiz ISBN listesi (orijinal + dönüştürülmüş).
 */
export function getIsbnVariants(raw: string): string[] {
  const primary = normalizeIsbn(raw);
  const variants = new Set<string>([primary]);

  if (primary.length === 10) {
    const as13 = convertIsbn10To13(primary);
    if (as13) variants.add(as13);
  } else if (primary.length === 13) {
    const as10 = convertIsbn13To10(primary);
    if (as10) variants.add(as10);
  }

  return Array.from(variants);
}
