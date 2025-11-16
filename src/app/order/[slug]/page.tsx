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

// Helpers de presentación
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

  // IMPORTANTE: usa solo números en COMPANY_WHATSAPP (sin +, sin espacios)
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header de la orden */}
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">
          Pedido de grupo: {order.slug.toUpperCase()}
        </h1>
        <p className="text-sm text-gray-600">
          Menú: <span className="font-medium">{order.menu.title}</span>
        </p>
        <p className="text-sm text-gray-600">
          Estado:{" "}
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100">
            {mapStatusLabel(order.status)}
          </span>
        </p>
      </section>

      {/* Si está cerrada o entregada, mostramos info bancaria */}
      {isClosedOrDelivered && (
        <BankInfoCard
          slug={order.slug}
          bankName={order.bankName}
          bankHolder={order.bankHolder}
          bankAccount={order.bankAccount}
          bankDoc={order.bankDoc}
        />
      )}

      {/* Tabla de items */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Detalle de tu pedido</h2>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Ítem del menú</th>
                <th className="px-3 py-2 text-right">Subtotal (Gs)</th>
                <th className="px-3 py-2 text-right">Delivery (Gs)</th>
                <th className="px-3 py-2 text-right">Total (Gs)</th>
                <th className="px-3 py-2 text-center">Pago</th>
                {isClosedOrDelivered && (
                  <th className="px-3 py-2 text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.lines.length === 0 && (
                <tr>
                  <td
                    colSpan={isClosedOrDelivered ? 7 : 6}
                    className="px-3 py-6 text-center text-gray-500 italic"
                  >
                    No hay items cargados en este pedido.
                  </td>
                </tr>
              )}

              {order.lines.map((line) => {
                const paymentLabel = mapLineStatusLabel(line.status);
                const isPending = line.status === "PENDING";

                return (
                  <tr key={line.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 align-top">{line.name}</td>
                    <td className="px-3 py-2 align-top">{line.itemName}</td>
                    <td className="px-3 py-2 text-right align-top">
                      {formatGs(line.subtotalGs)}
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      {formatGs(line.deliveryShareGs)}
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      {formatGs(line.totalGs)}
                    </td>
                    <td className="px-3 py-2 text-center align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          line.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {paymentLabel}
                      </span>
                    </td>

                    {isClosedOrDelivered && (
                      <td className="px-3 py-2 text-center align-top">
                        {/* Lógica de acciones según método de pago y estado */}
                        {isPending && line.payMethod === "CASH" && (
                          <p className="text-xs text-gray-500">
                            Tu pago se realizará en efectivo. El administrador
                            confirmará el pago después de recibirlo.
                          </p>
                        )}

                        {isPending && line.payMethod === "TRANSFER" && (
                          <div className="flex flex-col items-center gap-1">
                            {/* Opción 1: Confirmar pago por WhatsApp */}
                            <a
                              href={buildWhatsAppTransferMessage(
                                line,
                                order as GroupOrderWithRelations
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                            >
                              Confirmar pago por WhatsApp
                            </a>

                            {/* 
                              Opción 2 (avanzada): Subir comprobante
                              Aquí podrías agregar un formulario <form> con input file
                              que envíe el comprobante a tu backend y desde allí a
                              WhatsApp Cloud API. Lo dejo marcado como TODO.
                            */}
                            {/* 
                            <form
                              action="/api/order/payment-proof"
                              method="POST"
                              encType="multipart/form-data"
                              className="flex flex-col items-center gap-1"
                            >
                              <input type="hidden" name="orderLineId" value={line.id} />
                              <input
                                type="file"
                                name="proof"
                                accept="image/*"
                                className="text-[10px]"
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Enviar comprobante (beta)
                              </button>
                            </form>
                            */}
                            <p className="text-[10px] text-gray-500 max-w-[180px]">
                              Después de transferir, tocá el botón para
                              avisarnos y adjuntar el comprobante desde
                              WhatsApp.
                            </p>
                          </div>
                        )}

                        {/* Otros casos: sin acciones */}
                        {(!isPending ||
                          line.payMethod === "TC" ||
                          line.payMethod === "TD" ||
                          line.payMethod === "QR") &&
                          !(isPending && line.payMethod === "TRANSFER") &&
                          !(isPending && line.payMethod === "CASH") && (
                            <p className="text-xs text-gray-400">
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

        {/* Mensaje auxiliar según estado de la orden */}
        {order.status === "OPEN" && (
          <p className="text-xs text-gray-500">
            El pedido todavía está abierto. Una vez que el administrador cierre
            el pedido, verás aquí las instrucciones para confirmar tu pago.
          </p>
        )}
      </section>
    </div>
  );
}
