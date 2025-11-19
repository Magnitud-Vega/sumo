// src/lib/order-close.ts
import { prisma } from "@/lib/db";
import { computeDeliveryPreview } from "./order-preview";

export async function closeGroupOrderById(groupOrderId: string) {
  const group = await prisma.groupOrder.findUnique({
    where: { id: groupOrderId },
    include: { lines: true },
  });
  if (!group) throw new Error("Group order no existe");
  if (group.status !== "OPEN")
    return { ok: true, alreadyClosed: true, groupId: group.id };

  // Validaciones de mínimos (igual que antes)...
  const itemCount = group.lines.reduce((a, l) => a + l.qty, 0);
  const subtotalSum = group.lines.reduce((a, l) => a + l.subtotalGs, 0);

  const failsMinTotal =
    group.minTotalGs != null && subtotalSum < group.minTotalGs;
  const failsMinItems = group.minItems != null && itemCount < group.minItems;

  if (failsMinTotal || failsMinItems) {
    const reasonParts = [];
    if (failsMinTotal)
      reasonParts.push(
        `minTotalGs=${group.minTotalGs}, subtotal=${subtotalSum}`
      );
    if (failsMinItems)
      reasonParts.push(`minItems=${group.minItems}, items=${itemCount}`);
    const reason = reasonParts.join(" | ");

    await prisma.groupOrder.update({
      where: { id: group.id },
      data: { status: "CANCELLED", closedAt: new Date(), cancelReason: reason },
    });

    // Opcional: poner totales en 0 por prolijidad
    await prisma.orderLine.updateMany({
      where: { groupOrderId: group.id },
      data: { deliveryShareGs: 0, totalGs: 0, status: "PENDING" },
    });

    return {
      ok: true,
      cancelled: true,
      reason,
      subtotalSum,
      itemCount,
      groupId: group.id,
    };
  }

  // 👇 Usamos la librería para calcular los valores definitivos
  const { lines: previewLines } = computeDeliveryPreview(
    {
      status: "OPEN",
      deliveryCostGs: group.deliveryCostGs,
      splitStrategy: group.splitStrategy,
    },
    group.lines
  );

  await prisma.$transaction(async (tx) => {
    for (const pl of previewLines) {
      await tx.orderLine.update({
        where: { id: pl.id },
        data: {
          deliveryShareGs: pl.estimatedDeliveryShareGs,
          totalGs: pl.estimatedTotalGs,
          status: "PENDING",
        },
      });
    }

    await tx.groupOrder.update({
      where: { id: group.id },
      data: { status: "CLOSED", closedAt: new Date(), cancelReason: null },
    });
  });

  return {
    ok: true,
    closed: true,
    subtotalSum,
    itemCount,
    groupId: group.id,
  };
}
