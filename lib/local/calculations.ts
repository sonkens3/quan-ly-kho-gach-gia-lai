import type {
  Customer,
  InventoryRow,
  Product,
  PurchaseOrder,
  Supplier,
  WarehouseData,
} from "@/lib/local/types";

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nextCode(prefix: string, existingCodes: string[]) {
  const nextNumber =
    existingCodes.reduce((max, code) => {
      const number = Number(code.replace(`${prefix}-`, ""));
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

export function getProductName(products: Product[], id: string) {
  return products.find((product) => product.id === id)?.name ?? "-";
}

export function getCustomerName(customers: Customer[], id: string) {
  return customers.find((customer) => customer.id === id)?.name ?? "-";
}

export function getSupplierName(suppliers: Supplier[], id: string) {
  return suppliers.find((supplier) => supplier.id === id)?.name ?? "-";
}

export function computeInventory(data: WarehouseData): InventoryRow[] {
  return data.products.map((product) => {
    const currentStock = data.stockMovements
      .filter((movement) => movement.productId === product.id)
      .reduce((total, movement) => total + movement.quantity, 0);

    const stockStatus = !product.isActive
      ? "inactive"
      : currentStock <= 0
        ? "out_of_stock"
        : currentStock <= product.minStock
          ? "low_stock"
          : "in_stock";

    return {
      ...product,
      currentStock,
      currentPieces: currentStock * product.piecesPerBox,
      currentSqm: currentStock * product.sqmPerBox,
      stockValue: currentStock * product.importPrice,
      stockStatus,
    };
  });
}

export function getAvailableStock(data: WarehouseData, productId: string) {
  return computeInventory(data).find((item) => item.id === productId)?.currentStock ?? 0;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function getCustomerDebt(data: WarehouseData, customerId: string) {
  return sum(
    data.sales
      .filter((order) => order.customerId === customerId && order.status !== "canceled")
      .map((order) => order.debtAmount),
  );
}

export function getSupplierDebt(data: WarehouseData, supplierId: string) {
  return sum(
    data.purchases
      .filter((order) => order.supplierId === supplierId && order.status !== "canceled")
      .map((order) => order.debtAmount),
  );
}

export function getSupplierImported(data: WarehouseData, supplierId: string) {
  return sum(
    data.purchases
      .filter((order) => order.supplierId === supplierId && order.status !== "canceled")
      .map((order) => order.totalAmount),
  );
}

export function getCustomerBought(data: WarehouseData, customerId: string) {
  return sum(
    data.sales
      .filter((order) => order.customerId === customerId && order.status !== "canceled")
      .map((order) => order.totalAmount),
  );
}

export function getCustomerPaid(data: WarehouseData, customerId: string) {
  return sum(
    data.sales
      .filter((order) => order.customerId === customerId && order.status !== "canceled")
      .map((order) => order.paidAmount),
  );
}

export function getSupplierPaid(data: WarehouseData, supplierId: string) {
  return sum(
    data.purchases
      .filter((order) => order.supplierId === supplierId && order.status !== "canceled")
      .map((order) => order.paidAmount),
  );
}

export function getPurchaseDebt(order: PurchaseOrder) {
  return Math.max(order.totalAmount - order.paidAmount, 0);
}
