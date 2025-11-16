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

export default function AdminPage() {
  // ... (tu UI de crear evento ya existente)

  const [groups, setGroups] = useState<G[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admincito/group-orders/list");
    if (res.ok) setGroups(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function closeNow(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admincito/group-orders/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPin: "1234" }), // si lo validas
    });
    setLoading(false);
    if (!res.ok) {
      const e = await res.json();
      alert(e.error || "Error al cerrar");
    } else {
      await load();
      alert("Evento cerrado/calculado");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* ... BLOQUE CREAR EVENTO ... */}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Eventos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Slug</th>
                <th className="p-2 text-left">Menú</th>
                <th className="p-2">Status</th>
                <th className="p-2">Deadline</th>
                <th className="p-2">Ítems</th>
                <th className="p-2">Subtotal</th>
                <th className="p-2">Total</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-2">{g.slug}</td>
                  <td className="p-2">{g.menu}</td>
                  <td className="p-2 text-center">{g.status}</td>
                  <td className="p-2">
                    {new Date(g.deadlineTs).toLocaleString("es-PY")}
                  </td>
                  <td className="p-2 text-center">{g.items}</td>
                  <td className="p-2 text-right">
                    {g.subtotal.toLocaleString()} Gs
                  </td>
                  <td className="p-2 text-right">
                    {g.total.toLocaleString()} Gs
                  </td>
                  <td className="p-2">
                    {g.status === "OPEN" ? (
                      <button
                        disabled={loading}
                        className="px-3 py-1 rounded bg-black text-white"
                        onClick={() => closeNow(g.id)}
                      >
                        {loading ? "Cerrando..." : "Cerrar ahora"}
                      </button>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                    <Link
                      href={`/admin/group-orders/${g.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    Sin eventos
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
