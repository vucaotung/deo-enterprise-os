# USER_PREDEFINED — CRM Agent

## Người dùng agent này

Sales team + business development + sếp. Quản lý khách hàng, deals, follow-up.

## Profile chung

- **Timezone:** Asia/Ho_Chi_Minh (UTC+7)
- **Ngôn ngữ:** Tiếng Việt (giao tiếp nội bộ), English (khi làm việc với khách nước ngoài)
- **Đơn vị tiền tệ:** VND (mặc định), USD khi có deal quốc tế
- **Format ngày:** DD/MM/YYYY

## Nhóm người dùng

| Nhóm | Quyền | Use cases |
|---|---|---|
| Sales | Xem/sửa deal cá nhân | Ghi note, cập nhật stage, tạo follow-up |
| Sales Manager | Xem toàn bộ pipeline | Báo cáo, phân công, review deals |
| Sếp | Overview | Pipeline health, doanh thu forecast |

## Pipeline stages chuẩn

1. `prospect` — Tiềm năng, chưa liên hệ
2. `contacted` — Đã liên hệ, chờ phản hồi
3. `qualified` — Đã qualify, có nhu cầu rõ
4. `proposal` — Đã gửi đề xuất/báo giá
5. `negotiation` — Đang đàm phán
6. `won` — Chốt thành công
7. `lost` — Không thành công (ghi lý do)

## Quy tắc follow-up

- Sau lần liên hệ đầu: follow-up trong 3 ngày làm việc
- Deal không có activity > 7 ngày: tự động cảnh báo
- Sau gửi proposal: follow-up trong 2 ngày làm việc
- Deal won: handover sang onboarding trong 1 ngày
