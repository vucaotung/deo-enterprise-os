# PRODUCTION DRIFT

**Ngày lập:** 2026-04-04  
**Mục đích:** Ghi rõ những khác biệt giữa:
- repo local mới đưa lên GitHub
- code/hành vi đang chạy thật trên VPS production
- runtime patch đang sống ngoài repo (đặc biệt trong OpenClaw agent workspaces)

Tài liệu này giúp tránh tình trạng tưởng repo là chuẩn nhưng production thực tế đang khác.

---

## 1. Kết luận nhanh

Hiện tại **repo GitHub mới tạo chưa phản ánh đầy đủ 100% trạng thái production thật**.

Có ít nhất 3 lớp drift:
1. **Repo local vs VPS production app code**
2. **Repo app chính vs OpenClaw agent runtime patch local**
3. **Tài liệu kiến trúc vs luồng production đang chạy thực tế**

Do đó, repo hiện tại là:
- **baseline rất quan trọng để bắt đầu quản lý version**
- nhưng **chưa phải source-of-truth production hoàn chỉnh tuyệt đối**

---

## 2. Nhóm drift A — VPS production app code có hotfix thực tế chưa chắc đã nằm hết trong repo

### A1. Frontend auth/runtime hotfix
Production đã từng cần các vá sau để usable:
- fix API base URL production
- fix login/dashboard trắng
- fix auth state sync
- fix dashboard response shape mismatch
- fix bundle cache/runtime mismatch

**Rủi ro drift:**
Những thay đổi này có thể đang tồn tại ở VPS production theo kiểu hotfix trực tiếp, trong khi repo local hiện tại vẫn là snapshot từ desktop architecture branch, chưa chắc khớp hoàn toàn từng file runtime đã chạy ổn.

---

### A2. Telegram webhook integration production
Production đã được vá và test với:
- route webhook Telegram
- wiring nhiều bot
- debug case bot reply nhưng không ghi DB

**Rủi ro drift:**
Repo local hiện tại chưa được xác minh byte-to-byte với code đang nằm ở `/opt/deo-enterprise-os` trên VPS sau các hotfix production.

---

### A3. Dashboard/task contract fixes
Production đã từng phát sinh các mismatch về:
- task status enum
- id type
- dashboard summary response
- frontend/backend contract

**Rủi ro drift:**
Repo local hiện tại có thể vẫn còn một phần contract đời cũ trong một số route/page/doc, dù production đã vá theo hướng khác để dùng được.

---

## 3. Nhóm drift B — Runtime patch nằm ngoài app repo

### B1. Agent Admin workspace local
Patch quan trọng đã được áp dụng ở:
- `C:\openclaw\workspaces\agent-admin\lib\job-client.js`
- `C:\openclaw\workspaces\agent-admin\TOOLS.md`
- `C:\openclaw\workspaces\agent-admin\AGENTS.md`

### Những gì patch này đang làm
- đổi `API_BASE` sang `https://api.enterpriseos.bond`
- không còn phụ thuộc `localhost:3001`
- tự login để lấy token mới
- bypass `agent-jobs` lỗi bằng cách gọi thẳng `/api/tasks`
- format mô tả task dễ đọc hơn
- ép bot trả kết quả rõ: ID / tiêu đề / trạng thái

### Vấn đề
Các patch trên **không nằm trong repo app chính** `deo-enterprise-os`.

**Ảnh hưởng:**
- clone repo về máy khác không tự có logic này
- deploy app repo xong chưa có nghĩa Agent Admin sẽ chạy đúng
- rất dễ quên khi audit production

---

### B2. Các agent khác chưa được đồng bộ cùng pattern
Hiện Dẹo mới vá rõ ràng cho `agent-admin`.

Các agent khác như:
- `agent-phap-che`
- `agent-ke-toan`
- `agent-dieu-phoi`

chưa được xác nhận đã đi theo cùng pattern production bridge / response format / token refresh.

**Đây là drift vận hành, không chỉ drift code.**

---

## 4. Nhóm drift C — Kiến trúc thiết kế vs production reality

### C1. `agent-jobs` trong kiến trúc vẫn được xem như orchestration route chuẩn
Theo kiến trúc và code local, `agent-jobs` là một primitive quan trọng của orchestration.

### Nhưng thực tế production hiện tại
- `agent-jobs` chưa ổn định theo schema/contract thật
- Agent Admin phải bypass sang `/api/tasks`
- nghĩa là orchestration layer hiện tại **chưa sống đúng như thiết kế ban đầu**

### Tác động
Nếu đọc repo/docs mà không đọc file drift này, rất dễ hiểu lầm rằng:
- tạo job qua `agent-jobs` là production-ready

Trong khi thực tế hiện tại:
- **task flow usable**
- **agent-jobs flow chưa clean**

---

### C2. Phase status trong docs có thể “đẹp” hơn hiện trạng thực tế
Tài liệu kiến trúc mô tả roadmap rất rõ và đầy đủ.
Nhưng production hiện tại vẫn là:
- usable demo nội bộ
- nhiều hotfix trực tiếp
- chưa contract-clean
- chưa source-of-truth-clean

Nên khi đọc docs phải phân biệt:
- **design intent**
- **production reality**

---

## 5. Những phần hiện có thể xem là gần đúng source-of-truth

### Tương đối tin được
- GitHub repo mới: baseline quản lý version chính thức
- `CHANGELOG.md`
- `VERSION.md`
- `KNOWN_ISSUES.md`
- `ROADMAP_NEXT.md`
- `STATUS_AND_ROADMAP_2026-04-04.md`

### Chưa đủ để coi là source-of-truth hoàn chỉnh
- logic runtime trong OpenClaw agent workspaces
- production hotfix trực tiếp trên VPS chưa sync ngược sạch vào repo
- contract thực tế của `agent-jobs`

---

## 6. Việc cần làm để đóng production drift

### D1. So sánh repo local với production VPS
Cần diff có hệ thống giữa:
- repo local hiện tại
- `/opt/deo-enterprise-os` trên VPS

**Mục tiêu:**
- xác định file nào production đã khác
- quyết định file nào cần kéo về repo

---

### D2. Tách rõ app repo và runtime patches
Cần quyết định:
- patch agent runtime có nên đưa thành thư mục/docs trong repo không
- hay để ở workspace riêng nhưng phải có doc tái tạo

**Mục tiêu:**
- không còn phụ thuộc “máy này đang nhớ patch gì”

---

### D3. Chốt trạng thái `agent-jobs`
Cần chọn 1 trong 2:
1. sửa `agent-jobs` để làm đúng orchestration contract production
2. tạm deprecate `agent-jobs` và tài liệu hóa rõ bridge qua `/api/tasks`

**Mục tiêu:**
- production logic phải nói thật, không mập mờ

---

### D4. Sync tài liệu release với thực tế production
Mỗi hotfix sau này cần:
- changelog entry
- version bump hợp lý
- nếu có drift mới thì cập nhật file này

---

## 7. Mức độ tin cậy hiện tại

### Repo GitHub hiện tại
**Vai trò:** baseline quản lý chính thức  
**Độ phản ánh production:** trung bình-khá, nhưng chưa hoàn chỉnh

### Production VPS hiện tại
**Vai trò:** nơi chạy thật  
**Độ phản ánh design:** đủ để dùng demo nội bộ, nhưng có workaround/hotfix

### Agent runtime local
**Vai trò:** nơi giữ một số patch quan trọng để bot hoạt động đúng  
**Rủi ro:** cao nếu không tài liệu hóa/sync vào repo

---

## 8. Một câu chốt

**Repo đã có, version đã có, nhưng source-of-truth production vẫn chưa đóng hẳn; file này tồn tại để nhắc rằng hiện tại hệ thống vẫn còn drift giữa repo, VPS và agent runtime local, và đó là việc phải xử lý trong mốc v0.3.0.**
