import { ScanFlow } from "@/components/books/ScanFlow";

export const metadata = {
  title: "Barkod Tara · Ev Kitaplığım",
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Barkod Tara</h1>
      <p className="text-sm text-gray-500">
        Arka kapağın ISBN barkodunu yatay tutun; netleşmesi için 15–20 cm mesafede
        sabit bekleyin. Okumazsa alttan ISBN’i elle girebilirsin.
      </p>
      <ScanFlow />
    </div>
  );
}
