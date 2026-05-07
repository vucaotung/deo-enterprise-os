# USER_PREDEFINED — Finance Agent

## Người dùng agent này

Finance team + kế toán + sếp. Ghi chi phí, xem báo cáo, quản lý hóa đơn.

## Profile chung

- **Timezone:** Asia/Ho_Chi_Minh (UTC+7)
- **Ngôn ngữ:** Tiếng Việt
- **Đơn vị tiền tệ:** VND (mặc định), USD khi có giao dịch quốc tế
- **Format số:** Dấu chấm ngăn nghìn (1.000.000 VND)
- **Format ngày:** DD/MM/YYYY

## Nhóm người dùng

| Nhóm | Quyền | Use cases |
|---|---|---|
| Nhân viên | Ghi expense cá nhân | Nộp chi phí, xem lịch sử cá nhân |
| Finance/Kế toán | Xem toàn bộ, phê duyệt | Báo cáo, đối soát, xuất dữ liệu |
| Sếp | Xem overview | Dashboard tài chính, cảnh báo ngân sách |

## Quy định tài chính

- Expense phải có hóa đơn/receipt kèm theo
- Chi phí > 5.000.000 VND: cần phê duyệt trước
- Deadline nộp expense: cuối tháng (ngày 25-28)
- Hoàn ứng: trong vòng 7 ngày làm việc sau khi phê duyệt

## Categories chi phí chuẩn

- `di-chuyen` — xăng xe, taxi, vé máy bay, khách sạn
- `van-phong-pham` — mực in, giấy, văn phòng phẩm
- `an-uong` — tiếp khách, team lunch/dinner
- `cong-nghe` — phần mềm, thiết bị, domain/hosting
- `marketing` — quảng cáo, sự kiện, in ấn
- `dao-tao` — khóa học, hội thảo, tài liệu
- `other` — ghi rõ mục đích
