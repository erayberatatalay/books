import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardStats,
  type DashboardStatsData,
} from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();

  const [totalBooks, readByMe, readingByMe, wantToRead, activeHolders] =
    await Promise.all([
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("is_archived", false),
      supabase
        .from("user_book_statuses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "read"),
      supabase
        .from("user_book_statuses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "reading"),
      supabase
        .from("user_book_statuses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "want_to_read"),
      supabase
        .from("book_copies")
        .select("id", { count: "exact", head: true })
        .eq("status", "with_member"),
    ]);

  const stats: DashboardStatsData = {
    totalBooks: totalBooks.count ?? 0,
    readByMe: readByMe.count ?? 0,
    readingByMe: readingByMe.count ?? 0,
    wantToRead: wantToRead.count ?? 0,
    activeHolders: activeHolders.count ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Merhaba, {user.profile.full_name} 👋
        </h1>
        <p className="text-sm text-gray-500">Ev kitaplığına genel bakış</p>
      </div>

      <DashboardStats stats={stats} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Hızlı İşlemler
        </h2>
        <QuickActions />
      </div>
    </div>
  );
}
