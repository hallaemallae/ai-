"use client";

import Link from "next/link";
import { cn, RANK_STYLE } from "@/lib/utils";
import type { DepartmentDTO } from "@/types";

export function OrgChart({
  companyName,
  departments,
}: {
  companyName: string;
  departments: DepartmentDTO[];
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-4 text-center text-white shadow-lg">
          <div className="text-xs uppercase tracking-widest opacity-75">대표</div>
          <div className="text-lg font-bold">{companyName}</div>
        </div>
      </div>

      <div className="mx-auto h-8 w-px bg-slate-300" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((d) => {
          const head = d.employees.find((e) => e.rank === "부장");
          const members = d.employees.filter((e) => e.rank !== "부장");
          return (
            <div
              key={d.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-2xl">{d.icon}</span>
                <div>
                  <div className="text-base font-bold text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.employees.length}명</div>
                </div>
              </div>

              {head && <EmployeeRow employee={head} isHead />}

              {members.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-dashed border-slate-200 pl-3">
                  {members.map((m) => (
                    <EmployeeRow key={m.id} employee={m} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmployeeRow({
  employee,
  isHead,
}: {
  employee: DepartmentDTO["employees"][number];
  isHead?: boolean;
}) {
  return (
    <Link
      href={`/settings/employee/${employee.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 transition hover:border-brand-300 hover:bg-brand-50",
        isHead ? "border-brand-200 bg-brand-50/50" : "border-slate-100 bg-slate-50"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700 shadow-sm">
        {employee.name.slice(0, 1)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{employee.name}</span>
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[10px]",
              RANK_STYLE[employee.rank] ?? "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {employee.rank}
          </span>
        </div>
        <div className="text-xs text-slate-500">{employee.title}</div>
      </div>
    </Link>
  );
}
