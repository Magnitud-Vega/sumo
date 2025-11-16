// app/admin/group-order/[orderId]/OrderLinesTable.tsx
"use client";

import { useState, useTransition } from "react";
import type { OrderLine, LineStatus } from "@prisma/client";

interface OrderLinesTableProps {
  initialLines: OrderLine[];
}

export default function OrderLinesTable({
  initialLines,
}: OrderLinesTableProps) {
  const [lines, setLines] = useState(initialLines);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkAsPaid = (id: string) => {
    setUpdatingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/order-lines/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "PAID" as LineStatus }),
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

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="table-sumo">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>WhatsApp</th>
            <th>Pago</th>
            <th>Item</th>
            <th className="text-right">Subtotal (Gs)</th>
            <th className="text-right">Delivery (Gs)</th>
            <th className="text-right">Total (Gs)</th>
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
                <td>{line.itemName}</td>
                <td className="text-right">
                  {line.subtotalGs.toLocaleString("es-PY")}
                </td>
                <td className="text-right">
                  {line.deliveryShareGs.toLocaleString("es-PY")}
                </td>
                <td className="text-right">
                  {line.totalGs.toLocaleString("es-PY")}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>  
  );
}
