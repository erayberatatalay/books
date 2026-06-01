import Link from "next/link";
import type { Book, ReadingStatus } from "@/lib/types";
import { READING_STATUS_COLORS, READING_STATUS_LABELS } from "@/lib/constants";
import { BookHolderBadge } from "./BookHolderBadge";

export type BookCardData = {
  book: Book;
  readingStatus: ReadingStatus | null;
  holderName: string | null;
};

export function BookCard({ book, readingStatus, holderName }: BookCardData) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
    >
      <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
            📕
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
          {book.title}
        </h3>
        {book.author && (
          <p className="line-clamp-1 text-xs text-gray-500">{book.author}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {readingStatus && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${READING_STATUS_COLORS[readingStatus]}`}
            >
              {READING_STATUS_LABELS[readingStatus]}
            </span>
          )}
          <BookHolderBadge holderName={holderName} compact />
        </div>
      </div>
    </Link>
  );
}
