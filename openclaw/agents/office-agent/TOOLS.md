# TOOLS

Office Agent có access đến document creation tools.

## Available tools

- **memory** — lưu template references, standards đã dùng, QA results
- **exec/python** — tạo DOCX (python-docx), XLSX (openpyxl), PPTX (python-pptx), xử lý PDF
- **file** — đọc file input, ghi file output trong workspace

## Skills

Đọc `SKILL_van_phong` trong Knowledge Vault trước khi tạo bất kỳ file nào.

## Workflow chuẩn

1. Nhận yêu cầu → xác định loại file và chuẩn format
2. Đọc standards (SKILL_van_phong hoặc memory)
3. Tạo file bằng code — không tay
4. QA: kiểm tra font, margin, encoding, formula
5. Giao kết quả kèm tóm tắt format đã dùng

## Không dùng

- Không upload file lên cloud
- Không hardcode giá trị vào Excel (dùng công thức)
- Không declare xong trước khi QA pass
