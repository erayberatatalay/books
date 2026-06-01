import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createBookRecord, type CreateBookInput } from "@/lib/server/createBook";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: CreateBookInput;
  try {
    body = (await request.json()) as CreateBookInput;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.title || !body.title.trim()) {
    return NextResponse.json(
      { error: "Kitap adı zorunludur." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    const result = await createBookRecord(supabase, user.id, body);
    return NextResponse.json({
      book_id: result.book_id,
      duplicate: result.duplicate,
      cover_url: result.cover_url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kitap eklenemedi." },
      { status: 500 }
    );
  }
}
