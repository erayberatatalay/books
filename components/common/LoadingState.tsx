export function LoadingState({ message = "Yükleniyor..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"
        aria-hidden
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
