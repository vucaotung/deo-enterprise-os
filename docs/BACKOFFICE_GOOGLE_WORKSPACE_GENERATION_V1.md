# BACKOFFICE GOOGLE WORKSPACE GENERATION V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt thiết kế kỹ thuật cho nhánh `agent back office` theo hướng **workflow-first, Google-native**, dùng Google Docs / Sheets / Drive làm lớp materialization tài liệu, đồng thời phân tách rõ 2 luồng xử lý:
1. hồ sơ/văn bản **theo mẫu/template**
2. hồ sơ/văn bản **theo yêu cầu mới từ chat/context**

Ngoài ra, tài liệu này cũng chốt:
- cấu trúc folder lưu dữ liệu trên Google Drive
- quy tắc đặt tên file/folder chuẩn
- cách làm sao để tên vừa **kỷ luật**, vừa **user-friendly**

---

## 1. Quyết định kiến trúc

### Chọn phương án
**Workflow-first, Google-native**

### Nghĩa là
- **Agent** chịu trách nhiệm hiểu yêu cầu, gom ngữ cảnh, phân loại output, tạo brief/spec.
- **Workflow layer** chịu trách nhiệm tạo file, ghi nội dung, share quyền, move folder, callback kết quả.
- **Google Workspace** là nơi user mở file, review file, chỉnh sửa file.
- **Work OS** là nơi lưu trace, metadata, linked entities và execution history.

### Không chọn
- LibreOffice / python-docx làm đường chính
- agent worker tự gọi ad-hoc file APIs không qua workflow/trace

### Câu chốt
> **Agent hiểu việc cần làm; workflow tạo tài liệu; Google Workspace là nơi user review và cộng tác.**

---

## 2. Phân loại 2 luồng xử lý chính

## Luồng A — Hồ sơ / văn bản theo mẫu (template-based)
Dùng khi output có form tương đối ổn định.

### Ví dụ
- hợp đồng
- báo giá
- công văn mẫu
- quyết định mẫu
- biên bản mẫu
- bảng tổng hợp theo form cố định
- sheet báo cáo định kỳ

### Đặc điểm
- có template sẵn
- dữ liệu đầu vào tương đối rõ
- cấu trúc file gần như lặp lại
- ít cần sáng tác nội dung mới

---

## Luồng B — Hồ sơ / văn bản theo yêu cầu mới (draft-from-context)
Dùng khi không có template sẵn hoặc nội dung phải dựng từ context chat/thảo luận.

### Ví dụ
- viết văn bản từ nội dung nhóm chat vừa thảo luận
- làm proposal mới
- biên bản họp mới theo nội dung thực tế
- memo nội bộ
- kế hoạch hành động
- brief dự án
- sheet theo dõi mới cho một job cụ thể

### Đặc điểm
- không có form cố định hoặc form chỉ là gợi ý nhẹ
- nội dung lấy từ thread context
- cần AI gom ý, draft, structure
- thường cần human review checkpoint trước khi tạo file final

---

## 3. Kiến trúc runtime cho agent back office

```text
User / Telegram group / Web request
→ Thread context / object context
→ Agent back office (reason + classify + brief/spec)
→ Workflow dispatch
→ Google Docs / Sheets / Drive materialization
→ Callback về Work OS
→ Link file trả về thread / project / task / hồ sơ
```

### Các lớp trách nhiệm

## A. Agent back office
### Làm gì
- hiểu user muốn loại hồ sơ nào
- xác định là luồng A hay B
- gom context
- xác định template hay không template
- tạo structured brief / schema
- yêu cầu review nếu cần

## B. Workflow layer
### Làm gì
- copy template
- tạo Google Doc/Sheet mới
- fill nội dung / cells
- set folder
- set permission
- callback URL + metadata

## C. Work OS
### Làm gì
- lưu invocation trace
- lưu workflow dispatch/callback
- link file vào thread / project / task / hồ sơ
- ghi audit trail

---

## 4. Workflow cho Luồng A — Hồ sơ theo mẫu/template

## Step 1 — Classify request
Agent xác định:
- loại tài liệu là gì
- template nào tương ứng
- dữ liệu đầu vào đã đủ chưa

### Ví dụ input
- tên khách hàng
- số hợp đồng
- ngày hiệu lực
- giá trị hợp đồng
- người ký
- phạm vi công việc

---

## Step 2 — Create structured fill payload
Agent tạo payload kiểu:

```json
{
  "document_mode": "template_based",
  "document_type": "hop_dong",
  "template_key": "hop_dong_dich_vu_v1",
  "title": "Hop dong dich vu Cong ty A",
  "data": {
    "ten_ben_a": "Cong ty A",
    "ten_ben_b": "Cong ty B",
    "gia_tri": "50000000",
    "ngay_hieu_luc": "2026-04-05"
  },
  "target_folder": "...",
  "reviewers": ["abc@example.com"]
}
```

---

## Step 3 — Dispatch workflow
Workflow tương ứng:
- `docs.from-template.v1`
- `sheets.from-template.v1`
- `drive.share-for-review.v1`

---

## Step 4 — Materialize file
Workflow thực hiện:
- copy template file
- replace placeholders
- format nhẹ nếu cần
- set tên file chuẩn
- move vào folder đúng
- set permission

---

## Step 5 — Callback + trace
Kết quả callback về Work OS gồm:
- `file_id`
- `url`
- `folder_id`
- `workflow_key`
- `invocation_id`
- status

Sau đó Work OS:
- gắn file vào hồ sơ/object tương ứng
- append kết quả vào thread nếu request đến từ chat

---

## 5. Workflow cho Luồng B — Hồ sơ theo yêu cầu mới từ chat/context

Đây là luồng quan trọng hơn và khác template-fill.

## Step 1 — Collect context
Nguồn context có thể là:
- thread chat
- project context
- task context
- clarification answers
- notebook notes
- file đính kèm đã OCR/extract

---

## Step 2 — Build structured brief
Agent back office phải chuyển raw context thành brief có cấu trúc.

### Ví dụ brief
```json
{
  "document_mode": "draft_from_context",
  "document_type": "de_xuat",
  "title": "De xuat trien khai he thong A",
  "purpose": "trinh noi bo de chot huong thuc hien",
  "audience": "noi bo",
  "tone": "formal_internal",
  "key_points": [
    "muc tieu",
    "pham vi",
    "timeline",
    "nguon luc"
  ],
  "open_questions": [
    "deadline chot?",
    "ngan sach?"
  ],
  "source_thread_id": "th_001"
}
```

---

## Step 3 — Draft checkpoint
Mặc định với văn bản mới, nên có checkpoint review trước khi tạo file final.

### Agent trả ra chat
- outline đề xuất
- draft nội dung sơ bộ
- các chỗ còn thiếu
- đề nghị:
  - sửa tiếp trong chat
  - tạo Google Doc draft
  - tạo Doc và share reviewer

### Đây là bước rất quan trọng
Để tránh tạo quá nhiều file rác và tránh chốt nội dung khi ngữ cảnh còn mơ hồ.

---

## Step 4 — Materialize into Google Doc / Sheet
Khi user confirm, workflow tương ứng chạy:

### Với docs
- `docs.draft-from-context.v1`
- `docs.materialize.v1`

### Với sheets
- `sheets.schema-from-context.v1`
- `sheets.materialize.v1`

Workflow sẽ:
- tạo file mới
- ghi title
- ghi body / table schema / initial rows
- set folder
- set permission
- callback link

---

## Step 5 — Link back to Work OS
Work OS lưu:
- thread nào sinh ra tài liệu này
- project/task/hồ sơ nào liên quan
- version hiện tại
- ai review
- trạng thái: draft / in_review / approved / final

---

## 6. Decision rules: khi nào dùng template, khi nào không

## Dùng template khi
- tài liệu đã có form chuẩn
- trường dữ liệu khá cố định
- yêu cầu chủ yếu là điền dữ liệu
- cần tốc độ cao
- ít tranh luận về cấu trúc nội dung

## Không dùng template khi
- đây là tài liệu mới hoàn toàn
- nội dung sinh từ trao đổi/chat
- cấu trúc chưa chốt
- cần AI tổng hợp và soạn từ context
- sheet là loại mới, chưa có schema chuẩn

---

## 7. Workflow family đề xuất cho agent back office

## Nhóm 1 — Template-based
- `docs.from-template.v1`
- `sheets.from-template.v1`
- `drive.share-for-review.v1`

## Nhóm 2 — Context-based document generation
- `docs.draft-from-context.v1`
- `docs.materialize.v1`
- `sheets.schema-from-context.v1`
- `sheets.materialize.v1`

## Nhóm 3 — Drive organization helpers
- `drive.resolve-folder.v1`
- `drive.ensure-folder-tree.v1`
- `drive.archive-file.v1`

---

## 8. Cấu trúc folder chuẩn trên Google Drive

## Nguyên tắc đặt tên folder
Sếp yêu cầu:
- **tiếng Việt không dấu**
- dùng **underscore `_`** để tách từ
- vẫn phải **user-friendly**

### Dẹo đề xuất quy tắc
- dùng **tiếng Việt không dấu, ngắn gọn, quen mắt**
- tránh viết quá kỹ thuật hoặc quá dài
- cho phép thêm **prefix số** để giữ thứ tự nhìn dễ
- chỉ dùng chữ thường + số + `_`
- không dùng dấu tiếng Việt, không ký tự lạ

---

## Cấu trúc root gợi ý

```text
Deo_Workspace/
  00_dieu_hanh
  01_templates
  02_ho_so_theo_mau
  03_ho_so_theo_yeu_cau
  04_du_an
  05_khach_hang
  06_tai_chinh
  07_bao_cao
  08_luu_tam
  09_luu_tru
```

### Giải thích nhanh
- `00_dieu_hanh` → tài liệu điều hành nội bộ, chính sách, quy chuẩn
- `01_templates` → kho template gốc
- `02_ho_so_theo_mau` → file tạo ra từ template
- `03_ho_so_theo_yeu_cau` → file mới sinh từ chat/context
- `04_du_an` → tài liệu theo project
- `05_khach_hang` → tài liệu theo khách hàng/account
- `06_tai_chinh` → báo cáo, bảng chi phí, đối soát
- `07_bao_cao` → weekly/monthly/management reports
- `08_luu_tam` → file tạm, draft chưa phân loại
- `09_luu_tru` → hồ sơ đã khóa/đóng/archive

---

## Cấu trúc chi tiết gợi ý

### 01_templates
```text
01_templates/
  docs/
    hop_dong/
    bao_gia/
    cong_van/
    bien_ban/
    de_xuat/
  sheets/
    theo_doi_tien_do/
    tong_hop_chi_phi/
    bao_cao_tuan/
```

### 02_ho_so_theo_mau
```text
02_ho_so_theo_mau/
  2026/
    hop_dong/
    bao_gia/
    cong_van/
    bien_ban/
    bao_cao/
```

### 03_ho_so_theo_yeu_cau
```text
03_ho_so_theo_yeu_cau/
  2026/
    de_xuat/
    ghi_nho/
    ke_hoach/
    bien_ban_hop/
    tai_lieu_tong_hop/
    bang_theo_doi/
```

### 04_du_an
```text
04_du_an/
  du_an_<ma_hoac_ten_ngan>/
    01_tai_lieu_chung/
    02_hop_dong_bao_gia/
    03_ke_hoach_tien_do/
    04_bien_ban_ghi_nho/
    05_file_ban_giao/
    99_luu_tru/
```

### 05_khach_hang
```text
05_khach_hang/
  <ten_khach_hang_slug>/
    01_thong_tin_chung/
    02_hop_dong_bao_gia/
    03_tai_lieu_trao_doi/
    99_luu_tru/
```

---

## 9. Quy tắc đặt tên folder chuẩn

## Công thức
```text
<prefix_thu_tu>_<ten_ngan_khong_dau>
```

### Ví dụ tốt
- `01_templates`
- `02_ho_so_theo_mau`
- `03_ho_so_theo_yeu_cau`
- `04_du_an`
- `05_khach_hang`
- `99_luu_tru`

### Không nên
- `Tài liệu mới`
- `Hồ sơ khách hàng ABC!!!`
- `Project A Final New`
- `aaa`

---

## 10. Quy tắc đặt tên file chuẩn

## Mục tiêu
Tên file phải giúp user nhìn là biết:
- đây là loại hồ sơ gì
- liên quan ai/cái gì
- ngày nào
- bản nháp hay bản cuối
- version nào

---

## Công thức tên file gợi ý

### Công thức chung
```text
<yyyy-mm-dd>_<loai_tai_lieu>_<doi_tuong_chinh>_<mo_ta_ngan>_<trang_thai_or_version>
```

### Ví dụ
- `2026-04-05_hop_dong_cong_ty_abc_ban_nhap_v1`
- `2026-04-05_bao_gia_khach_hang_xyz_goi_dich_vu_v2`
- `2026-04-05_de_xuat_trien_khai_he_thong_a_draft_v1`
- `2026-04-05_bien_ban_hop_du_an_delta_final_v1`
- `2026-04-05_bang_theo_doi_tien_do_du_an_delta_v1`

---

## Trạng thái file nên dùng nhất quán
- `draft`
- `review`
- `final`
- `signed`
- `archived`

### Ví dụ
- `2026-04-05_hop_dong_cong_ty_abc_review_v2`
- `2026-04-05_hop_dong_cong_ty_abc_final_v3`

---

## 11. Quy tắc slug/chuẩn hóa tên

## Chuyển tên về slug kiểu an toàn
Ví dụ:
- `Công ty TNHH Ánh Dương` → `cong_ty_tnhh_anh_duong`
- `Dự án CRM nội bộ` → `du_an_crm_noi_bo`
- `Biên bản họp tuần 1` → `bien_ban_hop_tuan_1`

### Quy tắc
- lowercase hết
- bỏ dấu tiếng Việt
- thay khoảng trắng bằng `_`
- bỏ ký tự đặc biệt
- giới hạn tên đủ ngắn để dễ nhìn

---

## 12. Metadata tối thiểu cần lưu ngoài tên file

Không nên dồn hết mọi thứ vào tên file.

### Metadata nên có trong Work OS
- `file_id`
- `url`
- `document_type`
- `generation_mode` = `template_based` | `draft_from_context`
- `source_thread_id`
- `linked_project_id`
- `linked_task_id`
- `owner_user_id`
- `reviewers`
- `status`
- `version`

---

## 13. Quy tắc user-friendly vs machine-friendly

## Nguyên tắc
Tên file/folder phải đủ sạch cho machine xử lý, nhưng user vẫn đọc được ngay.

### Vì vậy Dẹo đề xuất
- folder/file dùng **tiếng Việt không dấu** để gần ngữ cảnh người dùng
- không dùng tên tiếng Anh thuần làm tên chính nếu user nội bộ chủ yếu nói tiếng Việt
- phần “thân thiện” đến từ **từ vựng quen**, **ngắn**, **có thứ tự**, **không ký tự rác**

### Ví dụ tốt
- `03_ho_so_theo_yeu_cau`
- `2026-04-05_de_xuat_he_thong_quan_tri_draft_v1`

### Không cần cố nhồi cả Việt + Anh vào cùng tên file
vì như vậy tên sẽ dài và xấu.

### Cách tốt hơn
- tên file/folder: tiếng Việt không dấu
- metadata/doc type nội bộ: có thể map thêm English code nếu cần cho system

---

## 14. Gợi ý mapping internal code song song

Hệ có thể giữ thêm mã English ngắn trong metadata nhưng không nhất thiết đưa vào tên file hiển thị.

### Ví dụ
- `hop_dong` ↔ `contract`
- `bao_gia` ↔ `quotation`
- `bien_ban_hop` ↔ `meeting_minutes`
- `de_xuat` ↔ `proposal`
- `ghi_nho` ↔ `memo`
- `bang_theo_doi` ↔ `tracking_sheet`

Điều này giúp:
- user nhìn tên Việt dễ hiểu
- hệ nội bộ vẫn query/code thuận lợi

---

## 15. Gợi ý lifecycle tài liệu

### Với template-based
`draft` → `review` → `final` → `signed/archived`

### Với context-based
`draft_brief` → `draft_text` → `review` → `materialized` → `final` → `archived`

---

## 16. V1 implementation priority

Nếu build thật cho agent back office, nên ưu tiên:

1. chốt folder root + naming rules
2. dựng workflow registry entries cho docs/sheets/drive
3. làm `drive.resolve-folder.v1`
4. làm `docs.from-template.v1`
5. làm `docs.draft-from-context.v1`
6. làm `docs.materialize.v1`
7. làm `sheets.schema-from-context.v1`
8. làm `sheets.materialize.v1`
9. lưu trace/link về project/task/thread

---

## 17. One-line conclusion

**Agent back office nên vận hành theo hướng workflow-first, Google-native: hồ sơ theo mẫu thì copy/fill từ template, hồ sơ theo yêu cầu thì đi từ chat/context → structured brief → review → materialize thành Google Doc/Sheet; còn toàn bộ file phải được đặt trong folder tree và naming convention tiếng Việt không dấu, ngắn gọn, có thứ tự, vừa dễ dùng cho người thật vừa đủ chuẩn cho hệ thống quản lý.**
