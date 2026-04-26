"use client";

import { useState } from "react";
import type { DepartmentDTO } from "@/types";
import type { DeptResponseNode } from "./DeptCard";
import { EmployeeResponseView } from "./EmployeeResponse";

export interface ArtifactEntry {
  artifactId: string;
  filename: string;
  language: string;
  departmentSlug: string;
  employeeName: string;
}

const LANG_ICON: Record<string, string> = {
  md: "📝",
  markdown: "📝",
  ts: "🧩",
  tsx: "🧩",
  js: "🧩",
  jsx: "🧩",
  html: "🌐",
  css: "🎨",
  svg: "🖼️",
  json: "🗂️",
  sql: "🗄️",
  yaml: "⚙️",
  yml: "⚙️",
  sh: "💻",
  txt: "📄",
};

function CcPromptCard({ artifact }: { artifact: ArtifactEntry }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const res = await fetch(`/api/artifact/${artifact.artifactId}`);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: just open download
      window.open(`/api/artifact/${artifact.artifactId}?download=1`);
    }
  }

  return (
    <div className="col-span-full rounded-2xl border-2 border-brand-400 bg-gradient-to-br from-brand-50 to-white p-4 shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <div>
          <div className="text-sm font-bold text-brand-800">
            Claude Code 구현 프롬프트
          </div>
          <div className="text-xs text-slate-500">
            아래 버튼으로 복사 → Claude Code 에 붙여넣기하면 바로 구현 시작
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-brand-700 active:scale-95"
          >
            {copied ? "✓ 복사됨!" : "📋 복사"}
          </button>
          <a
            href={`/api/artifact/${artifact.artifactId}?download=1`}
            download={artifact.filename}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
          >
            ↓ 저장
          </a>
        </div>
      </div>
    </div>
  );
}

export function ArtifactsPanel({
  artifacts,
  byDept,
  departments,
}: {
  artifacts: ArtifactEntry[];
  byDept: Record<string, DeptResponseNode[]>;
  departments: DepartmentDTO[];
}) {
  const ccPrompt = artifacts.find((a) => a.filename === "claude-code-prompt.md");
  const minutes = artifacts.find((a) => a.filename === "meeting-minutes.md");
  const rest = artifacts.filter(
    (a) =>
      a.filename !== "claude-code-prompt.md" && a.filename !== "meeting-minutes.md"
  );

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-slate-700">
        📦 산출물 (다운로드 가능)
      </h3>

      {artifacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-400">
          산출물 생성 중...
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {ccPrompt && <CcPromptCard artifact={ccPrompt} />}
          {minutes && (
            <div className="col-span-full flex items-center justify-between rounded-xl border border-slate-300 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">회의록</div>
                  <div className="text-[11px] text-slate-500">meeting-minutes.md</div>
                </div>
              </div>
              <a
                href={`/api/artifact/${minutes.artifactId}?download=1`}
                download="meeting-minutes.md"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50"
              >
                ↓ 다운로드
              </a>
            </div>
          )}
          {rest.map((a) => (
            <a
              key={a.artifactId}
              href={`/api/artifact/${a.artifactId}?download=1`}
              download={a.filename}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
            >
              <span className="text-lg">{LANG_ICON[a.language] ?? "📄"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800">
                  {a.filename}
                </div>
                <div className="text-[11px] text-slate-500">
                  {a.employeeName}
                </div>
              </div>
              <span className="text-xs text-brand-600">↓</span>
            </a>
          ))}
        </div>
      )}

      <details className="mt-4 rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          📋 팀원 작성 로그 보기 ▾
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2">
          {departments.map((d) => {
            const round3 = (byDept[d.slug] ?? [])
              .flatMap((n) => n.children)
              .filter((n) => n.round === 3);
            if (round3.length === 0) return null;
            return (
              <div key={d.id}>
                <div className="mb-2 text-xs font-semibold text-slate-700">
                  {d.icon} {d.name}
                </div>
                <div className="space-y-2">
                  {round3.map((n) => (
                    <EmployeeResponseView
                      key={n.id}
                      employeeName={n.employeeName}
                      title={n.title}
                      rank={n.rank}
                      content={n.content}
                      streaming={n.streaming}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
