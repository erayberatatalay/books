import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { normalizeIsbn } from "@/lib/isbn";
import type { LookupBook } from "@/lib/types";

type CreateBookBody = LookupBook & { source?: string };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: CreateBookBody;
  try {
    body = (await request.json()) as CreateBookBody;
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

  const isbn13 = body.isbn_13 ? normalizeIsbn(body.isbn_13) : null;
  const isbn10 = body.isbn_10 ? normalizeIsbn(body.isbn_10) : null;

  // 1) Aynı ISBN'e sahip kitap var mı?
  let existingBookId: string | null = null;
  if (isbn13 || isbn10) {
    const orFilters: string[] = [];
    if (isbn13) orFilters.push(`isbn_13.eq.${isbn13}`);
    if (isbn10) orFilters.push(`isbn_10.eq.${isbn10}`);

    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .or(orFilters.join(","))
      .limit(1)
      .maybeSingle();

    if (existing) {
      existingBookId = existing.id as string;
    }
  }

  let bookId = existingBookId;
  let duplicate = false;

  if (existingBookId) {
    // 2-3) Aynı kitap varsa yeni kitap oluşturma, sadece yeni kopya ekle.
    duplicate = true;
    const { error: copyError } = await supabase.from("book_copies").insert({
      book_id: existingBookId,
      status: "on_shelf",
    });
    if (copyError) {
      return NextResponse.json(
        { error: "Kitap kopyası eklenirken bir hata oluştu." },
        { status: 500 }
      );
    }
  } else {
    // 4) Kitap yoksa önce books, sonra book_copies.
    const { data: newBook, error: bookError } = await supabase
      .from("books")
      .insert({
        title: body.title.trim(),
        subtitle: body.subtitle ?? null,
        author: body.author ?? null,
        isbn_10: isbn10,
        isbn_13: isbn13,
        publisher: body.publisher ?? null,
        published_year: body.published_year ?? null,
        page_count: body.page_count ?? null,
        description: body.description ?? null,
        cover_url: body.cover_url ?? null,
        category: body.category ?? null,
        source: body.source ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (bookError || !newBook) {
      return NextResponse.json(
        { error: "Kitap eklenirken bir hata oluştu." },
        { status: 500 }
      );
    }

    bookId = newBook.id as string;

    const { error: copyError } = await supabase.from("book_copies").insert({
      book_id: bookId,
      status: "on_shelf",
    });
    if (copyError) {
      return NextResponse.json(
        { error: "Kitap kopyası eklenirken bir hata oluştu." },
        { status: 500 }
      );
    }
  }

  // 5) Ekleyen kullanıcı için varsayılan okuma durumu (not_read).
  if (bookId) {
    await supabase
      .from("user_book_statuses")
      .upsert(
        { user_id: user.id, book_id: bookId, status: "not_read" },
        { onConflict: "user_id,book_id", ignoreDuplicates: true }
      );
  }

  return NextResponse.json({ book_id: bookId, duplicate });
}
