# ORCHESTRATION STACK V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Gom toàn bộ các quyết định kiến trúc đã chốt về `chat`, `thread context`, `agents`, `n8n`, `workflow registry`, `admin`, và `execution trace` vào một khung nhìn tích hợp duy nhất.

---

## 1. Câu chốt của stack này

Dẹo Enterprise OS đang đi theo hướng:

> **Human-native frontstage ở chat/thread, orchestration ở agent layer, structured execution ở workflow/integration layer, và domain truth nằm trong Work OS core.**

---

## 2. Các tầng chính của hệ

## Tầng 1 — Frontstage / Human interaction
Đây là nơi con người làm việc tự nhiên.

### Bao gồm
- Telegram group
- về sau có thể thêm Zalo / web chat
- project/task web views

### Vai trò
- nhận input từ user
- giữ conversational context
- hiển thị kết quả về lại cho người dùng

### Quyết định đã chốt
- Telegram group là **human-native frontstage**
- không ép user bỏ Telegram/Zalo để chuyển hết vào web chat riêng

---

## Tầng 2 — Thread / Context layer
Đây là nơi biến raw chat thành work context có cấu trúc.

### Bao gồm
- thread summaries
- pending actions
- open questions
- linked entities
- current objective
- active agent bindings

### Vai trò
- lưu continuity của cuộc việc
- tránh cho agent phải đọc lại full history liên tục
- cung cấp context package cho orchestration

---

## Tầng 3 — Agent / Orchestration layer
Đây là nơi hiểu ngữ cảnh và quyết định hành động.

### Bao gồm
- coordinator agents
- specialist agents
- watcher agents
- invocation logic
- bindings

### Vai trò
- reason trên context
- chọn action phù hợp
- decide khi nào gọi specialist
- decide khi nào dispatch workflow

### Quyết định đã chốt
- agent là actor thực thi có role/capabilities/runtime state/bindings/invocation trace
- agent không chỉ là chatbot avatar hay model call đơn lẻ

---

## Tầng 4 — Workflow / Integration layer
Đây là nơi chạy các chuỗi automation có cấu trúc.

### Bao gồm
- n8n workflows
- webhook handlers
- integration connectors
- scheduled flows
- callback flows

### Vai trò
- chạy multi-step automations
- nối Work OS với external systems
- xử lý retries / waits / approvals / fan-out

### Quyết định đã chốt
- **truth ở OS, flow ở n8n**
- agent quyết định, n8n thực thi flow

---

## Tầng 5 — Object / Domain layer
Đây là source-of-truth nghiệp vụ.

### Bao gồm
- projects
- tasks
- clarifications
- notebooks
- CRM
- finance

### Vai trò
- lưu object state chính thức
- giữ quan hệ giữa các domain
- nhận kết quả đã được apply từ orchestration/workflows

---

## Tầng 6 — Control plane / Admin / Trace
Đây là nơi quản trị và quan sát hệ.

### Bao gồm
- Agent Admin
- workflow registry
- execution traces
- run inspection
- retry/cancel/intervention

### Vai trò
- kiểm soát agent layer
- kiểm soát workflow eligibility
- trace từ trigger đến object result

---

## 3. Luồng chuẩn end-to-end

```text
Human message / external event
→ thread context update
→ agent invocation
→ workflow dispatch (nếu cần)
→ n8n execution
→ callback về Work OS
→ result application vào thread/object
→ human thấy kết quả ở frontstage
```

---

## 4. Vai trò từng thành phần

## Telegram / chat
- human-native entrypoint
- không phải source-of-truth duy nhất

## Thread model
- continuity container
- context packaging layer

## Coordinator agent
- hiểu thread
- giữ continuity
- decide next action

## Specialist agent
- xử domain-specific work khi được summon

## n8n
- workflow engine + integration fabric
- không phải agent

## Workflow registry
- catalog chính thức của automation layer

## Agent Admin
- control plane của agent layer

## Trace model
- execution truth từ trigger tới output

---

## 5. Các nguyên tắc kiến trúc đã khóa

1. **Telegram-first, không multi-channel quá sớm**
2. **Coordinator trước, specialists sau**
3. **Summary first, full reread chỉ on-demand**
4. **Workflow qua registry, không gọi ad-hoc**
5. **Agent Admin tách biệt khỏi Agent Domain**
6. **Object truth không nằm trong n8n workflows**
7. **Execution trace là hạ tầng cốt lõi, không phải tiện ích phụ**

---

## 6. Bộ tài liệu nền đã có cho stack này

### Chat / thread / frontstage
- `TELEGRAM_GROUP_AS_WORK_OS_V1.md`
- `THREAD_CONTEXT_AND_AGENT_INVOCATION_MODEL.md`
- `TELEGRAM_GROUP_TO_PROJECT_TASK_MAPPING.md`
- `LOW_TOKEN_CHAT_ORCHESTRATION_STRATEGY.md`
- `CHAT_THREAD_DATA_MODEL_V1.md`
- `CHAT_ORCHESTRATION_API_V1.md`
- `CHAT_V1_IMPLEMENTATION_PLAN.md`

### Agent / workflow / control plane
- `AGENT_DOMAIN_V1.md`
- `N8N_ROLE_IN_ENTERPRISE_OS.md`
- `AGENT_TO_N8N_EXECUTION_PATTERN.md`
- `N8N_WORKFLOW_REGISTRY_V1.md`
- `AGENT_ADMIN_MODEL_V1.md`
- `AGENT_RUN_AND_CALLBACK_TRACE_MODEL.md`

---

## 7. Thứ tự build thực dụng nếu quay lại implementation

1. canonicalize backend/frontend contracts đang có
2. dựng chat/thread schema tối thiểu
3. Telegram ingest core
4. thread state engine
5. agent definitions + invocations + bindings
6. workflow registry + dispatch/callback contracts
7. 2-3 workflow n8n đầu tiên
8. result application + trace views
9. Agent Admin cơ bản

---

## 8. One-line conclusion

**Orchestration Stack V1 của Dẹo Enterprise OS là kiến trúc nhiều tầng, trong đó chat/thread là mặt tiền tự nhiên cho con người, agent layer là nơi quyết định có ngữ cảnh, n8n là execution/integration substrate, Work OS là nơi giữ domain truth, và admin/trace layer là nơi vận hành/kiểm soát toàn bộ flow.**
