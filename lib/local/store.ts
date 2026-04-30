"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchSheetSnapshot,
  formDataToPayload,
  isSheetConfigured,
  loadSheetConfig,
  mutateSheet,
} from "@/lib/google-sheets/client";
import { createBackup, createSeedLocalBackup, localDataKey, type LocalBackup } from "@/lib/local/free-mode";
import {
  computeInventory,
  getAvailableStock,
  getToday,
  makeId,
  nextCode,
} from "@/lib/local/calculations";
import type {
  AuditLog,
  Customer,
  Expense,
  Payment,
  Product,
  PurchaseOrder,
  SalesOrder,
  StockMovement,
  Supplier,
  WarehouseData,
} from "@/lib/local/types";

type ActionResult = {
  ok: boolean;
  message: string;
};

type SyncMode = "local" | "google-sheet";

function parseBackup(raw: string | null): LocalBackup | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LocalBackup;

    if (parsed.app !== "tile-warehouse-app" || parsed.version !== 1 || !parsed.data) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeData(data: WarehouseData) {
  window.localStorage.setItem(localDataKey, JSON.stringify(createBackup(data)));
}

function makeAudit(action: string, tableName: string, recordCode: string, note: string): AuditLog {
  return {
    id: makeId("audit"),
    time: new Date().toISOString(),
    user: "Chủ kho local",
    action,
    tableName,
    recordCode,
    note,
  };
}

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function useWarehouseStore() {
  const [data, setData] = useState<WarehouseData | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [syncMode, setSyncMode] = useState<SyncMode>("local");
  const [syncStatus, setSyncStatus] = useState("Đang tải dữ liệu local...");

  useEffect(() => {
    let intervalId: number | undefined;
    let canceled = false;
    const backup = parseBackup(window.localStorage.getItem(localDataKey)) ?? createSeedLocalBackup();
    window.localStorage.setItem(localDataKey, JSON.stringify(backup));
    setData(backup.data);

    void loadSheetConfig().then((sheetConfig) => {
      if (canceled) {
        return;
      }

      if (!isSheetConfigured(sheetConfig)) {
        setSyncMode("local");
        setSyncStatus("Đang dùng dữ liệu local trong trình duyệt.");
        return;
      }

      setSyncMode("google-sheet");

      async function pullSnapshot(showSuccess: boolean) {
        try {
          const sheetData = await fetchSheetSnapshot(sheetConfig);
          if (canceled) {
            return;
          }
          setData(sheetData);
          writeData(sheetData);
          setSyncStatus(
            showSuccess
              ? "Đã đồng bộ Google Sheet."
              : `Tự cập nhật từ Google Sheet lúc ${new Date().toLocaleTimeString("vi-VN")}.`,
          );
        } catch (error) {
          setSyncStatus(error instanceof Error ? error.message : "Không đồng bộ được Google Sheet.");
        }
      }

      void pullSnapshot(true);
      intervalId = window.setInterval(() => {
        void pullSnapshot(false);
      }, 15000);
    });

    return () => {
      canceled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  function commit(updater: (current: WarehouseData) => WarehouseData, message: string): ActionResult {
    if (!data) {
      return { ok: false, message: "Dữ liệu chưa sẵn sàng." };
    }

    const nextData = updater(data);
    setData(nextData);
    writeData(nextData);
    setLastMessage(message);
    return { ok: true, message };
  }

  const inventory = useMemo(() => (data ? computeInventory(data) : []), [data]);

  async function commitRemoteOrLocal(
    type: string,
    formData: FormData,
    localUpdater: (current: WarehouseData) => WarehouseData,
    message: string,
  ): Promise<ActionResult> {
    const sheetConfig = await loadSheetConfig();

    if (isSheetConfigured(sheetConfig)) {
      try {
        setSyncMode("google-sheet");
        setSyncStatus("Đang ghi Google Sheet...");
        const sheetData = await mutateSheet(type, formDataToPayload(formData), sheetConfig);
        setData(sheetData);
        writeData(sheetData);
        setLastMessage(message);
        setSyncStatus("Đã ghi và đọc lại Google Sheet.");
        return { ok: true, message };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Không ghi được Google Sheet.";
        setLastMessage(errorMessage);
        setSyncStatus(errorMessage);
        return { ok: false, message: errorMessage };
      }
    }

    return commit(localUpdater, message);
  }

  function addProduct(formData: FormData) {
    return commitRemoteOrLocal("addProduct", formData, (current) => {
      const code = toText(formData.get("code"));
      const product: Product = {
        id: makeId("product"),
        code,
        name: toText(formData.get("name")),
        category: toText(formData.get("category")),
        size: toText(formData.get("size")),
        unit: "thùng",
        piecesPerBox: toNumber(formData.get("piecesPerBox")),
        sqmPerBox: toNumber(formData.get("sqmPerBox")),
        importPrice: toNumber(formData.get("importPrice")),
        salePrice: toNumber(formData.get("salePrice")),
        supplierId: toText(formData.get("supplierId")),
        minStock: toNumber(formData.get("minStock")),
        isActive: true,
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        products: [product, ...current.products],
        auditLogs: [
          makeAudit("create", "products", code, `Tạo sản phẩm ${product.name}`),
          ...current.auditLogs,
        ],
      };
    }, "Đã thêm sản phẩm.");
  }

  function addCustomer(formData: FormData) {
    return commitRemoteOrLocal("addCustomer", formData, (current) => {
      const customer: Customer = {
        id: makeId("customer"),
        name: toText(formData.get("name")),
        phone: toText(formData.get("phone")),
        address: toText(formData.get("address")),
        customerGroup: toText(formData.get("customerGroup")),
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        customers: [customer, ...current.customers],
        auditLogs: [
          makeAudit("create", "customers", customer.name, `Tạo khách hàng ${customer.name}`),
          ...current.auditLogs,
        ],
      };
    }, "Đã thêm khách hàng.");
  }

  function addSupplier(formData: FormData) {
    return commitRemoteOrLocal("addSupplier", formData, (current) => {
      const supplier: Supplier = {
        id: makeId("supplier"),
        name: toText(formData.get("name")),
        phone: toText(formData.get("phone")),
        address: toText(formData.get("address")),
        contactPerson: toText(formData.get("contactPerson")),
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        suppliers: [supplier, ...current.suppliers],
        auditLogs: [
          makeAudit("create", "suppliers", supplier.name, `Tạo nhà cung cấp ${supplier.name}`),
          ...current.auditLogs,
        ],
      };
    }, "Đã thêm nhà cung cấp.");
  }

  function addPurchase(formData: FormData) {
    return commitRemoteOrLocal("addPurchase", formData, (current) => {
      const quantity = toNumber(formData.get("quantity"));
      const unitPrice = toNumber(formData.get("unitPrice"));
      const paidAmount = toNumber(formData.get("paidAmount"));
      const totalAmount = quantity * unitPrice;
      const debtAmount = Math.max(totalAmount - paidAmount, 0);
      const code = nextCode("PO", current.purchases.map((order) => order.code));
      const id = makeId("purchase");
      const orderDate = toText(formData.get("orderDate")) || getToday();

      const purchase: PurchaseOrder = {
        id,
        code,
        supplierId: toText(formData.get("supplierId")),
        orderDate,
        productId: toText(formData.get("productId")),
        quantity,
        unitPrice,
        totalAmount,
        paidAmount: Math.min(paidAmount, totalAmount),
        debtAmount,
        paymentMethod: toText(formData.get("paymentMethod")),
        status: "confirmed",
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      const movement: StockMovement = {
        id: makeId("movement"),
        productId: purchase.productId,
        movementDate: orderDate,
        quantity,
        movementType: "purchase",
        referenceType: "purchase_order",
        referenceId: id,
        note: `Nhập ${code}`,
        createdAt: new Date().toISOString(),
      };

      const payment: Payment | null =
        purchase.paidAmount > 0
          ? {
              id: makeId("payment"),
              paymentDate: orderDate,
              direction: "out",
              partyType: "supplier",
              supplierId: purchase.supplierId,
              referenceType: "purchase_order",
              referenceId: id,
              amount: purchase.paidAmount,
              method: purchase.paymentMethod,
              note: `Trả tiền ${code}`,
              createdAt: new Date().toISOString(),
            }
          : null;

      return {
        ...current,
        purchases: [purchase, ...current.purchases],
        stockMovements: [movement, ...current.stockMovements],
        payments: payment ? [payment, ...current.payments] : current.payments,
        auditLogs: [
          makeAudit("confirm", "purchase_orders", code, `Xác nhận nhập ${quantity} thùng`),
          ...current.auditLogs,
        ],
      };
    }, "Đã nhập kho và cộng tồn.");
  }

  async function addSale(formData: FormData): Promise<ActionResult> {
    const sheetConfig = await loadSheetConfig();

    if (isSheetConfigured(sheetConfig)) {
      return commitRemoteOrLocal("addSale", formData, (current) => current, "Đã tạo đơn bán và trừ tồn.");
    }

    if (!data) {
      return { ok: false, message: "Dữ liệu chưa sẵn sàng." };
    }

    const productId = toText(formData.get("productId"));
    const quantity = toNumber(formData.get("quantity"));
    const availableStock = getAvailableStock(data, productId);

    if (quantity <= 0) {
      setLastMessage("Số lượng bán phải lớn hơn 0.");
      return { ok: false, message: "Số lượng bán phải lớn hơn 0." };
    }

    if (availableStock < quantity) {
      const message = `Không đủ tồn kho. Hiện còn ${availableStock} thùng.`;
      setLastMessage(message);
      return { ok: false, message };
    }

    return commit((current) => {
      const unitPrice = toNumber(formData.get("unitPrice"));
      const discountAmount = toNumber(formData.get("discountAmount"));
      const shippingFee = toNumber(formData.get("shippingFee"));
      const paidAmountInput = toNumber(formData.get("paidAmount"));
      const subtotalAmount = quantity * unitPrice;
      const totalAmount = Math.max(subtotalAmount - discountAmount + shippingFee, 0);
      const paidAmount = Math.min(paidAmountInput, totalAmount);
      const debtAmount = Math.max(totalAmount - paidAmount, 0);
      const code = nextCode("SO", current.sales.map((order) => order.code));
      const id = makeId("sale");
      const orderDate = toText(formData.get("orderDate")) || getToday();

      const sale: SalesOrder = {
        id,
        code,
        customerId: toText(formData.get("customerId")),
        orderDate,
        productId,
        quantity,
        unitPrice,
        discountAmount,
        shippingFee,
        subtotalAmount,
        totalAmount,
        paidAmount,
        debtAmount,
        paymentMethod: toText(formData.get("paymentMethod")),
        deliveryStatus: "pending",
        paymentStatus: debtAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
        status: "confirmed",
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      const movement: StockMovement = {
        id: makeId("movement"),
        productId,
        movementDate: orderDate,
        quantity: -quantity,
        movementType: "sale",
        referenceType: "sales_order",
        referenceId: id,
        note: `Bán ${code}`,
        createdAt: new Date().toISOString(),
      };

      const payment: Payment | null =
        paidAmount > 0
          ? {
              id: makeId("payment"),
              paymentDate: orderDate,
              direction: "in",
              partyType: "customer",
              customerId: sale.customerId,
              referenceType: "sales_order",
              referenceId: id,
              amount: paidAmount,
              method: sale.paymentMethod,
              note: `Thu tiền ${code}`,
              createdAt: new Date().toISOString(),
            }
          : null;

      return {
        ...current,
        sales: [sale, ...current.sales],
        stockMovements: [movement, ...current.stockMovements],
        payments: payment ? [payment, ...current.payments] : current.payments,
        auditLogs: [
          makeAudit("confirm", "sales_orders", code, `Xác nhận bán ${quantity} thùng`),
          ...current.auditLogs,
        ],
      };
    }, "Đã tạo đơn bán và trừ tồn.");
  }

  async function recordCustomerPayment(formData: FormData): Promise<ActionResult> {
    const sheetConfig = await loadSheetConfig();

    if (isSheetConfigured(sheetConfig)) {
      return commitRemoteOrLocal(
        "recordCustomerPayment",
        formData,
        (current) => current,
        "Đã ghi nhận khách trả nợ và cập nhật công nợ.",
      );
    }

    if (!data) {
      return { ok: false, message: "Dữ liệu chưa sẵn sàng." };
    }

    const customerId = toText(formData.get("customerId"));
    const amount = toNumber(formData.get("amount"));
    const paymentDate = toText(formData.get("paymentDate")) || getToday();
    const method = toText(formData.get("method")) || "Tiền mặt";
    const note = toText(formData.get("note"));
    const outstandingOrders = data.sales
      .filter((order) => order.customerId === customerId && order.status !== "canceled" && order.debtAmount > 0)
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
    const totalDebt = outstandingOrders.reduce((total, order) => total + order.debtAmount, 0);

    if (!customerId) {
      const message = "Chọn khách hàng cần trả nợ.";
      setLastMessage(message);
      return { ok: false, message };
    }

    if (amount <= 0) {
      const message = "Số tiền trả nợ phải lớn hơn 0.";
      setLastMessage(message);
      return { ok: false, message };
    }

    if (totalDebt <= 0) {
      const message = "Khách hàng này không còn công nợ.";
      setLastMessage(message);
      return { ok: false, message };
    }

    if (amount > totalDebt) {
      const message = `Số tiền vượt công nợ hiện tại. Khách còn nợ ${totalDebt.toLocaleString("vi-VN")}đ.`;
      setLastMessage(message);
      return { ok: false, message };
    }

    return commit((current) => {
      let remaining = amount;
      const affectedCodes: string[] = [];
      const updatedSales = current.sales.map((order) => {
        if (order.customerId !== customerId || order.status === "canceled" || order.debtAmount <= 0 || remaining <= 0) {
          return order;
        }

        const paidForOrder = Math.min(order.debtAmount, remaining);
        remaining -= paidForOrder;
        affectedCodes.push(order.code);
        const nextDebt = Math.max(order.debtAmount - paidForOrder, 0);
        const nextPaid = order.paidAmount + paidForOrder;

        return {
          ...order,
          paidAmount: nextPaid,
          debtAmount: nextDebt,
          paymentStatus: nextDebt <= 0 ? ("paid" as const) : ("partial" as const),
        };
      });

      const payment: Payment = {
        id: makeId("payment"),
        paymentDate,
        direction: "in",
        partyType: "customer",
        customerId,
        referenceType: "manual",
        referenceId: affectedCodes.join(", "),
        amount,
        method,
        note: note || `Khách trả nợ: ${affectedCodes.join(", ")}`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        sales: updatedSales,
        payments: [payment, ...current.payments],
        auditLogs: [
          makeAudit(
            "payment",
            "customer_debts",
            affectedCodes.join(", "),
            `Ghi nhận khách trả ${amount.toLocaleString("vi-VN")}đ`,
          ),
          ...current.auditLogs,
        ],
      };
    }, "Đã ghi nhận khách trả nợ và cập nhật công nợ.");
  }

  function addExpense(formData: FormData) {
    return commitRemoteOrLocal("addExpense", formData, (current) => {
      const amount = toNumber(formData.get("amount"));
      const expenseDate = toText(formData.get("expenseDate")) || getToday();
      const expense: Expense = {
        id: makeId("expense"),
        category: toText(formData.get("category")),
        amount,
        expenseDate,
        paymentMethod: toText(formData.get("paymentMethod")),
        note: toText(formData.get("note")),
        createdAt: new Date().toISOString(),
      };

      const payment: Payment = {
        id: makeId("payment"),
        paymentDate: expenseDate,
        direction: "out",
        partyType: "other",
        referenceType: "expense",
        referenceId: expense.id,
        amount,
        method: expense.paymentMethod,
        note: expense.note,
        createdAt: new Date().toISOString(),
      };

      return {
        ...current,
        expenses: [expense, ...current.expenses],
        payments: [payment, ...current.payments],
        auditLogs: [
          makeAudit("create", "expenses", expense.category, `Tạo chi phí ${expense.category}`),
          ...current.auditLogs,
        ],
      };
    }, "Đã thêm khoản chi.");
  }

  return {
    data,
    inventory,
    lastMessage,
    syncMode,
    syncStatus,
    actions: {
      addProduct,
      addCustomer,
      addSupplier,
      addPurchase,
      addSale,
      recordCustomerPayment,
      addExpense,
    },
  };
}
