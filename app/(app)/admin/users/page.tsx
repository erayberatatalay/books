import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { UserCreateForm } from "@/components/admin/UserCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const users = (data as Profile[] | null) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aile Üyeleri</h1>
        <p className="text-sm text-gray-500">
          Aile üyelerini görüntüle ve yeni üye ekle.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Yeni Aile Üyesi Ekle
        </h2>
        <UserCreateForm />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Üyeler ({users.length})
        </h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
            >
              <span className="text-sm font-medium text-gray-900">
                {u.full_name}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  u.role === "admin"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {u.role === "admin" ? "Yönetici" : "Üye"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
