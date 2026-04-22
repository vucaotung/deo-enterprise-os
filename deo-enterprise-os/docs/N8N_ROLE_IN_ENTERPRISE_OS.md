# N8N ROLE IN ENTERPRISE OS

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt vai trò của `n8n` trong Dẹo Enterprise OS để phân biệt rõ nó với `agent domain`, `chat orchestration`, `project/task object layer` và `admin/control plane`.

---

## 1. Tư duy lõi

`n8n` không nên bị hiểu là “thay thế toàn bộ agent system”.

Cũng không nên bị xem chỉ là một món tích hợp phụ.

Trong hệ này, n8n nên được định vị là:
- **workflow engine**
- **integration bus / automation fabric**
- **execution substrate cho một số loại agent actions**
- **bridge giữa Work OS và thế giới external systems**

### Một câu chốt
> **Agent quyết định và mang ngữ cảnh; n8n điều phối workflow/integrations và thực thi các bước automation có cấu trúc.**

---

## 2. n8n dùng để làm gì trong hệ này

n8n phải trả lời được các nhu cầu kiểu:
- khi chat/thread tạo event thì route workflow đi đâu?
- khi agent cần gọi nhiều external services thì ai nối giúp?
- khi có email/webhook/form/sheet/file event thì ai kéo vào OS?
- khi cần một chuỗi automation nhiều bước thì ai chạy?
- khi cần push data ra ngoài hệ thì ai làm bridge?

---

## 3. n8n KHÔNG phải là gì

## Không phải Agent Domain
n8n không tự là “agent” theo nghĩa nghiệp vụ của hệ.

### Vì sao
- n8n không phải actor có persona/domain role tự nhiên như agent
- n8n không giữ conversational context giống coordinator
- n8n mạnh về workflow steps hơn là reasoning-driven orchestration

## Không phải Chat Frontstage
n8n không phải nơi người dùng trực tiếp làm việc hàng ngày.

## Không phải Object Layer
n8n không phải nơi project/task/clarification/notebook được định nghĩa về mặt domain truth.

---

## 4. Vị trí đúng của n8n trong kiến trúc

## Frontstage
- Telegram/Zalo/web chat
- user interaction
- thread context

## Decision/Orchestration layer
- coordinator agents
- specialist agents
- trigger logic
- action selection

## Workflow / Integration layer
- **n8n**

## Object layer
- projects
- tasks
- clarifications
- notebooks
- CRM
- finance

## Control plane
- agent admin
- workflow admin
- execution logs

### Kết luận
`n8n` nằm **dưới orchestration, cạnh integration/execution**, không ở frontstage.

---

## 5. Vai trò chuẩn của n8n

## A. External event intake
n8n nhận hoặc route các event từ ngoài vào.

### Ví dụ
- webhook từ form
- email event
- Google Sheets update
- external CRM change
- payment / finance event
- third-party callback

### Sau đó
n8n có thể đẩy event vào Work OS qua API nội bộ.

---

## B. Multi-step automation runner
Khi cần chuỗi bước rõ ràng, n8n rất hợp.

### Ví dụ
- nhận brief mới
- tạo folder
- lưu file
- gọi OCR/extraction
- update DB
- notify group
- create task draft

### Tại sao hợp
- step-based
- dễ quan sát
- dễ retry
- dễ nối nhiều integration

---

## C. Integration bridge
n8n rất hợp để nối Work OS với:
- Google services
- Notion
- Airtable
- Slack/Telegram/Zalo webhooks
- CRM/ERP ngoài
- storage systems
- HTTP APIs

---

## D. Execution substrate cho action không cần reasoning
Có những action agent quyết định xong thì không cần chính agent tự làm tiếp.

### Ví dụ
Coordinator quyết định:
- lưu file vào drive
- tạo row trong sheet
- gửi webhook sang hệ khác
- đẩy task sang external PM tool

### Khi đó
Agent chỉ quyết định **cần làm gì**  
Còn n8n thực hiện **làm bằng cách nào** qua workflow steps.

---

## 6. Agent và n8n nên phối hợp thế nào

## Mô hình đúng
### Agent chịu trách nhiệm
- hiểu context
- reason
- chọn action
- draft/suggest/decide

### n8n chịu trách nhiệm
- chạy workflow nhiều bước
- nối integrations
- move data giữa systems
- handle webhooks/triggers/retries

### Một câu chốt
> **Agent = decision + context**  
> **n8n = execution flow + integrations**

---

## 7. Các pattern phối hợp agent ↔ n8n

## Pattern 1 — Agent decides, n8n executes
### Ví dụ
User trong group: `@Dẹo tạo onboarding flow cho lead này`

- coordinator hiểu yêu cầu
- agent tạo action plan / task draft
- n8n workflow chạy:
  - create CRM record
  - create Drive folder
  - send email template
  - notify team group

---

## Pattern 2 — n8n ingests, agent interprets
### Ví dụ
- form đăng ký mới đẩy vào webhook
- n8n nhận data
- gọi Work OS API
- system/coordinator agent phân loại:
  - tạo lead
  - tạo task follow-up
  - notify relevant thread

---

## Pattern 3 — Agent calls specialist, n8n handles toolchain
### Ví dụ
Research agent cần:
- fetch nhiều nguồn
- gọi APIs ngoài
- normalize data
- lưu result vào store

Agent có thể reason phần high-level, còn n8n xử phần toolchain nhiều bước.

---

## Pattern 4 — n8n workflow emits event back into chat/thread
### Ví dụ
- workflow hoàn tất
- n8n post callback vào Work OS
- Work OS append `system_event` hoặc `agent_result` vào thread
- coordinator viết reply tự nhiên vào group

---

## 8. Những use cases n8n rất hợp

## A. Integration-heavy workflows
- Google Drive / Docs / Sheets
- email routing
- webhook fan-out
- sync external systems

## B. Repetitive operational flows
- create records in nhiều hệ
- notify nhiều kênh
- transform dữ liệu định dạng chuẩn
- ETL nhẹ

## C. Scheduled automations
- daily digest
- weekly report
- sync jobs
- SLA reminders

## D. Human-in-the-loop workflows
- đợi confirm
- đi qua nhiều bước có nút approve
- callback lại thread/group khi xong

---

## 9. Những việc KHÔNG nên ép n8n làm

## A. Deep conversational reasoning
n8n không nên là nơi “hiểu ý người dùng” chính.

## B. Long-lived thread memory/orchestration truth
Thread state truth nên nằm ở Work OS data model, không nằm trong workflow JSON của n8n.

## C. Domain object truth
`project`, `task`, `clarification`, `notebook` phải có source of truth trong OS, không nằm rải trong các workflow node.

## D. Agent identity model
Agent definitions / runtime states / capabilities không nên bị nhét vào n8n workflow metadata như nơi lưu chính.

---

## 10. Cách nhìn đúng về source-of-truth

## Work OS là source-of-truth cho
- chat threads
- projects/tasks
- clarifications/notebooks
- agent definitions
- invocation trace

## n8n là source-of-execution cho
- workflow graph
- integration steps
- retries
- connector logic
- schedule-based automations

### Một câu chốt
> **Truth ở OS, flow ở n8n.**

---

## 11. Suggested boundaries giữa Work OS API và n8n

## Work OS API nên cung cấp cho n8n
- create/update project
- create/update task
- append thread event/message
- get thread context snapshot
- create clarification
- create notebook note
- register agent invocation result

## n8n nên cung cấp cho Work OS
- workflow triggers
- webhook entrypoints
- integration callbacks
- long-chain automation execution
- external data sync results

---

## 12. n8n trong nhánh chat-based Work OS

Nếu dùng Telegram group làm frontstage, n8n rất hợp cho:
- ingest external attachments/events phụ
- post-processing files
- notify external systems
- route outputs sau khi agent quyết định

### Ví dụ
Trong group user nói:
- `@Dẹo lưu file này vào đúng thư mục project`

Flow đẹp sẽ là:
- coordinator hiểu ý + xác định project context
- tạo action
- n8n workflow xử:
  - upload file
  - move file
  - rename file
  - link file back to thread/project
- kết quả callback về group

---

## 13. n8n trong agent domain

n8n không phải agent, nhưng có thể là một **backend execution target** cho agent invocations.

### Ví dụ
`finance_agent` decide:
- cần chạy reconciliation workflow

### Thực thi bởi
- n8n workflow `finance.reconcile.v1`

### Kết quả
- workflow xong
- callback result vào `agent_invocations`
- update thread/project/task nếu cần

---

## 14. V1 implementation priority cho n8n role

Nếu build thật, Dẹo đề xuất ưu tiên:

### Phase 1
n8n làm external integration bus
- webhook intake
- Google connectors
- file pipelines
- notifications

### Phase 2
n8n làm action executor cho agent-decided workflows
- create multi-system records
- route automation chains
- callbacks

### Phase 3
n8n làm scheduled/maintenance workflows
- digests
- nightly syncs
- health checks

### Chưa cần ngay
- biến toàn bộ orchestration logic thành workflow nodes
- encode full business/domain truth vào n8n

---

## 15. Admin implications

Nếu có Agent Admin, sau này cũng nên có **Workflow Admin / n8n Admin view** riêng.

### Để xem
- workflow nào được gọi nhiều
- workflow nào fail
- callback nào pending
- external integration nào unstable
- action nào đang rely on n8n

### Nhưng
Không trộn Agent Admin và n8n Admin thành một cục nếu chưa cần.

---

## 16. One-line conclusion

**Trong Dẹo Enterprise OS, n8n nên được dùng như workflow engine và integration fabric đứng dưới orchestration layer: agent chịu trách nhiệm hiểu ngữ cảnh và quyết định hành động, còn n8n chịu trách nhiệm chạy các chuỗi automation và kết nối external systems một cách có cấu trúc, quan sát được và dễ retry.**
