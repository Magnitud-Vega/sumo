import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pizzbur Fran | CENA-MCHILL",
  description: "Sumá tu pedido a la orden.",
};

export default function OrderSlug({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
