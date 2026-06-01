import { requireUser } from "@/lib/auth/requireUser";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { JsonBookImportPanel } from "@/components/settings/JsonBookImportPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.profile.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Ayarlar</h1>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-xs text-gray-500">Ad Soyad</p>
          <p className="text-sm font-medium text-gray-900">
            {user.profile.full_name}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm font-medium text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Rol</p>
          <p className="text-sm font-medium text-gray-900">
            {isAdmin ? "Yönetici" : "Üye"}
          </p>
        </div>
      </section>

      {isAdmin && <JsonBookImportPanel />}

      <LogoutButton />
    </div>
  );
}
