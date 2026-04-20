import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_LABEL: Record<string, string> = {
  urgent: "긴급",
  normal: "일반",
  low: "낮음",
};

export const PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  normal: "bg-brand-100 text-brand-700 border-brand-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export const RANK_STYLE: Record<string, string> = {
  부장: "bg-amber-100 text-amber-800 border-amber-200",
  과장: "bg-indigo-100 text-indigo-800 border-indigo-200",
  대리: "bg-emerald-100 text-emerald-800 border-emerald-200",
  사원: "bg-slate-100 text-slate-700 border-slate-200",
};
