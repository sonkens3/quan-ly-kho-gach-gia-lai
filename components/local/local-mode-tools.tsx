"use client";

import { Download, HardDrive, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  chooseAutoBackupFile,
  getAutoBackupFileHandle,
  isAutoFileBackupSupported,
  writeBackupToFile,
  type AutoBackupFileHandle,
} from "@/lib/local/auto-file-backup";
import { createBackup, createEmptyLocalBackup, localDataKey, type LocalBackup } from "@/lib/local/free-mode";
import type { WarehouseData } from "@/lib/local/types";

type RestoreResult = {
  ok: boolean;
  message: string;
};

type LocalModeToolsProps = {
  data?: WarehouseData | null;
  disabled?: boolean;
  onRestore?: (backup: LocalBackup) => Promise<RestoreResult> | RestoreResult;
  syncMode?: "local" | "google-sheet";
};

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

function getStoredBackup() {
  try {
    const raw = window.localStorage.getItem(localDataKey);
    return raw ? (JSON.parse(raw) as LocalBackup) : createEmptyLocalBackup();
  } catch {
    return createEmptyLocalBackup();
  }
}

function isValidBackup(value: unknown): value is LocalBackup {
  const backup = value as Partial<LocalBackup>;
  return backup.app === "tile-warehouse-app" && backup.version === 1 && Boolean(backup.data);
}

export function LocalModeTools({
  data,
  disabled = false,
  onRestore,
  syncMode = "local",
}: LocalModeToolsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [autoBackupMessage, setAutoBackupMessage] = useState<string | null>(null);
  const [autoBackupHandle, setAutoBackupHandle] = useState<AutoBackupFileHandle | null>(null);
  const [autoBackupSupported, setAutoBackupSupported] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const supported = isAutoFileBackupSupported();
    setAutoBackupSupported(supported);

    if (!supported) {
      setAutoBackupMessage("Trình duyệt này chưa hỗ trợ ghi file tự động. Nên dùng Chrome hoặc Edge trên PC.");
      return;
    }

    let canceled = false;

    void getAutoBackupFileHandle().then((handle) => {
      if (canceled) {
        return;
      }

      setAutoBackupHandle(handle);
      setAutoBackupMessage(
        handle
          ? `Đã cấu hình file ${handle.name}. Khi còn mở web, hệ thống sẽ tự ghi khi dữ liệu đổi và mỗi 10 phút.`
          : "Chưa chọn file backup tự động. Bấm Chọn file để tạo file JSON ở thư mục bạn muốn.",
      );
    });

    return () => {
      canceled = true;
    };
  }, []);

  function handleExport() {
    const backup = data ? createBackup(data) : getStoredBackup();
    const today = new Date().toISOString().slice(0, 10);

    window.localStorage.setItem(localDataKey, JSON.stringify(backup));
    downloadTextFile(`kho-gach-backup-${today}.json`, JSON.stringify(backup, null, 2));
    setMessage("Đã xuất file backup JSON đầy đủ.");
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const parsed = JSON.parse(content) as unknown;

      if (!isValidBackup(parsed)) {
        setMessage("File backup không đúng định dạng.");
        return;
      }

      const confirmed = window.confirm(
        syncMode === "google-sheet"
          ? "Nhập backup sẽ ghi đè toàn bộ dữ liệu trong Google Sheet hiện tại. Bạn có chắc muốn phục hồi không?"
          : "Nhập backup sẽ ghi đè dữ liệu local hiện tại. Bạn có chắc muốn phục hồi không?",
      );

      if (!confirmed) {
        setMessage("Đã hủy nhập backup.");
        return;
      }

      setIsImporting(true);
      const result = onRestore
        ? await onRestore(parsed)
        : (() => {
            window.localStorage.setItem(localDataKey, content);
            return { ok: true, message: "Đã nhập backup vào trình duyệt này." };
          })();

      setMessage(result.message);
    } catch {
      setMessage("Không đọc được file backup.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleChooseAutoBackupFile() {
    try {
      const handle = await chooseAutoBackupFile();
      const backupData = data ?? getStoredBackup().data;

      await writeBackupToFile(handle, backupData, true);
      setAutoBackupHandle(handle);
      setAutoBackupMessage(`Đã chọn và ghi backup vào file ${handle.name}.`);
    } catch (error) {
      setAutoBackupMessage(error instanceof Error ? error.message : "Không chọn được file backup tự động.");
    }
  }

  async function handleWriteAutoBackupNow() {
    if (!autoBackupHandle) {
      setAutoBackupMessage("Chưa chọn file backup tự động.");
      return;
    }

    try {
      await writeBackupToFile(autoBackupHandle, data ?? getStoredBackup().data, true);
      setAutoBackupMessage(`Đã cập nhật file ${autoBackupHandle.name}.`);
    } catch (error) {
      setAutoBackupMessage(error instanceof Error ? error.message : "Không ghi được file backup.");
    }
  }

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-2">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Backup và phục hồi dữ liệu</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Xuất file JSON để cất riêng. Khi Sheet lỗi hoặc cần tạo Sheet mới, cấu hình app trỏ sang Sheet mới rồi
                bấm Nhập backup để ghi lại toàn bộ dữ liệu.
              </p>
              {message ? <p className="mt-1 text-sm font-medium">{message}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleExport} disabled={disabled || isImporting}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Xuất backup JSON
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isImporting}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isImporting ? "Đang nhập..." : "Nhập phục hồi"}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-amber-300 bg-white/55 p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold">Backup tự động trên PC</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Chọn một file JSON ở ổ C hoặc thư mục bạn muốn. Sau đó khi web còn mở, file sẽ tự cập nhật khi dữ liệu
                thay đổi và tự ghi lại mỗi 10 phút.
              </p>
              {autoBackupMessage ? <p className="mt-1 text-sm font-medium">{autoBackupMessage}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleChooseAutoBackupFile}
                disabled={disabled || !autoBackupSupported}
              >
                <HardDrive className="h-4 w-4" aria-hidden="true" />
                Chọn file backup tự động
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleWriteAutoBackupNow}
                disabled={disabled || !autoBackupSupported || !autoBackupHandle}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Ghi backup ngay
              </Button>
            </div>
          </div>
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
    </section>
  );
}
