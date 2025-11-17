// app/api/admincito/order-lines/[orderLineId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LineStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderLineId: string }> }
) {
  try {
    // params es una Promise según el tipo que Next está esperando
    const { orderLineId } = await params;

    const body = await req.json();
    const { status } = body as { status: LineStatus };

    if (status !== "PAID") {
      return NextResponse.json(
        { error: "Solo se permite cambiar a estado PAID por esta ruta." },
        { status: 400 }
      );
    }

    const existing = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "OrderLine no encontrada." },
        { status: 404 }
      );
    }

    if (existing.status !== LineStatus.PENDING) {
      return NextResponse.json(
        { error: "Solo se pueden marcar como pagadas las líneas PENDING." },
        { status: 409 }
      );
    }

    const updated = await prisma.orderLine.update({
      where: { id: orderLineId },
      data: {
        status: LineStatus.PAID,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar OrderLine:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
