import Link from "next/link";
import { prisma } from "@/lib/db";
import { CommandInput } from "@/components/CommandInput";
import { PriorityBadge } from "@/components/PriorityBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [company, departments, commands] = await Promise.all([
    prisma.company.findFirst(),
    prisma.department.findMany({
      orderBy: { order: "asc" },
      include: { employees: { orderBy: { order: "asc" } } },
    }),
    prisma.command.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: {
        responses: {
          include: { employee: { include: { department: true } } },
        },
      },
    }),
  ]);

  if (!company) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-bold text-slate-800">회사 데이터가 없습니다</h2>
        <p className="mt-2 text-sm text-slate-600">
          터미널에서 <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run db:seed</code>{" "}
          를 실행해 초기 조직 데이터를 생성해 주십시오.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-500">
              {company.industry} · {departments.length}개 부서 ·{" "}
              {departments.reduce((sum, d) => sum + d.employees.length, 0)}명
            </p>
          </div>
        </div>

        <CommandInput departments={departments} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">최근 지시 이력</h2>
          <Link href="/org" className="text-xs text-brand-600 hover:underline">
            조직도 보기 →
          </Link>
        </div>

        {commands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            아직 등록된 지시가 없습니다. 위에서 첫 지시를 작성해 보십시오.
          </div>
        ) : (
          <ul className="space-y-2">
            {commands.map((c) => {
              const deptSet = new Set(
                c.responses.map((r) => r.employee.department.name)
              );
              return (
                <li key={c.id}>
                  <Link
                    href={`/command/${c.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <PriorityBadge priority={c.priority} />
                          {c.pinned && (
                            <span className="rounded bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                              📌 고정
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(c.createdAt).toLocaleString("ko-KR")}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-800">
                          {c.content}
                        </p>
                        {deptSet.size > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-500">
                            {Array.from(deptSet).map((d) => (
                              <span key={d} className="rounded bg-slate-100 px-1.5">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        응답 {c.responses.length}건
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
