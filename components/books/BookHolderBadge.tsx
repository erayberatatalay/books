export function BookHolderBadge({
  holderName,
  compact = false,
}: {
  holderName: string | null;
  compact?: boolean;
}) {
  if (!holderName) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
        Şu an: {holderName}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
      <span aria-hidden>👤</span>
      Şu an {holderName} kişisinde
    </div>
  );
}
