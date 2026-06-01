import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { getProfileMap } from "@/lib/server/books";
import type { Book, BookCopy } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function ActiveHoldersPage() {
  await requireUser();
  const supabase = createClient();

  const [{ data: copies }, profiles] = await Promise.all([
    supabase
      .from("book_copies")
      .select("*, books(*)")
      .eq("status", "with_member")
      .order("updated_at", { ascending: false }),
    getProfileMap(),
  ]);

  const rows = ((copies as (BookCopy & { books: Book | null })[]) ?? []).filter(
    (c) => c.books && !c.books.is_archived
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Kimde Olan Kitaplar</h1>
      <p className="text-sm text-gray-500">
        Şu anda bir aile üyesinde olan kitaplar.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="Şu anda kimsede aktif kitap yok."
          description="Tüm kitaplar rafta görünüyor."
          icon="📚"
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((copy) => {
            const book = copy.books!;
            const holder = copy.current_holder_id
              ? profiles[copy.current_holder_id] ?? "Bilinmeyen Üye"
              : "Bilinmeyen Üye";
            return (
              <li key={copy.id}>
                <Link
                  href={`/books/${book.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:border-brand-300"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="truncate text-xs text-gray-500">
                        {book.author}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Alındığı tarih: {formatDate(copy.updated_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {holder}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
