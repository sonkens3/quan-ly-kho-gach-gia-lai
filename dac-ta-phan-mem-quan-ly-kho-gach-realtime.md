# ĐẶC TẢ PHẦN MỀM QUẢN LÝ KHO GẠCH REALTIME

## 1. Mục tiêu phần mềm

Tôi cần xây dựng một phần mềm web để quản lý một kho gạch làm chung với người khác.

Phần mềm cần giúp kế toán, chủ kho và người góp chung quản lý đầy đủ:

- Hàng nhập kho
- Hàng bán ra
- Hàng còn tồn trong kho
- Công nợ khách hàng
- Công nợ nhà cung cấp
- Lịch sử thu chi
- Lịch sử mua bán
- Báo cáo doanh thu, tồn kho, công nợ
- Nhật ký thao tác của từng người
- Dữ liệu cập nhật realtime để chủ kho có thể xem ngay khi kế toán thay đổi dữ liệu

Phần mềm phải dùng được trên:

- Máy tính
- Laptop
- Điện thoại Android
- iPhone
- Tablet

Ưu tiên làm dạng web app responsive, mở bằng trình duyệt là dùng được.

---

## 2. Công nghệ yêu cầu

Ưu tiên sử dụng stack sau:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- Row Level Security
- React Hook Form
- Zod validation
- TanStack Table nếu cần bảng dữ liệu nâng cao
- Recharts nếu cần biểu đồ
- Xuất Excel bằng thư viện xlsx
- Xuất PDF bằng thư viện phù hợp

Lý do chọn Supabase:

- Có PostgreSQL phù hợp cho dữ liệu kho, tiền, công nợ
- Có realtime để cập nhật dữ liệu ngay
- Có auth đăng nhập
- Có phân quyền bằng RLS
- Có storage để lưu ảnh hóa đơn, chứng từ, ảnh mẫu gạch

---

## 3. Vai trò người dùng

Phần mềm cần có phân quyền rõ ràng.

### 3.1. Admin / Chủ kho

Có toàn quyền:

- Xem tất cả dữ liệu
- Tạo, sửa, hủy phiếu
- Quản lý sản phẩm
- Quản lý khách hàng
- Quản lý nhà cung cấp
- Quản lý người dùng
- Xem báo cáo doanh thu, lợi nhuận, công nợ
- Xem lịch sử thao tác
- Khóa sổ ngày/tháng
- Xuất Excel/PDF

### 3.2. Partner / Người góp chung

Có quyền xem, không có quyền sửa dữ liệu quan trọng:

- Xem dashboard
- Xem tồn kho
- Xem nhập hàng
- Xem bán hàng
- Xem công nợ
- Xem thu chi
- Xem báo cáo
- Xem nhật ký thao tác

Không được:

- Xóa dữ liệu
- Sửa phiếu nhập
- Sửa phiếu bán
- Sửa thu chi
- Sửa công nợ
- Quản lý tài khoản người dùng

### 3.3. Accountant / Kế toán

Có quyền thao tác nghiệp vụ:

- Tạo phiếu nhập kho
- Tạo phiếu bán hàng
- Ghi nhận thu tiền khách
- Ghi nhận trả tiền nhà cung cấp
- Tạo chi phí
- Xem công nợ
- Xem tồn kho
- Xem khách hàng
- Xem nhà cung cấp

Không được:

- Xóa dữ liệu vĩnh viễn
- Xem lợi nhuận nếu Admin không cho phép
- Quản lý tài khoản người dùng
- Sửa phiếu đã khóa sổ

### 3.4. Warehouse / Nhân viên kho

Có quyền hạn chế:

- Xem danh sách đơn cần xuất
- Xác nhận đã giao hàng hoặc đã xuất kho
- Xem tồn kho
- Ghi chú giao hàng

Không được:

- Xem lợi nhuận
- Xem công nợ chi tiết
- Sửa giá bán
- Sửa giá nhập
- Sửa phiếu thu chi

---

## 4. Nguyên tắc dữ liệu quan trọng

Phần mềm phải đảm bảo các nguyên tắc sau:

### 4.1. Không xóa dữ liệu thật

Không được xóa vĩnh viễn phiếu nhập, phiếu bán, phiếu thu, phiếu chi.

Nếu sai thì chuyển trạng thái:

- `canceled`
- `voided`
- `reversed`

Khi hủy phải lưu:

- Người hủy
- Thời gian hủy
- Lý do hủy
- Dữ liệu cũ
- Dữ liệu mới
- Ảnh hưởng đến tồn kho hoặc công nợ

### 4.2. Mọi thao tác quan trọng phải có audit log

Cần lưu lại:

- Ai thao tác
- Thao tác gì
- Bảng nào
- Bản ghi nào
- Dữ liệu trước khi sửa
- Dữ liệu sau khi sửa
- Thời gian thao tác
- IP hoặc thông tin thiết bị nếu có thể

### 4.3. Không cho bán quá tồn kho

Khi tạo đơn bán, hệ thống phải kiểm tra tồn kho.

Nếu không đủ hàng, không cho lưu đơn hoặc phải yêu cầu Admin duyệt.

### 4.4. Tồn kho phải có lịch sử

Không chỉ lưu số tồn hiện tại. Mọi thay đổi tồn kho phải có lịch sử trong bảng `stock_movements`.

Ví dụ:

- Nhập hàng: tăng tồn
- Bán hàng: giảm tồn
- Hủy bán hàng: hoàn tồn
- Trả hàng: tăng tồn
- Điều chỉnh kho: tăng hoặc giảm tồn

### 4.5. Tiền và công nợ phải có lịch sử

Không chỉ lưu số nợ hiện tại. Mọi lần thanh toán phải lưu trong bảng `payments`.

---

## 5. Module chức năng cần làm

## 5.1. Đăng nhập và phân quyền

Yêu cầu:

- Đăng nhập bằng email/số điện thoại và mật khẩu
- Phân quyền theo role
- Chặn route theo quyền
- Người không có quyền không được truy cập dữ liệu qua giao diện hoặc API
- Sử dụng Supabase Auth
- Sử dụng RLS để bảo vệ dữ liệu ở database

Các màn hình:

- Đăng nhập
- Đổi mật khẩu
- Quản lý tài khoản người dùng
- Cấp quyền người dùng

---

## 5.2. Quản lý sản phẩm gạch

Mỗi sản phẩm gạch cần lưu:

- Mã hàng
- Tên hàng
- Loại hàng
- Kích thước
- Đơn vị tính
- Số viên/thùng
- Số m2/thùng
- Giá nhập mặc định
- Giá bán mặc định
- Nhà cung cấp chính
- Ảnh sản phẩm
- Ghi chú
- Trạng thái đang bán/ngừng bán
- Tồn tối thiểu để cảnh báo

Ví dụ sản phẩm:

```text
Mã hàng: G6060-A01
Tên hàng: Gạch bóng kính 60x60 A01
Kích thước: 60x60
Quy cách: 4 viên/thùng
M2/thùng: 1.44
Giá nhập: 120.000đ/thùng
Giá bán: 150.000đ/thùng
Tồn tối thiểu: 20 thùng
```

Chức năng:

- Thêm sản phẩm
- Sửa sản phẩm
- Ngừng bán sản phẩm
- Tìm kiếm sản phẩm
- Lọc theo kích thước, loại, nhà cung cấp
- Upload ảnh mẫu gạch

---

## 5.3. Quản lý khách hàng

Thông tin khách hàng:

- Tên khách hàng
- Số điện thoại
- Địa chỉ
- Nhóm khách hàng
- Ghi chú
- Tổng đã mua
- Tổng đã thanh toán
- Tổng còn nợ

Chức năng:

- Thêm khách hàng
- Sửa thông tin khách hàng
- Xem lịch sử mua hàng
- Xem công nợ khách hàng
- Xem lịch sử thanh toán

---

## 5.4. Quản lý nhà cung cấp

Thông tin nhà cung cấp:

- Tên nhà cung cấp
- Số điện thoại
- Địa chỉ
- Người liên hệ
- Ghi chú
- Tổng tiền đã nhập
- Tổng đã trả
- Tổng còn nợ

Chức năng:

- Thêm nhà cung cấp
- Sửa nhà cung cấp
- Xem lịch sử nhập hàng
- Xem công nợ nhà cung cấp
- Xem lịch sử thanh toán

---

## 5.5. Nhập kho

Kế toán tạo phiếu nhập kho.

Thông tin phiếu nhập:

- Mã phiếu nhập
- Ngày nhập
- Nhà cung cấp
- Danh sách sản phẩm nhập
- Số lượng
- Đơn giá nhập
- Tổng tiền từng dòng
- Tổng tiền phiếu
- Đã thanh toán
- Còn nợ
- Phương thức thanh toán
- Ghi chú
- Ảnh hóa đơn/chứng từ
- Người tạo phiếu
- Trạng thái phiếu

Trạng thái phiếu nhập:

- `draft`: nháp
- `confirmed`: đã xác nhận
- `canceled`: đã hủy

Khi phiếu nhập được xác nhận:

- Cộng tồn kho
- Tạo bản ghi trong `stock_movements`
- Tạo hoặc cập nhật công nợ nhà cung cấp
- Tạo bản ghi thanh toán nếu có trả tiền
- Ghi audit log

Không cho sửa phiếu đã khóa sổ.

---

## 5.6. Bán hàng

Kế toán tạo phiếu bán hàng.

Thông tin phiếu bán:

- Mã đơn bán
- Ngày bán
- Khách hàng
- Số điện thoại
- Địa chỉ giao hàng
- Danh sách sản phẩm bán
- Số lượng
- Đơn giá bán
- Chiết khấu
- Phí vận chuyển
- Tổng tiền hàng
- Tổng tiền đơn
- Khách đã trả
- Khách còn nợ
- Phương thức thanh toán
- Trạng thái giao hàng
- Trạng thái thanh toán
- Ghi chú
- Người tạo đơn

Trạng thái đơn bán:

- `draft`: nháp
- `confirmed`: đã xác nhận
- `delivering`: đang giao
- `completed`: hoàn thành
- `canceled`: đã hủy
- `returned`: trả hàng

Khi đơn bán được xác nhận:

- Kiểm tra tồn kho
- Nếu đủ tồn thì trừ tồn kho
- Tạo bản ghi `stock_movements`
- Tạo công nợ khách hàng nếu chưa trả đủ
- Tạo bản ghi thanh toán nếu khách đã trả tiền
- Ghi audit log

Nếu hủy đơn:

- Hoàn lại tồn kho nếu trước đó đã trừ
- Điều chỉnh công nợ
- Lưu lý do hủy
- Ghi audit log

---

## 5.7. Tồn kho realtime

Màn hình tồn kho cần hiển thị:

- Mã hàng
- Tên hàng
- Kích thước
- Tồn hiện tại theo thùng
- Tồn hiện tại theo viên nếu có
- Tồn quy đổi m2
- Giá trị tồn theo giá nhập
- Tồn tối thiểu
- Cảnh báo sắp hết hàng
- Trạng thái còn hàng/hết hàng/ngừng bán

Chức năng:

- Tìm kiếm tồn kho
- Lọc theo loại gạch
- Lọc theo kích thước
- Lọc hàng sắp hết
- Xem lịch sử nhập/xuất của từng mã hàng
- Realtime cập nhật khi có phiếu nhập/bán mới

---

## 5.8. Công nợ khách hàng

Màn hình công nợ khách hàng cần hiển thị:

- Tên khách hàng
- Số điện thoại
- Tổng tiền hàng đã mua
- Tổng đã trả
- Tổng còn nợ
- Nợ quá hạn nếu có
- Danh sách đơn còn nợ
- Lịch sử thanh toán

Chức năng:

- Ghi nhận khách trả thêm tiền
- Gắn thanh toán vào đơn bán cụ thể
- Ghi chú thanh toán
- Upload ảnh chuyển khoản/chứng từ
- Xem lịch sử từng lần trả
- Xuất báo cáo công nợ

---

## 5.9. Công nợ nhà cung cấp

Màn hình công nợ nhà cung cấp cần hiển thị:

- Tên nhà cung cấp
- Tổng tiền đã nhập
- Tổng đã trả
- Tổng còn nợ
- Danh sách phiếu nhập còn nợ
- Lịch sử thanh toán

Chức năng:

- Ghi nhận trả tiền nhà cung cấp
- Gắn thanh toán vào phiếu nhập cụ thể
- Ghi chú thanh toán
- Upload ảnh chứng từ
- Xuất báo cáo công nợ

---

## 5.10. Thu chi

Phần thu chi cần quản lý:

### Thu

- Thu tiền bán hàng
- Thu tiền khách trả nợ
- Thu tiền góp vốn
- Thu khác

### Chi

- Chi nhập hàng
- Chi trả nợ nhà cung cấp
- Chi vận chuyển
- Chi bốc xếp
- Chi thuê kho
- Chi lương
- Chi điện nước
- Chi khác
- Rút lợi nhuận
- Hoàn tiền khách

Mỗi giao dịch thu chi cần có:

- Ngày giao dịch
- Loại giao dịch
- Số tiền
- Phương thức thanh toán
- Người nhận/người trả
- Liên kết với đơn hàng hoặc phiếu nhập nếu có
- Ghi chú
- Ảnh chứng từ
- Người tạo
- Thời gian tạo

---

## 5.11. Dashboard realtime

Dashboard dành cho Admin và Partner.

Cần hiển thị:

- Doanh thu hôm nay
- Doanh thu tháng này
- Tiền đã thu hôm nay
- Tổng công nợ khách hàng
- Tổng nợ nhà cung cấp
- Giá trị hàng tồn kho
- Số đơn bán hôm nay
- Số phiếu nhập hôm nay
- Hàng sắp hết
- Top sản phẩm bán chạy
- Giao dịch mới nhất
- Nhật ký thao tác mới nhất

Yêu cầu realtime:

- Khi kế toán tạo đơn bán, dashboard tự cập nhật
- Khi nhập hàng, tồn kho tự cập nhật
- Khi ghi nhận thanh toán, công nợ tự cập nhật
- Không cần refresh trang

---

## 5.12. Báo cáo

Cần có các báo cáo:

### Báo cáo bán hàng

- Theo ngày
- Theo tháng
- Theo khách hàng
- Theo sản phẩm
- Theo nhân viên tạo đơn

### Báo cáo nhập hàng

- Theo ngày
- Theo tháng
- Theo nhà cung cấp
- Theo sản phẩm

### Báo cáo tồn kho

- Tồn hiện tại
- Tồn sắp hết
- Hàng tồn lâu
- Giá trị hàng tồn

### Báo cáo công nợ

- Công nợ khách hàng
- Công nợ nhà cung cấp
- Công nợ quá hạn

### Báo cáo thu chi

- Thu theo ngày/tháng
- Chi theo ngày/tháng
- Lợi nhuận tạm tính

### Xuất dữ liệu

- Xuất Excel
- Xuất PDF
- In phiếu bán hàng
- In phiếu nhập kho
- In phiếu công nợ

---

## 5.13. Nhật ký thao tác

Màn hình nhật ký thao tác cần hiển thị:

- Thời gian
- Người thao tác
- Hành động
- Bảng dữ liệu
- Mã phiếu/bản ghi
- Dữ liệu cũ
- Dữ liệu mới
- Ghi chú

Ví dụ:

```text
30/04/2026 09:20 - Kế toán A tạo đơn bán SO-0001
30/04/2026 09:21 - Hệ thống trừ tồn G6060-A01: -10 thùng
30/04/2026 09:30 - Admin hủy đơn SO-0001, lý do: khách đổi hàng
```

---

## 5.14. Khóa sổ

Cần có chức năng khóa sổ theo ngày hoặc theo tháng.

Khi đã khóa sổ:

- Không cho sửa phiếu cũ
- Không cho hủy phiếu cũ nếu không có quyền Admin
- Nếu cần điều chỉnh thì tạo phiếu điều chỉnh riêng
- Ghi audit log đầy đủ

---

## 6. Thiết kế database đề xuất

Hãy tạo migration SQL đầy đủ cho các bảng dưới đây.

## 6.1. profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('admin', 'partner', 'accountant', 'warehouse')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.2. suppliers

```sql
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  contact_person text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.3. customers

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  customer_group text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.4. products

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text,
  size text,
  unit text default 'box',
  pieces_per_box numeric default 0,
  sqm_per_box numeric default 0,
  import_price numeric default 0,
  sale_price numeric default 0,
  supplier_id uuid references suppliers(id),
  image_url text,
  min_stock numeric default 0,
  is_active boolean default true,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.5. purchase_orders

```sql
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  supplier_id uuid references suppliers(id),
  order_date date not null default current_date,
  total_amount numeric default 0,
  paid_amount numeric default 0,
  debt_amount numeric default 0,
  payment_method text,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'canceled')),
  note text,
  attachment_url text,
  created_by uuid references profiles(id),
  canceled_by uuid references profiles(id),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.6. purchase_order_items

```sql
create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric not null,
  unit_price numeric not null,
  total_price numeric not null,
  created_at timestamptz default now()
);
```

## 6.7. sales_orders

```sql
create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  order_date date not null default current_date,
  total_goods_amount numeric default 0,
  discount_amount numeric default 0,
  delivery_fee numeric default 0,
  total_amount numeric default 0,
  paid_amount numeric default 0,
  debt_amount numeric default 0,
  payment_method text,
  delivery_status text default 'pending' check (delivery_status in ('pending', 'delivering', 'delivered', 'returned')),
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'completed', 'canceled', 'returned')),
  note text,
  attachment_url text,
  created_by uuid references profiles(id),
  canceled_by uuid references profiles(id),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.8. sales_order_items

```sql
create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid references sales_orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric not null,
  unit_price numeric not null,
  discount_amount numeric default 0,
  total_price numeric not null,
  created_at timestamptz default now()
);
```

## 6.9. stock_movements

```sql
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  movement_type text not null check (movement_type in ('import', 'sale', 'sale_cancel', 'purchase_cancel', 'return', 'adjustment')),
  quantity numeric not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

Quy ước:

- Nhập kho: quantity dương
- Bán hàng: quantity âm
- Hủy bán hàng: quantity dương
- Hủy nhập hàng: quantity âm
- Điều chỉnh tăng: quantity dương
- Điều chỉnh giảm: quantity âm

## 6.10. payments

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_type text not null check (payment_type in ('customer_payment', 'supplier_payment', 'income', 'expense')),
  customer_id uuid references customers(id),
  supplier_id uuid references suppliers(id),
  amount numeric not null,
  payment_method text,
  reference_type text,
  reference_id uuid,
  note text,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

## 6.11. expenses

```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null,
  expense_date date not null default current_date,
  payment_method text,
  note text,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6.12. audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  note text,
  created_at timestamptz default now()
);
```

## 6.13. inventory_view

Tạo view tính tồn kho:

```sql
create view inventory_view as
select 
  p.id as product_id,
  p.code,
  p.name,
  p.category,
  p.size,
  p.unit,
  p.pieces_per_box,
  p.sqm_per_box,
  p.import_price,
  p.sale_price,
  p.min_stock,
  coalesce(sum(sm.quantity), 0) as current_stock,
  coalesce(sum(sm.quantity), 0) * p.sqm_per_box as current_sqm,
  coalesce(sum(sm.quantity), 0) * p.import_price as stock_value
from products p
left join stock_movements sm on sm.product_id = p.id
where p.is_active = true
group by p.id;
```

---

## 7. Yêu cầu về transaction

Các nghiệp vụ sau phải chạy bằng transaction để tránh sai dữ liệu:

### 7.1. Xác nhận phiếu nhập

Trong cùng một transaction:

1. Tạo/cập nhật purchase_order
2. Tạo purchase_order_items
3. Cộng tồn kho bằng stock_movements
4. Tạo payment nếu có paid_amount > 0
5. Tính debt_amount
6. Ghi audit_logs

### 7.2. Xác nhận đơn bán

Trong cùng một transaction:

1. Kiểm tra tồn kho từng sản phẩm
2. Nếu đủ tồn thì tạo/cập nhật sales_order
3. Tạo sales_order_items
4. Trừ tồn kho bằng stock_movements
5. Tạo payment nếu có paid_amount > 0
6. Tính debt_amount
7. Ghi audit_logs

### 7.3. Hủy đơn bán

Trong cùng một transaction:

1. Cập nhật status = canceled
2. Hoàn tồn kho bằng stock_movements
3. Điều chỉnh công nợ/thanh toán nếu cần
4. Lưu lý do hủy
5. Ghi audit_logs

---

## 8. Realtime yêu cầu

Cần dùng Supabase Realtime cho các màn hình sau:

- Dashboard
- Tồn kho
- Công nợ khách hàng
- Công nợ nhà cung cấp
- Danh sách đơn bán mới
- Danh sách phiếu nhập mới
- Nhật ký thao tác mới nhất

Khi có thay đổi ở các bảng sau thì giao diện cần tự cập nhật:

- sales_orders
- purchase_orders
- stock_movements
- payments
- expenses
- audit_logs

---

## 9. Giao diện yêu cầu

Giao diện tiếng Việt, dễ dùng cho kế toán.

Phong cách:

- Sạch sẽ
- Rõ ràng
- Dễ nhìn số tiền
- Dễ thao tác trên điện thoại
- Có bảng dữ liệu, bộ lọc, tìm kiếm
- Có nút thêm nhanh
- Có xác nhận trước khi hủy phiếu

Menu chính:

```text
1. Tổng quan
2. Bán hàng
3. Nhập hàng
4. Tồn kho
5. Công nợ khách hàng
6. Công nợ nhà cung cấp
7. Thu chi
8. Khách hàng
9. Nhà cung cấp
10. Sản phẩm gạch
11. Báo cáo
12. Nhật ký thao tác
13. Tài khoản & phân quyền
14. Cài đặt
```

Màu sắc gợi ý:

- Nền sáng
- Card trắng
- Nút chính màu xanh
- Nút nguy hiểm màu đỏ
- Nút cảnh báo màu vàng/cam
- Số tiền nổi bật
- Cảnh báo hàng sắp hết màu đỏ/cam

---

## 10. Luồng màn hình chi tiết

## 10.1. Màn hình tổng quan

Hiển thị các card:

- Doanh thu hôm nay
- Doanh thu tháng này
- Tiền đã thu hôm nay
- Công nợ khách hàng
- Nợ nhà cung cấp
- Giá trị tồn kho
- Số đơn bán hôm nay
- Số phiếu nhập hôm nay
- Hàng sắp hết

Bên dưới:

- Bảng giao dịch mới nhất
- Bảng đơn bán mới nhất
- Bảng nhập kho mới nhất
- Bảng audit log mới nhất

---

## 10.2. Màn hình bán hàng

Có:

- Danh sách đơn bán
- Nút tạo đơn bán
- Tìm kiếm theo mã đơn, khách hàng, số điện thoại
- Lọc theo ngày
- Lọc theo trạng thái
- Lọc đơn còn nợ

Form tạo đơn bán:

- Chọn khách hàng
- Thêm nhanh khách hàng nếu chưa có
- Chọn sản phẩm
- Nhập số lượng
- Tự tính thành tiền
- Nhập chiết khấu
- Nhập phí giao hàng
- Nhập khách đã trả
- Tự tính còn nợ
- Ghi chú
- Upload ảnh chứng từ nếu có
- Nút lưu nháp
- Nút xác nhận đơn

---

## 10.3. Màn hình nhập hàng

Có:

- Danh sách phiếu nhập
- Nút tạo phiếu nhập
- Tìm kiếm theo mã phiếu, nhà cung cấp
- Lọc theo ngày
- Lọc phiếu còn nợ

Form tạo phiếu nhập:

- Chọn nhà cung cấp
- Thêm nhanh nhà cung cấp nếu chưa có
- Chọn sản phẩm
- Nhập số lượng
- Nhập giá nhập
- Tự tính tổng tiền
- Nhập số tiền đã trả
- Tự tính còn nợ
- Ghi chú
- Upload hóa đơn/chứng từ
- Nút lưu nháp
- Nút xác nhận nhập kho

---

## 10.4. Màn hình tồn kho

Có:

- Bảng tồn kho realtime
- Tìm kiếm sản phẩm
- Lọc loại gạch
- Lọc kích thước
- Lọc hàng sắp hết
- Lọc hàng hết kho
- Nút xem lịch sử nhập/xuất

Cột dữ liệu:

- Mã hàng
- Tên hàng
- Kích thước
- Tồn thùng
- Tồn m2
- Giá nhập
- Giá trị tồn
- Tồn tối thiểu
- Trạng thái

---

## 10.5. Màn hình công nợ khách hàng

Có:

- Danh sách khách còn nợ
- Tổng công nợ
- Tìm kiếm khách
- Lọc nợ quá hạn
- Nút ghi nhận thanh toán

Khi bấm vào khách:

- Xem danh sách đơn còn nợ
- Xem lịch sử mua hàng
- Xem lịch sử thanh toán
- Ghi nhận khách trả thêm tiền

---

## 10.6. Màn hình công nợ nhà cung cấp

Có:

- Danh sách nhà cung cấp còn nợ
- Tổng nợ nhà cung cấp
- Tìm kiếm nhà cung cấp
- Nút ghi nhận trả tiền

Khi bấm vào nhà cung cấp:

- Xem danh sách phiếu nhập còn nợ
- Xem lịch sử nhập hàng
- Xem lịch sử thanh toán
- Ghi nhận trả thêm tiền

---

## 10.7. Màn hình thu chi

Có:

- Danh sách giao dịch thu chi
- Nút thêm khoản thu
- Nút thêm khoản chi
- Lọc theo ngày
- Lọc theo loại giao dịch
- Lọc theo phương thức thanh toán
- Tổng thu
- Tổng chi
- Chênh lệch

---

## 10.8. Màn hình báo cáo

Có các tab:

- Bán hàng
- Nhập hàng
- Tồn kho
- Công nợ
- Thu chi
- Lợi nhuận tạm tính

Mỗi báo cáo có:

- Chọn khoảng ngày
- Lọc dữ liệu
- Xem bảng
- Xem biểu đồ nếu phù hợp
- Xuất Excel
- Xuất PDF

---

## 11. Quy tắc tính toán

## 11.1. Tính tổng đơn bán

```text
Tổng tiền hàng = tổng từng dòng sản phẩm
Tổng đơn = Tổng tiền hàng - Chiết khấu + Phí vận chuyển
Còn nợ = Tổng đơn - Đã thanh toán
```

## 11.2. Tính tổng phiếu nhập

```text
Tổng phiếu nhập = tổng số lượng * đơn giá nhập
Còn nợ nhà cung cấp = Tổng phiếu nhập - Đã thanh toán
```

## 11.3. Tính tồn kho

```text
Tồn hiện tại = Tổng tất cả stock_movements.quantity của sản phẩm đó
```

## 11.4. Tính tồn m2

```text
Tồn m2 = Tồn thùng * số m2/thùng
```

## 11.5. Tính giá trị tồn kho

```text
Giá trị tồn = Tồn hiện tại * giá nhập
```

## 11.6. Tính lãi tạm tính

```text
Lãi tạm tính = Doanh thu bán hàng - Giá vốn hàng bán - Chi phí
```

Lưu ý:

- Giá vốn nên lấy theo giá nhập tại thời điểm nhập/bán
- Bản đầu có thể dùng giá nhập hiện tại để tính tạm
- Bản nâng cao có thể dùng FIFO hoặc bình quân gia quyền

---

## 12. Yêu cầu bảo mật

- Mọi route cần kiểm tra đăng nhập
- Mọi API cần kiểm tra quyền
- Dùng RLS của Supabase
- Không để người dùng sửa role của chính mình nếu không phải Admin
- Không cho xem dữ liệu tiền/lợi nhuận nếu không có quyền
- Không lưu mật khẩu thủ công, dùng Supabase Auth
- Upload file cần kiểm tra loại file
- Giới hạn dung lượng file upload
- Dữ liệu quan trọng phải có audit log

---

## 13. RLS Supabase cần có

Cần viết policy RLS theo nguyên tắc:

- Admin xem/sửa tất cả
- Partner chỉ xem
- Accountant được tạo/sửa nghiệp vụ chưa khóa sổ
- Warehouse chỉ xem tồn kho và đơn giao hàng
- Người không active không được truy cập

Cần bật RLS cho các bảng:

- profiles
- products
- suppliers
- customers
- purchase_orders
- purchase_order_items
- sales_orders
- sales_order_items
- stock_movements
- payments
- expenses
- audit_logs

---

## 14. Seed data mẫu

Cần tạo dữ liệu mẫu để test:

### Người dùng

- Admin
- Kế toán
- Người góp chung
- Nhân viên kho

### Sản phẩm

- Gạch 60x60 A01
- Gạch 80x80 B01
- Gạch 30x60 C01
- Gạch lát sân D01

### Khách hàng

- Khách Nguyễn Văn A
- Khách Trần Văn B
- Công trình Nhà Anh C

### Nhà cung cấp

- Nhà cung cấp Gạch ABC
- Nhà cung cấp Gạch XYZ

### Dữ liệu test

- 3 phiếu nhập
- 5 đơn bán
- 2 khoản khách trả nợ
- 2 khoản trả nhà cung cấp
- 3 chi phí vận chuyển/bốc xếp

---

## 15. Kế hoạch làm theo giai đoạn

Không làm tất cả một lần. Hãy làm từng giai đoạn.

## Giai đoạn 1: Nền tảng

- Tạo project Next.js
- Kết nối Supabase
- Tạo database migration
- Tạo auth
- Tạo profiles
- Tạo layout chính
- Tạo menu
- Tạo phân quyền cơ bản

## Giai đoạn 2: Danh mục

- Quản lý sản phẩm
- Quản lý khách hàng
- Quản lý nhà cung cấp

## Giai đoạn 3: Nghiệp vụ kho

- Tạo phiếu nhập
- Xác nhận phiếu nhập
- Tạo đơn bán
- Xác nhận đơn bán
- Kiểm tra tồn kho
- Ghi stock_movements

## Giai đoạn 4: Tồn kho realtime

- Tạo inventory_view
- Tạo màn hình tồn kho
- Tạo realtime subscription
- Cảnh báo hàng sắp hết
- Xem lịch sử nhập/xuất

## Giai đoạn 5: Công nợ và thu chi

- Công nợ khách hàng
- Công nợ nhà cung cấp
- Ghi nhận thanh toán
- Thu chi
- Upload chứng từ

## Giai đoạn 6: Dashboard và báo cáo

- Dashboard realtime
- Báo cáo bán hàng
- Báo cáo nhập hàng
- Báo cáo tồn kho
- Báo cáo công nợ
- Báo cáo thu chi
- Xuất Excel/PDF

## Giai đoạn 7: Kiểm soát dữ liệu

- Audit log
- Hủy phiếu có lý do
- Khóa sổ
- Phân quyền chi tiết
- Test lỗi nghiệp vụ

---

## 16. Yêu cầu đầu ra khi AI code

AI cần tạo đầy đủ:

```text
1. Cấu trúc thư mục project
2. File .env.example
3. Migration SQL Supabase
4. Seed data
5. Code kết nối Supabase
6. Auth middleware
7. Layout dashboard
8. Các page chính
9. Các component form
10. Các API/server actions
11. Logic transaction
12. Realtime subscription
13. Export Excel/PDF
14. Hướng dẫn chạy local
15. Hướng dẫn deploy
```

---

## 17. Cấu trúc thư mục gợi ý

```text
tile-warehouse-app/
├─ app/
│  ├─ login/
│  ├─ dashboard/
│  ├─ products/
│  ├─ customers/
│  ├─ suppliers/
│  ├─ purchases/
│  ├─ sales/
│  ├─ inventory/
│  ├─ customer-debts/
│  ├─ supplier-debts/
│  ├─ cashflow/
│  ├─ reports/
│  ├─ audit-logs/
│  ├─ users/
│  └─ settings/
├─ components/
│  ├─ ui/
│  ├─ forms/
│  ├─ tables/
│  ├─ dashboard/
│  └─ layout/
├─ lib/
│  ├─ supabase/
│  ├─ auth/
│  ├─ permissions/
│  ├─ validations/
│  ├─ formatters/
│  └─ utils/
├─ server/
│  ├─ actions/
│  ├─ queries/
│  └─ services/
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ public/
├─ .env.example
├─ package.json
└─ README.md
```

---

## 18. Các lỗi cần test kỹ

Cần viết test thủ công hoặc tự động cho các tình huống:

- Bán quá tồn kho
- Hủy đơn bán đã trừ tồn
- Hủy phiếu nhập đã cộng tồn
- Khách trả nợ nhiều hơn số nợ
- Trả nhà cung cấp nhiều hơn số nợ
- Người không có quyền truy cập trang bị chặn
- Partner không sửa được dữ liệu
- Kế toán không sửa được phiếu đã khóa sổ
- Realtime tồn kho cập nhật đúng
- Dashboard cập nhật đúng
- Audit log ghi đúng
- Xuất Excel/PDF đúng dữ liệu
- Mất mạng khi đang lưu phiếu
- Hai người cùng bán một sản phẩm cùng lúc

---

## 19. Yêu cầu chất lượng code

- Code TypeScript rõ ràng
- Chia component hợp lý
- Không viết một file quá dài
- Validate dữ liệu bằng Zod
- Hiển thị lỗi dễ hiểu bằng tiếng Việt
- Format tiền Việt Nam
- Format ngày tháng Việt Nam
- Dùng transaction cho nghiệp vụ quan trọng
- Không hardcode role lung tung
- Không để key Supabase service role ở frontend
- Có loading state
- Có empty state
- Có confirm dialog khi hủy phiếu
- Có toast thông báo thành công/lỗi
- Responsive tốt trên điện thoại

---

## 20. Prompt bắt đầu cho AI code

Dùng đoạn này để bắt đầu yêu cầu AI làm:

```text
Hãy đọc file đặc tả này và bắt đầu xây dựng phần mềm quản lý kho gạch realtime theo từng giai đoạn.

Trước tiên hãy làm Giai đoạn 1:
- Tạo project Next.js App Router + TypeScript + Tailwind CSS
- Kết nối Supabase
- Tạo migration SQL cho database
- Tạo auth đăng nhập
- Tạo bảng profiles
- Tạo layout dashboard tiếng Việt
- Tạo phân quyền cơ bản theo role admin, partner, accountant, warehouse
- Tạo README hướng dẫn chạy local

Không làm vội các module nhập bán trước khi hoàn thành nền tảng.
Hãy xuất đầy đủ code từng file, đường dẫn file rõ ràng, có thể copy vào project để chạy.
```

---

## 21. Ghi chú quan trọng cho AI

Khi code, cần ưu tiên tính đúng dữ liệu hơn giao diện đẹp.

Thứ tự ưu tiên:

```text
1. Đúng tồn kho
2. Đúng công nợ
3. Đúng phân quyền
4. Có audit log
5. Có realtime
6. Giao diện dễ dùng
7. Báo cáo đẹp
```

Tuyệt đối tránh:

- Xóa dữ liệu vĩnh viễn
- Cho sửa phiếu đã khóa sổ
- Cho bán quá tồn
- Tính công nợ bằng tay không có lịch sử
- Để người góp chung sửa dữ liệu
- Để kế toán xem/sửa phần không được phép
- Lộ service role key ở frontend

---

# Kết luận

Đây là phần mềm quản lý kho gạch dùng chung, cần độ tin cậy cao vì liên quan đến hàng hóa, tiền và công nợ.

Bản đầu tiên chỉ cần chạy ổn các nghiệp vụ:

- Sản phẩm
- Khách hàng
- Nhà cung cấp
- Nhập kho
- Bán hàng
- Tồn kho
- Công nợ
- Thu chi
- Dashboard
- Audit log

Sau khi bản đầu chạy ổn mới phát triển thêm báo cáo nâng cao, khóa sổ, xuất PDF/Excel và mobile PWA.
