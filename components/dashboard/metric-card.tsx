import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "cyan",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1",
            toneClasses[tone],
          )}
        >
          {icon}
        </span>
      </div>
      {hint ? <p className="mt-3 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
