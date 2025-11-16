import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrderLineSchema } from "@/lib/schema";
import { sendWhatsAppText, toGs } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
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

    try {
      // send template confirmation
      // await sendWhatsAppTemplate({
      //   to: line.whatsapp.startsWith("+")
      //     ? line.whatsapp
      //     : `+${line.whatsapp.replace(/^0+/, "595")}`,
      //   name: "pedido_confirmado",
      //   bodyParams: [
      //     { type: "text", text: line.name },
      //     { type: "text", text: group.slug },
      //     {
      //       type: "text",
      //       text: new Date(group.deadlineTs).toLocaleTimeString("es-PY", {
      //         hour: "2-digit",
      //         minute: "2-digit",
      //       }),
      //     },
      //     { type: "text", text: `${toGs(line.subtotalGs)}` },
      //   ],
      // });

      // send plain text confirmation
      await sendWhatsAppText({
        to: line.whatsapp.startsWith("+")
          ? line.whatsapp.replace("+", "")
          : `${line.whatsapp.replace(/^0+/, "595")}`,
        text: `Hola ${line.name}, tu pedido en el grupo "${
          group.slug
        }" ha sido registrado. Total: ${toGs(
          line.subtotalGs
        )}. Gracias por usar SUMO Pedidos.`,
      });
    } catch (e) {
      console.error("[WA pedido_confirmado] ", e);
    }

    return NextResponse.json(line);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
