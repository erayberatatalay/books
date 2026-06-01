const USER_AGENT =
  "EvKitapligim/1.0 (home library app; +https://github.com/local)";

type FetchHtmlResult =
  | { ok: true; html: string; status: number }
  | { ok: false; status: number; error?: string };

/**
 * Harici kitap sitelerinden HTML çeker (JSON-LD / microdata ayrıştırma için).
 */
export async function fetchHtml(
  url: string,
  init?: RequestInit
): Promise<FetchHtmlResult> {
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9",
        "User-Agent": USER_AGENT,
        ...init?.headers,
      },
    });

    const html = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    return { ok: true, html, status: res.status };
  } catch {
    return { ok: false, status: 0, error: "network" };
  }
}

/**
 * Yanıt gövdesi JSON olmasa bile (text/html) ayrıştırır.
 */
export async function fetchJsonBody<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const result = await fetchHtml(url, init);
  if (!result.ok) {
    return { ok: false, status: result.status };
  }

  try {
    const data = JSON.parse(result.html) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, status: result.status };
  }
}
