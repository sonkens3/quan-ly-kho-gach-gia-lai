import { CalendarDays, Download, Filter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type WorkspaceColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type WorkspaceStat = {
  label: string;
  value: string;
  tone?: "green" | "blue" | "amber" | "red" | "slate" | "cyan";
};

export type WorkspaceRow = Record<string, string>;

export function WorkspacePage({
  title,
  eyebrow,
  actionLabel,
  exportLabel = "Xuất Excel",
  stats,
  columns,
  rows,
  searchPlaceholder,
  emptyLabel,
  statusFilters = ["Tất cả", "Hôm nay", "Còn nợ", "Đã xác nhận"],
}: {
  title: string;
  eyebrow: string;
  actionLabel: string;
  exportLabel?: string;
  stats: WorkspaceStat[];
  columns: WorkspaceColumn[];
  rows: WorkspaceRow[];
  searchPlaceholder: string;
  emptyLabel: string;
  statusFilters?: string[];
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-700">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" aria-hidden="true" />
            {exportLabel}
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {actionLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xl font-semibold text-slate-950">{stat.value}</p>
              <Badge tone={stat.tone ?? "slate"}>Realtime</Badge>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-md border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder={searchPlaceholder} />
          </div>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" type="date" />
          </div>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15">
              {statusFilters.map((filter) => (
                <option key={filter}>{filter}</option>
              ))}
            </select>
          </label>
          <Button variant="secondary">Lọc</Button>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "border-b border-slate-200 px-4 py-3 font-semibold",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "border-b border-slate-100 px-4 py-3 text-slate-700",
                          column.align === "right" && "text-right tabular-nums",
                          column.align === "center" && "text-center",
                        )}
                      >
                        {row[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-800">{emptyLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Bản GitHub Pages miễn phí đang dùng dữ liệu cục bộ trong trình duyệt.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
