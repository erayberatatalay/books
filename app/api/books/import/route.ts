import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  parseBookImportJson,
  type BookImportResponse,
  type BookImportRowResult,
} from "@/lib/bookImport";
import { importBookRecord } from "@/lib/server/createBook";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  if (user.profile.role !== "admin") {
    return NextResponse.json(
      { error: "Toplu içe aktarma için admin yetkisi gerekir." },
      { status: 403 }
    );
  }

  let body: { json?: string };
  try {
    body = (await request.json()) as { json?: string };
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.json?.trim()) {
    return NextResponse.json({ error: "JSON metni gerekli." }, { status: 400 });
  }

  let items;
  try {
    ({ items } = parseBookImportJson(body.json));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "JSON ayrıştırılamadı." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const results: BookImportRowResult[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    try {
      const outcome = await importBookRecord(supabase, user.id, item);
      results.push({
        index,
        title: item.title,
        success: true,
        book_id: outcome.book_id,
        created: outcome.created,
        updated: outcome.updated,
        unchanged: outcome.unchanged,
      });
    } catch (err) {
      results.push({
        index,
        title: item.title,
        success: false,
        error: err instanceof Error ? err.message : "Kayıt eklenemedi.",
      });
    }
  }

  const response: BookImportResponse = {
    total: results.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };

  return NextResponse.json(response);
}
