// app/page.tsx
import { prisma } from "@/lib/db";
import "./main.css";
import type { GroupOrder, Menu } from "@prisma/client";
import Image from "next/image";
import NameLogo from "@/../public/name-logo.png";

type GroupOrderWithMenu = GroupOrder & {
  menu: Menu;
};

function formatGs(value: number) {
  return value.toLocaleString("es-PY");
}

function formatDeadline(date: Date) {
  return date.toLocaleString("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function HomePage() {
  // Eventos activos (OPEN) solo informativos
  const activeOrders = (await prisma.groupOrder.findMany({
    where: { status: "OPEN" },
    include: { menu: true },
    orderBy: { createdAt: "desc" },
  })) as GroupOrderWithMenu[];

  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "";
  const contactWhatsAppUrl = contactPhone
    ? `https://wa.me/${contactPhone}?text=${encodeURIComponent(
        "Hola 👋, quiero saber más sobre SUMO para organizar pedidos grupales."
      )}`
    : "https://wa.me";

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {/* HERO / PRESENTACIÓN */}
        <section className="card-sumo">
          <div className="flex items-center">
            <Image src={NameLogo} alt="SUMO GO" width={80} height={80} />
            <h3>Sumo tu pedido, vos sumás el grupo.</h3>
          </div>
          {/* <p className="text-sumo-xs text-sumo-secondary uppercase tracking-wide">
            Sumo tu pedido, vos sumás el grupo.
          </p>
          <h1 className="font-brand font-extrabold text-sumo-primary text-sumo-3xl md:text-3xl">
            S<span className="text-sumo-highlight">UMO</span>
            <span className="font-medium text-sumo-secondary">
              : organizá pedidos grupales de forma rápida
            </span>
          </h1> */}
          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="flex-1 space-y-3">
              <p className="text-sumo-base text-sumo-secondary">
                Centralizá pedidos, calculá delivery y administrá pagos desde
                una sola pantalla. Tus clientes ven su pedido, el total a pagar
                y cómo avisar su transferencia en segundos.
              </p>
              {/* <ul className="mt-2 space-y-1 text-sumo-sm text-sumo-muted">
                <li>• Cada grupo tiene una URL pública simple de compartir.</li>
                <li>
                  • Calcula subtotales, delivery y total por persona
                  automáticamente.
                </li>
                <li>• El admin ve todo en un panel</li>
                <li>• El cliente consulta lo que necesita pagar.</li>
              </ul> */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={contactWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-sumo-secondary"
                >
                  Quiero probar SUMO
                </a>
                {/* <span className="text-sumo-xs text-sumo-muted">
                  Escribime por WhatsApp y te ayudo a implementarlo en tu
                  empresa.
                </span> */}
              </div>
            </div>

            {/* “Stats” / resumen a la derecha */}
            <div className="flex-1">
              <div className="card-sumo bg-sumo-muted space-y-3">
                <h2 className="card-sumo-title text-sumo-lg">
                  ¿Qué resuelve SUMO?
                </h2>
                <ul className="space-y-2 text-sumo-sm text-sumo-muted">
                  <li>
                    <span className="font-medium text-sumo-primary">
                      • Menos mensajes sueltos:
                    </span>{" "}
                    todos piden en un solo lugar.
                  </li>
                  <li>
                    <span className="font-medium text-sumo-primary">
                      • Cierre automático:
                    </span>{" "}
                    definís hora límite y el sistema se encarga.
                  </li>
                  <li>
                    <span className="font-medium text-sumo-primary">
                      • Pagos claros:
                    </span>{" "}
                    cada persona ve su total y cómo avisar el pago.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="card-sumo space-y-4">
          <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
            ¿Cómo funciona SUMO?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Paso 1 */}
            <div className="card-step card-step--1">
              <div className="card-step-inner space-y-2 text-white">
                <h2 className="font-brand text-sumo-lg min-h-[70px]">
                  <span className="text-4xl">1.</span> Creás el evento
                </h2>
                <p className="text-sumo-sm">
                  Cargás tu listado de ítems, definís el costo del delivery, la
                  hora límite y los datos de tu empresa y banco. SUMO genera la
                  URL pública del grupo.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="card-step card-step--2">
              <div className="card-step-inner space-y-2 text-white">
                <h2 className="font-brand text-sumo-lg min-h-[70px]">
                  <span className="text-4xl">2.</span> Cada persona hace su
                  pedido
                </h2>
                <p className="text-sumo-sm">
                  Tus clientes eligen su plato, cantidad, método de pago y dejan
                  su nombre y WhatsApp. El sistema calcula subtotales y
                  delivery.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="card-step card-step--3">
              <div className="card-step-inner space-y-2 text-white">
                <h2 className="font-brand text-sumo-lg min-h-[70px]">
                  <span className="text-4xl">3.</span> Cerrás y cobrás
                </h2>
                <p className="text-sumo-sm">
                  Cuando se cierra el pedido, SUMO muestra los datos bancarios y
                  botones de WhatsApp para que cada persona avise su
                  transferencia. El admin ve todo consolidado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PARA QUIÉN ES SUMO */}
        <section className="card-sumo space-y-4">
          <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
            ¿Para quién es SUMO?
          </h2>
          <p className="card-sumo-subtitle">
            Pensado para equipos que hacen pedidos grupales todo el tiempo y
            quieren dejar de sufrir con mensajes sueltos, errores de cálculo y
            confusiones de pago.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Equipos en oficina */}
            <div className="card-step card-step--office">
              <div className="card-step-inner space-y-2 text-white">
                <h3 className="font-brand text-sumo-lg flex items-center gap-2 min-h-[70px]">
                  <span>Equipos en oficina</span>
                </h3>
                <p className="text-sumo-sm">
                  Empresas, coworkings y áreas que hacen pedidos de almuerzo o
                  cena para varias personas. SUMO organiza quién pidió qué y
                  cuánto paga cada uno.
                </p>
              </div>
            </div>

            {/* Restaurantes y dark kitchens */}
            <div className="card-step card-step--restaurant">
              <div className="card-step-inner space-y-2 text-white">
                <h3 className="font-brand text-sumo-lg flex items-center gap-2 min-h-[70px]">
                  <span>Restaurantes y dark kitchens</span>
                </h3>
                <p className="text-sumo-sm">
                  Negocios de comida que reciben muchos pedidos de grupos
                  grandes: equipos, torneos, eventos, escuelas, etc. Menos caos
                  en WhatsApp, más claridad en cada pedido.
                </p>
              </div>
            </div>

            {/* Emprendedores y organizadores */}
            <div className="card-step card-step--organizer">
              <div className="card-step-inner space-y-2 text-white">
                <h3 className="font-brand text-sumo-lg flex items-center gap-2 min-h-[70px]">
                  <span>Emprendedores y organizadores</span>
                </h3>
                <p className="text-sumo-sm">
                  Personas que coordinan pedidos grupales para eventos,
                  comunidades, grupos de amigos o deportes y quieren tener todo
                  prolijo, trazable y fácil de cobrar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* EVENTOS ACTIVOS */}
        <section className="card-sumo space-y-4">
          <div className="card-sumo-header">
            <div>
              <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
                Eventos activos ahora mismo
              </h2>
              {/* <p className="card-sumo-subtitle">
                Ejemplo real de cómo se ven tus grupos cuando están abiertos.
              </p> */}
            </div>
            <span className="card-sumo-badge">
              {activeOrders.length} activo
              {activeOrders.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-sumo">
              <thead>
                <tr>
                  {/* <th>Slug</th> */}
                  <th>Orden</th>
                  <th>Deadline</th>
                  {/* <th className="text-right">Delivery (Gs)</th> */}
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sumo-muted italic"
                    >
                      No hay eventos activos en este momento. El próximo pedido
                      grupal puede ser el tuyo 😉
                    </td>
                  </tr>
                )}

                {activeOrders.map((order) => (
                  <tr key={order.id}>
                    {/* <td className="font-medium">
                      <span className="text-sumo-primary">
                        /order/{order.slug}
                      </span>
                    </td> */}
                    <td>{order.menu.title}</td>
                    <td className="text-sumo-sm text-sumo-muted">
                      {formatDeadline(order.deadlineTs)}
                    </td>
                    {/* <td className="text-right">
                      {formatGs(order.deliveryCostGs)}
                    </td> */}
                    <td className="text-center">
                      <span className="table-sumo-status-pill table-sumo-status-pending">
                        Abierta
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sumo-xs text-sumo-muted">
            * Esta sección es solo informativa. En tu implementación real, cada
            empresa tiene su propio panel y sus propios eventos.
          </p>
        </section>

        {/* CTA FINAL */}
        <section className="card-sumo flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
              ¿Querés SUMO en tu empresa?
            </h2>
            <p className="card-sumo-subtitle">
              Te ayudo a adaptar el sistema a tu negocio, con tu branding y tus
              formas de cobro.
            </p>
            <span className="text-sumo-xs text-sumo-muted">
              Coordinamos una demo y vemos si SUMO encaja con tu operación
              actual.
            </span>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <a
              href={contactWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-sumo-secondary"
            >
              Escribime por WhatsApp
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
