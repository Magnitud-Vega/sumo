// app/admin/group-orders/[orderId]/OrderLinesCard.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import type { GroupOrder, Menu, OrderLine, MenuItem } from "@prisma/client";
import { computeDeliveryPreview } from "@/lib/order-preview";

interface OrderLinesCardProps {
  initialLines: OrderLine[];
  status: GroupOrder["status"];
  deliveryCostGs: number;
  splitStrategy: GroupOrder["splitStrategy"];
  bankDetails: string;
  slug: GroupOrder["slug"];
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  // Si empieza con 0 → lo convertimos a 595 (Paraguay)
  if (digits.startsWith("0")) {
    return "595" + digits.slice(1);
  }

  // Si ya empieza en 595 → perfecto
  if (digits.startsWith("595")) {
    return digits;
  }

  // Si empieza con +595
  if (digits.startsWith("595")) {
    return digits;
  }

  // fallback para cualquier otro formato
  return digits;
}

function buildWhatsAppReminderMessage(
  line: OrderLine,
  slug: GroupOrder["slug"],
  bankDetails: string
) {
  const phone = normalizePhone(line.whatsapp);
  const text = `Hola ${line.name} 👋
Te dejamos un recordatorio para completar el pago de tu pedido.

🔖 Pedido: ${slug}
🍔 Ítem: ${line.itemName}
💵 Total: ${formatGs(line.totalGs)} Gs
💳 Cuenta: ${bankDetails}

Cuando puedas, realizá la transferencia y adjuntá tu comprobante. ¡Gracias! 🙌`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function formatGs(value: number) {
  return value.toLocaleString("es-PY");
}

function mapLineStatusLabel(status: OrderLine["status"]) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "FINALIZED":
      return "Finalizado";
    case "PAID":
      return "Pagado";
    default:
      return status;
  }
}

function mapPayMethodLabel(method: OrderLine["payMethod"]) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "TRANSFER":
      return "Transferencia bancaria";
    case "TC":
      return "Tarjeta de crédito";
    case "TD":
      return "Tarjeta de débito";
    case "QR":
      return "Pago por QR";
    default:
      return method;
  }
}

export default function OrderLinesCard({
  initialLines,
  status,
  deliveryCostGs,
  splitStrategy,
  bankDetails,
  slug,
}: OrderLinesCardProps) {
  const [lines, setLines] = useState(initialLines);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // const [remindingId, setRemindingId] = useState<string | null>(null);

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

  // const handleSendReminder = (id: string) => {
  //   setRemindingId(id);
  //   startTransition(async () => {
  //     try {
  //       const res = await fetch(`/api/admincito/order-lines/${id}/reminder`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ bankDetailsOverride: bankDetails }),
  //       });

  //       if (!res.ok) {
  //         const err = await res.json().catch(() => ({}));
  //         console.error("Error al enviar recordatorio", err);
  //         alert(err.error || "No se pudo enviar el recordatorio");
  //         return;
  //       }

  //       alert("Recordatorio de pago enviado por WhatsApp ✅");
  //     } catch (err) {
  //       console.error("Error en la petición", err);
  //       alert("Error inesperado enviando el recordatorio");
  //     } finally {
  //       setRemindingId(null);
  //     }
  //   });
  // };

  return (
    <div className="space-y-3 md:hidden">
      {/* Podés mostrar un resumen también acá */}
      {status === "OPEN" && (
        <p className="text-sumo-xs text-sumo-muted mb-2">
          Totales estimados · Subtotal:{" "}
          {preview.sumSubtotal.toLocaleString("es-PY")} Gs · Delivery:{" "}
          {preview.sumEstimatedDelivery.toLocaleString("es-PY")} Gs · Total:{" "}
          {preview.sumEstimatedTotal.toLocaleString("es-PY")} Gs
        </p>
      )}

      {lines.length === 0 && (
        <p className="py-4 text-center text-sumo-muted italic text-sm">
          No hay ítems cargados en este pedido todavía.
        </p>
      )}

      {lines.map((line) => {
        const paymentLabel = mapLineStatusLabel(line.status);

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
          (status === "DELIVERED" || status === "CLOSED") &&
          line.status === "PENDING";

        const payMethodLabel = mapPayMethodLabel(line.payMethod);

        return (
          <div
            key={line.id}
            className="rounded-lg border border-sumo-soft bg-sumo-muted px-3 py-3 shadow-lg flex flex-col gap-2"
          >
            {/* Header: nombre + estado */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sumo-sm font-bold text-sumo-primary">
                  {line.name}
                </p>
                <p className="text-sumo-xs">
                  {line.itemName} {line.note ? ` (${line.note})` : ""}
                </p>
              </div>
              <span className={`table-sumo-status-pill ${statusPillClass}`}>
                {payMethodLabel}: {paymentLabel}
              </span>
            </div>

            {/* Montos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sumo-xs mt-1">
              <div className="flex justify-between col-span-2">
                <span className="text-sumo-secondary">Subtotal</span>
                <span className="font-medium text-sumo-secondary">
                  {formatGs(line.subtotalGs)} Gs
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-sumo-secondary">
                  Delivery
                  {status === "OPEN" && " (estimado)"}
                </span>
                <span className="font-medium text-sumo-secondary">
                  {formatGs(deliveryToShow)} Gs
                </span>
              </div>
              <div className="flex justify-between col-span-2 text-sumo-primary">
                <span className="font-bold">
                  Total
                  {status === "OPEN" && " (estimado)"}
                </span>
                <span className="font-bold">{formatGs(totalToShow)} Gs</span>
              </div>
            </div>

            {/* Acciones (solo cerrada/entregada) */}
            <div className="flex flex-row space-x-2">
              {line.status === "PENDING" && (
                <div className="flex flex-col items-center gap-1">
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
                </div>
              )}
              {canSendReminder && (
                <div className="flex flex-col items-center gap-1">
                  <a
                    href={buildWhatsAppReminderMessage(line, slug, bankDetails)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-sumo-secondary text-[11px] px-3 py-1"
                  >
                    Enviar recordatorio
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// <button
//   type="button"
//   onClick={() => handleSendReminder(line.id)}
//   disabled={isPending && remindingId === line.id}
//   className="btn-sumo-secondary text-[11px] px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   {isPending && remindingId === line.id
//     ? "Enviando..."
//     : "Recordatorio de pago"}
// </button>
