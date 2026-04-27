import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    projects: companies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      repoUrl: c.repoUrl,
      hasGithub: Boolean(c.repoUrl && c.githubToken),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, repoUrl, githubToken } = (await req.json()) as {
      id: string;
      repoUrl?: string;
      githubToken?: string;
    };
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(repoUrl !== undefined && { repoUrl: repoUrl || null }),
        ...(githubToken !== undefined && { githubToken: githubToken || null }),
      },
    });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      repoUrl: updated.repoUrl,
      hasGithub: Boolean(updated.repoUrl && updated.githubToken),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }
}
