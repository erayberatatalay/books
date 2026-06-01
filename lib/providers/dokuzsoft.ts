import { fetchHtml, fetchJsonBody } from "@/lib/fetchHtml";
import { normalizeExternalCoverUrl } from "@/lib/normalizeCoverUrl";
import type { LookupBook } from "@/lib/types";

type AutocompleteItem = {
  id?: string | number;
  label?: string;
  value?: string;
  link?: string;
  image?: string | null;
  css_class?: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function parseFeatureFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const match of html.matchAll(
    /prd-features-label">([^<]+)<\/div><div class="table-cell">:<\/div><div class="table-cell">([^<]+)/g
  )) {
    fields[match[1].trim()] = match[2].trim();
  }

  for (const match of html.matchAll(
    /prd_fields_label">([^<:]+):<\/div>\s*<div class="prd_fields_text">([^<]*)/g
  )) {
    fields[match[1].trim()] = match[2].trim();
  }

  return fields;
}

function parsePublishedYear(value?: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/\d{4}/);
  return match ? match[0] : undefined;
}

function parsePageCount(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseDokuzsoftDetail(html: string, isbn: string): LookupBook | null {
  const name = html.match(/data-prd-name="([^"]+)"/)?.[1]?.trim();
  if (!name) return null;

  const fields = parseFeatureFields(html);
  const stokKodu = fields["Stok Kodu"] ?? html.match(/data-prd-barcode="([^"]+)"/)?.[1];
  const searched = digitsOnly(isbn);

  if (stokKodu) {
    const productIsbn = digitsOnly(stokKodu);
    if (productIsbn.length >= 10 && productIsbn !== searched) {
      return null;
    }
  }

  const coverUrl =
    normalizeExternalCoverUrl(
      html.match(/property="og:image"\s+content="([^"]+)"/)?.[1] ??
        html.match(/content="([^"]+)"\s+property="og:image"/)?.[1]
    ) ??
    normalizeExternalCoverUrl(
      html.match(/class="[^"]*product[^"]*image[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1]
    );

  const description =
    html.match(/property="og:description"\s+content="([^"]+)"/)?.[1]?.trim() ??
    html.match(/content="([^"]+)"\s+property="og:description"/)?.[1]?.trim();

  return {
    title: name,
    author: fields["Yazar"]?.trim() || undefined,
    isbn_13: searched.length === 13 ? searched : undefined,
    isbn_10: searched.length === 10 ? searched : undefined,
    publisher: fields["Yayınevi"]?.trim() || fields["Marka"]?.trim() || undefined,
    published_year: parsePublishedYear(fields["Basım Tarihi"]),
    page_count: parsePageCount(fields["Sayfa Sayısı"]),
    description,
    cover_url: coverUrl,
  };
}

/**
 * Dokuzsoft tabanlı kitapçı siteleri (Sahaf Salih, Kitap ve Kahve vb.).
 * HTML arama sayfası ISBN ile 0 sonuç döndürse de `/autocomplete` API'si stok kodunu bulur.
 */
export function createDokuzsoftLookup(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "") + "/";

  return async function lookupDokuzsoft(isbn: string): Promise<LookupBook | null> {
    const acUrl = `${base}autocomplete?term=${encodeURIComponent(isbn)}&json=1`;
    const search = await fetchJsonBody<AutocompleteItem[]>(acUrl, {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!search.ok || !Array.isArray(search.data)) return null;

    const product = search.data.find(
      (item) => item.css_class === "ac-item" && item.link
    );
    if (!product?.link) return null;

    const detail = await fetchHtml(product.link);
    if (!detail.ok) return null;

    const book = parseDokuzsoftDetail(detail.html, isbn);
    if (!book?.title) return null;

    if (!book.cover_url && product.image) {
      book.cover_url = normalizeExternalCoverUrl(product.image);
    }

    return book;
  };
}

export const lookupSahafsalih = createDokuzsoftLookup("https://www.sahafsalih.com");
export const lookupKitapvekahve = createDokuzsoftLookup(
  "https://www.kitapvekahve.com"
);
