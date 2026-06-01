import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
