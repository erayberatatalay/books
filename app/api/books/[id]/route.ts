import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Kitap arşivleme/arşivden çıkarma (sadece admin).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (user.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 }
    );
  }

  let body: { is_archived?: boolean };
  try {
    body = (await request.json()) as { is_archived?: boolean };
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (typeof body.is_archived !== "boolean") {
    return NextResponse.json(
      { error: "is_archived alanı gereklidir." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("books")
    .update({ is_archived: body.is_archived })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Kitap güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
