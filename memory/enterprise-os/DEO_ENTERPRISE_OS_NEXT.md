# Dẹo Enterprise OS — Việc chính tiếp theo

Cập nhật: 2026-04-07

## 1) Aurora assistant
### A14.9 — Media bridge cho bill ảnh
- Mục tiêu: để Aurora nhận ảnh bill từ Telegram/Zalo và đẩy thẳng vào OCR pipeline
- Hiện trạng: ảnh bill vẫn do Dẹo xử; Aurora mới ổn với text/PDF
- Kết quả mong muốn:
  - nhận media thật
  - OCR ra candidate fields
  - sửa semantic trước khi commit
  - vào PF qua Quick Entry / Transactions đúng luồng

### Calendar behavior chuẩn
- Ép Aurora với event có giờ + địa điểm rõ phải vào Google Calendar trước
- Có thể thêm cron nhắc gần giờ sau khi tạo event
- Test case chuẩn:
  - `9h họp với anh Tuyên ở VP 163 Khuất Duy Tiến`
  - phải tạo Calendar event thật, không chỉ cron

### Reminder behavior chuẩn
- One-shot reminder ngắn hạn -> cron
- Event thật -> Calendar (có thể kèm cron gần giờ)
- Việc chưa chốt giờ -> task queue
- Checklist nền -> heartbeat / cron nền

## 2) Personal Finance OS
### PDF intake cho Aurora
- Test Aurora đọc PDF chuyển khoản / hóa đơn
- Parse amount/date/account/vendor
- Đi đúng luồng vào Quick Entry rồi append sang Transactions

### Semantic polish dần
- dạy thêm các case:
  - mua hộ
  - chuyển cho ai
  - hoàn ứng
  - cá nhân vs business
  - vendor tên người / tên công ty

### Report/dashboard polish
- top categories
- recent transactions
- breakdown personal/business
- report theo dự án nếu cần

## 3) Trợ lý lịch hẹn thật
### Test trợ lý theo ngày
- 06:30 morning brief
- near-time sweep
- conflict reminder
- case `đang đi rồi` thì im
- case lịch đột xuất thì nhắc báo bên kia lùi/hủy

### Giai đoạn sau
- draft tin nhắn lùi/hủy lịch cho sếp duyệt
- chưa auto gửi người ngoài nếu chưa có xác nhận

## 4) Policy vận hành hiện tại
- Ảnh bill -> Dẹo
- Text / PDF -> Aurora
- Reminder / lịch / query cá nhân -> Aurora
- Việc mơ hồ / nhạy cảm / đối ngoại -> Dẹo
