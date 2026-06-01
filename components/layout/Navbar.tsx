"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel" },
  { href: "/books", label: "Tüm Kitaplar" },
  { href: "/my-books", label: "Kitaplarım" },
  { href: "/currently-reading", label: "Okuyorum" },
  { href: "/active-holders", label: "Kimde Olan" },
  { href: "/admin/users", label: "Aile Üyeleri", adminOnly: true },
  { href: "/settings", label: "Ayarlar" },
];

export function Navbar({
  fullName,
  role,
}: {
  fullName: string;
  role: UserRole;
}) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span className="text-base font-bold text-gray-900">Ev Kitaplığım</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/books/add"
            className="hidden rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 sm:inline-block"
          >
            + Kitap Ekle
          </Link>
          <span className="hidden text-sm text-gray-500 lg:inline">
            {fullName}
          </span>
        </div>
      </div>
    </header>
  );
}
