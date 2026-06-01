import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { normalizeIsbn } from "@/lib/isbn";
import {
  removeBookCoverFiles,
  saveBookCoverIfNeeded,
} from "@/lib/server/coverStorage";
import { isBrokenCoverUrl, resolveCoverUrl } from "@/lib/normalizeCoverUrl";
import type { LookupBook } from "@/lib/types";

type PatchBody = Partial<LookupBook> & { is_archived?: boolean };

async function canEditBook(
  supabase: ReturnType<typeof createClient>,
  bookId: string,
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true;
  const { data } = await supabase
    .from("books")
    .select("created_by")
    .eq("id", bookId)
    .maybeSingle();
  return data?.created_by === userId;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const supabase = createClient();
  const isAdmin = user.profile.role === "admin";

  if (typeof body.is_archived === "boolean") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Arşivleme için admin yetkisi gerekir." },
        { status: 403 }
      );
    }

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

  const allowed = await canEditBook(
    supabase,
    params.id,
    user.id,
    isAdmin
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Bu kitabı düzenleme yetkiniz yok." },
      { status: 403 }
    );
  }

  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: "Kitap adı zorunludur." },
      { status: 400 }
    );
  }

  const isbn13 = body.isbn_13 ? normalizeIsbn(body.isbn_13) : null;
  const isbn10 = body.isbn_10 ? normalizeIsbn(body.isbn_10) : null;

  const { data: current } = await supabase
    .from("books")
    .select("cover_url")
    .eq("id", params.id)
    .maybeSingle();

  const currentCover = current?.cover_url ?? null;
  const incomingCover = body.cover_url?.trim() || undefined;
  const needsCoverUpdate =
    Boolean(incomingCover) || isBrokenCoverUrl(currentCover);

  let coverUrl = resolveCoverUrl(currentCover) ?? currentCover;

  if (needsCoverUpdate) {
    coverUrl =
      (await saveBookCoverIfNeeded(
        params.id,
        incomingCover ?? currentCover ?? undefined,
        currentCover
      )) ??
      resolveCoverUrl(incomingCover ?? currentCover) ??
      coverUrl;
  }

  const { error } = await supabase
    .from("books")
    .update({
      title: body.title.trim(),
      subtitle: body.subtitle ?? null,
      author: body.author ?? null,
      isbn_10: isbn10,
      isbn_13: isbn13,
      publisher: body.publisher ?? null,
      published_year: body.published_year ?? null,
      page_count: body.page_count ?? null,
      description: body.description ?? null,
      cover_url: coverUrl,
      category: body.category ?? null,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Kitap güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, cover_url: coverUrl });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (user.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Kitap silmek için admin yetkisi gerekir." },
      { status: 403 }
    );
  }

  await removeBookCoverFiles(params.id);

  const supabase = createClient();
  const { error } = await supabase.from("books").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: "Kitap silinirken bir hata oluştu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
