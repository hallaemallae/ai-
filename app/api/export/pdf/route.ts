import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { commandId } = (await req.json()) as { commandId: string };

  const command = await prisma.command.findUnique({
    where: { id: commandId },
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
