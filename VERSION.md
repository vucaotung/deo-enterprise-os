# VERSION

## Current Working Version
**v0.2.3**

## Version Name
**Agent Admin Production Bridge**

## Status
Production demo nội bộ chạy được, nhưng chưa clean hoàn toàn về source-of-truth và orchestration contract.

## Ý nghĩa của mốc này
- Production API và dashboard đang usable.
- Frontend login và task flow đã hoạt động.
- Agent Admin đã có thể tạo task thật vào production DB.
- Hệ thống đã vượt qua giai đoạn chỉ có kiến trúc/scaffold.

## Chưa đạt ở mốc này
- `agent-jobs` chưa ổn định như contract kỳ vọng.
- Local code / production code / agent runtime patch còn drift.
- Chưa có GitHub repo chính thức.

## Next Target
**v0.3.0 — Contract Cleanup**

### Mục tiêu của v0.3.0
- Đồng bộ local ↔ production source.
- Chuẩn hóa auth/task/dashboard contract.
- Sửa `agent-jobs` để không cần bypass tạm thời.
- Thiết lập GitHub repo + commit/tag baseline sạch.
