import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate, sendWhatsAppText } from "@/lib/whatsapp";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { to, text } = await req.json();
    // Seguridad mínima opcional
    // const auth = req.headers.get("authorization");
    // if (auth !== `Bearer ${process.env.INTERNAL_API_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const r = await sendWhatsAppText({
      to,
      text,
    });

    return NextResponse.json({ ok: true, response: r });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// curl -X POST "http://localhost:3000/api/notify/whatsapp-text" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "to":"595985444801",
//     "text":"Este es un mensaje de prueba desde SUMO Pedidos."
//   }'
