# Hướng dẫn sử dụng Dẹo Enterprise OS

> Dành cho nhân viên (human worker). Tài liệu này nằm trong `docs/USER_GUIDE_VN.md`
> và được render trong web tại `https://dash.enterpriseos.bond/help`.

---

## 1. Bạn được mời vào hệ thống

Khi quản lý mời bạn, bạn nhận được email tiêu đề **"Lời mời tham gia ..."** chứa
link dạng `https://dash.enterpriseos.bond/signup?code=XXXX`.

Mở link đó:

1. Đảm bảo email hiển thị đúng là email của bạn.
2. Nhập **họ tên** (hiển thị cho đồng nghiệp).
3. Đặt **mật khẩu** ≥ 8 ký tự, nhập lại để xác nhận.
4. Bấm **"Tạo tài khoản"** — bạn sẽ được tự động đăng nhập và đưa về Bảng điều khiển.

⚠️ Link mời **chỉ dùng được 1 lần** và **hết hạn sau 7 ngày**. Nếu link đã dùng
hoặc hết hạn, liên hệ quản lý để xin link mới.

---

## 2. Đăng nhập / đăng xuất

- URL đăng nhập: `https://dash.enterpriseos.bond/login`
- Trên thanh trái dưới cùng có nút **Đăng xuất**.
- Quên mật khẩu: hiện chưa có tự đặt lại — nhờ quản lý reset qua **Tài khoản → Khóa → Mở khóa với mật khẩu mới**.

---

## 3. Vai trò của bạn

Hệ thống có 4 vai trò chính:

| Vai trò | Quyền |
|---------|-------|
| **Admin** | Toàn quyền — tạo công ty, quản lý mọi nhân viên, đổi vai trò người khác |
| **Manager (Quản lý)** | Mời thành viên mới, thấy + tạo + sửa mọi entity trong công ty |
| **Staff (Nhân viên)** | Xem dashboard, tạo / cập nhật task, ghi chi phí, ghi notebook |
| **Agent Handler** | Xử lý câu hỏi (clarification) từ AI agent, tương tự staff |

Vai trò của bạn hiển thị trong sidebar phía dưới tên.

---

## 4. Các trang chính

### 4.1. Bảng điều khiển (`/`)
Hiển thị KPI chung: số task mở, tổng chi phí tháng, số khách hàng, số agent online,
số câu cần làm rõ. Có biểu đồ chi phí theo tháng và phân bố task theo trạng thái.

### 4.2. Chat (`/chat`)
Trao đổi với khách hàng và task. Mỗi cuộc hội thoại liên kết với một khách hàng
hoặc task cụ thể; sidebar phải hiển thị thông tin liên quan.

### 4.3. Công việc (`/tasks`)
Danh sách task. Cột:
- **Tiêu đề** — bấm để xem chi tiết
- **Trạng thái**: Việc cần làm / Đang làm / Hoàn thành / Hủy
- **Ưu tiên**: Cao / Trung bình / Thấp
- **Người được giao** + **Hạn**

Tạo task: bấm **"+ Tạo công việc"** ở góc phải trên.

### 4.4. Projects (`/projects`)
Danh sách dự án. Mỗi project có nhiều task. Bấm vào project để xem
**ProjectDetail** (mô tả, người sở hữu, % hoàn thành) hoặc
**ProjectTasks** (toàn bộ task của project đó).

### 4.5. CRM (`/crm`)
Đường ống bán hàng (pipeline). Lead di chuyển qua các stage:
**NEW → CONTACTED → QUALIFIED → PROPOSAL → WON / LOST**.

Tạo lead: bấm **"+ Lead mới"**.

### 4.6. Tài chính (`/finance`)
Theo dõi thu / chi. Mỗi expense có:
- Mô tả, số tiền, danh mục, tài khoản
- Người tạo, ngày
- Đính kèm chứng từ (chuẩn bị ra mắt)

Thêm chi phí: bấm **"+ Chi phí mới"**.

### 4.7. Agents (`/agents`)
Danh sách AI agent đang phục vụ công ty. Mỗi agent có:
- Trạng thái: 🟢 Online / 🟡 Đang nghỉ / 🔴 Offline
- Số task đang xử lý
- Khả năng (capability tags)
- Heartbeat gần nhất

Nút **Tạm dừng / Tiếp tục** chuyển agent qua / lại trạng thái sleeping.

### 4.8. Làm rõ (`/clarifications`)
AI agent thỉnh thoảng cần human duyệt thông tin. Tab **Đang chờ** liệt kê câu hỏi
chưa trả lời. Nhập câu trả lời và bấm **Gửi** để agent tiếp tục.

Tab **Đã trả lời** lưu lịch sử.

### 4.9. Sổ ghi chép (`/notebooks`)
Knowledge base. Loại notebook:
- **Knowledge** — kiến thức nội bộ
- **Meeting** — biên bản họp
- **Research** — kết quả nghiên cứu
- **Other** — khác

Có chế độ xem **Grid** và **Table**.

### 4.10. Tài khoản (`/admin/users`) — chỉ Admin / Manager
Bảng thành viên + bảng lời mời.

**Mời thành viên mới**:
1. Bấm **"+ Mời thành viên"**
2. Nhập email, họ tên (tùy chọn), chọn vai trò
3. Bấm **"Tạo lời mời"**
4. Nếu SMTP đã cấu hình → email tự gửi. Nếu chưa → copy link và gửi thủ công cho thành viên.

**Đổi vai trò**: chọn dropdown trong cột "Vai trò" của bảng thành viên.

**Khóa / Xóa**: cột bên phải. Khóa = ngăn đăng nhập tạm thời. Xóa = vô hiệu hóa vĩnh viễn (chỉ Admin).

---

## 5. Mẹo dùng hằng ngày

- **Bảng điều khiển → KPI cập nhật theo company của bạn**, không phải toàn hệ thống.
- **Banner vàng** nghĩa là API offline / chưa có dữ liệu thật, đang hiển thị mẫu. Liên hệ admin nếu thấy thường xuyên.
- **Sidebar thu gọn**: bấm icon ☰ để mở rộng / thu gọn.
- **Đăng nhập sai 5 lần** sẽ bị chặn 15 phút (chuẩn bị ra mắt).

---

## 6. Khi nào cần liên hệ admin

| Tình huống | Hành động |
|------------|-----------|
| Quên mật khẩu | Yêu cầu admin reset từ trang Tài khoản |
| Cần đổi vai trò (lên Manager) | Liên hệ Admin |
| Không thấy dữ liệu của một công ty khác | Bạn chỉ thấy company được gán; admin có thể gán thêm qua `staff_assignments` |
| Banner vàng "Đang hiển thị dữ liệu mẫu" liên tục | Báo admin kiểm tra API + database |
| Email lời mời không tới | Kiểm tra spam, sau đó báo admin về cấu hình SMTP |

---

## 7. Phím tắt (chuẩn bị ra mắt)

- `g h` → về Bảng điều khiển
- `g t` → Công việc
- `g p` → Projects
- `g c` → CRM
- `?` → mở hướng dẫn này

---

## 8. Câu hỏi thường gặp

**Q: Tôi tạo task xong nhưng agent không nhận?**
A: Task cần được gán cho agent (cột `agent_id`). Nếu chưa gán, agent sẽ bỏ qua. Manager có thể gán qua API hoặc đợi cron tự gán theo capability.

**Q: Số liệu trên Bảng điều khiển khác Tài chính?**
A: Bảng điều khiển dùng `expenses_by_month` (status `approved`). Trang Tài chính hiển thị toàn bộ. Khác biệt thường do expense chưa được duyệt.

**Q: Tôi đổi mật khẩu ở đâu?**
A: Hiện tại admin/manager đổi qua trang Tài khoản → menu trên user. Tự đổi mật khẩu sẽ có ở phiên bản kế tiếp.

**Q: Sao Cloudflare bảo "Host not in allowlist"?**
A: Bạn đang truy cập VPS qua IP thay vì domain. Dùng `https://dash.enterpriseos.bond` hoặc `https://api.enterpriseos.bond`.

---

## 9. Liên hệ

- Admin chính: `admin@enterpriseos.bond`
- Báo lỗi tại GitHub: https://github.com/vucaotung/deo-enterprise-os/issues
