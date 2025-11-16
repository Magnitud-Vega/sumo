const GRAPH = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
const TOKEN = process.env.WHATSAPP_TOKEN!;

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

export async function sendWhatsAppTemplate(args: {
  to: string; // "+5959..."
  name: string; // nombre del template
  lang?: string; // "es"
  bodyParams: TemplateComponent["parameters"]; // variables del body
}) {
  if (!PHONE_ID || !TOKEN) {
    console.warn("[WA] Token/PhoneID faltante. Saltando envío.");
    return { skipped: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: args.to,
        type: "template",
        template: {
          name: args.name,
          language: { code: args.lang || "es_AR" },
          components: [
            {
              type: "body",
              parameters: args.bodyParams,
            },
          ],
        },
      }),
    }
  );
  console.log(
    `[WA] Endpoint https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages. Enviado template "${
      args.name
    }" a ${args.to} en lenguaje ${args.lang || "es"} con params`,
    args.bodyParams
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[WA] Error", res.status, json);
    throw new Error(json?.error?.message || `WA ${res.status}`);
  }
  return json;
}

export function toGs(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export async function sendWhatsAppText(args: {
  to: string; // "5959..."
  text: string; // texto plano
}) {
  if (!PHONE_ID || !TOKEN) {
    console.warn("[WA] Token/PhoneID faltante. Saltando envío.");
    return { skipped: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: args.to,
        type: "text",
        text: {
          body: args.text,
        },
      }),
    }
  );
  console.log(
    `[WA] Endpoint https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages. Enviado template "${args.text}" a ${args.to}`
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[WA] Error", res.status, json);
    throw new Error(json?.error?.message || `WA ${res.status}`);
  }
  return json;
}
