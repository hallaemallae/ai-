import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: [{ department: { order: "asc" } }, { order: "asc" }],
    include: { department: true },
  });
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const department = await prisma.department.findUnique({
    where: { id: body.departmentId },
    include: { company: true },
  });
  if (!department) {
    return NextResponse.json({ error: "부서를 찾을 수 없습니다." }, { status: 404 });
  }

  const systemPrompt =
    body.systemPrompt ||
    buildSystemPrompt({
      companyName: department.company.name,
      departmentName: department.name,
      name: body.name,
      title: body.title,
      rank: body.rank,
      specialties: body.specialties ?? "",
      style: body.style ?? "",
    });

  const employee = await prisma.employee.create({
    data: {
      name: body.name,
      title: body.title,
      rank: body.rank,
      specialties: body.specialties ?? "",
      style: body.style ?? "",
      order: body.order ?? 99,
      systemPrompt,
      departmentId: department.id,
    },
  });
  return NextResponse.json({ employee });
}
