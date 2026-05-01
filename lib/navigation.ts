import type { UserRole } from "@/lib/auth/roles";

export type NavIcon =
  | "layout-dashboard"
  | "shopping-cart"
  | "truck"
  | "boxes"
  | "receipt"
  | "landmark"
  | "wallet"
  | "users"
  | "factory"
  | "package"
  | "bar-chart"
  | "history"
  | "book-open"
  | "shield"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  roles: UserRole[];
};

export const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: "layout-dashboard",
    roles: ["admin", "partner", "accountant", "warehouse"],
  },
  {
    href: "/sales",
    label: "Bán hàng",
    icon: "shopping-cart",
    roles: ["admin", "partner", "accountant", "warehouse"],
  },
  {
    href: "/purchases",
    label: "Nhập hàng",
    icon: "truck",
    roles: ["admin", "partner", "accountant"],
  },
  {
    href: "/inventory",
    label: "Tồn kho",
    icon: "boxes",
    roles: ["admin", "partner", "accountant", "warehouse"],
  },
  {
    href: "/customer-debts",
    label: "Nợ khách hàng",
    icon: "receipt",
    roles: ["admin", "partner", "accountant"],
  },
  {
    href: "/supplier-debts",
    label: "Nợ nhà cung cấp",
    icon: "landmark",
    roles: ["admin", "partner", "accountant"],
  },
  {
    href: "/cashflow",
    label: "Thu chi",
    icon: "wallet",
    roles: ["admin", "partner", "accountant"],
  },
  {
    href: "/customers",
    label: "Khách hàng",
    icon: "users",
    roles: ["admin", "accountant"],
  },
  {
    href: "/suppliers",
    label: "Nhà cung cấp",
    icon: "factory",
    roles: ["admin", "accountant"],
  },
  {
    href: "/products",
    label: "Sản phẩm gạch",
    icon: "package",
    roles: ["admin", "partner", "accountant", "warehouse"],
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: "bar-chart",
    roles: ["admin", "partner", "accountant"],
  },
  {
    href: "/audit-logs",
    label: "Nhật ký thao tác",
    icon: "history",
    roles: ["admin", "partner"],
  },
  {
    href: "/guide",
    label: "Hướng dẫn sử dụng",
    icon: "book-open",
    roles: ["admin", "partner", "accountant", "warehouse"],
  },
  {
    href: "/users",
    label: "Tài khoản",
    icon: "shield",
    roles: ["admin"],
  },
  {
    href: "/settings",
    label: "Cài đặt",
    icon: "settings",
    roles: ["admin"],
  },
];
