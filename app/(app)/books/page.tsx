import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { getBookListItems } from "@/lib/server/books";
import { BookList } from "@/components/books/BookList";
import { EmptyState } from "@/components/common/EmptyState";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const user = await requireUser();
  const items = await getBookListItems(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tüm Kitaplar</h1>
        <Link
          href="/books/add"
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          + Ekle
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Henüz kitap eklenmemiş."
          description="İlk kitabını barkod tarayarak ekleyebilirsin."
          icon="📚"
          action={
            <Link
              href="/books/scan"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Barkod Tara
            </Link>
          }
        />
      ) : (
        <BookList items={items} />
      )}
    </div>
  );
}
