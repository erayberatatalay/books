import Link from "next/link";

export type DashboardStatsData = {
  totalBooks: number;
  readByMe: number;
  readingByMe: number;
  wantToRead: number;
  activeHolders: number;
};

const CARDS: {
  key: keyof DashboardStatsData;
  label: string;
  href: string;
  emoji: string;
}[] = [
  { key: "totalBooks", label: "Evdeki Kitap", href: "/books", emoji: "📚" },
  { key: "readByMe", label: "Okuduklarım", href: "/my-books", emoji: "✅" },
  {
    key: "readingByMe",
    label: "Şu An Okuduklarım",
    href: "/currently-reading",
    emoji: "📖",
  },
  {
    key: "wantToRead",
    label: "Okumak İstediklerim",
    href: "/my-books",
    emoji: "🔖",
  },
  {
    key: "activeHolders",
    label: "Birinde Olan Kitaplar",
    href: "/active-holders",
    emoji: "👤",
  },
];

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CARDS.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300"
        >
          <div className="text-2xl">{card.emoji}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {stats[card.key]}
          </div>
          <div className="text-xs text-gray-500">{card.label}</div>
        </Link>
      ))}
    </div>
  );
}
