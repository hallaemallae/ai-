import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CommandStreamView } from "@/components/CommandStreamView";
import { PriorityBadge } from "@/components/PriorityBadge";
import { PdfExportButton } from "@/components/PdfExportButton";
import type { CommandDTO, DepartmentDTO } from "@/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: { depts?: string; autostart?: string };
}

export default async function CommandDetailPage({ params, searchParams }: PageProps) {
  const command = await prisma.command.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      responses: {
        orderBy: { createdAt: "asc" },
        include: { employee: { include: { department: true } } },
      },
      artifacts: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!command) return notFound();

  const departments = await prisma.department.findMany({
    where: { companyId: command.companyId },
    orderBy: { order: "asc" },
    include: { employees: { orderBy: { order: "asc" } } },
  });

  const selectedSlugs =
    searchParams.depts?.split(",").filter(Boolean) ?? [];
  const autostart = searchParams.autostart === "1";
  const hasGithub = Boolean(command.company?.repoUrl && command.company?.githubToken);

  const commandDto = {
    id: command.id,
    content: command.content,
    type: (command.type ?? "task") as CommandDTO["type"],
    priority: command.priority as CommandDTO["priority"],
    deadline: command.deadline ? command.deadline.toISOString() : null,
    pinned: command.pinned,
    summary: command.summary,
    createdAt: command.createdAt.toISOString(),
    responses: command.responses.map((r) => ({
      id: r.id,
      content: r.content,
      status: r.status,
      round: r.round ?? 0,
      commandId: r.commandId,
      employeeId: r.employeeId,
      parentId: r.parentId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      employee: {
        id: r.employee.id,
        name: r.employee.name,
        title: r.employee.title,
        rank: r.employee.rank,
        specialties: r.employee.specialties,
        style: r.employee.style,
        systemPrompt: r.employee.systemPrompt,
        order: r.employee.order,
        departmentId: r.employee.departmentId,
        department: {
          id: r.employee.department.id,
          name: r.employee.department.name,
          slug: r.employee.department.slug,
          icon: r.employee.department.icon,
          order: r.employee.department.order,
          employees: [],
        },
      },
    })),
  } satisfies CommandDTO;

  const deptDto = departments.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    icon: d.icon,
    order: d.order,
    employees: d.employees.map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      rank: e.rank,
      specialties: e.specialties,
      style: e.style,
      systemPrompt: e.systemPrompt,
      order: e.order,
      departmentId: e.departmentId,
    })),
  })) satisfies DepartmentDTO[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-900">
          ← 대시보드
        </Link>
        <PdfExportButton commandId={command.id} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <PriorityBadge priority={command.priority} />
          <span className="text-xs text-slate-500">
            {new Date(command.createdAt).toLocaleString("ko-KR")}
          </span>
          {command.deadline && (
            <span className="text-xs text-slate-500">
              · 마감 {new Date(command.deadline).toLocaleDateString("ko-KR")}
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
          {command.content}
        </p>
      </div>

      <CommandStreamView
        command={commandDto}
        departments={deptDto}
        initialResponses={commandDto.responses ?? []}
        initialArtifacts={command.artifacts.map((a) => ({
          artifactId: a.id,
          filename: a.filename,
          language: a.language,
          departmentSlug:
            command.responses.find((r) => r.id === a.responseId)?.employee.department.slug ??
            "",
          employeeName:
            command.responses.find((r) => r.id === a.responseId)?.employee.name ?? "",
        }))}
        autostartDepartmentSlugs={autostart ? selectedSlugs : null}
        companyId={command.companyId}
        hasGithub={hasGithub}
      />
    </div>
  );
}
