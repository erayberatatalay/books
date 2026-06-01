import Link from "next/link";

const ACTIONS = [
  { href: "/books/add", label: "Kitap Ekle", emoji: "➕" },
  { href: "/books/scan", label: "Barkod Tara", emoji: "📷" },
  { href: "/books", label: "Tüm Kitaplar", emoji: "📚" },
  { href: "/my-books", label: "Benim Kitaplarım", emoji: "📖" },
  { href: "/active-holders", label: "Kimde Olan Kitaplar", emoji: "👤" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <span className="text-lg">{a.emoji}</span>
          {a.label}
        </Link>
      ))}
    </div>
  );
}
