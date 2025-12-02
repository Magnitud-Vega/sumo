// app/admin/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Image from "next/image";
import NameLogo from "@/../public/name-logo.png";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--sumo-bg)] text-[var(--sumo-text-primary)]">
      <header className="border-b border-sumo-soft bg-sumo-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/admin/group-orders"
            className="font-brand text-sumo-lg text-sumo-primary flex items-center"
          >
            <Image src={NameLogo} alt="SUMO GO" width={80} height={80} />
            <h3>Admin</h3>
          </Link>

          <nav className="flex items-center gap-3 text-sumo-sm">
            <Link
              href="/admin/group-orders/create"
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
