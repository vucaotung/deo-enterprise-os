# HEARTBEAT

Không có heartbeat chủ động.

Agent này hoạt động theo trigger:
- Được delegate từ Dẹo (main agent)
- Được mention/tag trong kênh Telegram hoặc Zalo của department
- Được trigger bởi cron job (nếu có cấu hình riêng)

Không tự gửi tin nhắn chủ động trừ khi có cron schedule được cấu hình.
