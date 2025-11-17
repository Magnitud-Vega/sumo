// app/admin/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--sumo-bg)] text-[var(--sumo-text-primary)]">
      <header className="border-b border-sumo-soft bg-sumo-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/admin/group-orders"
            className="font-brand text-sumo-lg text-sumo-primary"
          >
            SUMO Admin
          </Link>

          <nav className="flex items-center gap-3 text-sumo-sm">
            <Link
              href="/admin/order-groups/create"
              className="text-sumo-muted hover:text-sumo-primary"
            >
              Crear evento
            </Link>
            <Link
              href="/admin/group-orders"
              className="text-sumo-muted hover:text-sumo-primary"
            >
              Eventos
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
