export type UserRole = "admin" | "member";

export type ReadingStatus =
  | "not_read"
  | "reading"
  | "read"
  | "abandoned"
  | "want_to_read";

export type CopyStatus = "on_shelf" | "with_member" | "lost" | "damaged";

export type HolderAction = "taken" | "returned" | "transferred";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  isbn_10: string | null;
  isbn_13: string | null;
  publisher: string | null;
  published_year: string | null;
  page_count: number | null;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  source: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BookCopy = {
  id: string;
  book_id: string;
  copy_code: string | null;
  current_holder_id: string | null;
  status: CopyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UserBookStatus = {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type BookNote = {
  id: string;
  user_id: string;
  book_id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type BookHolderHistory = {
  id: string;
  book_copy_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  action: HolderAction;
  created_by: string | null;
  created_at: string;
};

export type LookupBook = {
  title: string;
  subtitle?: string;
  author?: string;
  isbn_10?: string;
  isbn_13?: string;
  publisher?: string;
  published_year?: string;
  page_count?: number;
  description?: string;
  cover_url?: string;
  category?: string;
};

export type LookupSource =
  | "google_books"
  | "open_library"
  | "hardcover"
  | "harikakitap"
  | "sahafsalih"
  | "kitapvekahve";

export type BookLookupResponse = {
  found: boolean;
  source?: LookupSource;
  book?: LookupBook;
  /** Kitap bulunamadığında yapılandırma ipucu (ör. eksik API anahtarı). */
  hint?: string;
};

export type BookWithRelations = Book & {
  book_copies?: BookCopy[];
  user_book_statuses?: UserBookStatus[];
};
