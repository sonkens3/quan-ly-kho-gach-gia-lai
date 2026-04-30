import { initialWarehouseData } from "@/lib/local/seed";
import type { WarehouseData } from "@/lib/local/types";

export const localSessionKey = "tile_warehouse_local_session";
export const localDataKey = "tile_warehouse_local_data";

export type LocalSession = {
  email: string;
  fullName: string;
  role: "admin";
  createdAt: string;
};

export type LocalBackup = {
  app: "tile-warehouse-app";
  version: 1;
  exportedAt: string;
  data: WarehouseData;
};

export function createBackup(data: WarehouseData): LocalBackup {
  return {
    app: "tile-warehouse-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function createLocalSession(email: string): LocalSession {
  return {
    email,
    fullName: "Chủ kho local",
    role: "admin",
    createdAt: new Date().toISOString(),
  };
}

export function createEmptyLocalBackup(): LocalBackup {
  return createBackup({
    products: [],
    customers: [],
    suppliers: [],
    purchases: [],
    sales: [],
    stockMovements: [],
    payments: [],
    expenses: [],
    auditLogs: [],
  });
}

export function createSeedLocalBackup(): LocalBackup {
  return createBackup(initialWarehouseData);
}
