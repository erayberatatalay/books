import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { MobileBottomNav } from "./MobileBottomNav";
import type { UserRole } from "@/lib/types";

export function AppShell({
  fullName,
  role,
  children,
}: {
  fullName: string;
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen has-bottom-nav md:pb-0">
      <Navbar fullName={fullName} role={role} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
