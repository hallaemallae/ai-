import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const department = await prisma.department.update({
    where: { id: params.id },
    data: {
      name: body.name,
      icon: body.icon,
      order: body.order,
    },
  });
  return NextResponse.json({ department });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.department.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
