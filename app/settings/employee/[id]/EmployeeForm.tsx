"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  employee: {
    id: string;
    name: string;
    title: string;
    rank: string;
    specialties: string;
    style: string;
    systemPrompt: string;
  };
}

export function EmployeeForm({ employee }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(employee);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/employee/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "저장 실패");
      }
      setMessage("저장되었습니다.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="이름">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
          />
        </Field>
        <Field label="직책">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
          />
        </Field>
        <Field label="직급">
          <select
            value={form.rank}
            onChange={(e) => setForm({ ...form, rank: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400"
          >
            {["부장", "과장", "대리", "사원"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="응답 스타일">
          <input
            value={form.style}
            onChange={(e) => setForm({ ...form, style: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
          />
        </Field>
      </div>
      <Field label="전문 분야 (콤마 구분)">
        <input
          value={form.specialties}
          onChange={(e) => setForm({ ...form, specialties: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
        />
      </Field>
      <Field label="AI 역할 프롬프트">
        <textarea
          value={form.systemPrompt}
          onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
          rows={12}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-brand-400 focus:bg-white"
        />
      </Field>

      <div className="flex items-center justify-end gap-3">
        {message && <span className="text-xs text-slate-500">{message}</span>}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
