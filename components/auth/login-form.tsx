"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  authenticateFromFile,
  getStoredFileAuthSession,
  saveFileAuthSession,
} from "@/lib/auth/file-auth";
import { createSeedLocalBackup, localDataKey } from "@/lib/local/free-mode";

const loginSchema = z.object({
  username: z.string().min(1, "Nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (getStoredFileAuthSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(values: LoginValues) {
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await authenticateFromFile(values.username, values.password);
      saveFileAuthSession(session);

      if (!window.localStorage.getItem(localDataKey)) {
        window.localStorage.setItem(localDataKey, JSON.stringify(createSeedLocalBackup()));
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath?.startsWith("/") ? nextPath : "/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Không đăng nhập được.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
        Tài khoản đăng nhập được đọc từ file{" "}
        <span className="font-semibold">public/auth-users.json</span>. Thiết bị đã đăng nhập sẽ tự
        vào trang chính trong lần sau.
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="username">
          Tên đăng nhập
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="username"
            type="text"
            autoComplete="username"
            className="pl-9"
            placeholder="admin"
            {...register("username")}
          />
        </div>
        {errors.username ? <p className="text-sm text-red-600">{errors.username.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          Mật khẩu
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="pl-9"
            placeholder="••••••••"
            {...register("password")}
          />
        </div>
        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
