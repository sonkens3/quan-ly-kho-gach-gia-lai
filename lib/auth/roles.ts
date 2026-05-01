export const userRoles = ["admin", "partner", "accountant", "warehouse"] as const;

export type UserRole = (typeof userRoles)[number];

export const roleLabels: Record<UserRole, string> = {
  admin: "Chủ kho",
  partner: "Người góp chung",
  accountant: "Kế toán",
  warehouse: "Nhân viên kho",
};

export const roleBadgeTone: Record<UserRole, "green" | "blue" | "amber" | "slate"> = {
  admin: "green",
  partner: "blue",
  accountant: "amber",
  warehouse: "slate",
};

export type Permission =
  | "view_dashboard"
  | "manage_users"
  | "manage_master_data"
  | "manage_transactions"
  | "view_finance"
  | "view_inventory"
  | "confirm_delivery"
  | "view_audit_logs";

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "manage_users",
    "manage_master_data",
    "manage_transactions",
    "view_finance",
    "view_inventory",
    "confirm_delivery",
    "view_audit_logs",
  ],
  partner: ["view_dashboard", "view_finance", "view_inventory", "view_audit_logs"],
  accountant: [
    "view_dashboard",
    "manage_master_data",
    "manage_transactions",
    "view_finance",
    "view_inventory",
  ],
  warehouse: ["view_dashboard", "view_inventory", "confirm_delivery"],
};

export const routeRoles: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/dashboard", roles: ["admin", "partner", "accountant", "warehouse"] },
  { prefix: "/sales", roles: ["admin", "partner", "accountant", "warehouse"] },
  { prefix: "/purchases", roles: ["admin", "partner", "accountant"] },
  { prefix: "/inventory", roles: ["admin", "partner", "accountant", "warehouse"] },
  { prefix: "/customer-debts", roles: ["admin", "partner", "accountant"] },
  { prefix: "/supplier-debts", roles: ["admin", "partner", "accountant"] },
  { prefix: "/cashflow", roles: ["admin", "partner", "accountant"] },
  { prefix: "/customers", roles: ["admin", "accountant"] },
  { prefix: "/suppliers", roles: ["admin", "accountant"] },
  { prefix: "/products", roles: ["admin", "partner", "accountant", "warehouse"] },
  { prefix: "/reports", roles: ["admin", "partner", "accountant"] },
  { prefix: "/audit-logs", roles: ["admin", "partner"] },
  { prefix: "/guide", roles: ["admin", "partner", "accountant", "warehouse"] },
  { prefix: "/users", roles: ["admin"] },
  { prefix: "/settings", roles: ["admin"] },
];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function hasPermission(role: UserRole | null | undefined, permission: Permission) {
  if (!role) {
    return false;
  }

  return rolePermissions[role].includes(permission);
}

export function canAccessPath(pathname: string, role: UserRole | null | undefined) {
  const matchedRoute = routeRoles
    .filter((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!matchedRoute) {
    return true;
  }

  if (!role) {
    return false;
  }

  return matchedRoute.roles.includes(role);
}
