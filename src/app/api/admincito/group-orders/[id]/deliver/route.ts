// src/app/api/admincito/group-orders/[id]/deliver/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyOrderDelivered } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Opcional: validar adminPin
  // const { adminPin } = await req.json();

  // 1) Marcamos la orden como DELIVERED
  const groupOrder = await prisma.groupOrder.update({
    where: { id },
    data: { status: "DELIVERED" },
  });

  // 2) Traemos todas las líneas
  const lines = await prisma.orderLine.findMany({
    where: { groupOrderId: id },
  });

  const results: any[] = [];

  for (const l of lines) {
    try {
      // filtrar (ej: solo TC/TD/TRANSFER), aquí:
      await notifyOrderDelivered(l, groupOrder);
      results.push({ lineId: l.id, ok: true });
    } catch (e: any) {
      console.error("[GREEN-API post-entrega] ", e);
      results.push({ lineId: l.id, error: e.message });
    }
  }

  return NextResponse.json({
    ok: true,
    count: lines.length,
    results,
  });
}
