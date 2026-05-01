"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Factory,
  History,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { mainNavItems, type NavIcon } from "@/lib/navigation";
import type { UserRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const iconMap: Record<NavIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "shopping-cart": ShoppingCart,
  truck: Truck,
  boxes: Boxes,
  receipt: Receipt,
  landmark: Landmark,
  wallet: Wallet,
  users: Users,
  factory: Factory,
  package: Package,
  "bar-chart": BarChart3,
  history: History,
  "book-open": BookOpen,
  shield: ShieldCheck,
  settings: Settings,
};

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = mainNavItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors lg:w-full",
              active
                ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100"
                : "hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
