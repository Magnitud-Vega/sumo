// app/order/[slug]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { GroupOrder, Menu, OrderLine, MenuItem } from "@prisma/client";
import BankInfoCard from "./BankInfoCard";
import ItemForm from "./OrderItemForm";
import { computeDeliveryPreview } from "@/lib/order-preview";
import Image from "next/image";
import NameLogo from "@/../public/name-logo.png";

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

function formatGs(value: number) {
  return value.toLocaleString("es-PY");
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

function buildWhatsAppTransferMessage(
  line: OrderLine,
  order: GroupOrderWithRelations
) {
  const phone = normalizePhone(order.companyWhatsapp);
  const text = `Hola 👋, soy ${line.name}.
Quiero avisar el pago por TRANSFERENCIA de mi pedido.

Datos de la orden:
- Orden: ${order.slug}
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
            orderBy: { name: "asc" },
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
          <div className="flex items-center">
            <Image src={NameLogo} alt="SUMO GO" width={80} height={80} />
            <h1 className="card-sumo-title font-brand text-sumo-2xl text-sumo-primary">
              {order.menu.title}
            </h1>
          </div>
          <p className="text-sumo-md text-sumo-danger">
            {/* Orden de grupo · {order.slug.toUpperCase()} */}
            🎁🍰 Hoy cenamos por el cumple de Jessy 🎉🎂🎈🥳
          </p>
          <div className="flex flex-col items-start md:items-end gap-1">
            <span
              className={`inline-flex items-center table-sumo-status-pill ${
                order.status === "OPEN"
                  ? "table-sumo-status-done"
                  : "table-sumo-status-pending"
              } text-lg`}
            >
              Orden: {mapStatusLabel(order.status)}
            </span>
            <span className="text-sumo-xs text-sumo-muted">
              Código del pedido: {order.slug.toUpperCase()}
            </span>
          </div>
        </div>

        {/* TODO: ver que puede ir aquí */}
        {/* {order.status === "OPEN" && (
          <p className="text-sumo-sm text-sumo-secondary">
            Sumá tu pedido y elegí el método de pago.
          </p>
        )}

        {isClosedOrDelivered && (
          <p className="text-sumo-sm text-sumo-secondary">
            Hacé tu pago y avisá al restaurante de tu pago.
          </p>
        )} */}
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
        <div className="card-sumo-header">
          <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
            Lista de pedidos
          </h2>

          {/* Podés mostrar también totales estimados si está OPEN */}
          {order.status === "OPEN" && (
            <p className="text-sumo-sm text-sumo-secondary">
              <span className="table-sumo-status-pill table-sumo-status-info">
                Subtotal general: <b>{formatGs(preview.sumSubtotal)}</b> Gs
              </span>
              <span className="table-sumo-status-pill table-sumo-status-info">
                Delivery por persona:{" "}
                <b>{formatGs(preview.sumEstimatedDelivery)}</b> Gs
              </span>
              <span className="table-sumo-status-pill table-sumo-status-info">
                Total general: <b>{formatGs(preview.sumEstimatedTotal)}</b> Gs
              </span>
              <br />
              <span className="text-sumo-xs text-sumo-muted">
                Mientras la orden este abierta los montos son estimativos.
              </span>
            </p>
          )}
        </div>

        {/* DESKTOP: table */}
        <div className="hidden md:block overflow-x-auto">
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

                const payMethodLabel = mapPayMethodLabel(line.payMethod);

                return (
                  <tr key={line.id}>
                    <td className="font-medium">{line.name}</td>
                    <td>
                      {line.itemName}{" "}
                      <span className="text-sumo-secondary">
                        {line.note ? ` (${line.note})` : ""}
                      </span>
                    </td>
                    <td className="text-right">{formatGs(line.subtotalGs)}</td>
                    <td className="text-right">{formatGs(deliveryToShow)}</td>
                    <td className="text-right">{formatGs(totalToShow)}</td>
                    <td className="text-center">
                      <span
                        className={`table-sumo-status-pill ${
                          line.status === "PAID"
                            ? "table-sumo-status-done"
                            : "table-sumo-status-pending"
                        }`}
                      >
                        {payMethodLabel}: {paymentLabel}
                      </span>
                    </td>

                    {isClosedOrDelivered && (
                      <td className="text-center">
                        {isPending && line.payMethod === "CASH" && (
                          <p className="text-sumo-xs text-sumo-muted">
                            El administrador confirmará tu pago en breve.
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
                              Avisá de tu pago y enviá tu comprobante por
                              WhatsApp.
                            </p>
                          </div>
                        )}

                        {/* {(!isPending ||
                          line.payMethod === "TC" ||
                          line.payMethod === "TD" ||
                          line.payMethod === "QR") &&
                          !(isPending && line.payMethod === "TRANSFER") &&
                          !(isPending && line.payMethod === "CASH") && (
                            <p className="text-sumo-xs text-sumo-muted">
                              No hay acciones disponibles.
                            </p>
                          )} */}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE: cards */}
        <div className="space-y-3 md:hidden">
          {order.lines.length === 0 && (
            <p className="py-4 text-center text-sumo-muted italic text-sm">
              No hay ítems cargados en este pedido todavía.
            </p>
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
                  <span
                    className={`table-sumo-status-pill ${
                      line.status === "PAID"
                        ? "table-sumo-status-done"
                        : "table-sumo-status-pending"
                    }`}
                  >
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
                      {order.status === "OPEN" && " (estimado)"}
                    </span>
                    <span className="font-medium text-sumo-secondary">
                      {formatGs(deliveryToShow)} Gs
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2 text-sumo-primary">
                    <span className="font-bold">
                      Total
                      {order.status === "OPEN" && " (estimado)"}
                    </span>
                    <span className="font-bold">
                      {formatGs(totalToShow)} Gs
                    </span>
                  </div>
                </div>

                {/* Pago */}
                {/* <div className="mt-1 flex justify-between items-center text-sumo-xs">
                  <span className="text-sumo-muted">Método de pago</span>
                  <span className="font-medium">{payMethodLabel}</span>
                </div> */}

                {/* Acciones (solo cerrada/entregada) */}
                {isClosedOrDelivered && (
                  <div className="mt-2">
                    {isPending && line.payMethod === "CASH" && (
                      <p className="text-[11px] text-sumo-muted">
                        El administrador confirmará tu pago en breve.
                      </p>
                    )}

                    {isPending && line.payMethod === "TRANSFER" && (
                      <div className="flex flex-col items-start gap-1">
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
                        <p className="text-[10px] text-sumo-muted">
                          Avisá de tu pago y enviá tu comprobante por WhatsApp.
                        </p>
                      </div>
                    )}

                    {/* {(!isPending ||
                      line.payMethod === "TC" ||
                      line.payMethod === "TD" ||
                      line.payMethod === "QR") &&
                      !(isPending && line.payMethod === "TRANSFER") &&
                      !(isPending && line.payMethod === "CASH") && (
                        <p className="text-[11px] text-sumo-muted">
                          No hay acciones disponibles.
                        </p>
                      )} */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
