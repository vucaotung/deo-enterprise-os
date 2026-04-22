# CHAT V1 IMPLEMENTATION PLAN

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt kế hoạch triển khai V1 cho nhánh chat-based Work OS để biến bộ spec hiện tại thành các phase buildable, sau đó tạm dừng nhánh này và chuyển trọng tâm sang `agent domain` + `n8n`.

---

## 1. Phạm vi của plan này

Plan này dùng để chuyển các tài liệu đã chốt thành thứ tự triển khai thực tế, không phải để mở rộng thêm architecture vô hạn.

### Bộ spec đầu vào đã có
- `TELEGRAM_GROUP_AS_WORK_OS_V1.md`
- `THREAD_CONTEXT_AND_AGENT_INVOCATION_MODEL.md`
- `TELEGRAM_GROUP_TO_PROJECT_TASK_MAPPING.md`
- `LOW_TOKEN_CHAT_ORCHESTRATION_STRATEGY.md`
- `CHAT_THREAD_DATA_MODEL_V1.md`
- `CHAT_ORCHESTRATION_API_V1.md`

### Mục tiêu thực tế
- biết phải build bảng nào trước
- API nào làm trước
- Telegram connector/ingest cắm vào đâu
- phần nào có thể fake/mock
- phần nào phải real ngay

---

## 2. Chốt trạng thái của nhánh chat tại thời điểm này

### Đã chốt xong ở mức architecture/spec
- chat như work frontstage
- Telegram group như human-native interface
- main coordinator + specialist summon model
- thread context model
- low-token orchestration strategy
- data model V1
- orchestration API V1

### Chưa làm ở mức implementation
- DB schema thật cho `chat_*` tables
- API routes thật cho `/api/chat/*`
- Telegram ingest thật vào thread/message store
- coordinator trigger engine thật
- specialist invocation runner thật
- UI/admin views cho thread/group configuration

### Quyết định vận hành
**Dừng nhánh chat ở mức spec/package tại đây** sau khi commit plan này.  
Không tiếp tục đào sâu code chat ngay lúc này.

---

## 3. Nguyên tắc triển khai V1

## Nguyên tắc 1
Build **ingest + state + action** trước UI fancy.

## Nguyên tắc 2
Build **Telegram-first**, không làm generic multi-channel quá sớm.

## Nguyên tắc 3
Coordinator trước, specialists sau.

## Nguyên tắc 4
Summary/pending_actions/open_questions quan trọng hơn chat UI clone.

## Nguyên tắc 5
Object write actions nên ưu tiên:
- create task
- create project
- create clarification
- create note

---

## 4. Phase breakdown đề xuất

## Phase 0 — Foundations / Schema
### Mục tiêu
Dựng schema tối thiểu cho chat work threads.

### Nên làm
- tạo bảng:
  - `chat_threads`
  - `chat_messages`
  - `chat_linked_entities`
  - `chat_pending_actions`
  - `chat_open_questions`
  - `chat_agent_invocations`
- index cơ bản
- migration scripts

### Deliverable
DB có thể ingest và giữ thread state tối thiểu.

---

## Phase 1 — Telegram Ingest Core
### Mục tiêu
Message Telegram đi vào được thread/message storage.

### Nên làm
- connector / webhook handler / polling bridge (tùy kiến trúc hiện tại)
- map `chat_id` → `chat_thread`
- map sender → participant
- save raw text + metadata + attachments refs
- update `last_message_at`

### Deliverable
Telegram group chat đi vào hệ thành work thread thật.

---

## Phase 2 — Thread State Engine
### Mục tiêu
Có thread state usable chứ không chỉ raw message log.

### Nên làm
- short summary refresh
- working summary refresh theo trigger/batch
- pending actions extraction đơn giản
- open questions extraction đơn giản
- linked entities registry

### Deliverable
Thread có summary + open loops + pending actions.

---

## Phase 3 — Coordinator Actions V1
### Mục tiêu
Main coordinator bắt đầu usable trong Telegram group.

### Nên làm
- mention detection
- basic command parsing
- lightweight trigger severity
- manual summary actions
- project/task/clarification/note suggestion flow

### Action set v1
- summarize thread
- create project draft
- create task draft
- create clarification draft
- create note draft

### Deliverable
Main coordinator làm được các action giá trị cao trong group thật.

---

## Phase 4 — Object Application Layer
### Mục tiêu
Cho phép biến thread actions thành object thật trong OS.

### Nên làm
- `create project from thread`
- `create task from thread/message`
- `create clarification from thread/message`
- `create note from thread/message`
- source trace fields từ object quay về thread/message

### Deliverable
Chat bắt đầu sinh object có cấu trúc trong OS.

---

## Phase 5 — Specialist Invocation V1
### Mục tiêu
Cho main coordinator summon specialist theo nhu cầu.

### Nên làm
- `invoke-specialist` flow
- context packaging tối thiểu
- result envelope chuẩn
- post kết quả lại thread
- lưu invocation trace

### Gợi ý specialist ban đầu
- `project_agent`
- `research_agent`
- `writer_agent`

### Deliverable
Chat thread có thể gọi specialist thay vì chỉ coordinator tự xử.

---

## Phase 6 — Admin / Back Office Basics
### Mục tiêu
Có chỗ quản trị cấu hình group/thread.

### Nên làm
- set group mode
- set group type
- set/unset primary project
- allowed specialists
- view thread summaries / invocations / pending actions

### Deliverable
Admin bắt đầu điều chỉnh được cách từng group dùng Work OS.

---

## 5. Build order ưu tiên gọn cho V1 thực dụng

Nếu cần build thật mà vẫn tiết kiệm effort, thứ tự tốt nhất là:

1. **DB schema tối thiểu**
2. **Telegram ingest**
3. **Thread summary + state engine tối thiểu**
4. **Coordinator summary / create-task / create-project**
5. **Object linkage & traceability**
6. **Specialist summon v1**
7. **Admin config UI/API**

---

## 6. Cái gì nên real ngay, cái gì có thể mock

## Phải real sớm
- thread persistence
- message ingest
- summary storage
- object linkage
- invocation trace

## Có thể mock/tạm đơn giản lúc đầu
- specialist variety
- advanced confidence scoring
- semantic search
- fancy admin dashboard
- full multi-channel abstraction

---

## 7. Telegram-first implementation notes

### V1 nên assume
- Telegram là channel đầu tiên được support nghiêm túc
- mỗi group Telegram map vào một `chat_thread` root
- reply/mention commands là interaction primitive chính

### Chưa cần ngay
- nhiều provider có behavior quá khác nhau
- unify hết Telegram/Zalo/Discord trong cùng sprint đầu tiên

---

## 8. Minimal V1 action contract nên support

### Trong Telegram group, user gọi được:
- `@Dẹo tóm tắt`
- `@Dẹo tạo project`
- `@Dẹo tạo task`
- `@Dẹo mở clarification`
- `@Dẹo lưu note`
- `@Dẹo gọi specialist X`

### V1 coordinator cần làm được
- hiểu lời gọi cơ bản
- lấy thread context tối thiểu
- tạo output draft hoặc execute có confirm

---

## 9. Risk notes

## Risk 1 — Đốt token quá sớm
### Giảm thiểu
roll out watch mode trước, reason mode có chọn lọc.

## Risk 2 — Object mapping sai
### Giảm thiểu
traceability + confirmation cho write actions.

## Risk 3 — Group chat quá ồn
### Giảm thiểu
mặc định `mention_only` hoặc `suggest_only`.

## Risk 4 — Specialist summon loạn
### Giảm thiểu
allowed specialists theo group + coordinator gating.

## Risk 5 — Scope tràn
### Giảm thiểu
giữ Telegram-first, coordinator-first, action set hẹp cho V1.

---

## 10. Clear stop line for this branch

Sau plan này, nhánh chat được coi là:
- **đã đủ spec để quay lại build sau**
- **không cần đào thêm architecture ngay lúc này**

### Next focus area được chốt
- `agent domain`
- `n8n`

### Lý do
Hai nhánh đó sẽ quyết định cách execution layer, workflow routing, integrations và orchestration thật sự vận hành phía sau chat/work OS.

---

## 11. One-line conclusion

**Chat V1 hiện đã được chốt đủ ở mức implementation planning: khi quay lại build, nên đi theo thứ tự Telegram ingest → thread state → coordinator actions → object writes → specialist invocation → admin basics; còn hiện tại có thể tạm dừng nhánh chat và chuyển sang agent domain + n8n.**
