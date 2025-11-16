import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { to, name, params, lang } = await req.json();
    // Seguridad mínima opcional
    // const auth = req.headers.get("authorization");
    // if (auth !== `Bearer ${process.env.INTERNAL_API_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const r = await sendWhatsAppTemplate({
      to,
      name,
      lang,
      bodyParams: (params || []).map((p: string) => ({
        type: "text",
        text: String(p),
      })),
    });

    return NextResponse.json({ ok: true, response: r });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
