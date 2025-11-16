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
    companyName: "",
    companyWhatsapp: "",
    bankName: "",
    bankHolder: "",
    bankAccount: "",
    bankDoc: "",
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
            id="slug"
            name="slug"
            className="border p-2 w-full"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>

        <label className="block">
          <span>Deadline (YYYY-MM-DDTHH:mm)</span>
          <input
            id="deadlineTs"
            name="deadlineTs"
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
              id="deliveryCostGs"
              name="deliveryCostGs"
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
              id="minTotalGs"
              name="minTotalGs"
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
              id="minItems"
              name="minItems"
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
            id="splitStrategy"
            name="splitStrategy"
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
            id="adminPin"
            name="adminPin"
            className="border p-2 w-full"
            value={form.adminPin}
            onChange={(e) => setForm({ ...form, adminPin: e.target.value })}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Nombre de la empresa
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              placeholder="Empresa S.A."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Usá solo números, sin +, sin espacios. Ejemplo: 595971234567
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">
              WhatsApp de la empresa
            </label>
            <input
              id="companyWhatsapp"
              name="companyWhatsapp"
              type="tel"
              required
              placeholder="5959XXXXXXX"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.companyWhatsapp}
              onChange={(e) =>
                setForm({ ...form, companyWhatsapp: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Usá solo números, sin +, sin espacios. Ejemplo: 595971234567
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Banco</label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Titular</label>
            <input
              id="bankHolder"
              name="bankHolder"
              type="text"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.bankHolder}
              onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Cuenta / Alias</label>
            <input
              id="bankAccount"
              name="bankAccount"
              type="text"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.bankAccount}
              onChange={(e) =>
                setForm({ ...form, bankAccount: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium">RUC o CI</label>
            <input
              id="bankDoc"
              name="bankDoc"
              type="text"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.bankDoc}
              onChange={(e) => setForm({ ...form, bankDoc: e.target.value })}
            />
          </div>
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={async () => {
            if (!menuId) return alert("Selecciona un menú");
            const res = await fetch("/api/admincito/group-orders", {
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
