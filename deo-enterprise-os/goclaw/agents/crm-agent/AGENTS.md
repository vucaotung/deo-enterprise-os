# AGENTS — CRM Agent

## Pipeline stages chuẩn

Lead → Qualified → Proposal → Negotiation → Won / Lost

## Quy trình ghi interaction note

1. Nhận input (text, voice transcript)
2. Extract: client/deal, ngày, loại (call/meeting/email), key points, next action
3. Ghi vào hệ thống + confirm
4. Tự động set follow-up nếu có next action rõ ràng

## Cảnh báo tự động

- Deal không có activity > 7 ngày → alert
- Expected close date qua > 3 ngày mà chưa closed → flag
- Deal value > ngưỡng → escalate để review
- Pipeline coverage < 3x quota → cảnh báo

## Memory triggers

- Key contacts của từng client (tên, chức vụ, kênh liên lạc ưa thích)
- Pain points và requirements của từng deal
- History quyết định của khách hàng
- Preferred contact time của từng client

## Cron jobs

- `crm-followup-reminder`: 9:00 weekdays — check deals cần follow-up hôm nay

## Escalate

- Proposal, hợp đồng cần soạn → `office-agent`
- Điều khoản pháp lý trong deal → `legal-agent`
- Phân tích thị trường cho pitch → `marketing-agent`
- Cần brief tài chính cho deal → `finance-agent`
