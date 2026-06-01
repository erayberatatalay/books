const USER_AGENT = "EvKitapligim/1.0 (home library app; +https://github.com/local)";

type FetchJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error?: string };

/**
 * Harici ISBN API'lerine standart User-Agent ile istek atar.
 */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, status: 0, error: "network" };
  }
}
