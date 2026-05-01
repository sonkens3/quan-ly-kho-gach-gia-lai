"use client";

import { Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredFileAuthSession } from "@/lib/auth/file-auth";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredFileAuthSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 text-center shadow-soft">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
          <Warehouse className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-950">Dang mo phan mem kho gach...</p>
      </div>
    </main>
  );
}
