import type { ReadingStatus, CopyStatus } from "./types";

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  not_read: "Okumadım",
  reading: "Okuyorum",
  read: "Okudum",
  abandoned: "Yarım Bıraktım",
  want_to_read: "Okumak İstiyorum",
};

export const READING_STATUS_ORDER: ReadingStatus[] = [
  "reading",
  "read",
  "not_read",
  "want_to_read",
  "abandoned",
];

export const READING_STATUS_COLORS: Record<ReadingStatus, string> = {
  not_read: "bg-gray-100 text-gray-700",
  reading: "bg-blue-100 text-blue-700",
  read: "bg-green-100 text-green-700",
  abandoned: "bg-amber-100 text-amber-700",
  want_to_read: "bg-purple-100 text-purple-700",
};

export const COPY_STATUS_LABELS: Record<CopyStatus, string> = {
  on_shelf: "Rafta",
  with_member: "Bir Üyede",
  lost: "Kayıp",
  damaged: "Hasarlı",
};

export const LOOKUP_SOURCE_LABELS: Record<string, string> = {
  harikakitap: "Harikakitap",
  sahafsalih: "Sahaf Salih",
  kitapvekahve: "Kitap ve Kahve",
  hardcover: "Hardcover",
  google_books: "Google Books",
  open_library: "Open Library",
  manual: "Manuel",
};
