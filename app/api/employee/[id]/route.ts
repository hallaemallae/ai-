import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: { department: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ employee });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      name: body.name,
      title: body.title,
      rank: body.rank,
      specialties: body.specialties,
      style: body.style,
      systemPrompt: body.systemPrompt,
      order: body.order,
    },
  });
  return NextResponse.json({ employee });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.employee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
