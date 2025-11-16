// app/admin/group-order/[orderId]/page.tsx
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
  console.log("Params:", orderId);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Orden de grupo: {groupOrder.slug}
          </h1>
          <p className="text-sm text-gray-500">
            Menú: {groupOrder.menu.title} · Deadline:{" "}
            {groupOrder.deadlineTs.toLocaleString()}
          </p>
        </div>

        <OrderLinesTable initialLines={groupOrder.lines} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching group order:", error);
    notFound();
  }
}
