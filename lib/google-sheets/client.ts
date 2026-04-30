"use client";

import type { WarehouseData } from "@/lib/local/types";

export const sheetEndpointKey = "tile_warehouse_sheet_endpoint";
export const sheetAppKeyKey = "tile_warehouse_sheet_app_key";

export type SheetConfig = {
  endpoint: string;
  appKey: string;
};

type SheetResponse = {
  ok: boolean;
  version?: number;
  data?: WarehouseData;
  error?: string;
};

let callbackCounter = 0;

function getWindow() {
  return typeof window === "undefined" ? null : window;
}

export function getStoredSheetConfig(): SheetConfig {
  const win = getWindow();

  if (!win) {
    return getBuildSheetConfig();
  }

  const storedEndpoint = win.localStorage.getItem(sheetEndpointKey) ?? "";
  const storedAppKey = win.localStorage.getItem(sheetAppKeyKey) ?? "";
  const buildConfig = getBuildSheetConfig();

  return {
    endpoint: storedEndpoint || buildConfig.endpoint,
    appKey: storedAppKey || buildConfig.appKey,
  };
}

export function saveStoredSheetConfig(config: SheetConfig) {
  const win = getWindow();

  if (!win) {
    return;
  }

  win.localStorage.setItem(sheetEndpointKey, config.endpoint.trim());
  win.localStorage.setItem(sheetAppKeyKey, config.appKey.trim());
}

export function isSheetConfigured(config = getStoredSheetConfig()) {
  return Boolean(config.endpoint.trim());
}

function getBuildSheetConfig(): SheetConfig {
  return {
    endpoint: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ?? "",
    appKey: process.env.NEXT_PUBLIC_GOOGLE_APP_KEY ?? "",
  };
}

function getConfigFileUrl() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}/google-sheet-config.json`;
}

export async function loadSheetConfig() {
  const buildConfig = getBuildSheetConfig();

  if (isSheetConfigured(buildConfig)) {
    return buildConfig;
  }

  try {
    const response = await fetch(getConfigFileUrl(), { cache: "no-store" });

    if (!response.ok) {
      return getStoredSheetConfig();
    }

    const fileConfig = (await response.json()) as Partial<SheetConfig>;
    const resolvedConfig = {
      endpoint: String(fileConfig.endpoint ?? "").trim(),
      appKey: String(fileConfig.appKey ?? "").trim(),
    };

    if (isSheetConfigured(resolvedConfig)) {
      saveStoredSheetConfig(resolvedConfig);
      return resolvedConfig;
    }
  } catch {
    return getStoredSheetConfig();
  }

  return getStoredSheetConfig();
}

function jsonpRequest(endpoint: string, params: Record<string, string>, timeoutMs = 20000) {
  const win = getWindow();

  if (!win) {
    return Promise.reject(new Error("Không chạy trong trình duyệt."));
  }

  return new Promise<SheetResponse>((resolve, reject) => {
    const callbackName = `__tileWarehouseSheetCallback${Date.now()}${callbackCounter++}`;
    const url = new URL(endpoint);
    const script = document.createElement("script");
    let settled = false;

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    url.searchParams.set("callback", callbackName);

    function cleanup() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    }

    (window as unknown as Record<string, (response: SheetResponse) => void>)[callbackName] = (
      response,
    ) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(response);
    };

    script.onerror = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error("Không kết nối được Google Apps Script."));
    };

    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error("Google Sheet phản hồi quá lâu."));
    }, timeoutMs);

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function assertOk(response: SheetResponse) {
  if (!response.ok || !response.data) {
    throw new Error(response.error || "Google Sheet trả về dữ liệu không hợp lệ.");
  }

  return response.data;
}

export async function fetchSheetSnapshot(config = getStoredSheetConfig()) {
  const response = await jsonpRequest(config.endpoint, {
    action: "snapshot",
    key: config.appKey,
  });
  return assertOk(response);
}

export async function mutateSheet(
  type: string,
  payload: Record<string, FormDataEntryValue | string | number | undefined>,
  config = getStoredSheetConfig(),
) {
  const response = await jsonpRequest(config.endpoint, {
    action: "mutate",
    type,
    key: config.appKey,
    payload: JSON.stringify(payload),
  });
  return assertOk(response);
}

export function formDataToPayload(formData: FormData) {
  return Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue>;
}
