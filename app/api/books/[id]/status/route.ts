import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { ReadingStatus } from "@/lib/types";

const VALID: ReadingStatus[] = [
  "not_read",
  "reading",
  "read",
  "abandoned",
  "want_to_read",
];

// Kullanıcının kendi okuma durumunu günceller (upsert).
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: { status?: ReadingStatus; rating?: number | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json(
      { error: "Geçerli bir okuma durumu seçiniz." },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const update: Record<string, unknown> = {
    user_id: user.id,
    book_id: params.id,
    status: body.status,
  };

  if (body.status === "reading") {
    update.started_at = new Date().toISOString().slice(0, 10);
  }
  if (body.status === "read") {
    update.finished_at = new Date().toISOString().slice(0, 10);
  }
  if (body.rating !== undefined) {
    update.rating = body.rating;
  }

  const { error } = await supabase
    .from("user_book_statuses")
    .upsert(update, { onConflict: "user_id,book_id" });

  if (error) {
    return NextResponse.json(
      { error: "Okuma durumu güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
