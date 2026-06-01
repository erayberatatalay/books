import { createClient } from "@/lib/supabase/server";
import type {
  Book,
  BookCopy,
  ReadingStatus,
  UserBookStatus,
} from "@/lib/types";
import type { BookCardData } from "@/components/books/BookCard";

export type ProfileMap = Record<string, string>;

/**
 * Profil id -> ad eşlemesi döndürür (sahiplik adlarını göstermek için).
 */
export async function getProfileMap(): Promise<ProfileMap> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("id, full_name");
  const map: ProfileMap = {};
  (data ?? []).forEach((p) => {
    map[p.id as string] = p.full_name as string;
  });
  return map;
}

/**
 * Bir kitabın aktif tutucu adını döndürür (with_member kopyası varsa).
 */
export function resolveHolderName(
  copies: BookCopy[] | undefined,
  profiles: ProfileMap
): string | null {
  const withMember = (copies ?? []).find(
    (c) => c.status === "with_member" && c.current_holder_id
  );
  if (!withMember || !withMember.current_holder_id) return null;
  return profiles[withMember.current_holder_id] ?? "Bilinmeyen Üye";
}

/**
 * Listeleme sayfaları için kitapları, kullanıcının okuma durumu ve aktif
 * tutucu bilgisiyle birlikte getirir.
 */
export async function getBookListItems(userId: string): Promise<BookCardData[]> {
  const supabase = createClient();

  const [{ data: books }, { data: statuses }, profiles] = await Promise.all([
    supabase
      .from("books")
      .select("*, book_copies(*)")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_book_statuses")
      .select("*")
      .eq("user_id", userId),
    getProfileMap(),
  ]);

  const statusMap = new Map<string, ReadingStatus>();
  (statuses as UserBookStatus[] | null)?.forEach((s) => {
    statusMap.set(s.book_id, s.status);
  });

  return ((books as (Book & { book_copies?: BookCopy[] })[]) ?? []).map(
    (book) => {
      const { book_copies, ...rest } = book;
      return {
        book: rest as Book,
        readingStatus: statusMap.get(book.id) ?? null,
        holderName: resolveHolderName(book_copies, profiles),
      };
    }
  );
}
