"use client";

import { useEffect, useState } from "react";

type Menu = { id: string; title: string };
type Item = { id: string; name: string; priceGs: number };

export default function AdminPage() {
  const [menuId, setMenuId] = useState<string>("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [form, setForm] = useState({
    slug: "",
    deadlineTs: "",
    deliveryCostGs: 0,
    minTotalGs: 0,
    minItems: 0,
    splitStrategy: "EVEN",
    adminPin: "",
  });

  useEffect(() => {
    // pequeña utilidad para listar menús (haz un endpoint o usa Prisma en server actions si prefieres)
    // Para el MVP, puedes crear el menú en DB con prisma studio: npx prisma studio
    fetch("/api/debug/menus")
      .then(async (r) => {
        if (r.ok) setMenus(await r.json());
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin · Crear evento</h1>

      <div className="space-y-3">
        <label className="block">
          <span>Menú</span>
          <select
            className="border p-2 w-full"
            value={menuId}
            onChange={(e) => setMenuId(e.target.value)}
          >
            <option value="">-- Selecciona --</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span>Slug público</span>
          <input
            className="border p-2 w-full"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>

        <label className="block">
          <span>Deadline (YYYY-MM-DDTHH:mm)</span>
          <input
            className="border p-2 w-full"
            placeholder="2025-10-22T13:30"
            value={form.deadlineTs}
            onChange={(e) => setForm({ ...form, deadlineTs: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span>Delivery (Gs)</span>
            <input
              className="border p-2 w-full"
              type="number"
              value={form.deliveryCostGs}
              onChange={(e) =>
                setForm({ ...form, deliveryCostGs: +e.target.value })
              }
            />
          </label>
          <label className="block">
            <span>Mínimo total (Gs)</span>
            <input
              className="border p-2 w-full"
              type="number"
              value={form.minTotalGs}
              onChange={(e) =>
                setForm({ ...form, minTotalGs: +e.target.value })
              }
            />
          </label>
          <label className="block">
            <span>Mínimo ítems</span>
            <input
              className="border p-2 w-full"
              type="number"
              value={form.minItems}
              onChange={(e) => setForm({ ...form, minItems: +e.target.value })}
            />
          </label>
        </div>

        <label className="block">
          <span>Estrategia</span>
          <select
            className="border p-2 w-full"
            value={form.splitStrategy}
            onChange={(e) =>
              setForm({ ...form, splitStrategy: e.target.value })
            }
          >
            <option value="EVEN">EVEN</option>
            <option value="WEIGHTED">WEIGHTED</option>
          </select>
        </label>

        <label className="block">
          <span>Admin PIN</span>
          <input
            className="border p-2 w-full"
            value={form.adminPin}
            onChange={(e) => setForm({ ...form, adminPin: e.target.value })}
          />
        </label>

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={async () => {
            if (!menuId) return alert("Selecciona un menú");
            const res = await fetch("/api/admin/group-orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, menuId }),
            });
            const data = await res.json();
            if (!res.ok) return alert(data.error || "Error");
            alert("Evento creado. URL pública: /go/" + data.slug);
          }}
        >
          Crear evento
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Tip: crear/editar menús con <code>npx prisma studio</code> hoy, y mañana
        añadimos UI CRUD.
      </p>
    </div>
  );
}
