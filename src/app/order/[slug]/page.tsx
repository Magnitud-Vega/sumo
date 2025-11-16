// app/order/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { GroupOrder, Menu, OrderLine } from "@prisma/client";
import BankInfoCard from "./BankInfoCard";

type Status = GroupOrder["status"];

type GroupOrderWithRelations = GroupOrder & {
  menu: Menu;
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
      menu: true,
      lines: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    notFound();
  }

  const isClosedOrDelivered =
    order.status === "CLOSED" || order.status === "DELIVERED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* HEADER */}
      <section className="card-sumo space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="card-sumo-title font-brand text-sumo-2xl">
              Pedido de grupo: {order.slug.toUpperCase()}
            </h1>
            <p className="card-sumo-subtitle mt-1">
              Menú: <span className="font-medium">{order.menu.title}</span>
            </p>
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
            El pedido todavía está <strong>abierto</strong>. Una vez que la
            empresa cierre el pedido, vas a ver aquí las instrucciones para
            confirmar tu pago.
          </p>
        )}
      </section>

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
          Detalle de tu pedido
        </h2>

        <div className="overflow-x-auto">
          <table className="table-sumo">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ítem del menú</th>
                <th className="text-right">Subtotal (Gs)</th>
                <th className="text-right">Delivery (Gs)</th>
                <th className="text-right">Total (Gs)</th>
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
                    No hay items cargados en este pedido.
                  </td>
                </tr>
              )}

              {order.lines.map((line) => {
                const paymentLabel = mapLineStatusLabel(line.status);
                const isPending = line.status === "PENDING";

                return (
                  <tr key={line.id}>
                    <td className="font-medium">{line.name}</td>
                    <td>{line.itemName}</td>
                    <td className="text-right">{formatGs(line.subtotalGs)}</td>
                    <td className="text-right">
                      {formatGs(line.deliveryShareGs)}
                    </td>
                    <td className="text-right">{formatGs(line.totalGs)}</td>
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
                        {/* CASH PENDING */}
                        {isPending && line.payMethod === "CASH" && (
                          <p className="text-sumo-xs text-sumo-muted">
                            Tu pago es en efectivo. El administrador confirmará
                            cuando lo reciba.
                          </p>
                        )}

                        {/* TRANSFER PENDING */}
                        {isPending && line.payMethod === "TRANSFER" && (
                          <div className="flex flex-col items-center gap-1">
                            <a
                              href={buildWhatsAppTransferMessage(
                                line,
                                order as GroupOrderWithRelations
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-sumo text-[11px] px-3 py-1"
                            >
                              Confirmar pago por WhatsApp
                            </a>
                            <p className="text-[10px] text-sumo-muted max-w-[180px]">
                              Después de transferir, tocá el botón para avisar y
                              adjuntar el comprobante desde WhatsApp.
                            </p>
                          </div>
                        )}

                        {/* OTROS CASOS */}
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
