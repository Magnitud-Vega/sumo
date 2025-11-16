// components/ui/CopyButton.tsx
"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  label?: string; // por si querés mostrar tooltip distinto del texto copiado
  className?: string;
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Error al copiar al portapapeles", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-100 " +
        (className || "")
      }
    >
      {copied ? "Copiado ✓" : label ?? "Copiar"}
    </button>
  );
}
