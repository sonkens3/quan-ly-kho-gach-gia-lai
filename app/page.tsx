import Link from "next/link";
import { ArrowRight, Warehouse } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
            <Warehouse className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Quản lý kho gạch</h1>
            <p className="mt-1 text-sm text-slate-500">Bản chạy miễn phí trên GitHub Pages</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-600">
          Dữ liệu bản miễn phí lưu trong trình duyệt của từng máy. Hãy dùng xuất/nhập backup
          để chuyển dữ liệu giữa các máy.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-800"
          >
            Mở dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
          >
            Đăng nhập local
          </Link>
        </div>
      </section>
    </main>
  );
}
