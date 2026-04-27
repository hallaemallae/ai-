import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ProjectSettingsForm } from "./ProjectSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = cookies();
  const savedId = cookieStore.get("activeProjectId")?.value;
  const allCompanies = await prisma.company.findMany({ orderBy: { createdAt: "asc" } });
  const company = allCompanies.find((c) => c.id === savedId) ?? allCompanies[0];

  if (!company) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        회사가 없습니다. 시드를 먼저 실행해 주십시오.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">프로젝트 설정</h1>
        <p className="text-sm text-slate-500">
          {company.name} · GitHub 연동 및 기타 설정
        </p>
      </div>

      <ProjectSettingsForm
        companyId={company.id}
        companyName={company.name}
        repoUrl={company.repoUrl ?? ""}
        hasToken={Boolean(company.githubToken)}
      />
    </div>
  );
}
