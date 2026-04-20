import { cn, PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.normal
      )}
    >
      {PRIORITY_LABEL[priority] ?? priority}
    </span>
  );
}
