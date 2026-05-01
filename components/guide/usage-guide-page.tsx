import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  FileDown,
  PackagePlus,
  ReceiptText,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";

const guideSteps = [
  {
    title: "1. Tạo nhà cung cấp",
    href: "/suppliers",
    action: "Mở Nhà cung cấp",
    icon: Truck,
    body:
      "Vào Nhà cung cấp, bấm Thêm NCC, nhập tên, số điện thoại, người liên hệ, địa chỉ và ghi chú nếu có. Nên tạo nhà cung cấp trước để sản phẩm và phiếu nhập có dữ liệu liên kết đúng.",
  },
  {
    title: "2. Tạo sản phẩm gạch",
    href: "/products",
    action: "Mở Sản phẩm",
    icon: PackagePlus,
    body:
      "Vào Sản phẩm gạch, bấm Thêm sản phẩm. Nhập mã hàng, tên hàng, loại, kích thước, viên/thùng, m2/thùng, giá nhập, giá bán, nhà cung cấp và tồn tối thiểu. Mã hàng nên rõ ràng, ví dụ G6060-A01.",
  },
  {
    title: "3. Nhập hàng vào kho",
    href: "/purchases",
    action: "Mở Nhập hàng",
    icon: ReceiptText,
    body:
      "Vào Nhập hàng, bấm Tạo phiếu nhập. Chọn ngày nhập, nhà cung cấp, sản phẩm, số lượng thùng, đơn giá nhập và số tiền đã trả. Khi lưu, hệ thống tự cộng tồn kho và tạo công nợ nhà cung cấp nếu chưa trả đủ.",
  },
  {
    title: "4. Tạo khách hàng",
    href: "/customers",
    action: "Mở Khách hàng",
    icon: UserPlus,
    body:
      "Vào Khách hàng, bấm Thêm khách. Nhập tên khách, số điện thoại, địa chỉ, nhóm khách và ghi chú. Nên tạo khách trước khi bán để lịch sử mua hàng và công nợ theo đúng người.",
  },
  {
    title: "5. Tạo đơn bán hàng",
    href: "/sales",
    action: "Mở Bán hàng",
    icon: ShoppingCart,
    body:
      "Vào Bán hàng, bấm Tạo đơn. Chọn ngày bán, khách hàng, sản phẩm, số lượng, đơn giá bán, chiết khấu, phí giao hàng và số tiền khách đã trả. Hệ thống tự kiểm tra tồn, trừ kho và ghi công nợ nếu khách chưa trả đủ.",
  },
  {
    title: "6. Ghi nhận khách trả nợ",
    href: "/customer-debts",
    action: "Mở Nợ khách",
    icon: CircleDollarSign,
    body:
      "Vào Nợ khách hàng, bấm Ghi nhận thu. Chọn ngày trả, khách hàng, nhập số tiền khách trả và phương thức thanh toán. Hệ thống tự trừ vào các đơn còn nợ cũ nhất trước, rồi cập nhật tổng đã trả và còn nợ.",
  },
  {
    title: "7. Kiểm tra tồn kho và công nợ",
    href: "/inventory",
    action: "Mở Tồn kho",
    icon: CheckCircle2,
    body:
      "Vào Tồn kho để xem số thùng còn lại, giá trị tồn, hàng sắp hết hoặc hết hàng. Vào Nợ khách hàng và Nợ nhà cung cấp để xem ngày phát sinh nợ, ngày trả gần nhất, tổng đã mua/nhập, đã trả và còn nợ.",
  },
  {
    title: "8. Theo dõi thu chi và báo cáo",
    href: "/cashflow",
    action: "Mở Thu chi",
    icon: BookOpen,
    body:
      "Vào Thu chi để xem tiền thu từ bán hàng, khách trả nợ, tiền chi nhập hàng và các khoản chi phí khác. Vào Báo cáo để xem tổng hợp doanh thu, chi phí, giá vốn tạm tính và lợi nhuận tạm tính.",
  },
  {
    title: "9. Sao lưu dữ liệu",
    href: "/settings",
    action: "Mở Cài đặt",
    icon: FileDown,
    body:
      "Ở khung Backup dữ liệu, bấm Xuất backup để tải file JSON về máy. Khi dùng máy khác hoặc cần phục hồi, bấm Nhập backup và chọn file đã xuất. Nếu đang dùng Google Sheet, dữ liệu chính nằm trong Sheet và app tự đọc lại định kỳ.",
  },
];

export function UsageGuidePage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-700">Hướng dẫn sử dụng</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Quy trình dùng phần mềm kho gạch
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Làm theo thứ tự dưới đây để dữ liệu tồn kho, công nợ, thu chi và báo cáo tự khớp với
              nhau. Người mới chỉ cần đọc từ bước 1 đến bước 9 là có thể vận hành cơ bản.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Backup dữ liệu
          </Link>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        {guideSteps.map((step) => {
          const Icon = step.icon;

          return (
            <article key={step.title} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-950">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex text-sm font-medium text-cyan-700 hover:text-cyan-900"
                  >
                    {step.action}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <div className="flex gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            Lưu ý: trước khi bán hàng phải có sản phẩm và tồn kho. Nếu hệ thống báo không đủ tồn,
            hãy nhập hàng trước hoặc kiểm tra lại lịch sử nhập/bán của mã hàng đó.
          </p>
        </div>
      </section>
    </div>
  );
}
