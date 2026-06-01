import { AddBookTabs } from "@/components/books/AddBookTabs";

export const metadata = {
  title: "Kitap Ekle · Ev Kitaplığım",
};

export default function AddBookPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Kitap Ekle</h1>
      <p className="text-sm text-gray-500">
        Barkod tarayarak, ISBN ile arayarak veya elle ekleyebilirsin.
      </p>
      <AddBookTabs />
    </div>
  );
}
