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
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admincito/group-orders/list");
    if (res.ok) setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function closeNow(id: string) {
    setLoading(true);
    setClosingId(id);
    const res = await fetch(`/api/admincito/group-orders/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPin: "1234" }),
    });
    setLoading(false);
    setClosingId(null);

    if (!res.ok) {
      const e = await res.json();
      alert(e.error || "Error al cerrar");
    } else {
      await load();
      alert("Evento cerrado/calculado");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER / INTRO */}
      <header className="card-sumo">
        <div className="card-sumo-header">
          <div>
            <h1 className="card-sumo-title font-brand">
              SUMO · Eventos de grupo
            </h1>
            <p className="card-sumo-subtitle">
              Gestioná tus pedidos grupales, cerrá eventos y revisá los detalles
              de cada orden.
            </p>
          </div>

          {/* Aquí podrías agregar un botón para crear evento, si lo tenés */}
          {/* <button className="btn-sumo text-xs md:text-sm">
            + Nuevo evento
          </button> */}
        </div>

        {/* Si tenés tu UI de crear evento, la podés envolver en un div así: */}
        {/* <div className="mt-4">
          ... UI CREAR EVENTO ...
        </div> */}
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

        <div className="overflow-x-auto">
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
              {groups.map((g) => (
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
                      {g.status === "OPEN" && (
                        <button
                          disabled={loading && closingId === g.id}
                          className="btn-sumo text-xs px-3 py-1"
                          onClick={() => closeNow(g.id)}
                        >
                          {loading && closingId === g.id
                            ? "Cerrando..."
                            : "Cerrar ahora"}
                        </button>
                      )}
                      {g.status !== "OPEN" && (
                        <span className="text-sumo-xs text-sumo-muted">
                          Cierre realizado
                        </span>
                      )}

                      <Link
                        href={`/admin/group-orders/${g.id}`}
                        className="btn-sumo-ghost text-xs px-3 py-1"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

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
      </section>
    </div>
  );
}
