// app/admin/group-orders/[orderId]/OrderLinesTable.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import type { OrderLine, GroupOrder } from "@prisma/client";
import { computeDeliveryPreview } from "@/lib/order-preview";

interface OrderLinesTableProps {
  initialLines: OrderLine[];
  status: GroupOrder["status"];
  deliveryCostGs: number;
  splitStrategy: GroupOrder["splitStrategy"];
  bankDetails?: string;
}

export default function OrderLinesTable({
  initialLines,
  status,
  deliveryCostGs,
  splitStrategy,
  bankDetails,
}: OrderLinesTableProps) {
  const [lines, setLines] = useState(initialLines);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  // Siempre recalculamos el preview en base al estado actual de `lines`
  const preview = useMemo(
    () =>
      computeDeliveryPreview(
        { status, deliveryCostGs, splitStrategy } as any,
        lines
      ),
    [status, deliveryCostGs, splitStrategy, lines]
  );
  const previewById = useMemo(
    () => Object.fromEntries(preview.lines.map((l) => [l.id, l])),
    [preview.lines]
  );

  const handleMarkAsPaid = (id: string) => {
    setUpdatingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admincito/order-lines/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAID" }),
        });

        if (!res.ok) {
          console.error("Error al actualizar el estado");
          return;
        }

        const updated = (await res.json()) as OrderLine;

        setLines((prev) =>
          prev.map((line) =>
            line.id === id ? { ...line, status: updated.status } : line
          )
        );
      } catch (err) {
        console.error("Error en la petición", err);
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const handleSendReminder = (id: string) => {
    setRemindingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admincito/order-lines/${id}/reminder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankDetailsOverride: bankDetails }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Error al enviar recordatorio", err);
          alert(err.error || "No se pudo enviar el recordatorio");
          return;
        }

        alert("Recordatorio de pago enviado por WhatsApp ✅");
      } catch (err) {
        console.error("Error en la petición", err);
        alert("Error inesperado enviando el recordatorio");
      } finally {
        setRemindingId(null);
      }
    });
  };

  return (
    <div className="mt-4 overflow-x-auto">
      {/* Podés mostrar un resumen también acá */}
      {status === "OPEN" && (
        <p className="text-sumo-xs text-sumo-muted mb-2">
          Totales estimados · Subtotal:{" "}
          {preview.sumSubtotal.toLocaleString("es-PY")} Gs · Delivery:{" "}
          {preview.sumEstimatedDelivery.toLocaleString("es-PY")} Gs · Total:{" "}
          {preview.sumEstimatedTotal.toLocaleString("es-PY")} Gs
        </p>
      )}

      <table className="table-sumo">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>WhatsApp</th>
            <th>Pago</th>
            <th>Item</th>
            <th className="text-right">Subtotal (Gs)</th>
            <th className="text-right">
              Delivery {status === "OPEN" && " (estimado)"} (Gs)
            </th>
            <th className="text-right">
              Total {status === "OPEN" && " (estimado)"} (Gs)
            </th>
            <th className="text-center">Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="py-6 text-center text-sumo-muted italic"
              >
                No hay ítems cargados para esta orden.
              </td>
            </tr>
          )}

          {lines.map((line) => {
            const statusLabel =
              line.status === "PAID"
                ? "Pagado"
                : line.status === "FINALIZED"
                ? "Finalizado"
                : "Pendiente";

            const statusPillClass =
              line.status === "PAID"
                ? "table-sumo-status-paid"
                : "table-sumo-status-pending";

            const previewLine = previewById[line.id];
            const deliveryToShow =
              status === "OPEN"
                ? previewLine.estimatedDeliveryShareGs
                : line.deliveryShareGs;
            const totalToShow =
              status === "OPEN" ? previewLine.estimatedTotalGs : line.totalGs;

            const canSendReminder =
              (status === "DELIVERED" || status == "CLOSED") &&
              line.status === "PENDING";

            return (
              <tr key={line.id}>
                <td className="font-medium">{line.name}</td>
                <td className="text-sumo-sm text-sumo-muted">
                  {line.whatsapp}
                </td>
                <td className="text-sumo-sm">
                  {line.payMethod === "CASH"
                    ? "Efectivo"
                    : line.payMethod === "TRANSFER"
                    ? "Transferencia"
                    : line.payMethod === "TC"
                    ? "Tarjeta crédito"
                    : line.payMethod === "TD"
                    ? "Tarjeta débito"
                    : line.payMethod === "QR"
                    ? "QR"
                    : line.payMethod}
                </td>
                <td>
                  {line.itemName}{" "}
                  <span className="text-sumo-muted">
                    {line.note ? `(${line.note})` : ""}
                  </span>
                </td>
                <td className="text-right">
                  {line.subtotalGs.toLocaleString("es-PY")}
                </td>
                <td className="text-right">
                  {deliveryToShow.toLocaleString("es-PY")}
                </td>
                <td className="text-right">
                  {totalToShow.toLocaleString("es-PY")}
                </td>
                <td className="text-center">
                  <span className={`table-sumo-status-pill ${statusPillClass}`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="text-center">
                  {line.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(line.id)}
                      disabled={isPending && updatingId === line.id}
                      className="btn-sumo text-[11px] px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending && updatingId === line.id
                        ? "Actualizando..."
                        : "Cambiar a PAGADO"}
                    </button>
                  )}
                  {canSendReminder && (
                    <button
                      type="button"
                      onClick={() => handleSendReminder(line.id)}
                      disabled={isPending && remindingId === line.id}
                      className="btn-sumo-secondary text-[11px] px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending && remindingId === line.id
                        ? "Enviando..."
                        : "Recordatorio de pago"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
