// app/admin/group-orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type G = {
  id: string;
  slug: string;
  menu: string;
  status: "OPEN" | "CLOSED" | "DELIVERED" | "CANCELLED";
  deadlineTs: string;
  subtotal: number;
  items: number;
  total: number;
  deliveryCostGs: number;
};

function formatGs(value: number) {
  return value.toLocaleString("es-PY");
}

function mapStatusLabel(status: G["status"]) {
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

function statusClasses(status: G["status"]) {
  // Pills de estado para admin
  switch (status) {
    case "OPEN":
      return "bg-sumo-muted text-sumo-primary";
    case "CLOSED":
      return "bg-sumo-muted text-sumo-muted";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-sumo-muted text-sumo-muted";
  }
}

export default function AdminPage() {
  const [groups, setGroups] = useState<G[]>([]);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admincito/group-orders/list");
    if (res.ok) setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function closeNow(id: string) {
    setClosingId(id);
    try {
      const res = await fetch(`/api/admincito/group-orders/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPin: "1234" }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Error al cerrar el evento");
        return;
      }

      await load();
      alert("Evento cerrado y delivery calculado ✅");
    } finally {
      setClosingId(null);
    }
  }

  async function deliverNow(id: string) {
    if (
      !confirm(
        "¿Marcar este evento como ENTREGADO y enviar avisos por WhatsApp a todos?"
      )
    ) {
      return;
    }

    setDeliveringId(id);
    try {
      const res = await fetch(`/api/admincito/group-orders/${id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deliver:", data);
        alert(data.error || "Error al marcar como entregado");
        return;
      }

      await load();
      alert("Evento marcado como ENTREGADO y avisos enviados por WhatsApp ✅");
    } finally {
      setDeliveringId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER / INTRO */}
      <header className="card-sumo">
        <div className="card-sumo-header">
          <div>
            <h1 className="card-sumo-title font-brand">
              SUMO · Eventos de grupo
            </h1>
            <p className="card-sumo-subtitle">
              Gestioná tus pedidos grupales, cerrá eventos, marcá entregas y
              revisá los detalles de cada orden.
            </p>
          </div>

          {/* Agregar un botón para crear evento */}
          {/* <button className="btn-sumo text-xs md:text-sm">
            + Nuevo evento
          </button> */}
        </div>
      </header>

      {/* LISTA DE EVENTOS */}
      <section className="card-sumo space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-sumo-title font-brand text-sumo-xl">
            Eventos activos y cerrados
          </h2>
          <p className="card-sumo-subtitle">
            Total: {groups.length} evento{groups.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* DESKTOP: tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table-sumo">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Menú</th>
                <th className="text-center">Estado</th>
                <th>Deadline</th>
                <th className="text-center">Ítems</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Total</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const isClosing = closingId === g.id;
                const isDelivering = deliveringId === g.id;

                return (
                  <tr key={g.id}>
                    <td className="font-medium">{g.slug}</td>
                    <td>{g.menu}</td>
                    <td className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(
                          g.status
                        )}`}
                      >
                        {mapStatusLabel(g.status)}
                      </span>
                    </td>
                    <td className="text-sumo-sm text-sumo-muted">
                      {new Date(g.deadlineTs).toLocaleString("es-PY")}
                    </td>
                    <td className="text-center">{g.items}</td>
                    <td className="text-right">
                      {formatGs(g.subtotal)}{" "}
                      <span className="text-sumo-muted">Gs</span>
                    </td>
                    <td className="text-right">
                      {formatGs(g.total)}{" "}
                      <span className="text-sumo-muted">Gs</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* Estado OPEN → botón Cerrar ahora */}
                        {g.status === "OPEN" && (
                          <button
                            disabled={isClosing || isDelivering}
                            className="btn-sumo text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => closeNow(g.id)}
                          >
                            {isClosing ? "Cerrando..." : "Cerrar ahora"}
                          </button>
                        )}

                        {/* Estado CLOSED → botón Marcar entregado + avisar */}
                        {g.status === "CLOSED" && (
                          <button
                            disabled={isDelivering || isClosing}
                            className="btn-sumo text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => deliverNow(g.id)}
                          >
                            {isDelivering
                              ? "Enviando avisos..."
                              : "Marcar entregado y avisar"}
                          </button>
                        )}

                        {/* Estado DELIVERED → solo info */}
                        {/* {g.status === "DELIVERED" && (
                          <span className="text-sumo-xs text-emerald-700">
                            Entregado y notificado
                          </span>
                        )} */}

                        {/* Estado CANCELLED → solo info */}
                        {/* {g.status === "CANCELLED" && (
                          <span className="text-sumo-xs text-red-600">
                            Evento cancelado
                          </span>
                        )} */}

                        <Link
                          href={`/admin/group-orders/${g.id}`}
                          className="btn-sumo-ghost text-xs px-3 py-1"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {groups.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sumo-muted">
                    Sin eventos por el momento. Creá tu primer pedido grupal
                    para comenzar 🙌
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE: cards */}
        <div className="space-y-3 md:hidden">
          {groups.length === 0 && (
            <p className="py-4 text-center text-sumo-muted italic text-sm">
              Sin eventos por el momento. Creá tu primer pedido grupal para
              comenzar 🙌
            </p>
          )}

          {groups.map((g) => {
            const isClosing = closingId === g.id;
            const isDelivering = deliveringId === g.id;
            const deadline = new Date(g.deadlineTs).toLocaleString("es-PY");

            return (
              <div
                key={g.id}
                className="rounded-lg border border-sumo-soft bg-sumo-muted px-3 py-3 shadow-lg flex flex-col gap-2"
              >
                {/* Header: slug + estado */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sumo-sm font-bold text-sumo-primary">
                      {g.slug}
                    </p>
                    <p className="text-sumo-xs text-sumo-secondary">{g.menu}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses(
                      g.status
                    )}`}
                  >
                    {mapStatusLabel(g.status)}
                  </span>
                </div>

                {/* Meta info */}
                <div className="text-sumo-xs text-sumo-muted flex flex-col gap-1 mt-1">
                  <div className="flex justify-between">
                    <span>Deadline</span>
                    <span className="font-medium">{deadline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ítems</span>
                    <span className="font-medium">{g.items}</span>
                  </div>
                </div>

                {/* Totales */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sumo-xs mt-1">
                  <div className="flex justify-between col-span-2">
                    <span className="text-sumo-secondary">Subtotal</span>
                    <span className="font-medium text-sumo-secondary">
                      {formatGs(g.subtotal)} Gs
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-sumo-secondary">Delivery</span>
                    <span className="font-medium text-sumo-secondary">
                      {formatGs(g.deliveryCostGs)} Gs
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2 text-sumo-primary">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">{formatGs(g.total)} Gs</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.status === "OPEN" && (
                    <button
                      disabled={isClosing || isDelivering}
                      className="btn-sumo text-[11px] px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => closeNow(g.id)}
                    >
                      {isClosing ? "Cerrando..." : "Cerrar ahora"}
                    </button>
                  )}

                  {g.status === "CLOSED" && (
                    <button
                      disabled={isDelivering || isClosing}
                      className="btn-sumo text-[11px] px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => deliverNow(g.id)}
                    >
                      {isDelivering
                        ? "Enviando avisos..."
                        : "Marcar entregado y avisar"}
                    </button>
                  )}

                  {/* {g.status === "DELIVERED" && (
                    <span className="text-[11px] text-emerald-700">
                      Entregado y notificado
                    </span>
                  )} */}

                  {/* {g.status === "CANCELLED" && (
                    <span className="text-[11px] text-red-600">
                      Evento cancelado
                    </span>
                  )} */}

                  <Link
                    href={`/admin/group-orders/${g.id}`}
                    className="btn-sumo text-[11px] px-3 py-1"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
