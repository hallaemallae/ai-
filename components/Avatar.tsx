"use client";

import { useState } from "react";
import { avatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const RANK_COLOR: Record<string, string> = {
  대표: "bg-amber-200 text-amber-900",
  부장: "bg-amber-100 text-amber-800",
  과장: "bg-indigo-100 text-indigo-800",
  대리: "bg-emerald-100 text-emerald-800",
  사원: "bg-slate-100 text-slate-700",
};

export function Avatar({
  name,
  rank,
  size = 48,
  className,
}: {
  name: string;
  rank: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-slate-200 font-bold shadow-sm",
          RANK_COLOR[rank] ?? "bg-slate-100 text-slate-700",
          className
        )}
      >
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl(name, rank, size * 2)}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full border border-slate-200 bg-white shadow-sm",
        className
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
