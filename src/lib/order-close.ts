import { prisma } from "@/lib/db";
import { splitDelivery } from "@/lib/calc";

export async function closeGroupOrderById(groupOrderId: string) {
  // 1) Trae el evento + líneas
  const group = await prisma.groupOrder.findUnique({
    where: { id: groupOrderId },
    include: { lines: true },
  });
  if (!group) throw new Error("Group order no existe");
  if (group.status !== "OPEN")
    return { ok: true, alreadyClosed: true, groupId: group.id };

  // 2) Valida mínimos
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

  // 3) Calcula prorrateo de delivery
  const subtotals = group.lines.map((l) => l.subtotalGs);
  const shares = splitDelivery(
    group.deliveryCostGs,
    subtotals,
    group.splitStrategy as any
  );

  // 4) Aplica cambios en transacción
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < group.lines.length; i++) {
      const line = group.lines[i];
      const deliveryShare = shares[i];
      const total = line.subtotalGs + deliveryShare;
      await tx.orderLine.update({
        where: { id: line.id },
        data: {
          deliveryShareGs: deliveryShare,
          totalGs: total,
          status: "FINALIZED",
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
    shares,
    groupId: group.id,
  };
}
