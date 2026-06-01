/**
 * Harici kapak URL'lerini indirme/ kayıt öncesi düzeltir.
 *
 * Dokuzsoft tabanlı siteler (Sahaf Salih, Kitap ve Kahve vb.) og:image ve
 * autocomplete görsel alanlarında bazen mağaza domain'ini CDN URL'sinin
 * önüne yapıştırır:
 *   https://www.kitapvekahve.comhttps://cdn1.dokuzsoft.com/...
 */
export function normalizeExternalCoverUrl(
  url?: string | null
): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const dokuzsoftDoubled = trimmed.match(
    /^https?:\/\/[^/]+?(https:\/\/cdn\d+\.dokuzsoft\.com\/.+)$/i
  );
  if (dokuzsoftDoubled) {
    return dokuzsoftDoubled[1];
  }

  // Aynı hata farklı CDN/host ile tekrarlanırsa: origin + mutlak URL
  const originPrefixed = trimmed.match(
    /^(https?:\/\/[^/]+)(https?:\/\/[^/].+)$/i
  );
  if (originPrefixed?.[2] && originPrefixed[1] !== originPrefixed[2]) {
    const host = originPrefixed[2];
    if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(host) || host.includes("/img/")) {
      return host;
    }
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

/** Mağaza domain'i ile CDN URL'sinin yapıştırıldığı bozuk kapaklar. */
export function isBrokenCoverUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (/^https?:\/\/[^/]+\.comhttps?:\/\//i.test(trimmed)) return true;
  const normalized = normalizeExternalCoverUrl(trimmed);
  return normalized !== undefined && normalized !== trimmed;
}

/** Kayıt/gösterim için tek geçerli kapak URL'si. */
export function resolveCoverUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  return normalizeExternalCoverUrl(url) ?? url.trim();
}

/** Kapak yok veya bozuk sayılır — birleştirmede yeni URL ile değiştirilebilir. */
export function isMissingOrBrokenCover(url?: string | null): boolean {
  if (!url?.trim()) return true;
  return isBrokenCoverUrl(url);
}
