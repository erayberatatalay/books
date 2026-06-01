import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">📕</div>
      <h1 className="text-xl font-bold text-gray-900">Sayfa bulunamadı</h1>
      <p className="text-sm text-gray-500">
        Aradığın sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Panele Dön
      </Link>
    </div>
  );
}
