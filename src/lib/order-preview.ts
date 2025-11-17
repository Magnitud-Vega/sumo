// src/lib/order-preview.ts
import type { GroupOrder, OrderLine } from "@prisma/client";
import { splitDelivery, type SplitMode } from "./calc";

export type Status = GroupOrder["status"];

export type PreviewLine = OrderLine & {
  estimatedDeliveryShareGs: number;
  estimatedTotalGs: number;
};

export type PreviewResult = {
  lines: PreviewLine[];
  sumSubtotal: number;
  sumEstimatedDelivery: number;
  sumEstimatedTotal: number;
};

type GroupLike = Pick<
  GroupOrder,
  "deliveryCostGs" | "splitStrategy" | "status"
>;

/**
 * Devuelve una vista "preview" de la orden:
 * - Si la orden está OPEN → calcula prorrateo en vivo (estimado).
 * - Si la orden está CLOSED/DELIVERED/CANCELLED → respeta lo que hay en DB.
 */
export function computeDeliveryPreview(
  group: GroupLike,
  lines: OrderLine[]
): PreviewResult {
  const sumSubtotal = lines.reduce((a, l) => a + l.subtotalGs, 0);

  // Si no hay delivery definido o no hay líneas, todo 0
  if (lines.length === 0 || group.deliveryCostGs <= 0) {
    const previewLines = lines.map((l) => ({
      ...l,
      estimatedDeliveryShareGs: 0,
      estimatedTotalGs: l.subtotalGs,
    }));

    const sumEstimatedTotal = sumSubtotal;
    return {
      lines: previewLines,
      sumSubtotal,
      sumEstimatedDelivery: 0,
      sumEstimatedTotal,
    };
  }

  // Si la orden YA está cerrada o entregada: usamos los valores persistidos
  if (group.status !== "OPEN") {
    const previewLines = lines.map((l) => ({
      ...l,
      estimatedDeliveryShareGs: l.deliveryShareGs,
      estimatedTotalGs: l.totalGs,
    }));
    const sumEstimatedDelivery = previewLines.reduce(
      (a, l) => a + l.estimatedDeliveryShareGs,
      0
    );
    const sumEstimatedTotal = previewLines.reduce(
      (a, l) => a + l.estimatedTotalGs,
      0
    );

    return {
      lines: previewLines,
      sumSubtotal,
      sumEstimatedDelivery,
      sumEstimatedTotal,
    };
  }

  // Orden OPEN → calculamos prorrateo estimado
  const subtotals = lines.map((l) => l.subtotalGs);
  const shares = splitDelivery(
    group.deliveryCostGs,
    subtotals,
    group.splitStrategy as SplitMode
  );

  const previewLines = lines.map((l, i) => {
    const deliveryShare = shares[i] ?? 0;
    return {
      ...l,
      estimatedDeliveryShareGs: deliveryShare,
      estimatedTotalGs: l.subtotalGs + deliveryShare,
    };
  });

  const sumEstimatedDelivery = previewLines.reduce(
    (a, l) => a + l.estimatedDeliveryShareGs,
    0
  );
  const sumEstimatedTotal = previewLines.reduce(
    (a, l) => a + l.estimatedTotalGs,
    0
  );

  return {
    lines: previewLines,
    sumSubtotal,
    sumEstimatedDelivery,
    sumEstimatedTotal,
  };
}
