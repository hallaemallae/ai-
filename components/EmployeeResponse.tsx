"use client";

import { Avatar } from "./Avatar";
import { cn, RANK_STYLE } from "@/lib/utils";
import { StreamingText } from "./StreamingText";

export interface EmployeeResponseViewProps {
  employeeName: string;
  rank: string;
  title?: string;
  content: string;
  streaming?: boolean;
  depth?: number;
}

export function EmployeeResponseView({
  employeeName,
  rank,
  title,
  content,
  streaming,
  depth = 0,
}: EmployeeResponseViewProps) {
  const isHead = rank === "부장";
  return (
    <div className={cn("flex items-start gap-3", depth > 0 && "ml-8")}>
      <Avatar name={employeeName} rank={rank} size={isHead ? 52 : 44} />

      <div className="relative flex-1">
        <span
          aria-hidden
          className={cn(
            "absolute left-[-7px] top-5 h-3 w-3 rotate-45 border-l border-b bg-white",
            isHead ? "border-brand-200" : "border-slate-200"
          )}
        />

        <div
          className={cn(
            "relative rounded-2xl border bg-white p-4 shadow-sm",
            isHead ? "border-brand-200" : "border-slate-200"
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                RANK_STYLE[rank] ?? "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              {rank}
            </span>
            <span className="text-sm font-semibold text-slate-800">{employeeName}</span>
            {title && <span className="text-xs text-slate-500">· {title}</span>}
            {streaming && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-brand-600">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand-500" />
                작성 중
              </span>
            )}
          </div>
          <StreamingText text={content} streaming={streaming} />
        </div>
      </div>
    </div>
  );
}
