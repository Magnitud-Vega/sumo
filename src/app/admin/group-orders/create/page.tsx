// app/admin/group-orders/create/page.tsx
"use client";

import { useEffect, useState } from "react";

type Menu = { id: string; title: string };

const initialForm = {
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
};

export default function AdminCreateGroupPage() {
  const [menuId, setMenuId] = useState<string>("");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/debug/menus")
      .then(async (r) => {
        if (r.ok) setMenus(await r.json());
      })
      .catch(() => {});
  }, []);

  const canSubmit =
    !!menuId &&
    form.slug.trim().length > 0 &&
    form.deadlineTs.trim().length > 0 &&
    form.adminPin.trim().length > 0 &&
    form.companyName.trim().length > 0 &&
    form.companyWhatsapp.trim().length > 0 &&
    form.bankName.trim().length > 0 &&
    form.bankHolder.trim().length > 0 &&
    form.bankAccount.trim().length > 0 &&
    form.bankDoc.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      alert("Completá todos los campos requeridos.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admincito/group-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, menuId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al crear el evento");
        return;
      }
      alert("Evento creado. URL pública: /order/" + data.slug);
      setForm(initialForm);
      setMenuId("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + título */}
      <section className="card-sumo space-y-1">
        <p className="text-sumo-xs text-sumo-muted">Admin · Crear evento</p>
        <h1 className="card-sumo-title font-brand text-sumo-2xl">
          Crear nuevo pedido de grupo
        </h1>
        <p className="card-sumo-subtitle">
          Definí el menú, los límites del pedido y los datos de la empresa para
          que tus clientes puedan pagar de forma clara y rápida.
        </p>
      </section>

      {/* Formulario */}
      <section className="card-sumo space-y-6">
        {/* Configuración básica */}
        <div className="space-y-4">
          <h2 className="card-sumo-title text-sumo-lg">Configuración básica</h2>

          <div className="space-y-3">
            <label className="block">
              <span className="text-sumo-sm font-medium">Menú</span>
              <select
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={menuId}
                onChange={(e) => setMenuId(e.target.value)}
              >
                <option value="">Seleccioná un menú…</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sumo-xs text-sumo-muted">
                Tip: por ahora podés crear/editar menús con{" "}
                <code>npx prisma studio</code>.
              </p>
            </label>

            <label className="block">
              <span className="text-sumo-sm font-medium">Slug público</span>
              <input
                id="slug"
                name="slug"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                placeholder="martes-chill-cena"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.trim() })
                }
              />
              <p className="mt-1 text-sumo-xs text-sumo-muted">
                Este identificador se usa en la URL pública:{" "}
                <code>/order/&lt;slug&gt;</code>.
              </p>
            </label>

            <label className="block">
              <span className="text-sumo-sm font-medium">
                Deadline (YYYY-MM-DDTHH:mm)
              </span>
              <input
                id="deadlineTs"
                name="deadlineTs"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                placeholder="2025-10-22T13:30"
                value={form.deadlineTs}
                onChange={(e) =>
                  setForm({ ...form, deadlineTs: e.target.value })
                }
              />
              <p className="mt-1 text-sumo-xs text-sumo-muted">
                A esta hora se cierra automáticamente la recepción de pedidos.
              </p>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sumo-sm font-medium">Delivery (Gs)</span>
                <input
                  id="deliveryCostGs"
                  name="deliveryCostGs"
                  className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                  type="number"
                  value={form.deliveryCostGs}
                  onChange={(e) =>
                    setForm({ ...form, deliveryCostGs: +e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="text-sumo-sm font-medium">
                  Mínimo total (Gs)
                </span>
                <input
                  id="minTotalGs"
                  name="minTotalGs"
                  className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                  type="number"
                  value={form.minTotalGs}
                  onChange={(e) =>
                    setForm({ ...form, minTotalGs: +e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="text-sumo-sm font-medium">
                  Mínimo ítems (opcional)
                </span>
                <input
                  id="minItems"
                  name="minItems"
                  className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                  type="number"
                  value={form.minItems}
                  onChange={(e) =>
                    setForm({ ...form, minItems: +e.target.value })
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sumo-sm font-medium">Estrategia</span>
                <select
                  id="splitStrategy"
                  name="splitStrategy"
                  className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                  value={form.splitStrategy}
                  onChange={(e) =>
                    setForm({ ...form, splitStrategy: e.target.value })
                  }
                >
                  <option value="EVEN">
                    Repartir delivery en partes iguales
                  </option>
                  <option value="WEIGHTED">
                    Repartir según importe de cada pedido
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sumo-sm font-medium">Admin PIN</span>
                <input
                  id="adminPin"
                  name="adminPin"
                  className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm tracking-[0.2em]"
                  value={form.adminPin}
                  onChange={(e) =>
                    setForm({ ...form, adminPin: e.target.value.trim() })
                  }
                />
                <p className="mt-1 text-sumo-xs text-sumo-muted">
                  PIN requerido para cerrar el pedido desde el panel admin.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Datos de empresa y banco */}
        <div className="space-y-4">
          <h2 className="card-sumo-title text-sumo-lg">
            Datos de la empresa y del banco
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sumo-sm font-medium">
                Nombre de la empresa
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="Empresa S.A."
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sumo-sm font-medium">
                WhatsApp de la empresa
              </label>
              <input
                id="companyWhatsapp"
                name="companyWhatsapp"
                type="tel"
                required
                placeholder="595971234567"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.companyWhatsapp}
                onChange={(e) =>
                  setForm({ ...form, companyWhatsapp: e.target.value })
                }
              />
              <p className="mt-1 text-sumo-xs text-sumo-muted">
                Usá solo números, sin +, sin espacios. Ejemplo: 595971234567
              </p>
            </div>

            <div>
              <label className="block text-sumo-sm font-medium">Banco</label>
              <input
                id="bankName"
                name="bankName"
                type="text"
                required
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sumo-sm font-medium">Titular</label>
              <input
                id="bankHolder"
                name="bankHolder"
                type="text"
                required
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.bankHolder}
                onChange={(e) =>
                  setForm({ ...form, bankHolder: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sumo-sm font-medium">
                Cuenta / Alias
              </label>
              <input
                id="bankAccount"
                name="bankAccount"
                type="text"
                required
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.bankAccount}
                onChange={(e) =>
                  setForm({ ...form, bankAccount: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sumo-sm font-medium">RUC o CI</label>
              <input
                id="bankDoc"
                name="bankDoc"
                type="text"
                required
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={form.bankDoc}
                onChange={(e) => setForm({ ...form, bankDoc: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || creating}
            className="btn-sumo disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? "Creando evento..." : "Crear evento"}
          </button>
        </div>
      </section>

      <p className="text-sumo-xs text-sumo-muted">
        Tip: hoy podés gestionar los menús con{" "}
        <code className="font-mono">npx prisma studio</code>. Más adelante podés
        sumar un CRUD visual para los menús.
      </p>
    </div>
  );
}
