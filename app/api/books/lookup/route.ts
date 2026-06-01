import { NextResponse } from "next/server";
import { lookupBookByIsbn } from "@/lib/bookLookup";
import { isValidIsbn } from "@/lib/isbn";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn") ?? "";

  if (!isValidIsbn(isbn)) {
    return NextResponse.json(
      { error: "Geçerli bir ISBN giriniz (10 veya 13 haneli)." },
      { status: 400 }
    );
  }

  try {
    const result = await lookupBookByIsbn(isbn);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Kitap bilgisi alınırken bir hata oluştu." },
      { status: 502 }
    );
  }
}
