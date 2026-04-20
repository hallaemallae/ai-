import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const command = await prisma.command.findUnique({
    where: { id: params.id },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
        include: { employee: { include: { department: true } } },
      },
    },
  });

  if (!command) {
    return NextResponse.json({ error: "지시를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ command });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.pinned === "boolean") data.pinned = body.pinned;
  if (typeof body.priority === "string") data.priority = body.priority;
  if (body.deadline === null) data.deadline = null;
  else if (typeof body.deadline === "string") data.deadline = new Date(body.deadline);

  const command = await prisma.command.update({ where: { id: params.id }, data });
  return NextResponse.json({ command });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.command.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
