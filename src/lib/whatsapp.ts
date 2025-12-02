// src/lib/whatsapp.ts
import type { GroupOrder, OrderLine } from "@prisma/client";

const GRAPH = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const SENDER_NAME = process.env.WHATSAPP_SENDER_NAME || "SUMO Pedidos";

// Dominio de la app para armar el link a la orden
const APP_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "https://sumo-mu.vercel.app/order/cena-mchill"; // ej: https://sumo-eight.vercel.app

if (!PHONE_ID || !TOKEN) {
  console.warn(
    "[WA] Faltan WHATSAPP_PHONE_ID o WHATSAPP_TOKEN. Los envíos se omitirán."
  );
}

type TemplateComponent = {
  type: "body";
  parameters: Array<
    | { type: "text"; text: string }
    | {
        type: "currency";
        currency: { fallback_value: string; code: string; amount_1000: number };
      }
    | { type: "date_time"; date_time: { fallback_value: string } }
  >;
};

export function toGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

/**
 * Normaliza el número a lo que espera Meta:
 * - Solo dígitos
 * - Sin "+"
 * - Para Paraguay: "0985..." → "595985..."
 */
export function normalizePhoneToMeta(phone: string | null | undefined) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  // Si empieza con 0 → lo convertimos a 595 (Paraguay)
  if (digits.startsWith("0")) {
    return "595" + digits.slice(1);
  }

  // Si ya empieza en 595 → perfecto
  if (digits.startsWith("595")) {
    return digits;
  }

  // Si empieza con +595
  if (digits.startsWith("595")) {
    return digits;
  }

  // fallback para cualquier otro formato
  return digits;
}

/**
 * Mapea el código de método de pago a un label legible.
 */
function mapPayMethodLabel(payMethod: OrderLine["payMethod"]): string {
  switch (payMethod) {
    case "CASH":
      return "Efectivo";
    case "TRANSFER":
      return "Transferencia bancaria";
    case "TC":
      return "Tarjeta de crédito";
    case "TD":
      return "Tarjeta de débito";
    case "QR":
      return "Pago por QR";
    default:
      return payMethod;
  }
}

/**
 * Construye el bloque de datos de transferencia en formato legible.
 * Prioriza los datos que vienen en `order`. Si faltan, usa el fallback.
 */
function buildBankDetailsBlock(
  order: GroupOrder,
  fallbackDetails?: string
): string {
  const lines: string[] = [];

  if (order.bankHolder) lines.push(`Nombre: ${order.bankHolder}`);
  if (order.bankAccount) lines.push(`Cuenta: ${order.bankAccount}`);
  if (order.bankDoc) lines.push(`RUC/CI: ${order.bankDoc}`);
  if (order.bankAlias) lines.push(`Alias: ${order.bankAlias}`);

  if (lines.length === 0 && fallbackDetails) {
    lines.push(fallbackDetails);
  }

  if (lines.length === 0) return "";

  return `\n\nDatos para transferencia:\n${lines.join("\n")}`;
}

/**
 * Link al detalle de la orden (si hay dominio configurado).
 * Ej: https://tu-dominio.com/order/martes-chill-cena
 */
function buildOrderLink(order: GroupOrder): string {
  if (!APP_URL) return "";
  const base = APP_URL.replace(/\/$/, ""); // sin slash al final
  return `${base}/order/${order.slug}`;
}

function getMetaEndpoint() {
  if (!PHONE_ID || !TOKEN) return null;
  return `https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages`;
}

async function postWhatsApp(body: unknown) {
  const endpoint = getMetaEndpoint();
  if (!endpoint) {
    console.warn("[WA] Config incompleta, omitiendo envío de WhatsApp.");
    return { skipped: true };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[WA] Error", res.status, json);
    throw new Error(json?.error?.message || `WA ${res.status}`);
  }
  return json;
}

/**
 * Helper genérico para enviar un template de Meta.
 * (lo dejamos disponible por si usás templates más adelante)
 */
export async function sendWhatsAppTemplate(args: {
  to: string; // "+5959..." o "0985..."
  name: string; // nombre del template
  lang?: string; // "es"
  bodyParams: TemplateComponent["parameters"]; // variables del body
}) {
  const toNormalized = normalizePhoneToMeta(args.to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "template" as const,
    template: {
      name: args.name,
      language: { code: args.lang || "es" },
      components: [
        {
          type: "body" as const,
          parameters: args.bodyParams,
        },
      ],
    },
  };

  console.log(
    `[WA] Enviando template "${args.name}" a ${toNormalized} (${SENDER_NAME}) con params`,
    args.bodyParams
  );

  return postWhatsApp(payload);
}

/**
 * Enviar texto plano por WhatsApp.
 */
export async function sendWhatsAppText(args: {
  to: string; // "0985..." o "+595..."
  text: string;
}) {
  const toNormalized = normalizePhoneToMeta(args.to);

  const payload = {
    messaging_product: "whatsapp",
    to: toNormalized,
    type: "text" as const,
    text: {
      body: args.text,
    },
  };

  console.log(
    `[WA] Enviando texto a ${toNormalized} (${SENDER_NAME}): "${args.text}"`
  );

  return postWhatsApp(payload);
}

/**
 * --- Helpers de negocio ---
 */

/**
 * Notificación cuando la orden de grupo pasa a DELIVERED.
 */
export async function notifyOrderDelivered(line: OrderLine, order: GroupOrder) {
  const payMethodLabel = mapPayMethodLabel(line.payMethod);
  const orderLink = buildOrderLink(order);
  const linkBlock = orderLink
    ? `\n\nPodés ver el detalle de tu pedido aquí:\n${orderLink}`
    : "";

  const text = `Hola ${line.name} 👋 (Este es un TEST - IGNORAR PAGO)

Tu pedido del grupo "${order.slug}" ya fue *ENTREGADO* ✅

• Ítem: ${line.itemName}
• Total a pagar: ${toGs(line.totalGs)} Gs.
• Método de pago: ${payMethodLabel}${linkBlock}`;

  return sendWhatsAppText({
    to: line.whatsapp,
    text,
  });
}

/**
 * Recordatorio de pago para un ítem PENDING.
 * Usa datos bancarios del order si existen, o fallback si se pasa.
 */
export async function notifyPaymentReminder(
  line: OrderLine,
  order: GroupOrder,
  bankDetailsFallback?: string
) {
  const payMethodLabel = mapPayMethodLabel(line.payMethod);
  const bankBlock = buildBankDetailsBlock(order, bankDetailsFallback);
  const orderLink = buildOrderLink(order);
  const linkBlock = orderLink
    ? `\n\nPodés ver el detalle de tu pedido aquí:\n${orderLink}`
    : "";

  const text = `Hola ${line.name} 👋 (Este es un TEST - IGNORAR PAGO)

Te recordamos el pago de tu pedido del grupo "${order.slug}".

• Ítem: ${line.itemName}
• Total pendiente: ${toGs(line.totalGs)} Gs.
• Estado actual: ${line.status}
• Método de pago: ${payMethodLabel}${bankBlock}${linkBlock}

Si ya realizaste el pago, podés ignorar este mensaje o avisarle al administrador 🙌`;

  return sendWhatsAppText({
    to: line.whatsapp,
    text,
  });
}
