import { requireUser } from "@/lib/auth/requireUser";
import { getBookListItems } from "@/lib/server/books";
import { BookCard } from "@/components/books/BookCard";
import { EmptyState } from "@/components/common/EmptyState";

export const dynamic = "force-dynamic";

export default async function CurrentlyReadingPage() {
  const user = await requireUser();
  const items = await getBookListItems(user.id);
  const reading = items.filter((it) => it.readingStatus === "reading");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Şu An Okuyorum</h1>

      {reading.length === 0 ? (
        <EmptyState
          title="Şu anda okuduğun bir kitap yok."
          description="Bir kitabı 'Okuyorum' olarak işaretlediğinde burada görünür."
          icon="📖"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {reading.map((it) => (
            <BookCard key={it.book.id} {...it} />
          ))}
        </div>
      )}
    </div>
  );
}
