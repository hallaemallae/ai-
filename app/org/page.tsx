import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { OrgChart } from "@/components/OrgChart";
import type { DepartmentDTO } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrgPage() {
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

  const departments = await prisma.department.findMany({
    where: { companyId: company.id },
    orderBy: { order: "asc" },
    include: { employees: { orderBy: { order: "asc" } } },
  });

  const dto: DepartmentDTO[] = departments.map((d) => ({
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
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{company.name} 조직도</h1>
        <p className="text-sm text-slate-500">
          각 직원 카드를 클릭해 역할 프롬프트를 편집할 수 있습니다.
        </p>
      </div>
      <OrgChart companyName={company.name} departments={dto} />
    </div>
  );
}
