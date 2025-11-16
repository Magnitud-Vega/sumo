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
    <div className="mt-4">
      <table className="min-w-full text-sm border border-gray-200 rounded-md overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Nombre</th>
            <th className="px-3 py-2 text-left">WhatsApp</th>
            <th className="px-3 py-2 text-left">Pago</th>
            <th className="px-3 py-2 text-left">Item</th>
            <th className="px-3 py-2 text-right">Subtotal (Gs)</th>
            <th className="px-3 py-2 text-right">Delivery (Gs)</th>
            <th className="px-3 py-2 text-right">Total (Gs)</th>
            <th className="px-3 py-2 text-center">Estado</th>
            <th className="px-3 py-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="px-3 py-6 text-center text-gray-500 italic"
              >
                No hay ítems cargados para esta orden.
              </td>
            </tr>
          )}

          {lines.map((line) => (
            <tr key={line.id} className="border-t border-gray-200">
              <td className="px-3 py-2">{line.name}</td>
              <td className="px-3 py-2">{line.whatsapp}</td>
              <td className="px-3 py-2">{line.payMethod}</td>
              <td className="px-3 py-2">{line.itemName}</td>
              <td className="px-3 py-2 text-right">
                {line.subtotalGs.toLocaleString("es-PY")}
              </td>
              <td className="px-3 py-2 text-right">
                {line.deliveryShareGs.toLocaleString("es-PY")}
              </td>
              <td className="px-3 py-2 text-right">
                {line.totalGs.toLocaleString("es-PY")}
              </td>
              <td className="px-3 py-2 text-center">{line.status}</td>
              <td className="px-3 py-2 text-center">
                {line.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsPaid(line.id)}
                    disabled={isPending && updatingId === line.id}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending && updatingId === line.id
                      ? "Actualizando..."
                      : "Cambiar a PAGADO"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
