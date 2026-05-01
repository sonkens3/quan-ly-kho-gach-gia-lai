"use client";

import { ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredFileAuthSession, type FileAuthSession } from "@/lib/auth/file-auth";
import { canAccessPath } from "@/lib/auth/roles";

export function LocalAuthGuard({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<FileAuthSession | null>();

  useEffect(() => {
    if (!enabled) {
      setSession(null);
      return;
    }

    const storedSession = getStoredFileAuthSession();

    if (!storedSession) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!canAccessPath(pathname, storedSession.role)) {
      router.replace("/dashboard");
      return;
    }

    setSession(storedSession);
  }, [enabled, pathname, router]);

  if (!enabled) {
    return <>{children}</>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 text-center shadow-soft">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-950">Dang kiem tra dang nhap...</p>
          <p className="mt-1 text-sm text-slate-500">Neu thiet bi nay chua dang nhap, he thong se chuyen ve man hinh dang nhap.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
