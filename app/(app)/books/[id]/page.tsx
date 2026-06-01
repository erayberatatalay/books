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
import { BookInfoPanel } from "@/components/books/BookInfoPanel";

export const dynamic = "force-dynamic";

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
  const canEdit = isAdmin || typedBook.created_by === user.id;
  const canDelete = isAdmin;

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

      <BookInfoPanel
        book={typedBook}
        copies={copies}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Kişisel Notlarım
        </h2>
        <BookNotes bookId={typedBook.id} initialNotes={notes} />
      </section>
    </div>
  );
}
