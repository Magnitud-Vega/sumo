// src/app/api/admincito/order-lines/[orderLineId]/reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyPaymentReminder } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderLineId: string }> }
) {
  const { orderLineId } = await context.params;
  const { bankDetailsOverride } = await req.json().catch(() => ({}));

  // Línea + orden (para slug, etc.)
  const line = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
  });

  if (!line) {
    return NextResponse.json(
      { error: "Order line not found" },
      { status: 404 }
    );
  }

  // Obtenemos el groupOrder asociado (para slug y bank data)
  const groupOrder = await prisma.groupOrder.findUnique({
    where: { id: line.groupOrderId },
  });

  if (!groupOrder) {
    return NextResponse.json(
      { error: "Group order not found" },
      { status: 404 }
    );
  }

  // Solo permitimos recordatorio si la línea está pendiente
  if (line.status !== "PENDING") {
    return NextResponse.json(
      { error: "Reminder only allowed for PENDING payments" },
      { status: 400 }
    );
  }

  // Y opcionalmente solo si la orden ya fue entregada (UX más lógico)
  // if (groupOrder.status !== "DELIVERED") {
  //   return NextResponse.json(
  //     { error: "Order is not delivered yet" },
  //     { status: 400 }
  //   );
  // }

  const bankDetails =
    bankDetailsOverride ||
    groupOrder.bankName ||
    process.env.BANK_DETAILS ||
    "";

  try {
    await notifyPaymentReminder(line, groupOrder);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
