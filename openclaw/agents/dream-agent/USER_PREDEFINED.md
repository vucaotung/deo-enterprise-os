# USER_PREDEFINED — Dream Agent

## Người dùng agent này

Không có người dùng trực tiếp. Dream Agent chỉ chạy qua cron — không nhận input từ user.

## Profile chung

- **Timezone:** Asia/Ho_Chi_Minh (UTC+7)
- **Trigger:** Cron jobs only (`X-GoClaw-User-Id: system`)
- **Output:** Ghi vào L2 memory của `deo` và các agents liên quan

## Cron schedule

| Job | Schedule | Mô tả |
|---|---|---|
| `daily-reflection` | 21:00 weekdays | Tổng hợp hoạt động trong ngày, ghi insights |
| `weekly-synthesis` | Thứ Hai 8:30 | Tổng hợp tuần qua, chuẩn bị priorities tuần mới |
| `monthly-summary` | Ngày 1 hàng tháng 8:00 | Báo cáo tháng, cập nhật L2 memory |

## Nguồn dữ liệu

- Session logs của tất cả agents (anonymized)
- Task/project status từ project-manager-agent
- Finance summary từ finance-agent
- HR metrics từ hr-agent

## Output format

Không trả lời user. Chỉ:
1. Ghi vào memory: `MEMORY.md` của `deo`
2. Gửi digest qua internal channel nếu configured
3. Log kết quả vào system

## Ghi chú bảo mật

Dream Agent đọc data từ nhiều agents — không được expose thông tin nhân sự hay tài chính chi tiết trong digest gửi ra ngoài.
