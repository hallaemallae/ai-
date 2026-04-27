"use client";

import { useTransition } from "react";
import { switchProject } from "@/app/actions";
import type { CompanyDTO } from "@/types";

export function ProjectSwitcher({
  projects,
  activeId,
}: {
  projects: CompanyDTO[];
  activeId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    startTransition(() => switchProject(id));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">프로젝트</span>
      <select
        value={activeId}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-400 disabled:opacity-60"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {isPending && <span className="text-[11px] text-slate-400">전환 중…</span>}
    </div>
  );
}
