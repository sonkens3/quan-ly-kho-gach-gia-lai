# Quản lý kho gạch

Web app quản lý kho gạch theo đặc tả `dac-ta-phan-mem-quan-ly-kho-gach-realtime.md`.

## Chế độ miễn phí hoàn toàn

Bản hiện tại đã được chuyển để chạy được trên **GitHub Pages** mà không cần VPS, Vercel hay Supabase.

Mô hình miễn phí khuyến nghị:

```text
GitHub Pages: chạy giao diện quản trị
Google Apps Script: API đọc/ghi miễn phí
Google Sheet: database trung tâm
```

Nếu chưa cấu hình Google Sheet, app vẫn chạy local bằng `localStorage`.

Điểm đánh đổi so với database thật:

- Không realtime 100%. App kiểm tra `revision` của Google Sheet khoảng 15 giây/lần; chỉ khi Sheet có thay đổi mới tải lại dữ liệu đầy đủ.
- Phù hợp kho nhỏ/vừa, ít người ghi đồng thời.
- App key trong GitHub Pages chỉ là lớp bảo vệ cơ bản, không thay thế phân quyền server chuyên nghiệp.

Nếu sau này cần phân quyền chặt, dữ liệu lớn, nhiều người thao tác đồng thời, nên chuyển sang Supabase/PostgreSQL.

## Logic đang có

Bản free local-first hiện đã xử lý được:

- Thêm sản phẩm gạch.
- Thêm khách hàng.
- Thêm nhà cung cấp.
- Tạo phiếu nhập một dòng hàng, tự cộng tồn kho.
- Tạo đơn bán một dòng hàng, tự kiểm tra không bán quá tồn và trừ tồn kho.
- Tự tính tổng tiền, đã trả, còn nợ.
- Ghi thanh toán thu/chi theo phiếu nhập, phiếu bán và chi phí.
- Tính tồn kho, giá trị tồn, hàng sắp hết.
- Tính công nợ khách hàng và công nợ nhà cung cấp, có ngày phát sinh nợ và ngày trả gần nhất.
- Dashboard lấy số liệu thật từ dữ liệu local.
- Audit log cho thao tác tạo/xác nhận chính.

Chưa có trong bản free hiện tại:

- Nhiều dòng sản phẩm trong một phiếu.
- Sửa/hủy phiếu có hoàn tồn.
- Khóa sổ.
- Phân quyền thật nhiều người dùng.
- Realtime nhiều máy.

Khi bật Google Sheet, các logic nhập/bán/trả nợ/chi phí được xử lý ở Apps Script và ghi vào Sheet.

## Cấu hình Google Sheet làm database

1. Tạo một Google Sheet mới, ví dụ `Kho gạch database`.
2. Vào `Extensions` > `Apps Script`.
3. Xóa code mặc định và copy toàn bộ nội dung file:

```text
google-apps-script/Code.gs
```

4. Bấm `Save`.
5. Chạy hàm `setup()` một lần để tạo các tab:

```text
products
customers
suppliers
purchase_orders
sales_orders
stock_movements
payments
expenses
audit_logs
settings
```

6. Chạy hàm `setAppKey("mat-khau-rieng-cua-ban")` trong Apps Script.

Ví dụ:

```js
setAppKey("kho-gach-2026");
```

7. Vào `Deploy` > `New deployment`.
8. Chọn loại `Web app`.
9. Cấu hình:

```text
Execute as: Me
Who has access: Anyone with the link
```

10. Deploy và copy `Web app URL`.
11. Mở file:

```text
public/google-sheet-config.json
```

12. Điền URL và app key:

```json
{
  "endpoint": "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
  "appKey": "kho-gach-2026"
}
```

13. Commit/push lên GitHub.

Sau đó web sẽ tự đọc file cấu hình này và dùng Google Sheet làm dữ liệu trung tâm. Lần đầu app tải dữ liệu từ Sheet; các lần sau app dùng cache trong trình duyệt rồi chỉ kiểm tra `revision`, không tải lại toàn bộ nếu Sheet chưa đổi. Trên giao diện chỉ còn nút xuất/nhập backup, không hiện ô nhập URL/key nữa.

Khi file `google-apps-script/Code.gs` trong project được cập nhật, cần copy lại toàn bộ code sang Apps Script và deploy lại Web App để tính năng kiểm tra `revision` hoạt động. Code mới cũng có `onEdit`, nên nếu bạn sửa trực tiếp trong Google Sheet thì `revision` sẽ tự đổi.

## Tài khoản đăng nhập

Tài khoản đăng nhập được lấy từ file:

```text
public/auth-users.json
```

Mặc định đang có tài khoản:

```text
Tên đăng nhập: admin
Mật khẩu: admin123456
```

Muốn đổi hoặc thêm tài khoản, sửa file `public/auth-users.json`:

```json
{
  "users": [
    {
      "username": "admin",
      "email": "admin@kho.local",
      "password": "mat-khau-moi",
      "fullName": "Chu kho",
      "role": "admin",
      "active": true
    }
  ]
}
```

Các quyền hợp lệ: `admin`, `partner`, `accountant`, `warehouse`.

Thiết bị nào đăng nhập thành công một lần sẽ lưu phiên trong trình duyệt. Lần sau mở phần mềm sẽ tự vào trang chính; muốn bắt đăng nhập lại thì bấm **Đăng xuất**.

Lưu ý bảo mật: vì GitHub Pages là web tĩnh nên file này nằm trong bản public. Cách này chỉ là lớp đăng nhập cơ bản, phù hợp dùng miễn phí và ít người dùng. Không nên dùng mật khẩu quan trọng giống email/ngân hàng.

## Chạy trên máy cá nhân

Yêu cầu: Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở:

```text
http://localhost:3000
```

Đăng nhập:

- Tên đăng nhập: `admin`
- Mật khẩu: `admin123456`

## Build bản static

```bash
npm run build
npm run start
```

Lệnh `npm run build` tạo thư mục `out/`. Lệnh `npm run start` dùng để xem thử bản static đã build.

## Đưa lên GitHub Pages miễn phí

1. Tạo repository trên GitHub.
2. Upload toàn bộ thư mục project này lên repository.
3. Vào GitHub repository > `Settings` > `Pages`.
4. Ở `Build and deployment`, chọn `GitHub Actions`.
5. Push code lên nhánh `main` hoặc `master`.
6. GitHub Actions sẽ tự chạy workflow:

```text
.github/workflows/deploy-github-pages.yml
```

Sau khi deploy xong, GitHub sẽ cấp link dạng:

```text
https://ten-tai-khoan.github.io/ten-repo/
```

## Cài ở máy khác

Cách 1: Dùng link GitHub Pages

- Mở link GitHub Pages trên máy mới.
- Nếu cần dữ liệu cũ, bấm **Nhập backup** và chọn file JSON đã xuất từ máy cũ.

Cách 2: Chạy local trên máy mới

```bash
git clone <url-repo>
cd <ten-repo>
npm install
npm run dev
```

## Sao lưu dữ liệu

Trong app có khung **Chế độ miễn phí local-only**:

- **Xuất backup**: tải file JSON dữ liệu về máy.
- **Nhập backup**: đưa dữ liệu từ file JSON vào trình duyệt hiện tại.
- **Tạo dữ liệu rỗng**: reset kho local về trạng thái trống.

Nên xuất backup cuối mỗi ngày nếu dùng bản miễn phí local-only.

## Nâng cấp sau này

Các file Supabase vẫn được giữ trong project:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`
- `lib/supabase/*`

Khi cần realtime, phân quyền thật và dữ liệu tập trung, có thể bật lại Supabase/Vercel hoặc tự host backend riêng.
