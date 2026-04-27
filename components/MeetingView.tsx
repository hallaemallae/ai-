"use client";

import { useState } from "react";
import { EmployeeResponseView } from "./EmployeeResponse";
import { ArtifactsPanel, type ArtifactEntry } from "./ArtifactsPanel";
import { StreamingText } from "./StreamingText";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import type { DepartmentDTO } from "@/types";
import type { DeptResponseNode } from "./DeptCard";

export interface MeetingPhase {
  phase: "idle" | "round1" | "round2" | "ceo" | "artifacts" | "done";
}

const PHASE_LABEL: Record<string, string> = {
  idle: "대기",
  round1: "1라운드 · 초기 입장",
  round2: "2라운드 · 조율",
  ceo: "대표이사 결정",
  artifacts: "산출물 생성",
  done: "완료",
};
const PHASE_ORDER = ["round1", "round2", "ceo", "artifacts", "done"];

export function MeetingView({
  departments,
  byDept,
  summary,
  summaryStreaming,
  artifacts,
  phase,
  streaming,
  onStart,
  alreadyHasData,
  commandId,
  companyId,
  hasGithub,
}: {
  departments: DepartmentDTO[];
  byDept: Record<string, DeptResponseNode[]>;
  summary: string;
  summaryStreaming: boolean;
  artifacts: ArtifactEntry[];
  phase: MeetingPhase["phase"];
  streaming: boolean;
  onStart: () => void;
  alreadyHasData: boolean;
  commandId?: string;
  companyId?: string;
  hasGithub?: boolean;
}) {
  const [showRound1, setShowRound1] = useState(true);

  return (
    <div className="space-y-6">
      {!alreadyHasData && phase === "idle" && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
          <span className="text-sm text-amber-800">
            회의가 아직 시작되지 않았습니다.
          </span>
          <button
            onClick={onStart}
            disabled={streaming}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
          >
            {streaming ? "회의 중..." : "회의 시작"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
        {PHASE_ORDER.map((p) => {
          const active = phase === p;
          const passed = PHASE_ORDER.indexOf(phase) > PHASE_ORDER.indexOf(p);
          return (
            <div
              key={p}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap",
                active && "border-brand-500 bg-brand-50 text-brand-700",
                passed && !active && "border-emerald-200 bg-emerald-50 text-emerald-700",
                !active && !passed && "border-slate-200 text-slate-500"
              )}
            >
              {passed && !active && <span>✓</span>}
              {active && <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />}
              {PHASE_LABEL[p]}
            </div>
          );
        })}
      </div>

      <details className="rounded-xl border border-slate-200 bg-white" open={showRound1}>
        <summary
          className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={(e) => {
            e.preventDefault();
            setShowRound1((s) => !s);
          }}
        >
          🗣️ 1라운드 · 각 부장 초기 입장 {showRound1 ? "▼" : "▶"}
        </summary>
        {showRound1 && (
          <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2">
            {departments.map((d) => {
              const round1Node = (byDept[d.slug] ?? []).find((n) => n.round === 1);
              return (
                <div key={d.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-base">{d.icon}</span>
                    <span className="text-sm font-semibold text-slate-800">{d.name}</span>
                  </div>
                  {round1Node ? (
                    <EmployeeResponseView
                      employeeName={round1Node.employeeName}
                      title={round1Node.title}
                      rank={round1Node.rank}
                      content={round1Node.content}
                      streaming={round1Node.streaming}
                    />
                  ) : (
                    <div className="text-xs text-slate-400">대기 중...</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </details>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          🤝 2라운드 · 부서간 조율
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {departments.map((d) => {
            const round2Node = (byDept[d.slug] ?? []).find((n) => n.round === 2);
            return (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="text-base">{d.icon}</span>
                  <span className="text-sm font-semibold text-slate-800">{d.name}</span>
                </div>
                {round2Node ? (
                  <EmployeeResponseView
                    employeeName={round2Node.employeeName}
                    title={round2Node.title}
                    rank={round2Node.rank}
                    content={round2Node.content}
                    streaming={round2Node.streaming}
                  />
                ) : (
                  <div className="text-xs text-slate-400">대기 중...</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(summary || summaryStreaming || phase === "ceo" || phase === "artifacts" || phase === "done") && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 shadow-md">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name="대표이사" rank="대표" size={48} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                대표이사 최종 결정
              </div>
              <div className="text-sm text-slate-500">모든 부서 의견 종합</div>
            </div>
          </div>
          <StreamingText
            text={summary}
            streaming={summaryStreaming}
            className="whitespace-pre-wrap text-sm leading-7 text-slate-800"
          />
        </div>
      )}

      {(artifacts.length > 0 || phase === "artifacts" || phase === "done") && (
        <ArtifactsPanel
          artifacts={artifacts}
          byDept={byDept}
          departments={departments}
          commandId={commandId}
          companyId={companyId}
          hasGithub={hasGithub}
        />
      )}
    </div>
  );
}
