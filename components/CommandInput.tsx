"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DepartmentDTO, Priority } from "@/types";

const PRIORITIES: { value: Priority; label: string; hint: string }[] = [
  { value: "urgent", label: "긴급", hint: "즉시 처리" },
  { value: "normal", label: "일반", hint: "표준 처리" },
  { value: "low", label: "낮음", hint: "여유 있음" },
];

export function CommandInput({ departments }: { departments: DepartmentDTO[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [deadline, setDeadline] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDept(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("지시 내용을 입력해 주십시오.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          priority,
          deadline: deadline || null,
          departmentSlugs: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "지시 생성 실패");
      const params = new URLSearchParams();
      if (selected.length > 0) params.set("depts", selected.join(","));
      params.set("autostart", "1");
      router.push(`/command/${data.command.id}?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        대표 지시사항
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="예) 다음 분기 앱 신기능 '소셜 로그인'에 대해 각 부서 검토 부탁합니다."
        rows={4}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed outline-none transition focus:border-brand-400 focus:bg-white"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-600">우선순위</div>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  priority === p.value
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold text-slate-600">마감일</div>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs font-semibold text-slate-600">
          부서 선택 <span className="font-normal text-slate-400">(선택 없으면 전 부서)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {departments.map((d) => {
            const active = selected.includes(d.slug);
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => toggleDept(d.slug)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                )}
              >
                <span className="mr-1">{d.icon}</span>
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="mt-3 text-xs text-red-600">{error}</div>}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "전달 중..." : "지시 전달"}
        </button>
      </div>
    </form>
  );
}
