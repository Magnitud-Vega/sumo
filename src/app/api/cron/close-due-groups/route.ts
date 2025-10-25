import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { closeGroupOrderById } from "@/lib/order-close";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Seguridad simple por header
  const token = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date(); // El server corre en UTC; tu deadlineTs ya es Date absoluta

  // Buscar todos los grupos OPEN vencidos
  const due = await prisma.groupOrder.findMany({
    where: { status: "OPEN", deadlineTs: { lte: now } },
    select: { id: true, slug: true },
  });

  const results: any[] = [];
  for (const g of due) {
    try {
      const r = await closeGroupOrderById(g.id);
      results.push({ slug: g.slug, ...r });
    } catch (e: any) {
      results.push({ slug: g.slug, error: e.message });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
