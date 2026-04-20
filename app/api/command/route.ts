import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const commands = await prisma.command.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      responses: {
        include: { employee: { include: { department: true } } },
      },
    },
  });
  return NextResponse.json({ commands });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, priority = "normal", deadline, departmentSlugs } = body as {
      content: string;
      priority?: "urgent" | "normal" | "low";
      deadline?: string | null;
      departmentSlugs?: string[];
    };

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "지시 내용을 입력해 주십시오." }, { status: 400 });
    }

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "회사 데이터가 없습니다. 먼저 seed를 실행해 주십시오." },
        { status: 500 }
      );
    }

    const command = await prisma.command.create({
      data: {
        content: content.trim(),
        priority,
        deadline: deadline ? new Date(deadline) : null,
        companyId: company.id,
      },
    });

    return NextResponse.json({
      command,
      departmentSlugs: departmentSlugs ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "지시 생성에 실패했습니다." }, { status: 500 });
  }
}
