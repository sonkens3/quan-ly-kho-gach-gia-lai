const APP_VERSION = 1;

const TABLES = {
  products: [
    "id",
    "code",
    "name",
    "category",
    "size",
    "unit",
    "piecesPerBox",
    "sqmPerBox",
    "importPrice",
    "salePrice",
    "supplierId",
    "minStock",
    "isActive",
    "note",
    "createdAt",
  ],
  customers: ["id", "name", "phone", "address", "customerGroup", "note", "createdAt"],
  suppliers: ["id", "name", "phone", "address", "contactPerson", "note", "createdAt"],
  purchase_orders: [
    "id",
    "code",
    "supplierId",
    "orderDate",
    "productId",
    "quantity",
    "unitPrice",
    "totalAmount",
    "paidAmount",
    "debtAmount",
    "paymentMethod",
    "status",
    "note",
    "createdAt",
  ],
  sales_orders: [
    "id",
    "code",
    "customerId",
    "orderDate",
    "productId",
    "quantity",
    "unitPrice",
    "discountAmount",
    "shippingFee",
    "subtotalAmount",
    "totalAmount",
    "paidAmount",
    "debtAmount",
    "paymentMethod",
    "deliveryStatus",
    "paymentStatus",
    "status",
    "note",
    "createdAt",
  ],
  stock_movements: [
    "id",
    "productId",
    "movementDate",
    "quantity",
    "movementType",
    "referenceType",
    "referenceId",
    "note",
    "createdAt",
  ],
  payments: [
    "id",
    "paymentDate",
    "direction",
    "partyType",
    "customerId",
    "supplierId",
    "referenceType",
    "referenceId",
    "amount",
    "method",
    "note",
    "createdAt",
  ],
  expenses: ["id", "category", "amount", "expenseDate", "paymentMethod", "note", "createdAt"],
  audit_logs: ["id", "time", "user", "action", "tableName", "recordCode", "note"],
  settings: ["key", "value", "updatedAt"],
};

const NUMBER_FIELDS = new Set([
  "piecesPerBox",
  "sqmPerBox",
  "importPrice",
  "salePrice",
  "minStock",
  "quantity",
  "unitPrice",
  "totalAmount",
  "paidAmount",
  "debtAmount",
  "discountAmount",
  "shippingFee",
  "subtotalAmount",
  "amount",
]);

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLES).forEach((tableName) => ensureSheet_(ss, tableName));
  seedIfEmpty_();
}

function setAppKey(appKey) {
  PropertiesService.getScriptProperties().setProperty("APP_KEY", String(appKey || ""));
}

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  const params = (e && e.parameter) || {};
  const callback = params.callback || "";

  try {
    authorize_(params);
    const action = params.action || "snapshot";

    if (action === "snapshot") {
      return respond_(callback, { ok: true, version: APP_VERSION, data: snapshot_() });
    }

    if (action === "mutate") {
      const type = params.type;
      const payload = JSON.parse(params.payload || "{}");
      const result = mutate_(type, payload);
      return respond_(callback, result);
    }

    throw new Error("Action không hợp lệ.");
  } catch (error) {
    return respond_(callback, {
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function authorize_(params) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("APP_KEY");

  if (!expectedKey) {
    return;
  }

  if (params.key !== expectedKey) {
    throw new Error("Sai app key.");
  }
}

function respond_(callback, payload) {
  const json = JSON.stringify(payload);

  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    );
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function mutate_(type, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (type === "addProduct") addProduct_(payload);
    else if (type === "addCustomer") addCustomer_(payload);
    else if (type === "addSupplier") addSupplier_(payload);
    else if (type === "addPurchase") addPurchase_(payload);
    else if (type === "addSale") addSale_(payload);
    else if (type === "recordCustomerPayment") recordCustomerPayment_(payload);
    else if (type === "addExpense") addExpense_(payload);
    else throw new Error("Loại thao tác không hợp lệ.");

    SpreadsheetApp.flush();
    return { ok: true, version: APP_VERSION, data: snapshot_() };
  } finally {
    lock.releaseLock();
  }
}

function snapshot_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLES).forEach((tableName) => ensureSheet_(ss, tableName));

  return {
    products: readTable_("products"),
    customers: readTable_("customers"),
    suppliers: readTable_("suppliers"),
    purchases: readTable_("purchase_orders"),
    sales: readTable_("sales_orders"),
    stockMovements: readTable_("stock_movements"),
    payments: readTable_("payments"),
    expenses: readTable_("expenses"),
    auditLogs: readTable_("audit_logs"),
  };
}

function ensureSheet_(ss, tableName) {
  let sheet = ss.getSheetByName(tableName);

  if (!sheet) {
    sheet = ss.insertSheet(tableName);
  }

  const headers = TABLES[tableName];
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readTable_(tableName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureSheet_(ss, tableName);
  const lastRow = sheet.getLastRow();
  const headers = TABLES[tableName];

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => rowToObject_(headers, row));
}

function writeTable_(tableName, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureSheet_(ss, tableName);
  const headers = TABLES[tableName];
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map((row) => objectToRow_(headers, row)));
  }
}

function appendRow_(tableName, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureSheet_(ss, tableName);
  sheet.appendRow(objectToRow_(TABLES[tableName], row));
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    const value = row[index];
    obj[header] = NUMBER_FIELDS.has(header) ? Number(value || 0) : value;
  });
  return obj;
}

function objectToRow_(headers, obj) {
  return headers.map((header) => (obj[header] === undefined ? "" : obj[header]));
}

function addProduct_(payload) {
  const code = text_(payload.code);
  if (!code || !text_(payload.name)) throw new Error("Thiếu mã hàng hoặc tên hàng.");
  if (readTable_("products").some((product) => product.code === code)) throw new Error("Mã hàng đã tồn tại.");

  appendRow_("products", {
    id: makeId_("product"),
    code,
    name: text_(payload.name),
    category: text_(payload.category),
    size: text_(payload.size),
    unit: "thùng",
    piecesPerBox: number_(payload.piecesPerBox),
    sqmPerBox: number_(payload.sqmPerBox),
    importPrice: number_(payload.importPrice),
    salePrice: number_(payload.salePrice),
    supplierId: text_(payload.supplierId),
    minStock: number_(payload.minStock),
    isActive: true,
    note: text_(payload.note),
    createdAt: now_(),
  });
  audit_("create", "products", code, `Tạo sản phẩm ${text_(payload.name)}`);
}

function addCustomer_(payload) {
  const name = text_(payload.name);
  if (!name) throw new Error("Thiếu tên khách hàng.");

  appendRow_("customers", {
    id: makeId_("customer"),
    name,
    phone: text_(payload.phone),
    address: text_(payload.address),
    customerGroup: text_(payload.customerGroup),
    note: text_(payload.note),
    createdAt: now_(),
  });
  audit_("create", "customers", name, `Tạo khách hàng ${name}`);
}

function addSupplier_(payload) {
  const name = text_(payload.name);
  if (!name) throw new Error("Thiếu tên nhà cung cấp.");

  appendRow_("suppliers", {
    id: makeId_("supplier"),
    name,
    phone: text_(payload.phone),
    address: text_(payload.address),
    contactPerson: text_(payload.contactPerson),
    note: text_(payload.note),
    createdAt: now_(),
  });
  audit_("create", "suppliers", name, `Tạo nhà cung cấp ${name}`);
}

function addPurchase_(payload) {
  const purchases = readTable_("purchase_orders");
  const code = nextCode_("PO", purchases.map((order) => order.code));
  const id = makeId_("purchase");
  const quantity = number_(payload.quantity);
  const unitPrice = number_(payload.unitPrice);
  const totalAmount = quantity * unitPrice;
  const paidAmount = Math.min(number_(payload.paidAmount), totalAmount);
  const orderDate = text_(payload.orderDate) || today_();

  if (!text_(payload.supplierId) || !text_(payload.productId)) throw new Error("Thiếu nhà cung cấp hoặc sản phẩm.");
  if (quantity <= 0) throw new Error("Số lượng nhập phải lớn hơn 0.");

  appendRow_("purchase_orders", {
    id,
    code,
    supplierId: text_(payload.supplierId),
    orderDate,
    productId: text_(payload.productId),
    quantity,
    unitPrice,
    totalAmount,
    paidAmount,
    debtAmount: Math.max(totalAmount - paidAmount, 0),
    paymentMethod: text_(payload.paymentMethod),
    status: "confirmed",
    note: text_(payload.note),
    createdAt: now_(),
  });
  appendRow_("stock_movements", {
    id: makeId_("movement"),
    productId: text_(payload.productId),
    movementDate: orderDate,
    quantity,
    movementType: "purchase",
    referenceType: "purchase_order",
    referenceId: id,
    note: `Nhập ${code}`,
    createdAt: now_(),
  });

  if (paidAmount > 0) {
    appendRow_("payments", {
      id: makeId_("payment"),
      paymentDate: orderDate,
      direction: "out",
      partyType: "supplier",
      customerId: "",
      supplierId: text_(payload.supplierId),
      referenceType: "purchase_order",
      referenceId: id,
      amount: paidAmount,
      method: text_(payload.paymentMethod),
      note: `Trả tiền ${code}`,
      createdAt: now_(),
    });
  }

  audit_("confirm", "purchase_orders", code, `Xác nhận nhập ${quantity} thùng`);
}

function addSale_(payload) {
  const sales = readTable_("sales_orders");
  const productId = text_(payload.productId);
  const quantity = number_(payload.quantity);
  const availableStock = getAvailableStock_(productId);

  if (!text_(payload.customerId) || !productId) throw new Error("Thiếu khách hàng hoặc sản phẩm.");
  if (quantity <= 0) throw new Error("Số lượng bán phải lớn hơn 0.");
  if (availableStock < quantity) throw new Error(`Không đủ tồn kho. Hiện còn ${availableStock} thùng.`);

  const code = nextCode_("SO", sales.map((order) => order.code));
  const id = makeId_("sale");
  const orderDate = text_(payload.orderDate) || today_();
  const unitPrice = number_(payload.unitPrice);
  const discountAmount = number_(payload.discountAmount);
  const shippingFee = number_(payload.shippingFee);
  const subtotalAmount = quantity * unitPrice;
  const totalAmount = Math.max(subtotalAmount - discountAmount + shippingFee, 0);
  const paidAmount = Math.min(number_(payload.paidAmount), totalAmount);
  const debtAmount = Math.max(totalAmount - paidAmount, 0);

  appendRow_("sales_orders", {
    id,
    code,
    customerId: text_(payload.customerId),
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
    paymentMethod: text_(payload.paymentMethod),
    deliveryStatus: "pending",
    paymentStatus: debtAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
    status: "confirmed",
    note: text_(payload.note),
    createdAt: now_(),
  });
  appendRow_("stock_movements", {
    id: makeId_("movement"),
    productId,
    movementDate: orderDate,
    quantity: -quantity,
    movementType: "sale",
    referenceType: "sales_order",
    referenceId: id,
    note: `Bán ${code}`,
    createdAt: now_(),
  });

  if (paidAmount > 0) {
    appendRow_("payments", {
      id: makeId_("payment"),
      paymentDate: orderDate,
      direction: "in",
      partyType: "customer",
      customerId: text_(payload.customerId),
      supplierId: "",
      referenceType: "sales_order",
      referenceId: id,
      amount: paidAmount,
      method: text_(payload.paymentMethod),
      note: `Thu tiền ${code}`,
      createdAt: now_(),
    });
  }

  audit_("confirm", "sales_orders", code, `Xác nhận bán ${quantity} thùng`);
}

function recordCustomerPayment_(payload) {
  const customerId = text_(payload.customerId);
  const amount = number_(payload.amount);
  const paymentDate = text_(payload.paymentDate) || today_();
  const sales = readTable_("sales_orders");
  const outstandingOrders = sales
    .filter((order) => order.customerId === customerId && order.status !== "canceled" && number_(order.debtAmount) > 0)
    .sort((a, b) => String(a.orderDate).localeCompare(String(b.orderDate)));
  const totalDebt = outstandingOrders.reduce((total, order) => total + number_(order.debtAmount), 0);

  if (!customerId) throw new Error("Chọn khách hàng cần trả nợ.");
  if (amount <= 0) throw new Error("Số tiền trả nợ phải lớn hơn 0.");
  if (totalDebt <= 0) throw new Error("Khách hàng này không còn công nợ.");
  if (amount > totalDebt) throw new Error(`Số tiền vượt công nợ hiện tại. Khách còn nợ ${formatVnd_(totalDebt)}.`);

  let remaining = amount;
  const affectedCodes = [];
  const updatedSales = sales.map((order) => {
    if (order.customerId !== customerId || order.status === "canceled" || number_(order.debtAmount) <= 0 || remaining <= 0) {
      return order;
    }

    const paidForOrder = Math.min(number_(order.debtAmount), remaining);
    remaining -= paidForOrder;
    affectedCodes.push(order.code);
    const nextDebt = Math.max(number_(order.debtAmount) - paidForOrder, 0);
    return Object.assign({}, order, {
      paidAmount: number_(order.paidAmount) + paidForOrder,
      debtAmount: nextDebt,
      paymentStatus: nextDebt <= 0 ? "paid" : "partial",
    });
  });

  writeTable_("sales_orders", updatedSales);
  appendRow_("payments", {
    id: makeId_("payment"),
    paymentDate,
    direction: "in",
    partyType: "customer",
    customerId,
    supplierId: "",
    referenceType: "manual",
    referenceId: affectedCodes.join(", "),
    amount,
    method: text_(payload.method) || "Tiền mặt",
    note: text_(payload.note) || `Khách trả nợ: ${affectedCodes.join(", ")}`,
    createdAt: now_(),
  });
  audit_("payment", "customer_debts", affectedCodes.join(", "), `Ghi nhận khách trả ${formatVnd_(amount)}`);
}

function addExpense_(payload) {
  const amount = number_(payload.amount);
  const expenseDate = text_(payload.expenseDate) || today_();
  const id = makeId_("expense");
  if (amount <= 0) throw new Error("Số tiền chi phải lớn hơn 0.");

  appendRow_("expenses", {
    id,
    category: text_(payload.category),
    amount,
    expenseDate,
    paymentMethod: text_(payload.paymentMethod),
    note: text_(payload.note),
    createdAt: now_(),
  });
  appendRow_("payments", {
    id: makeId_("payment"),
    paymentDate: expenseDate,
    direction: "out",
    partyType: "other",
    customerId: "",
    supplierId: "",
    referenceType: "expense",
    referenceId: id,
    amount,
    method: text_(payload.paymentMethod),
    note: text_(payload.note),
    createdAt: now_(),
  });
  audit_("create", "expenses", text_(payload.category), `Tạo chi phí ${text_(payload.category)}`);
}

function computeInventory_() {
  const products = readTable_("products");
  const movements = readTable_("stock_movements");
  return products.map((product) => {
    const currentStock = movements
      .filter((movement) => movement.productId === product.id)
      .reduce((total, movement) => total + number_(movement.quantity), 0);
    return Object.assign({}, product, { currentStock });
  });
}

function getAvailableStock_(productId) {
  const item = computeInventory_().find((product) => product.id === productId);
  return item ? number_(item.currentStock) : 0;
}

function audit_(action, tableName, recordCode, note) {
  appendRow_("audit_logs", {
    id: makeId_("audit"),
    time: now_(),
    user: "Google Sheet API",
    action,
    tableName,
    recordCode,
    note,
  });
}

function seedIfEmpty_() {
  if (readTable_("products").length > 0) return;

  appendRow_("suppliers", {
    id: "supplier-abc",
    name: "Nhà cung cấp Gạch ABC",
    phone: "0901000001",
    address: "KCN Tân Tạo, TP.HCM",
    contactPerson: "Anh Minh",
    note: "Nguồn hàng chính",
    createdAt: now_(),
  });
  appendRow_("customers", {
    id: "customer-a",
    name: "Khách Nguyễn Văn A",
    phone: "0912000001",
    address: "Quận 8, TP.HCM",
    customerGroup: "Bán lẻ",
    note: "Khách mẫu",
    createdAt: now_(),
  });
  appendRow_("products", {
    id: "product-6060-a01",
    code: "G6060-A01",
    name: "Gạch bóng kính 60x60 A01",
    category: "Gạch lát nền",
    size: "60x60",
    unit: "thùng",
    piecesPerBox: 4,
    sqmPerBox: 1.44,
    importPrice: 120000,
    salePrice: 150000,
    supplierId: "supplier-abc",
    minStock: 20,
    isActive: true,
    note: "Hàng mẫu",
    createdAt: now_(),
  });
  audit_("seed", "settings", "INIT", "Tạo dữ liệu mẫu ban đầu");
}

function makeId_(prefix) {
  return `${prefix}-${Utilities.getUuid()}`;
}

function nextCode_(prefix, codes) {
  const nextNumber =
    codes.reduce((max, code) => {
      const number = Number(String(code || "").replace(`${prefix}-`, ""));
      return isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

function text_(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

function number_(value) {
  const parsed = Number(String(value === undefined || value === null ? 0 : value).replace(/[^\d.-]/g, ""));
  return isFinite(parsed) ? parsed : 0;
}

function now_() {
  return new Date().toISOString();
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatVnd_(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}
