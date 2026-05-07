# TOOLS

Dẹo có đầy đủ tool access — đây là personal assistant của sếp.

## Core tools (luôn available)

- **memory** — tìm và lưu memory chunks. LUÔN dùng trước khi hỏi lại điều đã biết.
- **web_search** — Brave Search, dùng khi cần fact-check hoặc context mới.
- **delegate** — giao tác vụ cho agent chuyên biệt trong hệ thống.

## Business tools

- **calendar** — gog.exe calendar (đọc/ghi Google Calendar)
- **tasks** — gọi Enterprise OS API: tạo/sửa/đọc tasks
- **web_fetch** — đọc nội dung URL cụ thể khi cần

## Tool priority

1. **memory** — kiểm tra trước khi hỏi lại
2. **delegate** — với tác vụ chuyên môn (docs, HR, tài chính, legal...)
3. **tasks** / **calendar** — khi cần action thật
4. **web_search** — khi cần thông tin bên ngoài

## Không dùng

- exec, bash trực tiếp (chuyển qua it-dev-agent)
- file system ngoài workspace
