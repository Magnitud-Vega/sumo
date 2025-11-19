// src/lib/green-api.ts

import type { GroupOrder, OrderLine } from "@prisma/client";

const INSTANCE_ID = process.env.GREENAPI_INSTANCE_ID;
const API_TOKEN = process.env.GREENAPI_API_TOKEN;
const SENDER_NAME = process.env.GREENAPI_SENDER_NAME || "SUMO";

if (!INSTANCE_ID || !API_TOKEN) {
  console.warn("[GREEN-API] Faltan GREENAPI_INSTANCE_ID o GREENAPI_API_TOKEN");
}

const BASE_URL =
  INSTANCE_ID && API_TOKEN
    ? `https://api.green-api.com/waInstance${INSTANCE_ID}`
    : "";

export function formatGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

/**
 * Normaliza número local al formato que espera Green-API:
 * - Sin "+".
 * - Sin espacios ni símbolos.
 * - Para Paraguay, si empieza con "0" → reemplazar por "595".
 *   (ajustar según cómo guardes tus números)
 */
export function normalizePhoneForGreen(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // Ejemplo simple para Paraguay:
  // "0985123456" → "595985123456"
  if (digits.startsWith("0")) {
    return `595${digits.slice(1)}`;
  }
  // Si ya viene con "595..." lo dejamos
  return digits;
}

/**
 * Envia un mensaje de texto simple usando Green-API
 */
export async function sendGreenTextMessage(args: {
  to: string; // puede venir "+595..." o "0985..."
  text: string;
}) {
  if (!BASE_URL) {
    console.warn("[GREEN-API] Config incompleta, se omite envío");
    return { skipped: true };
  }

  const chatId = `${normalizePhoneForGreen(args.to)}@c.us`;

  const res = await fetch(`${BASE_URL}/SendMessage/${API_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      message: args.text,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[GREEN-API] Error", res.status, json);
    throw new Error(json?.message || `GREEN-API ${res.status}`);
  }

  console.log(
    `[GREEN-API] Mensaje enviado a ${chatId} (${SENDER_NAME}). Texto: "${args.text}"`
  );
  return json;
}

/**
 * Mensaje cuando la orden de grupo pasa a DELIVERED
 */
export async function notifyOrderDelivered(line: OrderLine, order: GroupOrder) {
  const text = `Hola ${line.name} 👋

Tu pedido del grupo "${order.slug}" ya fue *ENTREGADO* ✅

• Ítem: ${line.itemName}
• Total a pagar: ${formatGs(line.totalGs)} Gs.
• Método de pago: ${line.payMethod}

Por favor realizá el pago según el método acordado. ¡Gracias!`;

  return sendGreenTextMessage({
    to: line.whatsapp,
    text,
  });
}

/**
 * Recordatorio de pago para un ítem PENDING
 */
export async function notifyPaymentReminder(
  line: OrderLine,
  order: GroupOrder,
  bankDetails?: string
) {
  const extra =
    line.payMethod === "TRANSFER" && bankDetails
      ? `\n\nDatos para transferencia:\n${bankDetails}`
      : "";

  const text = `Hola ${line.name} 👋

Te recordamos el pago de tu pedido del grupo "${order.slug}".

• Ítem: ${line.itemName}
• Total pendiente: ${formatGs(line.totalGs)} Gs.
• Estado actual: ${line.status}
• Método de pago: ${line.payMethod}${extra}

Si ya realizaste el pago, podés ignorar este mensaje o avisarle al administrador 🙌`;

  return sendGreenTextMessage({
    to: line.whatsapp,
    text,
  });
}
