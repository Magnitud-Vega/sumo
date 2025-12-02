import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const groups = await prisma.groupOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { lines: true, menu: true },
  });

  const data = groups.map((g) => {
    const subtotal = g.lines.reduce((a, l) => a + l.subtotalGs, 0);
    const total = g.lines.reduce((a, l) => a + l.totalGs, 0);
    const items = g.lines.reduce((a, l) => a + l.qty, 0);
    return {
      id: g.id,
      slug: g.slug,
      menu: g.menu.title,
      status: g.status,
      deadlineTs: g.deadlineTs,
      subtotal,
      items,
      total,
      deliveryCostGs: g.deliveryCostGs,
    };
  });

  return NextResponse.json(data);
}
