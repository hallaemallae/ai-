import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { order: "asc" },
    include: {
      employees: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const company = await prisma.company.findFirst();
  if (!company) {
    return NextResponse.json({ error: "회사가 없습니다." }, { status: 500 });
  }
  const department = await prisma.department.create({
    data: {
      name: body.name,
      slug: body.slug,
      icon: body.icon ?? "🏢",
      order: body.order ?? 99,
      companyId: company.id,
    },
  });
  return NextResponse.json({ department });
}
