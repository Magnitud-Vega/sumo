// app/order/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { GroupOrder, Menu, OrderLine, MenuItem } from "@prisma/client";
import BankInfoCard from "./BankInfoCard";
import ItemForm from "./OrderItemForm";
import { computeDeliveryPreview } from "@/lib/order-preview";

type Status = GroupOrder["status"];

type GroupOrderWithRelations = GroupOrder & {
  menu: Menu & { items: MenuItem[] };
  lines: OrderLine[];
};

function mapStatusLabel(status: Status) {
  switch (status) {
    case "OPEN":
      return "Abierta";
    case "CLOSED":
      return "Cerrada";
    case "DELIVERED":
      return "Entregada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
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

function formatGs(value: number) {
  return value.toLocaleString("es-PY");
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function buildWhatsAppTransferMessage(
  line: OrderLine,
  order: GroupOrderWithRelations
) {
  const phone = normalizePhone(order.companyWhatsapp);
  const text = `Hola 👋, soy ${line.name}.
Quiero avisar el pago por TRANSFERENCIA de mi pedido.

Datos del pedido:
- Pedido: ${order.slug}
- Ítem: ${line.itemName}
- Monto total: ${formatGs(line.totalGs)} Gs.
- Método de pago: Transferencia bancaria.

Adjunto el comprobante de la transferencia.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

interface OrderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { slug } = await params;

  const order = await prisma.groupOrder.findUnique({
    where: { slug },
    include: {
      menu: {
        include: {
          items: {
            where: { isActive: true },
            orderBy: { name: "asc" }, // opcional pero recomendable
          },
        },
      },
      lines: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  const isClosedOrDelivered =
    order.status === "CLOSED" || order.status === "DELIVERED";

  // calculamos el preview para TODAS las líneas
  const preview = computeDeliveryPreview(order, order.lines);
  // Para lookup rápido por id
  const previewById = Object.fromEntries(preview.lines.map((l) => [l.id, l]));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* HEADER */}
      <section className="card-sumo space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sumo-xs text-sumo-muted">
              Pedido de grupo · {order.slug.toUpperCase()}
            </p>
            <h1 className="card-sumo-title font-brand text-sumo-2xl">
              {order.menu.title}
            </h1>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-sumo-xs text-sumo-muted">
              Organizado por la empresa
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-sumo-muted text-sumo-primary">
              Estado: {mapStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {order.status === "OPEN" && (
          <p className="text-sumo-sm text-sumo-muted">
            El pedido todavía está <strong>abierto</strong>. Podés sumar tu
            pedido y elegir cómo vas a pagar. Una vez que se cierre, vas a ver
            aquí las instrucciones para confirmar tu pago.
          </p>
        )}
      </section>

      {/* FORM PARA SUMAR ITEMS (solo cuando está abierto) */}
      {order.status === "OPEN" && order.menu.items.length > 0 && (
        <ItemForm groupSlug={order.slug} items={order.menu.items} />
      )}

      {/* DATOS BANCARIOS (solo cerrada/entregada) */}
      {isClosedOrDelivered && (
        <BankInfoCard
          slug={order.slug}
          bankName={order.bankName}
          bankHolder={order.bankHolder}
          bankAccount={order.bankAccount}
          bankDoc={order.bankDoc}
        />
      )}

      {/* DETALLE DE ITEMS */}
      <section className="card-sumo space-y-3">
        <h2 className="card-sumo-title font-brand text-sumo-xl">
          Detalle de pedidos
        </h2>

        {/* Podés mostrar también totales estimados si está OPEN */}
        {order.status === "OPEN" && (
          <p className="text-sumo-xs text-sumo-muted">
            Los montos de delivery y total son <strong>estimados</strong> y
            pueden cambiar hasta el cierre del pedido.
            <br />
            Subtotal actual: {formatGs(preview.sumSubtotal)} Gs · Delivery
            estimado: {formatGs(preview.sumEstimatedDelivery)} Gs · Total
            estimado: {formatGs(preview.sumEstimatedTotal)} Gs
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="table-sumo">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ítem del menú</th>
                <th className="text-right">Subtotal (Gs)</th>
                <th className="text-right">
                  Delivery {order.status === "OPEN" && " (estimado)"} (Gs)
                </th>
                <th className="text-right">
                  Total {order.status === "OPEN" && " (estimado)"} (Gs)
                </th>
                <th className="text-center">Pago</th>
                {isClosedOrDelivered && (
                  <th className="text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.lines.length === 0 && (
                <tr>
                  <td
                    colSpan={isClosedOrDelivered ? 7 : 6}
                    className="py-6 text-center text-sumo-muted italic"
                  >
                    No hay ítems cargados en este pedido todavía.
                  </td>
                </tr>
              )}

              {order.lines.map((line) => {
                const previewLine = previewById[line.id];
                const paymentLabel = mapLineStatusLabel(line.status);
                const isPending = line.status === "PENDING";

                const deliveryToShow =
                  order.status === "OPEN"
                    ? previewLine.estimatedDeliveryShareGs
                    : line.deliveryShareGs;

                const totalToShow =
                  order.status === "OPEN"
                    ? previewLine.estimatedTotalGs
                    : line.totalGs;

                return (
                  <tr key={line.id}>
                    <td className="font-medium">{line.name}</td>
                    <td>{line.itemName}</td>
                    <td className="text-right">{formatGs(line.subtotalGs)}</td>
                    <td className="text-right">{formatGs(deliveryToShow)}</td>
                    <td className="text-right">{formatGs(totalToShow)}</td>
                    <td className="text-center">
                      <span
                        className={`table-sumo-status-pill ${
                          line.status === "PAID"
                            ? "table-sumo-status-paid"
                            : "table-sumo-status-pending"
                        }`}
                      >
                        {paymentLabel}
                      </span>
                    </td>

                    {isClosedOrDelivered && (
                      <td className="text-center">
                        {isPending && line.payMethod === "CASH" && (
                          <p className="text-sumo-xs text-sumo-muted">
                            Pago en efectivo. El administrador confirmará cuando
                            lo reciba.
                          </p>
                        )}

                        {isPending && line.payMethod === "TRANSFER" && (
                          <div className="flex flex-col items-center gap-1">
                            <a
                              href={buildWhatsAppTransferMessage(
                                line,
                                order as GroupOrderWithRelations
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-sumo-secondary text-[11px] px-3 py-1"
                            >
                              Confirmar pago por WhatsApp
                            </a>
                            <p className="text-[10px] text-sumo-muted max-w-[200px]">
                              Después de transferir, tocá el botón para avisar y
                              adjuntar el comprobante desde WhatsApp.
                            </p>
                          </div>
                        )}

                        {(!isPending ||
                          line.payMethod === "TC" ||
                          line.payMethod === "TD" ||
                          line.payMethod === "QR") &&
                          !(isPending && line.payMethod === "TRANSFER") &&
                          !(isPending && line.payMethod === "CASH") && (
                            <p className="text-sumo-xs text-sumo-muted">
                              No hay acciones disponibles.
                            </p>
                          )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
