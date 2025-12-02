import type { Metadata } from "next";
import { inter, fredoka } from "./fonts";
import "./globals.css";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "SUMO GO",
  description: "Sumo tu pedido, vos sumás el grupo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`}>
      <body className="min-h-screen bg-[var(--sumo-bg)] text-[var(--sumo-text-primary)]">
        {/* <header className="flex items-center justify-between px-4 py-3 bg-sumo-surface border-b border-sumo-soft">
          <span className="font-brand font-semibold text-sumo-primary">
            SUMO
          </span>
          <ThemeToggle />
        </header> */}
        {children}
      </body>
    </html>
  );
}
