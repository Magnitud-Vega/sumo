import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppTemplate, sendWhatsAppText, toGs } from "@/lib/whatsapp";
// import { createPagoparLink } from "@/lib/payments"; // Día 4

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Opcional: validar adminPin del body
  // const { adminPin } = await req.json();

  // Marca entregado
  await prisma.groupOrder.update({
    where: { id },
    data: { status: "DELIVERED" },
  });

  const lines = await prisma.orderLine.findMany({
    where: { groupOrderId: id },
  });

  for (const l of lines) {
    try {
      if (l.payMethod === "TC" || l.payMethod === "TD") {
        // Día 4: crear link de pago Pagopar
        const link = "https://example.pay/link/" + l.id; // await createPagoparLink(l)
        await sendWhatsAppTemplate({
          to: l.whatsapp.startsWith("+") ? l.whatsapp : `+${l.whatsapp}`,
          name: "cobro_tarjeta",
          bodyParams: [
            { type: "text", text: link },
            { type: "text", text: toGs(l.totalGs) },
          ],
        });
      } else if (l.payMethod === "TRANSFER") {
        const datos = process.env.BANK_DETAILS || "Cuenta: 123-456789-0";
        // send link de pago con datos bancarios template
        // await sendWhatsAppTemplate({
        //   to: l.whatsapp.startsWith("+") ? l.whatsapp : `+${l.whatsapp}`,
        //   name: "cobro_transferencia",
        //   bodyParams: [
        //     { type: "text", text: toGs(l.totalGs) },
        //     { type: "text", text: datos },
        //   ],
        // });

        // send recordatorio de pago text
        await sendWhatsAppText({
          to: l.whatsapp.startsWith("+")
            ? l.whatsapp.replace("+", "")
            : `${l.whatsapp.replace(/^0+/, "595")}}`,
          text: `Hola ${
            l.name
          }, tu pedido ha sido entregado. El total a pagar es ${toGs(
            l.totalGs
          )}. Por favor realiza la transferencia a los siguientes datos: ${datos}. Y enviá el comprobante, muchas gracias!.`,
        });
      } // CASH/QR: opcional enviar recordatorio/instrucciones
    } catch (e) {
      console.error("[WA post-entrega] ", e);
    }
  }

  return NextResponse.json({ ok: true, count: lines.length });
}
