import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pizzbur Fran | Martes Chill",
  description: "✨ 1er paseo del año!! ✨",
};

export default function OrderSlug({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
