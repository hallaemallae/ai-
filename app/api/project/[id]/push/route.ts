import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pushArtifactsAsPR } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { commandId } = (await req.json()) as { commandId: string };
    if (!commandId) {
      return NextResponse.json({ error: "commandId required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: params.id } });
    if (!company) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }
    if (!company.repoUrl || !company.githubToken) {
      return NextResponse.json(
        { error: "GitHub 리포지토리가 설정되지 않았습니다. 설정 페이지에서 구성해 주십시오." },
        { status: 400 }
      );
    }

    const artifacts = await prisma.artifact.findMany({
      where: { commandId },
      orderBy: { createdAt: "asc" },
    });

    if (artifacts.length === 0) {
      return NextResponse.json({ error: "산출물이 없습니다." }, { status: 400 });
    }

    const command = await prisma.command.findUnique({ where: { id: commandId } });
    const date = new Date().toISOString().slice(0, 10);
    const branchName = `ai-meeting/${date}-${commandId.slice(-6)}`;
    const prTitle = `[AI 회의] ${command?.content?.slice(0, 60) ?? "산출물 자동 푸시"}`;
    const prBody = `## AI 임원 회의 산출물 자동 푸시\n\n**안건**: ${command?.content ?? ""}\n\n**생성 파일 (${artifacts.length}개)**:\n${artifacts.map((a) => `- \`ai-outputs/${a.filename}\``).join("\n")}\n\n> ${company.name} AI 시스템에서 자동 생성`;

    const { prUrl } = await pushArtifactsAsPR({
      repoUrl: company.repoUrl,
      token: company.githubToken,
      branchName,
      prTitle,
      prBody,
      artifacts: artifacts.map((a) => ({ filename: a.filename, content: a.content })),
    });

    return NextResponse.json({ prUrl });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "푸시 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
