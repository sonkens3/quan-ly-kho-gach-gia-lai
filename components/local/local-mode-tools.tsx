"use client";

import { Download, HardDrive, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createEmptyLocalBackup, localDataKey } from "@/lib/local/free-mode";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function LocalModeTools() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function ensureLocalData() {
    const current = window.localStorage.getItem(localDataKey);

    if (!current) {
      window.localStorage.setItem(localDataKey, JSON.stringify(createEmptyLocalBackup()));
    }
  }

  function handleExport() {
    ensureLocalData();
    const backup = window.localStorage.getItem(localDataKey) ?? JSON.stringify(createEmptyLocalBackup());
    const today = new Date().toISOString().slice(0, 10);
    downloadTextFile(`kho-gach-backup-${today}.json`, backup);
    setMessage("Đã xuất file backup JSON.");
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as { app?: string; version?: number };

      if (parsed.app !== "tile-warehouse-app" || parsed.version !== 1) {
        setMessage("File backup không đúng định dạng.");
        return;
      }

      window.localStorage.setItem(localDataKey, content);
      setMessage("Đã nhập backup vào trình duyệt này.");
    } catch {
      setMessage("Không đọc được file backup.");
    }
  }

  function handleReset() {
    window.localStorage.setItem(localDataKey, JSON.stringify(createEmptyLocalBackup()));
    setMessage("Đã tạo lại kho dữ liệu cục bộ rỗng.");
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-2">
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Backup dữ liệu</p>
            <p className="mt-1 text-sm text-amber-900">
              Google Sheet được cấu hình trong file hệ thống. Khu vực này chỉ dùng để xuất hoặc nhập backup JSON.
            </p>
            {message ? <p className="mt-1 text-sm font-medium">{message}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Xuất backup
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Nhập backup
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Tạo dữ liệu rỗng
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          void handleImport(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
