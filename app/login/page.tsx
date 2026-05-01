import { ShieldCheck, Warehouse } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_480px]">
      <section className="flex min-h-[36rem] items-center justify-center border-b border-slate-200 bg-white px-6 py-10 lg:border-b-0 lg:border-r">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-700 text-white shadow-soft">
              <Warehouse className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Kho gạch</h1>
              <p className="mt-1 text-sm text-slate-500">Quản lý hàng, tiền và công nợ</p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              ["Tồn kho", "Theo thùng, viên, m2"],
              ["Công nợ", "Khách hàng, nhà cung cấp"],
              ["Thu chi", "Phiếu thu, phiếu chi"],
              ["Tài khoản", "Đọc từ file auth-users.json"],
            ].map(([title, value]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Đăng nhập</h2>
              <p className="mt-1 text-sm text-slate-500">Dùng tài khoản trong file cấu hình</p>
            </div>
            <Badge tone="green">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              File
            </Badge>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
