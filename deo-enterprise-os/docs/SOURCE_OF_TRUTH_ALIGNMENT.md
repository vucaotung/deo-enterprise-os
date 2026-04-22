# SOURCE OF TRUTH ALIGNMENT

**Ngày lập:** 2026-04-04  
**Mục tiêu:** Ghi rõ hiện trạng lệch giữa repo local/GitHub và production VPS, từ đó xác định hướng hợp nhất source-of-truth cho milestone `v0.3.0`.

---

## 1. Kết luận nhanh

Hiện tại Dẹo Enterprise OS đang tồn tại dưới **hai nhánh tiến hóa song song**:

1. **Repo local/GitHub hiện tại**
   - mạnh về governance
   - có changelog/version/roadmap/audit
   - phản ánh tốt tư duy kiến trúc và hồ sơ quản trị

2. **Production VPS hiện tại**
   - mạnh về runtime thực tế
   - đang chứa các hotfix thật để hệ usable
   - phản ánh đúng hơn hành vi đang chạy ngoài đời

Hai nhánh này **chưa được hợp nhất hoàn toàn**.

---

## 2. Mục tiêu của việc alignment

Alignment không chỉ là copy file qua lại.

Nó phải trả lời được 4 câu hỏi:
1. File nào ở production đang quan trọng nhưng repo chưa có?
2. File nào repo có nhưng production không dùng?
3. File nào cùng chức năng nhưng khác path/cấu trúc?
4. Sau khi sync, đâu mới là source-of-truth chính thức?

---

## 3. Nhóm chênh lệch đã phát hiện

## A. File production có nhưng local repo không có
Đây là nhóm drift quan trọng nhất vì thường gắn với runtime thật.

### Đã phát hiện rõ:
- `apps/api/src/routes/telegram.ts`
- `apps/api/src/config/database.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/pages/Expenses.tsx`
- `apps/web/src/types.ts`
- `apps/web/src/vite-env.d.ts`

### Ý nghĩa
Các file này cho thấy production đã có một nhánh hotfix/runtime khác với repo hiện tại.

### Hướng xử lý
- cần lấy nội dung các file này từ VPS
- đối chiếu chức năng với file tương ứng trong repo local
- quyết định merge hay thay thế

---

## B. File/cấu trúc local repo có nhưng production không cùng layout
### Ví dụ
- local repo dùng `infrastructure/nginx/default.conf`
- production VPS đang có `infra/nginx/default.conf`

### Ý nghĩa
Không chỉ code lệch, mà **cấu trúc dự án cũng đang bị tách thành 2 đời**.

### Hướng xử lý
- chọn 1 layout chính thức
- update docs + scripts + references theo layout đó

---

## C. Production có thêm script/bootstrap/docs mà repo chưa mang về
### Đã thấy ở production:
- `docker-compose.yml`
- `docker-build.sh`
- `docker-run.sh`
- `docker-stop.sh`
- `setup.sh`
- `test-api.sh`
- `package.json`
- `docs/plans/...`
- `docs/DEO_OS_ARCHITECTURE_V6_HULY_COLLAB.md`

### Ý nghĩa
Production có thể đang dựa vào một bộ bootstrap/script thực tế hơn so với repo local hiện tại.

### Hướng xử lý
- xác định script nào còn giá trị thật
- chỉ kéo về repo những gì còn hữu ích/đang dùng
- tránh bê cả đống rác historical vào repo mới

---

## D. Frontend local và frontend production đang khác đời
### Repo local có xu hướng dùng:
- `apps/web/src/lib/api.ts`
- `apps/web/src/pages/Login.tsx`
- structure theo bộ scaffold hiện tại

### Production có dấu hiệu dùng:
- `apps/web/src/api/client.ts`
- `apps/web/src/components/Login.tsx`
- `apps/web/src/types.ts`
- `apps/web/src/vite-env.d.ts`

### Ý nghĩa
Đây là nguồn gốc của nhiều bug trước đó:
- dashboard trắng
- auth mismatch
- bundle cache khó đoán
- path/file logic không khớp giữa local và production

### Hướng xử lý
- audit riêng frontend runtime contract
- chọn 1 structure chuẩn cho `apps/web`
- bỏ cấu trúc cũ hoặc merge có kiểm soát

---

## 4. Đánh giá từng vùng code

## Vùng 1 — Governance / release docs
### Trạng thái
Repo local/GitHub hiện tại **đúng hơn và tốt hơn**.

### Gồm:
- `CHANGELOG.md`
- `VERSION.md`
- `KNOWN_ISSUES.md`
- `ROADMAP_NEXT.md`
- `docs/PRODUCTION_DRIFT.md`
- `docs/RELEASE_PROCESS.md`
- `docs/STATUS_AUDIT_2026-04-04.md`
- `docs/V0_3_0_PLAN.md`

### Kết luận
Vùng này nên xem là **source-of-truth chính thức**.

---

## Vùng 2 — Runtime production behavior
### Trạng thái
VPS production **đúng hơn** vì đó là nơi đang chạy thật.

### Kết luận
Các file liên quan runtime cần được ưu tiên đối chiếu từ VPS về repo.

---

## Vùng 3 — Agent runtime patches
### Trạng thái
Hiện đang nằm ngoài app repo.

### Ví dụ
- `C:\openclaw\workspaces\agent-admin\lib\job-client.js`
- `C:\openclaw\workspaces\agent-admin\TOOLS.md`
- `C:\openclaw\workspaces\agent-admin\AGENTS.md`

### Kết luận
Đây chưa thể coi là source-of-truth bền vững. Phải:
- kéo logic quan trọng vào repo/docs
- hoặc mô tả cách tái tạo rất rõ

---

## 5. Nguồn chuẩn tạm thời nên chọn thế nào

### Tạm thời đề xuất
**Source-of-truth tạm thời nên chia 2 lớp:**

#### Lớp A — Governance truth
Repo GitHub hiện tại là chuẩn cho:
- version
- changelog
- roadmap
- audit
- release discipline

#### Lớp B — Runtime truth
Production VPS hiện tại là chuẩn cho:
- behavior đang chạy thật
- hotfix user-facing
- flow thực tế đã usable

### Mục tiêu v0.3.0
Hợp nhất 2 lớp đó về 1 chuẩn duy nhất: **repo GitHub cũng phải phản ánh runtime thật đủ quan trọng**.

---

## 6. Hạng mục alignment bắt buộc trong v0.3.0

### A. Kéo diff file runtime từ VPS về
Cần làm file-by-file cho các vùng:
- auth
- dashboard
- tasks
- telegram route
- database config
- frontend api client
- frontend types

---

### B. Chốt cấu trúc thư mục chuẩn
Cần quyết định thống nhất các nhánh kiểu:
- `infra/` hay `infrastructure/`
- `src/api/client.ts` hay `src/lib/api.ts`
- `src/types.ts` hay `src/types/index.ts`

---

### C. Chốt vùng nào được phép sống ngoài repo
Ví dụ agent runtime patches:
- hoặc kéo vào repo
- hoặc có docs tái tạo chính thức

Không được để tình trạng “máy đang chạy được nhưng repo không biết vì sao”.

---

## 7. Cách thực hiện alignment đề xuất

### Bước 1
Lấy danh sách file production quan trọng

### Bước 2
Map từng file với local repo:
- same file
- same role, different path
- production only
- local only

### Bước 3
Chia thành 3 bucket:
- merge now
- document only
- ignore/archive

### Bước 4
Commit theo nhóm nhỏ
Ví dụ:
- `sync: align frontend runtime files from production`
- `sync: align api runtime config from production`
- `docs: record agent runtime bridge outside app repo`

---

## 8. Deliverable mong muốn sau alignment

Khi bước alignment xong, phải đạt được:
- repo GitHub phản ánh phần lớn production reality
- docs governance vẫn giữ nguyên làm chuẩn
- production drift giảm rõ rệt
- ai vào repo cũng hiểu:
  - cái gì đang chạy
  - cái gì còn workaround
  - cái gì là đường chính thức

---

## 9. Một câu chốt

**Hiện tại GitHub repo là baseline quản trị, còn VPS là baseline hành vi runtime; nhiệm vụ của v0.3.0 là kéo hai baseline này về gần nhau đến mức repo có thể trở thành source-of-truth thực sự, thay vì chỉ là nơi lưu hồ sơ đẹp.**
