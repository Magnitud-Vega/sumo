// app/admin/group-orders/[orderId]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import OrderLinesTable from "./OrderLinesTable";

interface GroupOrderDetailPageProps {
  params: {
    orderId: string;
  };
}

export default async function GroupOrderDetailPage({
  params,
}: GroupOrderDetailPageProps) {
  const { orderId } = await params;

  try {
    if (!orderId) {
      notFound();
    }

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { id: orderId },
      include: {
        lines: {
          orderBy: { createdAt: "asc" },
        },
        menu: true,
      },
    });

    if (!groupOrder) {
      notFound();
    }

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="card-sumo space-y-2">
          <h1 className="card-sumo-title font-brand text-sumo-2xl">
            Orden de grupo: {groupOrder.slug}
          </h1>
          <p className="card-sumo-subtitle">
            Menú: <span className="font-medium">{groupOrder.menu.title}</span>
          </p>
          <p className="card-sumo-subtitle">
            Deadline:{" "}
            {groupOrder.deadlineTs.toLocaleString("es-PY", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </section>

        <section className="card-sumo">
          {/* OrderLinesTable ya maneja la tabla interna */}
          <OrderLinesTable initialLines={groupOrder.lines} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error fetching group order:", error);
    notFound();
  }
}
