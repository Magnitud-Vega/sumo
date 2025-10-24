import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const group = await prisma.groupOrder.findUnique({
    where: { slug },
    include: {
      menu: { include: { items: { where: { isActive: true } } } },
      lines: true,
    },
  });
  if (!group) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(group);
}
