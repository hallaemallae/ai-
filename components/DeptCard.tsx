"use client";

import { EmployeeResponseView } from "./EmployeeResponse";
import type { DepartmentDTO } from "@/types";

export interface DeptResponseNode {
  id: string;
  employeeId: string;
  employeeName: string;
  title?: string;
  rank: string;
  content: string;
  streaming?: boolean;
  round: number;
  children: DeptResponseNode[];
}

export function DeptCard({
  department,
  headNodes,
}: {
  department: Pick<DepartmentDTO, "id" | "name" | "icon" | "slug">;
  headNodes: DeptResponseNode[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{department.icon}</span>
        <h3 className="text-base font-bold text-slate-800">{department.name}</h3>
      </div>

      {headNodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
          아직 응답이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {headNodes.map((head) => {
            const aligned = head.children.find((c) => c.round === 4);
            const members = head.children.filter((c) => c.round !== 4);
            return (
              <div key={head.id} className="space-y-2">
                <EmployeeResponseView
                  employeeName={head.employeeName}
                  title={head.title}
                  rank={head.rank}
                  content={head.content}
                  streaming={head.streaming}
                />
                {aligned && (
                  <div className="ml-4 rounded-lg border border-amber-200 bg-amber-50/60 p-2">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      🤝 부서간 조율 후 조정안
                    </div>
                    <EmployeeResponseView
                      employeeName={aligned.employeeName}
                      title={aligned.title}
                      rank={aligned.rank}
                      content={aligned.content}
                      streaming={aligned.streaming}
                    />
                  </div>
                )}
                {members.map((child) => (
                  <EmployeeResponseView
                    key={child.id}
                    employeeName={child.employeeName}
                    title={child.title}
                    rank={child.rank}
                    content={child.content}
                    streaming={child.streaming}
                    depth={1}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
