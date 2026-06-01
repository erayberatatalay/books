import { requireUser } from "@/lib/auth/requireUser";
import { LogoutButton } from "@/components/settings/LogoutButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
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
            {user.profile.role === "admin" ? "Yönetici" : "Üye"}
          </p>
        </div>
      </section>

      <LogoutButton />
    </div>
  );
}
