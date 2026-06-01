"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { ErrorMessage } from "@/components/common/ErrorMessage";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function UserCreateForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kullanıcı oluşturulamadı.");
        return;
      }
      setSuccess(`${fullName} başarıyla eklendi.`);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("member");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ad Soyad
        </label>
        <input
          className={inputClass}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Şifre
        </label>
        <input
          type="text"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="En az 6 karakter"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Rol
        </label>
        <select
          className={inputClass}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="member">Üye</option>
          <option value="admin">Yönetici</option>
        </select>
      </div>

      <ErrorMessage message={error} />
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {saving ? "Ekleniyor..." : "Aile Üyesi Ekle"}
      </button>
    </form>
  );
}
