// app/components/ui/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "sumo-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        (localStorage.getItem(THEME_KEY) as "light" | "dark" | null)) ||
      null;

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-sumo-ghost text-xs md:text-sm"
    >
      {theme === "light" ? "Modo oscuro 🌙" : "Modo claro ☀️"}
    </button>
  );
}
