import { NextResponse } from "next/server";
import { lookupBookByIsbn, hasGoogleBooksApiKey, hasHardcoverToken } from "@/lib/bookLookup";
import { normalizeIsbn, validateIsbnMessage } from "@/lib/isbn";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawIsbn = searchParams.get("isbn") ?? "";

  const validationError = validateIsbnMessage(rawIsbn);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const isbn = normalizeIsbn(rawIsbn);

  try {
    const result = await lookupBookByIsbn(isbn);

    if (!result.found) {
      const missing: string[] = [];
      if (!hasGoogleBooksApiKey()) missing.push("GOOGLE_BOOKS_API_KEY");
      if (!hasHardcoverToken()) missing.push("HARDCOVER_API_TOKEN");

      if (missing.length > 0) {
        const hint =
          missing.length === 2
            ? "Daha geniş kapsam için .env dosyanıza GOOGLE_BOOKS_API_KEY ve/veya HARDCOVER_API_TOKEN ekleyebilirsiniz."
            : `Daha geniş kapsam için .env dosyanıza ${missing[0]} ekleyebilirsiniz.`;
        return NextResponse.json({ ...result, hint });
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Kitap bilgisi alınırken bir hata oluştu." },
      { status: 502 }
    );
  }
}
