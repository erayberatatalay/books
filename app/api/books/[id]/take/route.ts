import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Kitabı "Şu an bende" olarak işaretler.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const supabase = createClient();

  // Bu kitaba ait bir kopya bul (öncelik rafta olana).
  const { data: copies, error: copyError } = await supabase
    .from("book_copies")
    .select("id, current_holder_id, status")
    .eq("book_id", params.id)
    .order("created_at", { ascending: true });

  if (copyError) {
    return NextResponse.json(
      { error: "Kitap kopyası bulunamadı." },
      { status: 500 }
    );
  }

  if (!copies || copies.length === 0) {
    return NextResponse.json(
      { error: "Bu kitabın fiziksel kopyası bulunamadı." },
      { status: 404 }
    );
  }

  const copy =
    copies.find((c) => c.status === "on_shelf") ?? copies[0];
  const previousHolder = copy.current_holder_id as string | null;

  const { error: updateError } = await supabase
    .from("book_copies")
    .update({ status: "with_member", current_holder_id: user.id })
    .eq("id", copy.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Kitap güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  await supabase.from("book_holder_history").insert({
    book_copy_id: copy.id,
    from_user_id: previousHolder,
    to_user_id: user.id,
    action: previousHolder && previousHolder !== user.id ? "transferred" : "taken",
    created_by: user.id,
  });

  return NextResponse.json({ success: true });
}
