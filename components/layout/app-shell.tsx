import Link from "next/link";
import { Warehouse } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocalModeTools } from "@/components/local/local-mode-tools";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { CurrentProfile } from "@/lib/auth/current-user";
import { roleBadgeTone, roleLabels, type UserRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: CurrentProfile | null;
}) {
  const configured = isSupabaseConfigured();
  const role: UserRole = configured ? profile?.role ?? "partner" : "admin";
  const displayName = profile?.fullName ?? "Chế độ local miễn phí";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-5 py-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white shadow-soft">
            <Warehouse className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold text-slate-950">Kho gạch</span>
            <span className="block text-xs text-slate-500">
              {configured ? "Realtime" : "Local free"}
            </span>
          </span>
        </Link>

        <div className="mt-7">
          <SidebarNav role={role} />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-7">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-700 text-white">
                <Warehouse className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-semibold text-slate-950">Kho gạch</span>
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="text-sm text-slate-500">Phiên làm việc</p>
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                <Badge tone={roleBadgeTone[role]}>{roleLabels[role]}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!configured ? <Badge tone="amber">Local free</Badge> : null}
              <SignOutButton />
            </div>
          </div>

          <div className="border-t border-slate-100 lg:hidden">
            <SidebarNav role={role} />
          </div>
        </header>

        {!profile?.isActive && configured ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 lg:px-7">
            Tài khoản chưa có hồ sơ hoạt động trong bảng profiles.
          </div>
        ) : null}

        <main className="space-y-5 px-4 py-5 lg:px-7 lg:py-7">
          {!configured ? <LocalModeTools /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
