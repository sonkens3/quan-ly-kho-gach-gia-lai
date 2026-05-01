"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  autoFileBackupChangedEvent,
  getAutoBackupFileHandle,
  isAutoFileBackupSupported,
  writeBackupToFile,
  type AutoBackupFileHandle,
} from "@/lib/local/auto-file-backup";
import type { WarehouseData } from "@/lib/local/types";

const autoBackupIntervalMs = 10 * 60 * 1000;
const dataChangeDelayMs = 1500;

export function AutoFileBackupAgent({ data }: { data: WarehouseData | null }) {
  const [handle, setHandle] = useState<AutoBackupFileHandle | null>(null);
  const dataRef = useRef<WarehouseData | null>(data);
  const writingRef = useRef(false);
  const pendingRef = useRef(false);
  const dataFingerprint = useMemo(() => (data ? JSON.stringify(data) : ""), [data]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isAutoFileBackupSupported()) {
      return;
    }

    let canceled = false;

    async function loadHandle() {
      const savedHandle = await getAutoBackupFileHandle();

      if (!canceled) {
        setHandle(savedHandle);
      }
    }

    void loadHandle();
    window.addEventListener(autoFileBackupChangedEvent, loadHandle);

    return () => {
      canceled = true;
      window.removeEventListener(autoFileBackupChangedEvent, loadHandle);
    };
  }, []);

  const writeBackup = useCallback(async () => {
    if (!handle || !dataRef.current) {
      return;
    }

    if (writingRef.current) {
      pendingRef.current = true;
      return;
    }

    writingRef.current = true;

    try {
      await writeBackupToFile(handle, dataRef.current, false);
    } catch {
      // Auto backup is best-effort. The settings panel shows how to re-grant file permission.
    } finally {
      writingRef.current = false;

      if (pendingRef.current) {
        pendingRef.current = false;
        void writeBackup();
      }
    }
  }, [handle]);

  useEffect(() => {
    if (!handle || !dataFingerprint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void writeBackup();
    }, dataChangeDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dataFingerprint, handle, writeBackup]);

  useEffect(() => {
    if (!handle) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void writeBackup();
    }, autoBackupIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [handle, writeBackup]);

  return null;
}
