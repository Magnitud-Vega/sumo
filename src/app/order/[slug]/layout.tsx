import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pizzbur Fran | Martes Chill",
  description: "✨ Paseo Martes Chill ✨",
};

export default function OrderSlug({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
