import { fetchHtml, fetchJsonBody } from "@/lib/fetchHtml";
import {
  extractJsonLdNodes,
  findSchemaNode,
  schemaBrandName,
  schemaImage,
  schemaString,
  splitTitleAuthor,
} from "@/lib/parseSchema";
import type { LookupBook } from "@/lib/types";

type HarikakitapSearchItem = {
  urun_adi?: string;
  urun_kapak?: string;
  urun_link?: string;
  filter_type?: number;
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

function normalizeCoverUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function parseHarikakitapDetail(html: string, isbn: string): Partial<LookupBook> {
  const nodes = extractJsonLdNodes(html);
  const product = findSchemaNode(nodes, "Product");
  if (!product) return {};

  const fullName = schemaString(product.name);
  const { title, author } = fullName
    ? splitTitleAuthor(fullName)
    : { title: undefined, author: undefined };

  const gtin13 = schemaString(product.gtin13) ?? schemaString(product.gtin);
  const isbn13 =
    gtin13 && gtin13.replace(/\D/g, "").length === 13
      ? gtin13.replace(/\D/g, "")
      : isbn.length === 13
        ? isbn
        : undefined;

  const barkodMatch = html.match(
    /Barkod<\/th><td[^>]*>\s*(\d{10,13})\s*<\/td>/i
  );
  const barkod = barkodMatch?.[1]?.replace(/\D/g, "");

  return {
    title,
    author,
    isbn_13: isbn13 ?? (barkod?.length === 13 ? barkod : undefined),
    isbn_10:
      barkod?.length === 10 ? barkod : isbn.length === 10 ? isbn : undefined,
    publisher: schemaBrandName(product.brand),
    description: schemaString(product.description),
    cover_url: normalizeCoverUrl(schemaImage(product.image)),
  };
}

async function enrichFromDetailPage(
  productUrl: string,
  isbn: string,
  base: LookupBook
): Promise<LookupBook> {
  const detail = await fetchHtml(productUrl);
  if (!detail.ok) return base;

  const extra = parseHarikakitapDetail(detail.html, isbn);
  return {
    ...base,
    title: extra.title ?? base.title,
    author: extra.author ?? base.author,
    isbn_13: extra.isbn_13 ?? base.isbn_13,
    isbn_10: extra.isbn_10 ?? base.isbn_10,
    publisher: extra.publisher ?? base.publisher,
    description: extra.description ?? base.description,
    cover_url: extra.cover_url ?? base.cover_url,
  };
}

/**
 * Harikakitap.com — ISBN araması (prsearch JSON API + ürün sayfası JSON-LD).
 * API anahtarı gerekmez; Türkçe yayınlar için güçlü kapsam.
 */
export async function lookupHarikakitap(isbn: string): Promise<LookupBook | null> {
  const search = await fetchJsonBody<HarikakitapSearchItem[]>(
    "https://www.harikakitap.com/prsearch",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://www.harikakitap.com/",
      },
      body: `keyword=${encodeURIComponent(isbn)}`,
    }
  );

  if (!search.ok || !Array.isArray(search.data)) return null;

  const product = search.data.find((item) => item.filter_type === 2);
  if (!product?.urun_adi || !product.urun_link) return null;

  const fullName = stripHtml(product.urun_adi);
  const { title, author } = splitTitleAuthor(fullName);
  if (!title) return null;

  const base: LookupBook = {
    title,
    author,
    isbn_13: isbn.length === 13 ? isbn : undefined,
    isbn_10: isbn.length === 10 ? isbn : undefined,
    cover_url: normalizeCoverUrl(product.urun_kapak),
  };

  return enrichFromDetailPage(product.urun_link, isbn, base);
}
