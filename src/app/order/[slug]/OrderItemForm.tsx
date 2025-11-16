// app/order/OrderItemForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; name: string; priceGs: number };

export default function ItemForm({
  groupSlug,
  items,
}: {
  groupSlug: string;
  items: Item[];
}) {
  const router = useRouter();
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!itemId || !name.trim() || !whatsapp.trim()) {
      alert("Completá el ítem, tu nombre y tu WhatsApp.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/group-orders/${groupSlug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          qty,
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          payMethod,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al registrar el pedido");
        return;
      }
      // Reset básico
      setItemId("");
      setQty(1);
      setNote("");
      // Refresca la página para traer los nuevos items
      router.refresh();
      alert("Pedido registrado. ¡Gracias! 🙌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-sumo space-y-4">
      <div className="card-sumo-header">
        <div>
          <h2 className="card-sumo-title font-brand text-sumo-xl">
            Sumá tu pedido
          </h2>
          <p className="card-sumo-subtitle">
            Elegí tu comida, completá tus datos y confirmá. El organizador se
            encarga del resto.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sumo-sm font-medium">Comida</span>
          <select
            className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Elegí una opción…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.priceGs.toLocaleString("es-PY")} Gs
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sumo-sm font-medium">Cantidad</span>
            <input
              id="qty"
              name="qty"
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              value={qty}
              onChange={(e) => setQty(Math.max(1, +e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-sumo-sm font-medium">Método de pago</span>
            <select
              id="payMethod"
              name="payMethod"
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="CASH">Efectivo</option>
              <option value="QR">QR</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="TC">Tarjeta Crédito</option>
              <option value="TD">Tarjeta Débito</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sumo-sm font-medium">Tu nombre</span>
            <input
              id="name"
              name="name"
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sumo-sm font-medium">WhatsApp</span>
            <input
              id="whatsapp"
              name="whatsapp"
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              placeholder="5959XXXXXXX"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <p className="mt-1 text-sumo-xs text-sumo-muted">
              Usá solo números para que podamos contactarte si hay dudas.
            </p>
          </label>
        </div>

        <label className="block">
          <span className="text-sumo-sm font-medium">Observación</span>
          <input
            id="note"
            name="note"
            className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sin mayonesa, sin picante, etc."
          />
        </label>

        <div className="flex justify-end pt-2">
          <button
            className="btn-sumo disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
