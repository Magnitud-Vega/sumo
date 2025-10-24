import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createGroupOrderSchema } from "@/lib/schema";
import { isoToDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = createGroupOrderSchema.parse(json);

    const exists = await prisma.groupOrder.findUnique({
      where: { slug: data.slug },
    });
    if (exists)
      return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });

    const group = await prisma.groupOrder.create({
      data: {
        slug: data.slug,
        menuId: data.menuId,
        deadlineTs: isoToDate(data.deadlineTs),
        deliveryCostGs: data.deliveryCostGs,
        minTotalGs: data.minTotalGs,
        minItems: data.minItems,
        splitStrategy: data.splitStrategy,
        adminPin: data.adminPin,
      },
    });

    return NextResponse.json(group);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
