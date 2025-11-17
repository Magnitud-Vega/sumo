// src/lib/order-close.ts
import { prisma } from "@/lib/db";
import { computeDeliveryPreview } from "./order-preview";
// import { sendWhatsAppTemplate, sendWhatsAppText, toGs } from "@/lib/whatsapp";

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
          status: "FINALIZED",
        },
      });
    }

    await tx.groupOrder.update({
      where: { id: group.id },
      data: { status: "CLOSED", closedAt: new Date(), cancelReason: null },
    });
  });

  for (const l of previewLines) {
    try {
      // await sendWhatsAppTemplate({
      //   to: l.whatsapp.startsWith("+")
      //     ? l.whatsapp
      //     : `+${l.whatsapp.replace(/^0+/, "595")}`,
      //   name: "pedido_cerrado",
      //   bodyParams: [
      //     { type: "text", text: l.name },
      //     { type: "text", text: toGs(l.totalGs) },
      //     { type: "text", text: toGs(l.deliveryShareGs) },
      //     { type: "text", text: l.payMethod }, // "CASH" | "QR" | "TRANSFER" | "TC" | "TD"
      //   ],
      // });
      // await sendWhatsAppText({
      //   to: l.whatsapp.startsWith("+")
      //     ? l.whatsapp.replace("+", "")
      //     : `${l.whatsapp.replace(/^0+/, "595")}`,
      //   text: `Hola ${l.name}, el grupo de pedidos "${
      //     group.slug
      //   }" ha sido cerrado. El total de tu pedido es ${toGs(
      //     l.totalGs
      //   )}, que incluye ${toGs(
      //     l.deliveryShareGs
      //   )} de costo de delivery. Tu método de pago seleccionado es ${
      //     l.payMethod
      //   }. ¡Gracias por tu pedido!`,
      // });
    } catch (e) {
      console.error("[WA pedido_cerrado] ", e);
    }
  }

  return {
    ok: true,
    closed: true,
    subtotalSum,
    itemCount,
    groupId: group.id,
  };
}
