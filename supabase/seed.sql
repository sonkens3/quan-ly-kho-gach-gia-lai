insert into public.suppliers (id, name, phone, address, contact_person, note)
values
  ('00000000-0000-0000-0000-000000000101', 'Nhà cung cấp Gạch ABC', '0901000001', 'KCN Tân Tạo, TP.HCM', 'Anh Minh', 'Nguồn hàng chính'),
  ('00000000-0000-0000-0000-000000000102', 'Nhà cung cấp Gạch XYZ', '0901000002', 'KCN Sóng Thần, Bình Dương', 'Chị Hạnh', 'Gạch cao cấp')
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  address = excluded.address,
  contact_person = excluded.contact_person,
  note = excluded.note;

insert into public.customers (id, name, phone, address, customer_group, note)
values
  ('00000000-0000-0000-0000-000000000201', 'Khách Nguyễn Văn A', '0912000001', 'Quận 8, TP.HCM', 'Bán lẻ', 'Khách mua thường xuyên'),
  ('00000000-0000-0000-0000-000000000202', 'Khách Trần Văn B', '0912000002', 'Biên Hòa, Đồng Nai', 'Đại lý', 'Ưu tiên giao nhanh'),
  ('00000000-0000-0000-0000-000000000203', 'Công trình Nhà Anh C', '0912000003', 'Thủ Đức, TP.HCM', 'Công trình', 'Theo dõi công nợ riêng')
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  address = excluded.address,
  customer_group = excluded.customer_group,
  note = excluded.note;

insert into public.products (
  id,
  code,
  name,
  category,
  size,
  unit,
  pieces_per_box,
  sqm_per_box,
  import_price,
  sale_price,
  supplier_id,
  min_stock,
  note
)
values
  ('00000000-0000-0000-0000-000000000301', 'G6060-A01', 'Gạch bóng kính 60x60 A01', 'Gạch lát nền', '60x60', 'box', 4, 1.44, 120000, 150000, '00000000-0000-0000-0000-000000000101', 20, 'Hàng bán chạy'),
  ('00000000-0000-0000-0000-000000000302', 'G8080-B01', 'Gạch 80x80 B01', 'Gạch lát nền', '80x80', 'box', 3, 1.92, 210000, 260000, '00000000-0000-0000-0000-000000000102', 15, 'Dòng cao cấp'),
  ('00000000-0000-0000-0000-000000000303', 'G3060-C01', 'Gạch 30x60 C01', 'Gạch ốp tường', '30x60', 'box', 8, 1.44, 95000, 125000, '00000000-0000-0000-0000-000000000101', 25, 'Ốp nhà tắm'),
  ('00000000-0000-0000-0000-000000000304', 'GLS-D01', 'Gạch lát sân D01', 'Gạch sân vườn', '40x40', 'box', 6, 0.96, 80000, 110000, '00000000-0000-0000-0000-000000000102', 30, 'Chống trơn')
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  size = excluded.size,
  unit = excluded.unit,
  pieces_per_box = excluded.pieces_per_box,
  sqm_per_box = excluded.sqm_per_box,
  import_price = excluded.import_price,
  sale_price = excluded.sale_price,
  supplier_id = excluded.supplier_id,
  min_stock = excluded.min_stock,
  note = excluded.note;

insert into public.purchase_orders (
  id,
  code,
  supplier_id,
  order_date,
  total_amount,
  paid_amount,
  debt_amount,
  payment_method,
  status,
  note
)
values
  ('00000000-0000-0000-0000-000000000401', 'PO-0001', '00000000-0000-0000-0000-000000000101', current_date - 10, 12000000, 8000000, 4000000, 'Chuyển khoản', 'confirmed', 'Seed nhập gạch 60x60'),
  ('00000000-0000-0000-0000-000000000402', 'PO-0002', '00000000-0000-0000-0000-000000000102', current_date - 8, 10500000, 10500000, 0, 'Tiền mặt', 'confirmed', 'Seed nhập gạch 80x80'),
  ('00000000-0000-0000-0000-000000000403', 'PO-0003', '00000000-0000-0000-0000-000000000101', current_date - 5, 7600000, 3000000, 4600000, 'Chuyển khoản', 'confirmed', 'Seed nhập gạch ốp')
on conflict (code) do nothing;

insert into public.purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price)
values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 100, 120000),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000302', 50, 210000),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000303', 80, 95000)
on conflict (id) do nothing;

insert into public.sales_orders (
  id,
  code,
  customer_id,
  order_date,
  customer_phone,
  delivery_address,
  subtotal_amount,
  discount_amount,
  shipping_fee,
  total_amount,
  paid_amount,
  debt_amount,
  payment_method,
  delivery_status,
  payment_status,
  status,
  note
)
values
  ('00000000-0000-0000-0000-000000000501', 'SO-0001', '00000000-0000-0000-0000-000000000201', current_date - 3, '0912000001', 'Quận 8, TP.HCM', 3000000, 0, 150000, 3150000, 2000000, 1150000, 'Chuyển khoản', 'delivered', 'partial', 'completed', 'Seed bán 60x60'),
  ('00000000-0000-0000-0000-000000000502', 'SO-0002', '00000000-0000-0000-0000-000000000202', current_date - 2, '0912000002', 'Biên Hòa, Đồng Nai', 5200000, 200000, 250000, 5250000, 5250000, 0, 'Tiền mặt', 'delivered', 'paid', 'completed', 'Seed bán 80x80'),
  ('00000000-0000-0000-0000-000000000503', 'SO-0003', '00000000-0000-0000-0000-000000000203', current_date - 1, '0912000003', 'Thủ Đức, TP.HCM', 2500000, 0, 200000, 2700000, 1000000, 1700000, 'Chuyển khoản', 'delivering', 'partial', 'delivering', 'Seed công trình'),
  ('00000000-0000-0000-0000-000000000504', 'SO-0004', '00000000-0000-0000-0000-000000000201', current_date, '0912000001', 'Quận 8, TP.HCM', 1250000, 0, 0, 1250000, 1250000, 0, 'Tiền mặt', 'pending', 'paid', 'confirmed', 'Seed đơn hôm nay'),
  ('00000000-0000-0000-0000-000000000505', 'SO-0005', '00000000-0000-0000-0000-000000000202', current_date, '0912000002', 'Biên Hòa, Đồng Nai', 2200000, 100000, 150000, 2250000, 0, 2250000, null, 'pending', 'unpaid', 'confirmed', 'Seed đơn còn nợ')
on conflict (code) do nothing;

insert into public.sales_order_items (id, sales_order_id, product_id, quantity, unit_price, discount_amount, cost_price)
values
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000301', 20, 150000, 0, 120000),
  ('00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000302', 20, 260000, 200000, 210000),
  ('00000000-0000-0000-0000-000000000513', '00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000303', 20, 125000, 0, 95000),
  ('00000000-0000-0000-0000-000000000514', '00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000303', 10, 125000, 0, 95000),
  ('00000000-0000-0000-0000-000000000515', '00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000304', 20, 110000, 100000, 80000)
on conflict (id) do nothing;

insert into public.stock_movements (id, product_id, movement_date, quantity, movement_type, reference_type, reference_id, note)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000301', current_date - 10, 100, 'purchase', 'purchase_order', '00000000-0000-0000-0000-000000000401', 'Seed nhập PO-0001'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000302', current_date - 8, 50, 'purchase', 'purchase_order', '00000000-0000-0000-0000-000000000402', 'Seed nhập PO-0002'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000303', current_date - 5, 80, 'purchase', 'purchase_order', '00000000-0000-0000-0000-000000000403', 'Seed nhập PO-0003'),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000301', current_date - 3, -20, 'sale', 'sales_order', '00000000-0000-0000-0000-000000000501', 'Seed bán SO-0001'),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000302', current_date - 2, -20, 'sale', 'sales_order', '00000000-0000-0000-0000-000000000502', 'Seed bán SO-0002'),
  ('00000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000303', current_date - 1, -20, 'sale', 'sales_order', '00000000-0000-0000-0000-000000000503', 'Seed bán SO-0003'),
  ('00000000-0000-0000-0000-000000000607', '00000000-0000-0000-0000-000000000303', current_date, -10, 'sale', 'sales_order', '00000000-0000-0000-0000-000000000504', 'Seed bán SO-0004'),
  ('00000000-0000-0000-0000-000000000608', '00000000-0000-0000-0000-000000000304', current_date, 60, 'adjustment', null, null, 'Seed tồn đầu kỳ gạch sân'),
  ('00000000-0000-0000-0000-000000000609', '00000000-0000-0000-0000-000000000304', current_date, -20, 'sale', 'sales_order', '00000000-0000-0000-0000-000000000505', 'Seed bán SO-0005')
on conflict (id) do nothing;

insert into public.payments (id, payment_date, direction, party_type, customer_id, supplier_id, reference_type, reference_id, amount, method, note)
values
  ('00000000-0000-0000-0000-000000000701', current_date - 3, 'in', 'customer', '00000000-0000-0000-0000-000000000201', null, 'sales_order', '00000000-0000-0000-0000-000000000501', 2000000, 'Chuyển khoản', 'Khách trả SO-0001'),
  ('00000000-0000-0000-0000-000000000702', current_date - 2, 'in', 'customer', '00000000-0000-0000-0000-000000000202', null, 'sales_order', '00000000-0000-0000-0000-000000000502', 5250000, 'Tiền mặt', 'Khách trả SO-0002'),
  ('00000000-0000-0000-0000-000000000703', current_date - 1, 'in', 'customer', '00000000-0000-0000-0000-000000000203', null, 'sales_order', '00000000-0000-0000-0000-000000000503', 1000000, 'Chuyển khoản', 'Khách trả SO-0003'),
  ('00000000-0000-0000-0000-000000000704', current_date - 10, 'out', 'supplier', null, '00000000-0000-0000-0000-000000000101', 'purchase_order', '00000000-0000-0000-0000-000000000401', 8000000, 'Chuyển khoản', 'Trả NCC PO-0001'),
  ('00000000-0000-0000-0000-000000000705', current_date - 8, 'out', 'supplier', null, '00000000-0000-0000-0000-000000000102', 'purchase_order', '00000000-0000-0000-0000-000000000402', 10500000, 'Tiền mặt', 'Trả NCC PO-0002')
on conflict (id) do nothing;

insert into public.expenses (id, category, amount, expense_date, payment_method, note)
values
  ('00000000-0000-0000-0000-000000000801', 'Vận chuyển', 450000, current_date - 3, 'Tiền mặt', 'Giao đơn SO-0001'),
  ('00000000-0000-0000-0000-000000000802', 'Bốc xếp', 300000, current_date - 2, 'Tiền mặt', 'Nhập hàng PO-0002'),
  ('00000000-0000-0000-0000-000000000803', 'Thuê kho', 2500000, date_trunc('month', current_date)::date, 'Chuyển khoản', 'Chi phí thuê kho tháng này')
on conflict (id) do nothing;

insert into public.audit_logs (id, action, table_name, note)
values
  ('00000000-0000-0000-0000-000000000901', 'seed', 'products', 'Tạo dữ liệu mẫu sản phẩm'),
  ('00000000-0000-0000-0000-000000000902', 'seed', 'purchase_orders', 'Tạo dữ liệu mẫu nhập hàng'),
  ('00000000-0000-0000-0000-000000000903', 'seed', 'sales_orders', 'Tạo dữ liệu mẫu bán hàng')
on conflict (id) do nothing;

-- Tạo người dùng bằng Supabase Auth trước, sau đó thêm profile tương ứng:
-- insert into public.profiles (id, full_name, phone, role)
-- values ('auth-user-id', 'Chủ kho', '0900000000', 'admin');
