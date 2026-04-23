import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  md: "text/markdown; charset=utf-8",
  ts: "text/plain; charset=utf-8",
  tsx: "text/plain; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  jsx: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  svg: "image/svg+xml; charset=utf-8",
  json: "application/json; charset=utf-8",
  sql: "text/plain; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  yaml: "text/yaml; charset=utf-8",
  yml: "text/yaml; charset=utf-8",
  sh: "text/x-shellscript; charset=utf-8",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const artifact = await prisma.artifact.findUnique({ where: { id: params.id } });
  if (!artifact) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(_req.url);
  const dl = url.searchParams.get("download") === "1";

  return new Response(artifact.content, {
    headers: {
      "Content-Type": MIME[artifact.language] ?? "text/plain; charset=utf-8",
      ...(dl
        ? {
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              artifact.filename
            )}"`,
          }
        : {}),
    },
  });
}
