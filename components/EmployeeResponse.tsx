"use client";

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
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        isHead ? "border-brand-200" : "border-slate-200",
        depth > 0 && "ml-6 border-l-4 border-l-brand-200"
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
  );
}
