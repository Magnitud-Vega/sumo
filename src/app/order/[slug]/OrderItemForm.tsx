// app/order/OrderItemForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; name: string; priceGs: number };

type ToastType = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type FieldErrors = {
  itemId?: string;
  qty?: string;
  name?: string;
  whatsapp?: string;
};

export default function ItemForm({
  groupSlug,
  items,
}: {
  groupSlug: string;
  items: Item[];
}) {
  const router = useRouter();

  // Form state
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [payMethod, setPayMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Errores por campo
  const [errors, setErrors] = useState<FieldErrors>({});

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: ToastType = "info") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  // Normalizamos WhatsApp a solo dígitos para enviar al backend
  const normalizedWhatsapp = useMemo(
    () => whatsapp.replace(/\D/g, ""),
    [whatsapp]
  );

  // ---- Validadores por campo ----
  function validateItemId(value: string): string | undefined {
    if (!value) return "Elegí una opción de comida.";
    return undefined;
  }

  function validateQty(value: string): string | undefined {
    if (!value) return "Ingresá una cantidad.";
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) return "La cantidad mínima es 1.";
    if (n > 99) return "La cantidad máxima es 99 por pedido.";
    return undefined;
  }

  function validateName(value: string | null | undefined): string | undefined {
    if (!value) return "Escribí tu nombre.";
    if (typeof value !== "string") return "Escribí tu nombre.";
    const trimmed = value.trim();
    if (trimmed.length === 0) return "El nombre no puede estar vacío.";
    if (trimmed.length < 2) return "Tu nombre debe tener al menos 2 letras.";
    return undefined;
  }

  function validateWhatsapp(
    value: string,
    normalized: string
  ): string | undefined {
    if (!value.trim()) return "Ingresá tu WhatsApp.";
    if (normalized.length < 8)
      return "Ingresá un WhatsApp válido (mínimo 8 dígitos).";
    return undefined;
  }

  // ---- Handlers de cambio de campos (con validación onChange) ----
  function handleItemChange(value: string) {
    setItemId(value);
    setErrors((prev) => ({
      ...prev,
      itemId: validateItemId(value),
    }));
  }

  function handleQtyChange(value: string) {
    // Permitimos vacío mientras edita
    if (value === "") {
      setQty("");
      setErrors((prev) => ({
        ...prev,
        qty: "Ingresá una cantidad.",
      }));
      return;
    }

    // Solo dígitos
    if (!/^\d+$/.test(value)) {
      return;
    }

    let numeric = parseInt(value, 10);
    if (numeric < 1) numeric = 1;
    if (numeric > 99) numeric = 99;

    const next = String(numeric);
    setQty(next);
    setErrors((prev) => ({
      ...prev,
      qty: validateQty(next),
    }));
  }

  function handleNameChange(value: string) {
    setName(value);
    setErrors((prev) => ({
      ...prev,
      name: validateName(value),
    }));
  }

  function handleWhatsappChange(value: string) {
    const normalized = value.replace(/\D/g, "");
    setWhatsapp(value);
    setErrors((prev) => ({
      ...prev,
      whatsapp: validateWhatsapp(value, normalized),
    }));
  }

  // Botones +/-
  function incrementQty() {
    const current = parseInt(qty || "1", 10);
    const next = Math.min(current + 1, 99);
    const asString = String(next);
    setQty(asString);
    setErrors((prev) => ({
      ...prev,
      qty: validateQty(asString),
    }));
  }

  function decrementQty() {
    const current = parseInt(qty || "1", 10);
    const next = Math.max(current - 1, 1);
    const asString = String(next);
    setQty(asString);
    setErrors((prev) => ({
      ...prev,
      qty: validateQty(asString),
    }));
  }

  // Form válido si no hay errores y los campos requeridos tienen contenido razonable
  const isFormValid =
    !errors.itemId &&
    !errors.qty &&
    !errors.name &&
    !errors.whatsapp &&
    !!itemId &&
    !!qty &&
    validateName(name) === undefined &&
    normalizedWhatsapp.length >= 8;

  async function handleSubmit() {
    // Validación final antes de enviar
    const nextErrors: FieldErrors = {
      itemId: validateItemId(itemId),
      qty: validateQty(qty),
      name: validateName(name),
      whatsapp: validateWhatsapp(whatsapp, normalizedWhatsapp),
    };

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setErrors(nextErrors);
      showToast("Revisá los campos marcados en rojo.", "error");
      return;
    }

    const qtyNumber = Math.max(1, parseInt(qty || "1", 10));

    setLoading(true);
    try {
      const res = await fetch(`/api/group-orders/${groupSlug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          qty: qtyNumber,
          name: name.trim(),
          whatsapp: normalizedWhatsapp,
          payMethod,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(
          data.error || "Error al registrar el pedido. Probá de nuevo.",
          "error"
        );
        return;
      }

      // Reset parcial: mantenemos nombre/WhatsApp para facilitar pedidos múltiples
      setItemId("");
      setQty("1");
      setNote("");
      setErrors((prev) => ({
        ...prev,
        itemId: undefined,
        qty: undefined,
      }));

      router.refresh();
      showToast("Pedido registrado. ¡Gracias! 🙌", "success");
    } catch (error) {
      console.error("Error al registrar pedido:", error);
      showToast(
        "Hubo un problema de conexión. Volvé a intentar en unos segundos.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Si no hay ítems configurados, mostramos mensaje claro
  if (!items || items.length === 0) {
    return (
      <div className="card-sumo space-y-3">
        <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
          Sumá tu pedido
        </h2>
        <p className="card-sumo-subtitle">
          Todavía no hay opciones de menú configuradas para este pedido grupal.
          Avisá al organizador para que cargue los platos disponibles.
        </p>

        {/* Toast container */}
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <>
      <div className="card-sumo space-y-4">
        <div className="card-sumo-header">
          <div>
            <h2 className="card-sumo-title font-brand text-sumo-xl text-sumo-primary">
              Sumá tu pedido
            </h2>
            <p className="card-sumo-subtitle">
              Elegí tu comida, completá tus datos y confirmá. El organizador se
              encarga del resto.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Comida */}
          <label className="block" htmlFor="itemId">
            <span className="text-sumo-sm font-medium">Comida</span>
            <select
              id="itemId"
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              value={itemId}
              onChange={(e) => handleItemChange(e.target.value)}
            >
              <option value="">Elegí una opción…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {i.priceGs.toLocaleString("es-PY")} Gs
                </option>
              ))}
            </select>
            {errors.itemId && (
              <p className="mt-1 text-sumo-xs text-red-500">{errors.itemId}</p>
            )}
          </label>

          {/* Cantidad + método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block" htmlFor="qty">
                <span className="text-sumo-sm font-medium">Cantidad</span>
                <div className="mt-1 flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={decrementQty}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-sumo-soft bg-sumo-surface text-sumo-base font-semibold"
                  >
                    −
                  </button>
                  <input
                    id="qty"
                    name="qty"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    pattern="\d*"
                    className="h-10 flex-1 rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-center text-sumo-sm"
                    value={qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={incrementQty}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-sumo-soft bg-sumo-surface text-sumo-base font-semibold"
                  >
                    +
                  </button>
                </div>
              </label>
              {errors.qty && (
                <p className="mt-1 text-sumo-xs text-red-500">{errors.qty}</p>
              )}
              {!errors.qty && (
                <p className="mt-1 text-sumo-xs text-sumo-muted">
                  Mínimo 1 unidad. Podés agregar más pedidos después si
                  necesitás.
                </p>
              )}
            </div>

            <label className="block" htmlFor="payMethod">
              <span className="text-sumo-sm font-medium">Método de pago</span>
              <select
                id="payMethod"
                name="payMethod"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={payMethod}
                onChange={(e) =>
                  setPayMethod(e.target.value as "CASH" | "TRANSFER")
                }
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </label>
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block" htmlFor="name">
              <span className="text-sumo-sm font-medium">Tu nombre</span>
              <input
                id="name"
                name="name"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-sumo-xs text-red-500">{errors.name}</p>
              )}
            </label>

            <label className="block" htmlFor="whatsapp">
              <span className="text-sumo-sm font-medium">WhatsApp</span>
              <input
                id="whatsapp"
                name="whatsapp"
                className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
                placeholder="09XXXXXXXX"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
              />
              {errors.whatsapp ? (
                <p className="mt-1 text-sumo-xs text-red-500">
                  {errors.whatsapp}
                </p>
              ) : (
                <p className="mt-1 text-sumo-xs text-sumo-muted">
                  Podés escribir con espacios o guiones, nosotros lo acomodamos.
                </p>
              )}
            </label>
          </div>

          {/* Observación */}
          <label className="block" htmlFor="note">
            <span className="text-sumo-sm font-medium">Observación</span>
            <input
              id="note"
              name="note"
              className="mt-1 w-full rounded-md border border-sumo-soft bg-sumo-surface px-3 py-2 text-sumo-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Sin pan, sin verduras, etc."
            />
          </label>

          {/* Botón */}
          <div className="flex justify-end pt-2">
            <button
              className="btn-sumo-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
            >
              {loading ? "Registrando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </>
  );
}

// Componente pequeño de toasts
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div className="flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => {
          const base =
            "pointer-events-auto rounded-xl px-4 py-3 text-sumo-sm shadow-md border";
          const colorMap: Record<ToastType, string> = {
            info: "bg-sumo-surface text-sumo-primary border-sumo-soft",
            success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
            error: "bg-red-50 text-red-800 border border-red-200",
          };

          return (
            <div key={toast.id} className={`${base} ${colorMap[toast.type]}`}>
              {toast.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
