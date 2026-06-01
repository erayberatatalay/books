import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Kullanıcının bu kitaptaki kendi notlarını listeler.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_notes")
    .select("*")
    .eq("book_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Notlar alınırken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ notes: data ?? [] });
}

// Yeni kişisel not ekler.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: { note?: string };
  try {
    body = (await request.json()) as { note?: string };
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.note || !body.note.trim()) {
    return NextResponse.json(
      { error: "Not boş olamaz." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_notes")
    .insert({
      book_id: params.id,
      user_id: user.id,
      note: body.note.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Not eklenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ note: data });
}

// Notu günceller.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: { note_id?: string; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.note_id || !body.note || !body.note.trim()) {
    return NextResponse.json(
      { error: "Not bilgileri eksik." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("book_notes")
    .update({ note: body.note.trim() })
    .eq("id", body.note_id)
    .eq("user_id", user.id)
    .eq("book_id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Not güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Notu siler.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("note_id");
  if (!noteId) {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("book_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id)
    .eq("book_id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Not silinirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
