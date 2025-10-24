import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrderLineSchema } from "@/lib/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const group = await prisma.groupOrder.findUnique({
      where: { slug },
      include: { menu: { include: { items: true } } },
    });
    if (!group)
      return NextResponse.json({ error: "No existe" }, { status: 404 });
    if (group.status !== "OPEN")
      return NextResponse.json({ error: "Evento cerrado" }, { status: 400 });

    const payload = await req.json();
    const data = createOrderLineSchema.parse(payload);

    interface MenuItem {
      id: string;
      name: string;
      priceGs: number;
      isActive: boolean;
    }

    interface CreateOrderLineDto {
      itemId: string;
      qty: number;
      name?: string | null;
      whatsapp?: string | null;
      payMethod?: string | null;
      note?: string | null;
    }

    const typedData = data as CreateOrderLineDto;

    const item: MenuItem | undefined = (
      group.menu.items as unknown as MenuItem[]
    ).find((i) => i.id === typedData.itemId);
    if (!item || !item.isActive) {
      return NextResponse.json({ error: "Item inválido" }, { status: 400 });
    }

    const subtotal = item.priceGs * data.qty;

    const line = await prisma.orderLine.create({
      data: {
        groupOrderId: group.id,
        name: data.name,
        whatsapp: data.whatsapp,
        payMethod: data.payMethod,
        itemId: item.id,
        itemName: item.name,
        unitPriceGs: item.priceGs,
        qty: data.qty,
        note: data.note,
        subtotalGs: subtotal,
      },
    });

    return NextResponse.json(line);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
