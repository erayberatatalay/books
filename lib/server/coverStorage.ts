import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "book-covers";
const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

/** URL zaten Supabase Storage'daki book-covers bucket'ına ait mi? */
export function isStoredCoverUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  return url.startsWith(base) && url.includes(`/storage/v1/object/public/${BUCKET}/`);
}

/**
 * Harici kapak URL'sini indirir ve Supabase Storage'a yükler.
 * Başarılı olursa public storage URL döner; aksi halde null.
 */
export async function persistBookCover(
  externalUrl: string,
  bookId: string
): Promise<string | null> {
  if (!externalUrl.trim() || isStoredCoverUrl(externalUrl)) {
    return isStoredCoverUrl(externalUrl) ? externalUrl : null;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  try {
    const res = await fetch(externalUrl.replace(/^http:\/\//i, "https://"), {
      headers: {
        Accept: "image/*",
        "User-Agent": "EvKitapligim/1.0",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;

    const ext = extensionFromContentType(contentType);
    const path = `${bookId}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) return null;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Kitabın cover_url alanını storage URL ile günceller (varsa).
 * Harici URL kalırsa mevcut değeri korur.
 */
export async function saveBookCoverIfNeeded(
  bookId: string,
  externalUrl: string | null | undefined,
  currentCoverUrl?: string | null
): Promise<string | null> {
  if (!externalUrl?.trim()) {
    return currentCoverUrl ?? null;
  }

  if (currentCoverUrl && isStoredCoverUrl(currentCoverUrl)) {
    return currentCoverUrl;
  }

  const stored = await persistBookCover(externalUrl, bookId);
  if (!stored) {
    return externalUrl;
  }

  try {
    const admin = createAdminClient();
    await admin.from("books").update({ cover_url: stored }).eq("id", bookId);
  } catch {
    return stored;
  }

  return stored;
}

/** Kitaba ait storage kapak dosyalarını siler (varsa). */
export async function removeBookCoverFiles(bookId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: files } = await admin.storage.from(BUCKET).list("", {
      limit: 100,
    });
    const paths = (files ?? [])
      .filter((f) => f.name.startsWith(`${bookId}.`))
      .map((f) => f.name);
    if (paths.length > 0) {
      await admin.storage.from(BUCKET).remove(paths);
    }
  } catch {
    // Storage yoksa veya erişilemezse sessizce devam et.
  }
}
