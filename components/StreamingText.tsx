"use client";

import { cn } from "@/lib/utils";

export function StreamingText({
  text,
  streaming,
  className,
}: {
  text: string;
  streaming?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("whitespace-pre-wrap text-sm leading-6 text-slate-700", className)}>
      {text || (streaming ? "생각 중..." : "아직 응답이 없습니다.")}
      {streaming && (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-brand-500 align-middle" />
      )}
    </div>
  );
}
