"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Panel", icon: "🏠" },
  { href: "/books", label: "Kitaplar", icon: "📚" },
  { href: "/books/add", label: "Ekle", icon: "➕" },
  { href: "/my-books", label: "Kitaplarım", icon: "📖" },
  { href: "/settings", label: "Ayarlar", icon: "⚙️" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === "/books"
              ? pathname === "/books"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-brand-600" : "text-gray-500"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
