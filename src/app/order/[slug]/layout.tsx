import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pizzbur Fran | CENA-MCHILL",
  description: "Hoy cenamos por el cumple de Jessy 🎉🎂🎈🥳🎁🍰✨",
};

export default function OrderSlug({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
