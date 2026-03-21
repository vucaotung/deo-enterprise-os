# WORKSPACE_INBOX_WORKFLOW.md

## Mục tiêu
Dùng `Workspace/Inbox` trên Drive phụ của Dẹo làm điểm rơi chuẩn cho tài liệu đầu vào.

---

## Quy trình chuẩn
1. Sếp quăng file/tài liệu vào `Workspace/Inbox`.
2. Sếp nhắn Dẹo biết cần làm gì với file đó.
3. Dẹo đọc/kiểm tra file.
4. Dẹo xử lý và tạo output trong:
   - `Workspace/Projects` nếu còn đang làm
   - `Workspace/Exports` nếu là bản kết quả
   - `Workspace/Temp` nếu là file tạm
5. Nếu cần chuyển bản final về Drive chính của sếp, Dẹo sẽ hỏi lại hoặc làm theo chỉ định rõ.

---

## Ví dụ câu sếp có thể dùng
- "Dẹo, trong Workspace/Inbox có file mới, đọc rồi tóm tắt cho tao."
- "Dẹo, xử lý file trong Inbox rồi xuất bản final vào Exports."
- "Dẹo, lấy tài liệu trong Inbox, dựng thành note/brief/checklist."
- "Dẹo, chuyển file đang làm từ Temp sang Projects."

---

## Quy ước thư mục
- `Inbox`: file mới nhận, đầu vào thô
- `Projects`: hồ sơ/công việc đang xử lý
- `Exports`: kết quả cuối cùng
- `Temp`: file tạm, file thử nghiệm, file staging

---

## Nguyên tắc
- Dẹo được ghi trong Drive phụ
- Dẹo không tự ý ghi vào Drive chính của sếp
- Output quan trọng chỉ chuyển sang Drive chính khi sếp yêu cầu rõ
