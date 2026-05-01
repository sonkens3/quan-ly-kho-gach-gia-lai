"use client";

import { createBackup, type LocalBackup } from "@/lib/local/free-mode";
import type { WarehouseData } from "@/lib/local/types";

export const autoFileBackupChangedEvent = "tile-warehouse-auto-file-backup-changed";

const dbName = "tile_warehouse_auto_file_backup";
const storeName = "handles";
const backupHandleKey = "backup-file";

type AutoBackupPermissionDescriptor = {
  mode?: "read" | "readwrite";
};

export type AutoBackupFileHandle = {
  kind: "file";
  name: string;
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
  queryPermission?: (descriptor?: AutoBackupPermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (descriptor?: AutoBackupPermissionDescriptor) => Promise<PermissionState>;
};

type WindowWithFilePicker = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<AutoBackupFileHandle>;
};

function getWindow() {
  return typeof window === "undefined" ? null : (window as WindowWithFilePicker);
}

export function isAutoFileBackupSupported() {
  const win = getWindow();

  return Boolean(win?.isSecureContext && win.showSaveFilePicker && win.indexedDB);
}

function openAutoBackupDb() {
  const win = getWindow();

  if (!win) {
    return Promise.reject(new Error("Không chạy trong trình duyệt."));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = win.indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không mở được IndexedDB."));
  });
}

async function runHandleTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openAutoBackupDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thao tác được IndexedDB."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Không lưu được cấu hình backup tự động."));
    };
  });
}

export async function getAutoBackupFileHandle() {
  if (!isAutoFileBackupSupported()) {
    return null;
  }

  return runHandleTransaction<AutoBackupFileHandle | undefined>("readonly", (store) =>
    store.get(backupHandleKey),
  ).then((handle) => handle ?? null);
}

export async function saveAutoBackupFileHandle(handle: AutoBackupFileHandle) {
  await runHandleTransaction<IDBValidKey>("readwrite", (store) => store.put(handle, backupHandleKey));
  window.dispatchEvent(new CustomEvent(autoFileBackupChangedEvent));
}

export async function chooseAutoBackupFile() {
  const win = getWindow();

  if (!isAutoFileBackupSupported() || !win?.showSaveFilePicker) {
    throw new Error("Trình duyệt này chưa hỗ trợ ghi file backup tự động.");
  }

  const handle = await win.showSaveFilePicker({
    suggestedName: "kho-gach-auto-backup.json",
    types: [
      {
        description: "JSON backup",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
  });

  await saveAutoBackupFileHandle(handle);
  return handle;
}

export async function hasAutoBackupWritePermission(
  handle: AutoBackupFileHandle,
  requestPermission = false,
) {
  const descriptor = { mode: "readwrite" as const };

  if (handle.queryPermission && (await handle.queryPermission(descriptor)) === "granted") {
    return true;
  }

  if (requestPermission && handle.requestPermission) {
    return (await handle.requestPermission(descriptor)) === "granted";
  }

  return false;
}

export function makeBackupJson(data: WarehouseData): string {
  return JSON.stringify(createBackup(data), null, 2);
}

export async function writeBackupToFile(
  handle: AutoBackupFileHandle,
  data: WarehouseData,
  requestPermission = false,
) {
  const allowed = await hasAutoBackupWritePermission(handle, requestPermission);

  if (!allowed) {
    throw new Error("Chưa có quyền ghi file backup. Vào Cài đặt và bấm Chọn file backup tự động.");
  }

  const writable = await handle.createWritable();
  await writable.write(makeBackupJson(data));
  await writable.close();
}

export function backupToData(backup: LocalBackup) {
  return backup.data;
}
