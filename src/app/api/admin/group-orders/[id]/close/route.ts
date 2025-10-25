import { NextRequest, NextResponse } from "next/server";
import { closeGroupOrderById } from "@/lib/order-close";

export const runtime = "nodejs"; // Prisma no funciona en Edge

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // (Opcional) valida adminPin
    const body = await req.json().catch(() => ({}));
    const adminPin = body?.adminPin as string | undefined;
    // Si quisieras validar: traer el group y comparar adminPin antes de cerrar

    const result = await closeGroupOrderById(id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
