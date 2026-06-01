import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { UserRole } from "@/lib/types";

// Aile üyelerini listeler (admin).
export async function GET() {
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

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Kullanıcılar alınırken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data ?? [] });
}

// Yeni aile üyesi oluşturur (admin, service role).
export async function POST(request: Request) {
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

  let body: {
    full_name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  const email = body.email?.trim();
  const password = body.password ?? "";
  const role: UserRole = body.role === "admin" ? "admin" : "member";

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Ad soyad, email ve şifre zorunludur." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Şifre en az 6 karakter olmalıdır." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik. Service role key tanımlı değil." },
      { status: 500 }
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (createError || !created.user) {
    const message = createError?.message?.includes("already")
      ? "Bu email ile bir kullanıcı zaten mevcut."
      : "Kullanıcı oluşturulurken bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Trigger profili oluşturur; yine de garanti için upsert ediyoruz.
  await admin.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: fullName,
      role,
    },
    { onConflict: "id" }
  );

  return NextResponse.json({ success: true, user_id: created.user.id });
}
