// --- Client component para el formulario ---
"use client";
import { useState } from "react";

export default function ItemForm({
  groupSlug,
  items,
}: {
  groupSlug: string;
  items: any[];
}) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-3">
      <label className="block">
        <span>Comida</span>
        <select
          className="border p-2 w-full"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        >
          <option value="">-- elige --</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} — {i.priceGs.toLocaleString()} Gs
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span>Cantidad</span>
          <input
            id="qty"
            name="qty"
            type="number"
            min={1}
            className="border p-2 w-full"
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
          />
        </label>
        <label className="block">
          <span>Método de pago</span>
          <select
            id="payMethod"
            name="payMethod"
            className="border p-2 w-full"
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

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span>Tu nombre</span>
          <input
            id="name"
            name="name"
            className="border p-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span>WhatsApp</span>
          <input
            id="whatsapp"
            name="whatsapp"
            className="border p-2 w-full"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span>Observación</span>
        <input
          id="note"
          name="note"
          className="border p-2 w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sin mayonesa, etc."
        />
      </label>

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={async () => {
          if (!itemId || !name || !whatsapp) return alert("Completa los datos");
          const res = await fetch(`/api/group-orders/${groupSlug}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId,
              qty,
              name,
              whatsapp,
              payMethod,
              note,
            }),
          });
          const data = await res.json();
          if (!res.ok) return alert(data.error || "Error");
          alert("Pedido registrado. ¡Gracias!");
        }}
      >
        Confirmar pedido
      </button>
    </div>
  );
}
