import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  const params = await context.params;
  console.log("Fetching menu(s) with params:", params);
  if (!params) {
    const menu = await prisma.menu.findMany({
      include: {
        items: { where: { isActive: true } },
      },
    });
    if (!menu)
      return NextResponse.json({ error: "No existe" }, { status: 404 });
    return NextResponse.json(menu);
  } else {
    const { id } = params;
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        items: { where: { isActive: true } },
      },
    });
    if (!menu)
      return NextResponse.json({ error: "No existe" }, { status: 404 });
    return NextResponse.json(menu);
  }
}
