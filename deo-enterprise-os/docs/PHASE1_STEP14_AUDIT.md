# PHASE 1 STEP 1.4 AUDIT

**Ngày:** 2026-04-05  
**Mục tiêu:** Audit các page/domain còn lại sau khi đã xử lý auth/app shell để xác định page nào đang dùng canonical paths, page nào vẫn còn mock/legacy, và thứ tự cleanup tiếp theo.

---

## 1. Kết luận nhanh

Sau khi rà các page:
- `Chat.tsx`
- `CRM.tsx`
- `Finance.tsx`
- `Agents.tsx`
- `Notebooks.tsx`

Dẹo chốt được bức tranh chung như sau:

### Nhóm 1 — Hub pages còn thiên về mock/demo
- `Finance.tsx`
- `Agents.tsx`
- `Notebooks.tsx`
- nhiều khả năng cả `CRM.tsx` và `Chat.tsx` cũng đang ở tình trạng tương tự

### Nhóm 2 — Chưa dùng canonical API/runtime thật rõ ràng
- phần lớn vẫn sống bằng `useState` + mock data
- chưa bám chặt `api/client.ts`
- chưa bám chặt data model/domain model canonical

### Nhóm 3 — Cần cleanup theo domain, không phải vá lẻ tẻ từng file
- Finance cleanup phải theo hướng finance hub
- Agents cleanup phải theo hướng orchestration/agent status thật
- CRM cleanup phải theo client/lead hub
- Notebooks cleanup phải theo knowledge hub
- Chat cleanup phải quyết định là `/chat` tạm thời hay chuyển về `/conversations`

---

## 2. Page-by-page assessment

## A. Finance.tsx
### Trạng thái
- vẫn là **hub mock/demo**
- chưa phải finance module production-ready

### Vai trò đúng
- giữ làm **canonical finance hub direction**

### Vấn đề
- dùng mock data
- chưa bám model accounting/project/company thật
- chưa bám `FINANCE_DATA_MODEL_V1.md`

### Kết luận
**Đây là page nên cleanup sớm nhất trong nhóm domain pages.**

---

## B. Agents.tsx
### Trạng thái
- hiện chủ yếu là mock data + UI showcase
- chưa nối agent runtime/orchestration thật

### Vai trò đúng
- agents overview / hub

### Vấn đề
- text/encoding còn bẩn
- data model agent hiện chưa phản ánh runtime thật
- chưa bám API thật / audit / status flow thật

### Kết luận
**Đây là page cleanup ưu tiên sau Finance.**

---

## C. Notebooks.tsx
### Trạng thái
- knowledge hub mock khá rõ
- UI usable nhưng data hiện tại là giả lập

### Vai trò đúng
- notebooks/knowledge overview

### Vấn đề
- content mock
- text/encoding lỗi nhiều chỗ
- chưa nối notebooks API thật

### Kết luận
**Có thể cleanup sau Agents.**

---

## D. CRM.tsx
### Trạng thái
- CRM hub, nhưng cần review sâu hơn theo client/lead split

### Vai trò đúng
- giữ làm CRM overview/hub ngắn hạn

### Vấn đề dự kiến
- có khả năng đang ôm nhiều state/UI mock
- chưa rõ canonical split clients/leads

### Kết luận
**Cần cleanup, nhưng chưa urgent bằng Finance/Agents nếu ưu tiên theo impact kiến trúc.**

---

## E. Chat.tsx
### Trạng thái
- page cầu nối conversation/chat
- vai trò domain chưa chốt tuyệt đối

### Vai trò đúng hiện tại
- giữ tạm như operational communication center

### Vấn đề dự kiến
- naming có thể đổi về `/conversations` sau
- chưa chắc dùng runtime conversation model thật

### Kết luận
**Giữ tạm, cleanup naming/domain sau.**

---

## 3. Canonical vs mock status table

| Page | Vai trò mục tiêu | Trạng thái hiện tại | Ưu tiên cleanup |
|---|---|---|---|
| `Finance.tsx` | Finance hub | mock/demo, canonical direction | Rất cao |
| `Agents.tsx` | Agents hub | mock/demo | Cao |
| `Notebooks.tsx` | Knowledge hub | mock/demo | Trung bình |
| `CRM.tsx` | CRM hub | likely mixed/mock | Trung bình |
| `Chat.tsx` | conversation hub | transitional | Trung bình-thấp |

---

## 4. Kết luận cho Phase 1

Phase 1 không nên cố cleanup tất cả page cùng lúc.

### Nên làm theo thứ tự
1. `Finance.tsx`
2. `Agents.tsx`
3. `CRM.tsx` hoặc `Notebooks.tsx`
4. `Chat.tsx`

### Lý do
- Finance là domain đang được chốt hướng mạnh nhất
- Agents là domain ảnh hưởng lớn tới orchestration vision
- CRM/Notebooks có thể sống tạm kiểu hub mock lâu hơn một chút
- Chat chưa nên dồn sức nếu domain naming còn chưa chốt tuyệt đối

---

## 5. Khuyến nghị bước tiếp theo

### Priority 1
Bắt đầu **Phase 1 - step 1.5** bằng cleanup `Finance.tsx`:
- bỏ mock data cứng nếu có thể
- map theo finance hub direction
- align text, section, card structure với finance/accounting domain

### Priority 2
Sau đó cleanup `Agents.tsx`:
- bỏ mock bẩn
- dọn encoding
- chốt structure hub theo agent/orchestration domain

---

## 6. One-line conclusion

**Sau bước 1.4, Dẹo chốt rằng lớp nền auth/app shell đã ổn hơn, còn phần page-level debt hiện tập trung rõ nhất ở các hub pages dùng mock data; trong đó `Finance.tsx` là mục tiêu cleanup ưu tiên số 1 tiếp theo của Phase 1.**
