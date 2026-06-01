import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { getProfileMap, resolveHolderName } from "@/lib/server/books";
import type {
  Book,
  BookCopy,
  BookNote,
  UserBookStatus,
} from "@/lib/types";
import { ReadingStatusSelect } from "@/components/books/ReadingStatusSelect";
import { BookNotes } from "@/components/books/BookNotes";
import { BookActions } from "@/components/books/BookActions";
import { BookHolderBadge } from "@/components/books/BookHolderBadge";

export const dynamic = "force-dynamic";

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default async function BookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*, book_copies(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!book) {
    notFound();
  }

  const typedBook = book as Book & { book_copies?: BookCopy[] };
  const copies = typedBook.book_copies ?? [];

  const [{ data: statusRow }, { data: notesRows }, profiles] = await Promise.all([
    supabase
      .from("user_book_statuses")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", params.id)
      .maybeSingle(),
    supabase
      .from("book_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", params.id)
      .order("created_at", { ascending: false }),
    getProfileMap(),
  ]);

  const readingStatus = (statusRow as UserBookStatus | null)?.status ?? null;
  const notes = (notesRows as BookNote[] | null) ?? [];
  const holderName = resolveHolderName(copies, profiles);
  const isWithMember = copies.some((c) => c.status === "with_member");
  const heldByMe = copies.some((c) => c.current_holder_id === user.id);
  const isAdmin = user.profile.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-4">
        <div className="h-44 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {typedBook.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typedBook.cover_url}
              alt={typedBook.title}
              className="h-44 w-28 object-cover"
            />
          ) : (
            <div className="flex h-44 w-28 items-center justify-center text-3xl text-gray-300">
              📕
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-lg font-bold text-gray-900">{typedBook.title}</h1>
          {typedBook.subtitle && (
            <p className="text-sm text-gray-600">{typedBook.subtitle}</p>
          )}
          {typedBook.author && (
            <p className="text-sm text-gray-500">{typedBook.author}</p>
          )}
          {typedBook.is_archived && (
            <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
              Arşivlenmiş
            </span>
          )}
          {holderName && (
            <div className="pt-1">
              <BookHolderBadge holderName={holderName} />
            </div>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <BookActions
          bookId={typedBook.id}
          isWithMember={isWithMember}
          heldByMe={heldByMe}
          isAdmin={isAdmin}
          isArchived={typedBook.is_archived}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <ReadingStatusSelect
          bookId={typedBook.id}
          initialStatus={readingStatus}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Kitap Bilgileri
        </h2>
        <DetailRow label="Yazar" value={typedBook.author} />
        <DetailRow label="ISBN-13" value={typedBook.isbn_13} />
        <DetailRow label="ISBN-10" value={typedBook.isbn_10} />
        <DetailRow label="Yayınevi" value={typedBook.publisher} />
        <DetailRow label="Yayın Yılı" value={typedBook.published_year} />
        <DetailRow label="Sayfa Sayısı" value={typedBook.page_count} />
        <DetailRow label="Kategori" value={typedBook.category} />
        {typedBook.description && (
          <div className="pt-3">
            <p className="mb-1 text-sm text-gray-500">Açıklama</p>
            <p className="whitespace-pre-wrap text-sm text-gray-800">
              {typedBook.description}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Kişisel Notlarım
        </h2>
        <BookNotes bookId={typedBook.id} initialNotes={notes} />
      </section>
    </div>
  );
}
