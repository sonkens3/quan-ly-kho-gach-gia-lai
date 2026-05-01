"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Download, Filter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import {
  getCustomerBought,
  getCustomerDebt,
  getCustomerName,
  getCustomerPaid,
  getSupplierDebt,
  getSupplierImported,
  getSupplierName,
  getSupplierPaid,
  sum,
} from "@/lib/local/calculations";
import { useWarehouseStore } from "@/lib/local/store";
import type { InventoryRow, WarehouseData } from "@/lib/local/types";
import { modulePages, type ModulePageConfig } from "@/lib/module-pages";
import { cn } from "@/lib/utils";

type PageKey = keyof typeof modulePages;

type Row = Record<string, string>;

const usageSteps = [
  {
    title: "1. Tạo nhà cung cấp",
    href: "/suppliers",
    body:
      "Vào Nhà cung cấp, bấm Thêm NCC, nhập tên nhà cung cấp, số điện thoại, người liên hệ, địa chỉ rồi bấm Lưu. Bước này nên làm trước để sản phẩm và phiếu nhập có nơi liên kết.",
  },
  {
    title: "2. Tạo sản phẩm gạch",
    href: "/products",
    body:
      "Vào Sản phẩm gạch, bấm Thêm sản phẩm. Nhập mã hàng, tên hàng, loại, kích thước, quy cách viên/thùng, m2/thùng, giá nhập, giá bán, nhà cung cấp và tồn tối thiểu. Mã hàng nên đặt rõ như G6060-A01 để dễ tìm.",
  },
  {
    title: "3. Nhập hàng vào kho",
    href: "/purchases",
    body:
      "Vào Nhập hàng, bấm Tạo phiếu nhập. Chọn ngày nhập, nhà cung cấp, sản phẩm, số lượng thùng, đơn giá nhập và số tiền đã trả. Khi lưu, hệ thống tự cộng tồn kho, ghi lịch sử nhập và tạo công nợ nhà cung cấp nếu chưa trả đủ.",
  },
  {
    title: "4. Tạo khách hàng",
    href: "/customers",
    body:
      "Vào Khách hàng, bấm Thêm khách. Nhập tên khách, số điện thoại, địa chỉ, nhóm khách và ghi chú nếu có. Nên tạo khách trước khi bán để công nợ và lịch sử mua hàng theo đúng người.",
  },
  {
    title: "5. Tạo đơn bán hàng",
    href: "/sales",
    body:
      "Vào Bán hàng, bấm Tạo đơn. Chọn ngày bán, khách hàng, sản phẩm, số lượng, đơn giá bán, chiết khấu, phí giao hàng và số tiền khách đã trả. Khi lưu, hệ thống kiểm tra tồn kho; nếu đủ hàng thì trừ tồn, ghi doanh thu và tạo công nợ nếu khách chưa trả đủ.",
  },
  {
    title: "6. Ghi nhận khách trả nợ",
    href: "/customer-debts",
    body:
      "Vào Nợ khách hàng, bấm Ghi nhận thu. Chọn ngày trả, khách hàng, nhập số tiền khách trả và phương thức thanh toán. Hệ thống tự trừ vào các đơn còn nợ cũ nhất trước, cập nhật đã trả, còn nợ, thu chi và nhật ký thao tác.",
  },
  {
    title: "7. Kiểm tra tồn kho và công nợ",
    href: "/inventory",
    body:
      "Vào Tồn kho để xem số thùng còn lại, giá trị tồn, hàng sắp hết hoặc hết hàng. Vào Nợ khách hàng và Nợ nhà cung cấp để xem ngày phát sinh nợ, lần trả gần nhất, tổng đã mua/nhập, đã trả và còn nợ.",
  },
  {
    title: "8. Theo dõi thu chi và báo cáo",
    href: "/cashflow",
    body:
      "Vào Thu chi để xem tiền thu từ bán hàng, khách trả nợ, tiền chi nhập hàng và các khoản chi phí. Vào Báo cáo để xem tổng hợp doanh thu, chi phí, giá vốn tạm tính và lợi nhuận tạm tính.",
  },
  {
    title: "9. Sao lưu dữ liệu",
    href: "/settings",
    body:
      "Ở khung Backup dữ liệu, bấm Xuất backup để tải file JSON về máy. Khi dùng máy khác hoặc cần phục hồi, bấm Nhập backup và chọn file đã xuất. Nếu đang dùng Google Sheet, dữ liệu chính vẫn nằm trong Sheet và app tự đọc lại định kỳ.",
  },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  name,
  children,
  defaultValue,
}: {
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15"
      required
    >
      {children}
    </select>
  );
}

function SettingsUsageGuide() {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-medium text-cyan-700">Hướng dẫn sử dụng</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">
          Quy trình dùng phần mềm kho gạch
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Làm theo thứ tự dưới đây để dữ liệu tồn kho, công nợ và thu chi tự khớp với nhau.
        </p>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {usageSteps.map((step) => (
          <div key={step.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
              <Link
                href={step.href}
                className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
              >
                Mở trang
              </Link>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Lưu ý: trước khi bán hàng phải có sản phẩm và tồn kho. Nếu hệ thống báo không đủ tồn,
        hãy nhập hàng trước hoặc kiểm tra lại lịch sử nhập/bán của mã hàng đó.
      </div>
    </section>
  );
}

function getRows(pageKey: PageKey, data: WarehouseData, inventory: InventoryRow[] = []) {
  if (pageKey === "products") {
    return data.products.map((product) => ({
      code: product.code,
      name: product.name,
      category: product.category,
      size: product.size,
      unit: product.unit,
      salePrice: formatCurrency(product.salePrice),
      status: product.isActive ? "Đang bán" : "Ngừng bán",
    }));
  }

  if (pageKey === "customers") {
    return data.customers.map((customer) => ({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      group: customer.customerGroup,
      total: formatCurrency(getCustomerBought(data, customer.id)),
      debt: formatCurrency(getCustomerDebt(data, customer.id)),
    }));
  }

  if (pageKey === "suppliers") {
    return data.suppliers.map((supplier) => ({
      name: supplier.name,
      phone: supplier.phone,
      contact: supplier.contactPerson,
      address: supplier.address,
      imported: formatCurrency(getSupplierImported(data, supplier.id)),
      debt: formatCurrency(getSupplierDebt(data, supplier.id)),
    }));
  }

  if (pageKey === "purchases") {
    return data.purchases.map((order) => ({
      code: order.code,
      date: formatDate(order.orderDate),
      supplier: getSupplierName(data.suppliers, order.supplierId),
      total: formatCurrency(order.totalAmount),
      paid: formatCurrency(order.paidAmount),
      status: order.debtAmount > 0 ? "Còn nợ" : "Đã trả đủ",
    }));
  }

  if (pageKey === "sales") {
    return data.sales.map((order) => ({
      code: order.code,
      date: formatDate(order.orderDate),
      customer: getCustomerName(data.customers, order.customerId),
      total: formatCurrency(order.totalAmount),
      paid: formatCurrency(order.paidAmount),
      status: order.debtAmount > 0 ? "Còn nợ" : "Đã trả đủ",
    }));
  }

  if (pageKey === "inventory") {
    return inventory.map((item) => ({
      code: item.code,
      name: item.name,
      size: item.size,
      stock: formatNumber(item.currentStock),
      sqm: formatNumber(item.currentSqm),
      value: formatCurrency(item.stockValue),
      status:
        item.stockStatus === "out_of_stock"
          ? "Hết hàng"
          : item.stockStatus === "low_stock"
            ? "Sắp hết"
            : item.stockStatus === "inactive"
              ? "Ngừng bán"
              : "Còn hàng",
    }));
  }

  if (pageKey === "customer-debts") {
    return data.customers
      .map((customer) => {
        const outstandingOrders = data.sales
          .filter((order) => order.customerId === customer.id && order.status !== "canceled" && order.debtAmount > 0)
          .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
        const customerPayments = data.payments
          .filter((payment) => payment.customerId === customer.id && payment.direction === "in")
          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

        return {
          customer: customer.name,
          phone: customer.phone,
          debtDate: formatDate(outstandingOrders[0]?.orderDate),
          lastPaymentDate: formatDate(customerPayments[0]?.paymentDate),
          bought: formatCurrency(getCustomerBought(data, customer.id)),
          paid: formatCurrency(getCustomerPaid(data, customer.id)),
          debt: formatCurrency(getCustomerDebt(data, customer.id)),
          status: getCustomerDebt(data, customer.id) > 0 ? "Còn nợ" : "Đã tất toán",
        };
      })
      .filter((row) => row.debt !== formatCurrency(0));
  }

  if (pageKey === "supplier-debts") {
    return data.suppliers
      .map((supplier) => {
        const outstandingOrders = data.purchases
          .filter((order) => order.supplierId === supplier.id && order.status !== "canceled" && order.debtAmount > 0)
          .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
        const supplierPayments = data.payments
          .filter((payment) => payment.supplierId === supplier.id && payment.direction === "out")
          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

        return {
          supplier: supplier.name,
          contact: supplier.contactPerson,
          debtDate: formatDate(outstandingOrders[0]?.orderDate),
          lastPaymentDate: formatDate(supplierPayments[0]?.paymentDate),
          imported: formatCurrency(getSupplierImported(data, supplier.id)),
          paid: formatCurrency(getSupplierPaid(data, supplier.id)),
          debt: formatCurrency(getSupplierDebt(data, supplier.id)),
          status: getSupplierDebt(data, supplier.id) > 0 ? "Còn nợ" : "Đã tất toán",
        };
      })
      .filter((row) => row.debt !== formatCurrency(0));
  }

  if (pageKey === "cashflow") {
    const payments = data.payments.map((payment) => ({
      date: formatDate(payment.paymentDate),
      type: payment.direction === "in" ? "Thu" : "Chi",
      category:
        payment.partyType === "customer"
          ? "Thu khách hàng"
          : payment.partyType === "supplier"
            ? "Trả nhà cung cấp"
            : "Chi khác",
      amount: formatCurrency(payment.amount),
      method: payment.method,
      createdBy: "Local",
    }));

    return payments;
  }

  if (pageKey === "audit-logs") {
    return data.auditLogs.map((log) => ({
      time: formatDate(log.time),
      user: log.user,
      action: log.action,
      table: log.tableName,
      record: log.recordCode,
      note: log.note,
    }));
  }

  if (pageKey === "reports") {
    const revenue = sum(data.sales.map((order) => order.totalAmount));
    const purchaseCost = sum(data.purchases.map((order) => order.totalAmount));
    const expenses = sum(data.expenses.map((expense) => expense.amount));
    return [
      {
        name: "Tổng hợp local",
        period: "Toàn bộ dữ liệu",
        revenue: formatCurrency(revenue),
        cost: formatCurrency(purchaseCost + expenses),
        profit: formatCurrency(revenue - purchaseCost - expenses),
        status: "Tạm tính",
      },
    ];
  }

  if (pageKey === "users") {
    return [
      {
        name: "Chủ kho local",
        email: "admin@local.vn",
        phone: "-",
        role: "Admin",
        status: "Hoạt động",
        createdAt: formatDate(new Date()),
      },
    ];
  }

  if (pageKey === "settings") {
    return [
      {
        name: "Chế độ dữ liệu",
        value: "localStorage",
        scope: "Trình duyệt hiện tại",
        updatedBy: "Hệ thống",
        updatedAt: formatDate(new Date()),
        status: "Miễn phí",
      },
    ];
  }

  return [];
}

function getStats(
  pageKey: PageKey,
  config: ModulePageConfig,
  data: WarehouseData,
  inventory: InventoryRow[],
) {
  const totalDebtCustomers = sum(data.customers.map((customer) => getCustomerDebt(data, customer.id)));
  const totalDebtSuppliers = sum(data.suppliers.map((supplier) => getSupplierDebt(data, supplier.id)));
  const stockValue = sum(inventory.map((item) => item.stockValue));
  const revenue = sum(data.sales.map((order) => order.totalAmount));
  const expenses = sum(data.expenses.map((expense) => expense.amount));

  if (pageKey === "sales") {
    return [
      { label: "Tổng đơn bán", value: String(data.sales.length), tone: "cyan" as const },
      { label: "Doanh thu", value: formatCurrency(revenue), tone: "green" as const },
      { label: "Khách còn nợ", value: formatCurrency(totalDebtCustomers), tone: "amber" as const },
      { label: "Đơn còn nợ", value: String(data.sales.filter((order) => order.debtAmount > 0).length), tone: "slate" as const },
    ];
  }

  if (pageKey === "purchases") {
    return [
      { label: "Tổng phiếu nhập", value: String(data.purchases.length), tone: "cyan" as const },
      { label: "Giá trị nhập", value: formatCurrency(sum(data.purchases.map((order) => order.totalAmount))), tone: "green" as const },
      { label: "Nợ nhà cung cấp", value: formatCurrency(totalDebtSuppliers), tone: "amber" as const },
      { label: "Phiếu còn nợ", value: String(data.purchases.filter((order) => order.debtAmount > 0).length), tone: "slate" as const },
    ];
  }

  if (pageKey === "inventory" || pageKey === "products") {
    return [
      { label: "Mã hàng", value: String(data.products.length), tone: "cyan" as const },
      { label: "Giá trị tồn", value: formatCurrency(stockValue), tone: "green" as const },
      { label: "Sắp hết", value: String(inventory.filter((item) => item.stockStatus === "low_stock").length), tone: "amber" as const },
      { label: "Hết hàng", value: String(inventory.filter((item) => item.stockStatus === "out_of_stock").length), tone: "red" as const },
    ];
  }

  if (pageKey === "customers" || pageKey === "customer-debts") {
    return [
      { label: "Tổng khách", value: String(data.customers.length), tone: "cyan" as const },
      { label: "Tổng đã mua", value: formatCurrency(sum(data.customers.map((customer) => getCustomerBought(data, customer.id)))), tone: "green" as const },
      { label: "Còn nợ", value: formatCurrency(totalDebtCustomers), tone: "amber" as const },
      { label: "Khách còn nợ", value: String(data.customers.filter((customer) => getCustomerDebt(data, customer.id) > 0).length), tone: "red" as const },
    ];
  }

  if (pageKey === "suppliers" || pageKey === "supplier-debts") {
    return [
      { label: "Tổng NCC", value: String(data.suppliers.length), tone: "cyan" as const },
      { label: "Tổng đã nhập", value: formatCurrency(sum(data.suppliers.map((supplier) => getSupplierImported(data, supplier.id)))), tone: "green" as const },
      { label: "Còn nợ", value: formatCurrency(totalDebtSuppliers), tone: "amber" as const },
      { label: "NCC còn nợ", value: String(data.suppliers.filter((supplier) => getSupplierDebt(data, supplier.id) > 0).length), tone: "red" as const },
    ];
  }

  if (pageKey === "cashflow") {
    const totalIn = sum(data.payments.filter((payment) => payment.direction === "in").map((payment) => payment.amount));
    const totalOut = sum(data.payments.filter((payment) => payment.direction === "out").map((payment) => payment.amount));
    return [
      { label: "Tổng thu", value: formatCurrency(totalIn), tone: "green" as const },
      { label: "Tổng chi", value: formatCurrency(totalOut), tone: "red" as const },
      { label: "Chênh lệch", value: formatCurrency(totalIn - totalOut), tone: "cyan" as const },
      { label: "Chi phí", value: formatCurrency(expenses), tone: "slate" as const },
    ];
  }

  return config.stats;
}

function EntryForm({
  pageKey,
  data,
  onSubmit,
}: {
  pageKey: PageKey;
  data: WarehouseData;
  onSubmit: (formData: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  if (
    ![
      "products",
      "customers",
      "suppliers",
      "purchases",
      "sales",
      "cashflow",
      "customer-debts",
    ].includes(pageKey)
  ) {
    return null;
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-3 rounded-md border border-cyan-100 bg-cyan-50 p-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {pageKey === "products" ? (
        <>
          <Field label="Mã hàng"><Input name="code" required placeholder="G6060-A02" /></Field>
          <Field label="Tên hàng"><Input name="name" required placeholder="Gạch bóng kính..." /></Field>
          <Field label="Loại"><Input name="category" placeholder="Gạch lát nền" /></Field>
          <Field label="Kích thước"><Input name="size" placeholder="60x60" /></Field>
          <Field label="Viên/thùng"><Input name="piecesPerBox" type="number" min="0" step="1" defaultValue="4" /></Field>
          <Field label="m2/thùng"><Input name="sqmPerBox" type="number" min="0" step="0.01" defaultValue="1.44" /></Field>
          <Field label="Giá nhập"><MoneyInput name="importPrice" defaultValue="0" /></Field>
          <Field label="Giá bán"><MoneyInput name="salePrice" defaultValue="0" /></Field>
          <Field label="Nhà cung cấp">
            <SelectField name="supplierId" defaultValue={data.suppliers[0]?.id}>
              {data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </SelectField>
          </Field>
          <Field label="Tồn tối thiểu"><Input name="minStock" type="number" min="0" defaultValue="0" /></Field>
          <Field label="Ghi chú"><Input name="note" placeholder="Ghi chú" /></Field>
        </>
      ) : null}

      {pageKey === "customers" ? (
        <>
          <Field label="Tên khách"><Input name="name" required /></Field>
          <Field label="Số điện thoại"><Input name="phone" /></Field>
          <Field label="Địa chỉ"><Input name="address" /></Field>
          <Field label="Nhóm khách"><Input name="customerGroup" defaultValue="Bán lẻ" /></Field>
          <Field label="Ghi chú"><Input name="note" /></Field>
        </>
      ) : null}

      {pageKey === "suppliers" ? (
        <>
          <Field label="Tên NCC"><Input name="name" required /></Field>
          <Field label="Số điện thoại"><Input name="phone" /></Field>
          <Field label="Người liên hệ"><Input name="contactPerson" /></Field>
          <Field label="Địa chỉ"><Input name="address" /></Field>
          <Field label="Ghi chú"><Input name="note" /></Field>
        </>
      ) : null}

      {pageKey === "purchases" ? (
        <>
          <Field label="Ngày nhập"><Input name="orderDate" type="date" defaultValue={today} /></Field>
          <Field label="Nhà cung cấp">
            <SelectField name="supplierId" defaultValue={data.suppliers[0]?.id}>
              {data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </SelectField>
          </Field>
          <Field label="Sản phẩm">
            <SelectField name="productId" defaultValue={data.products[0]?.id}>
              {data.products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
            </SelectField>
          </Field>
          <Field label="Số lượng thùng"><Input name="quantity" type="number" min="1" step="1" required /></Field>
          <Field label="Đơn giá nhập"><MoneyInput name="unitPrice" required defaultValue={data.products[0]?.importPrice ?? 0} /></Field>
          <Field label="Đã trả"><MoneyInput name="paidAmount" defaultValue="0" /></Field>
          <Field label="Thanh toán"><Input name="paymentMethod" defaultValue="Tiền mặt" /></Field>
          <Field label="Ghi chú"><Input name="note" /></Field>
        </>
      ) : null}

      {pageKey === "sales" ? (
        <>
          <Field label="Ngày bán"><Input name="orderDate" type="date" defaultValue={today} /></Field>
          <Field label="Khách hàng">
            <SelectField name="customerId" defaultValue={data.customers[0]?.id}>
              {data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </SelectField>
          </Field>
          <Field label="Sản phẩm">
            <SelectField name="productId" defaultValue={data.products[0]?.id}>
              {data.products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
            </SelectField>
          </Field>
          <Field label="Số lượng thùng"><Input name="quantity" type="number" min="1" step="1" required /></Field>
          <Field label="Đơn giá bán"><MoneyInput name="unitPrice" required defaultValue={data.products[0]?.salePrice ?? 0} /></Field>
          <Field label="Chiết khấu"><MoneyInput name="discountAmount" defaultValue="0" /></Field>
          <Field label="Phí giao"><MoneyInput name="shippingFee" defaultValue="0" /></Field>
          <Field label="Khách đã trả"><MoneyInput name="paidAmount" defaultValue="0" /></Field>
          <Field label="Thanh toán"><Input name="paymentMethod" defaultValue="Tiền mặt" /></Field>
          <Field label="Ghi chú"><Input name="note" /></Field>
        </>
      ) : null}

      {pageKey === "cashflow" ? (
        <>
          <Field label="Ngày chi"><Input name="expenseDate" type="date" defaultValue={today} /></Field>
          <Field label="Danh mục"><Input name="category" required placeholder="Vận chuyển, bốc xếp..." /></Field>
          <Field label="Số tiền"><MoneyInput name="amount" required /></Field>
          <Field label="Thanh toán"><Input name="paymentMethod" defaultValue="Tiền mặt" /></Field>
          <Field label="Ghi chú"><Input name="note" /></Field>
        </>
      ) : null}

      {pageKey === "customer-debts" ? (
        <>
          <Field label="Ngày trả"><Input name="paymentDate" type="date" defaultValue={today} /></Field>
          <Field label="Khách hàng">
            <SelectField name="customerId" defaultValue={data.customers[0]?.id}>
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - nợ {formatCurrency(getCustomerDebt(data, customer.id))}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label="Số tiền khách trả"><MoneyInput name="amount" required placeholder="100.000" /></Field>
          <Field label="Phương thức"><Input name="method" defaultValue="Tiền mặt" /></Field>
          <Field label="Ghi chú"><Input name="note" placeholder="VD: khách chuyển khoản thêm" /></Field>
        </>
      ) : null}

      <div className="flex items-end">
        <Button type="submit" className="w-full">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Lưu
        </Button>
      </div>
    </form>
  );
}

export function LocalWorkspacePage({ pageKey }: { pageKey: PageKey }) {
  const config = modulePages[pageKey];
  const { data, inventory, lastMessage, syncMode, syncStatus, actions } = useWarehouseStore();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo<Row[]>(() => {
    if (!data) {
      return [];
    }

    const pageRows = getRows(pageKey, data, inventory);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return pageRows;
    }

    return pageRows.filter((row) =>
      Object.values(row).some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [data, inventory, pageKey, query]);

  if (!data) {
    return <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">Đang tải dữ liệu local...</div>;
  }

  const stats = getStats(pageKey, config, data, inventory);

  async function handleSubmit(formData: FormData) {
    const result =
      pageKey === "products"
        ? await actions.addProduct(formData)
        : pageKey === "customers"
          ? await actions.addCustomer(formData)
          : pageKey === "suppliers"
            ? await actions.addSupplier(formData)
            : pageKey === "purchases"
              ? await actions.addPurchase(formData)
              : pageKey === "sales"
                ? await actions.addSale(formData)
                : pageKey === "cashflow"
                  ? await actions.addExpense(formData)
                  : pageKey === "customer-debts"
                    ? await actions.recordCustomerPayment(formData)
                    : { ok: false, message: "Trang này chưa có form nhập liệu." };

    if (result.ok) {
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-700">{config.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{config.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" type="button">
            <Download className="h-4 w-4" aria-hidden="true" />
            {config.exportLabel ?? "Xuất dữ liệu"}
          </Button>
          {[
            "products",
            "customers",
            "suppliers",
            "purchases",
            "sales",
            "cashflow",
            "customer-debts",
          ].includes(pageKey) ? (
            <Button size="sm" type="button" onClick={() => setShowForm((value) => !value)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {config.actionLabel}
            </Button>
          ) : null}
        </div>
      </div>

      {lastMessage ? (
        <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800">
          {lastMessage}
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        Nguồn dữ liệu:{" "}
        <span className="font-semibold text-slate-900">
          {syncMode === "google-sheet" ? "Google Sheet" : "Local"}
        </span>
        {" - "}
        {syncStatus}
      </div>

      {showForm ? <EntryForm pageKey={pageKey} data={data} onSubmit={handleSubmit} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xl font-semibold text-slate-950">{stat.value}</p>
              <Badge tone={stat.tone ?? "slate"}>Local</Badge>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-md border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder={config.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" type="date" />
          </div>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <select className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15">
              {(config.statusFilters ?? ["Tất cả"]).map((filter) => (
                <option key={filter}>{filter}</option>
              ))}
            </select>
          </label>
          <Button variant="secondary" type="button">Lọc</Button>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                {config.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "border-b border-slate-200 px-4 py-3 font-semibold",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={index}>
                    {config.columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "border-b border-slate-100 px-4 py-3 text-slate-700",
                          column.align === "right" && "text-right tabular-nums",
                          column.align === "center" && "text-center",
                        )}
                      >
                        {row[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={config.columns.length} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-800">{config.emptyLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Bấm nút thêm nhanh để tạo dữ liệu local đầu tiên.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pageKey === "settings" ? <SettingsUsageGuide /> : null}
    </div>
  );
}
