# CHAT ORCHESTRATION API V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Đề xuất API V1 cho chat-based Work OS để ingest conversation events, đọc thread state, trigger coordinator/specialist agents, và apply outputs thành project/task/clarification/note theo cách buildable.

---

## 1. Tư duy lõi

API này không nhằm clone Telegram API hay làm inbox chung chung.

Nó nhằm phục vụ 4 việc chính:
- ingest chat events
- quản lý thread state/context
- trigger orchestration/agent invocations
- chuyển chat actions thành structured objects

### Một câu chốt
> **Chat Orchestration API là lớp nối giữa conversational frontstage và object/action back-office.**

---

## 2. API domains chính

## A. Thread ingestion API
Nhận events/messages từ Telegram/Zalo/web.

## B. Thread query API
Đọc thread state, summaries, linked entities, pending actions.

## C. Orchestration API
Trigger coordinator/specialist actions.

## D. Action application API
Tạo project/task/clarification/note từ thread context.

## E. Admin/config API
Cấu hình group mode, primary project, allowed specialists.

---

## 3. Suggested route groups

- `/api/chat/threads`
- `/api/chat/messages`
- `/api/chat/ingest`
- `/api/chat/summary`
- `/api/chat/actions`
- `/api/chat/invocations`
- `/api/chat/groups`

---

## 4. Thread ingestion endpoints

## `POST /api/chat/ingest/message`
### Mục tiêu
Nhận một message event từ Telegram/Zalo/web connector.

### Request example
```json
{
  "channel": "telegram",
  "chat_id": "-100123456789",
  "thread_title": "Job ABC - Proposal",
  "external_message_id": "msg_123",
  "sender": {
    "external_user_id": "7293498822",
    "display_name": "Vincent",
    "participant_type": "human"
  },
  "message": {
    "type": "text",
    "text": "@Dẹo tạo project cho job này",
    "reply_to_message_id": null,
    "created_at": "2026-04-05T09:00:00+07:00"
  },
  "attachments": []
}
```

### Response example
```json
{
  "thread_id": "thread_abc",
  "message_id": "cm_001",
  "trigger_level": 3,
  "suggested_next_step": "coordinator_reasoning"
}
```

---

## `POST /api/chat/ingest/batch`
### Mục tiêu
Nhận batch events nếu connector sync nhiều message cùng lúc.

### Dùng khi
- startup sync
- backlog replay
- migration/import

---

## 5. Thread query endpoints

## `GET /api/chat/threads/:id`
### Mục tiêu
Lấy thread overview.

### Response nên gồm
- metadata thread
- short summary
- current goal
- counts
- active agents
- pending action count
- open question count

---

## `GET /api/chat/threads/:id/context`
### Mục tiêu
Lấy thread context đầy hơn để render admin view hoặc feed cho orchestration.

### Response nên gồm
- short summary
- working summary
- recent messages
- linked entities
- pending actions
- open questions
- linked files

---

## `GET /api/chat/threads/:id/messages`
### Params gợi ý
- `limit`
- `before`
- `after`

### Mục tiêu
Paginate raw messages.

---

## `GET /api/chat/threads/:id/invocations`
### Mục tiêu
Xem lịch sử agent invocations trong thread.

---

## 6. Summary endpoints

## `POST /api/chat/threads/:id/refresh-summary`
### Mục tiêu
Buộc coordinator/system refresh thread summary.

### Request example
```json
{
  "mode": "short",
  "reason": "manual_user_request"
}
```

### Response example
```json
{
  "thread_id": "thread_abc",
  "summary_type": "short",
  "content": "Nhóm đang bàn proposal cho khách ABC, deadline tuần sau..."
}
```

---

## `GET /api/chat/threads/:id/summaries`
### Mục tiêu
Xem lịch sử summary snapshots.

---

## 7. Orchestration / agent invocation endpoints

## `POST /api/chat/threads/:id/invoke-coordinator`
### Mục tiêu
Yêu cầu coordinator reasoning trên thread.

### Request example
```json
{
  "objective": "Tóm tắt lại những gì đã chốt",
  "trigger_type": "mention",
  "trigger_message_id": "cm_100",
  "expected_output": "summary"
}
```

---

## `POST /api/chat/threads/:id/invoke-specialist`
### Mục tiêu
Summon specialist agent.

### Request example
```json
{
  "agent_key": "research_agent",
  "objective": "Bóc đối thủ cạnh tranh từ brief hiện tại",
  "trigger_type": "mention",
  "trigger_message_id": "cm_101",
  "allowed_actions": ["reply", "analysis", "draft_note"],
  "expected_output": "analysis"
}
```

### Response example
```json
{
  "invocation_id": "inv_001",
  "status": "queued"
}
```

---

## `POST /api/chat/invocations/:id/cancel`
### Mục tiêu
Cancel invocation đang chờ/running nếu policy cho phép.

---

## 8. Action application endpoints

## `POST /api/chat/threads/:id/create-project`
### Mục tiêu
Tạo project từ thread context.

### Request example
```json
{
  "name": "Job ABC - Proposal",
  "description": "Tạo từ thread Telegram",
  "confirm": true
}
```

### Response example
```json
{
  "project_id": "proj_001",
  "linked": true,
  "source_thread_id": "thread_abc"
}
```

---

## `POST /api/chat/threads/:id/create-task`
### Mục tiêu
Tạo task từ thread/message.

### Request example
```json
{
  "title": "Follow-up khách ABC về scope",
  "description": "Sinh từ trao đổi trong group",
  "project_id": "proj_001",
  "source_message_id": "cm_102"
}
```

---

## `POST /api/chat/threads/:id/create-clarification`
### Mục tiêu
Tạo clarification từ ambiguity trong thread.

---

## `POST /api/chat/threads/:id/create-note`
### Mục tiêu
Tạo notebook/decision note từ đoạn chat đã chốt.

---

## 9. Group/admin endpoints

## `GET /api/chat/groups/:channel/:chatId`
### Mục tiêu
Lấy config của group.

---

## `PATCH /api/chat/groups/:channel/:chatId`
### Mục tiêu
Update config group.

### Có thể đổi
- `group_type`
- `mode`
- `primary_project_id`
- `allow_multi_project_context`
- `allowed_specialists`

### Request example
```json
{
  "mode": "assisted_execution",
  "group_type": "project_group",
  "primary_project_id": "proj_001",
  "allowed_specialists": ["research_agent", "writer_agent", "project_agent"]
}
```

---

## 10. Message-level action endpoints

Một số action nên gắn được trực tiếp vào message, không chỉ thread.

## `POST /api/chat/messages/:id/create-task`
## `POST /api/chat/messages/:id/create-clarification`
## `POST /api/chat/messages/:id/save-note`
## `POST /api/chat/messages/:id/summon-specialist`

### Vì sao cần
Rất tự nhiên khi user reply đúng vào message rồi bảo bot xử từ đoạn đó.

---

## 11. Trigger/result lifecycle đề xuất

### Step 1
Message/event vào `ingest`

### Step 2
System detect trigger level

### Step 3
Nếu cần, tạo `chat_agent_invocation`

### Step 4
Coordinator/specialist xử lý

### Step 5
Kết quả được:
- post lại thread
- hoặc tạo structured object
- hoặc cả hai

### Step 6
Thread summary/state được refresh nếu cần

---

## 12. Response shape recommendation

Nên nhất quán envelope để dễ debug.

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "thread_id": "thread_abc",
    "invocation_id": "inv_001"
  }
}
```

Lỗi:

```json
{
  "ok": false,
  "error": {
    "code": "THREAD_NOT_FOUND",
    "message": "Thread not found"
  }
}
```

---

## 13. Permissions / policy hints

Không phải action nào cũng được auto-run.

### Suggestion
Phân action ra:
- read-only
- draft-only
- execute-with-confirmation
- auto-execute-limited

### Ví dụ
- refresh summary → auto được
- create project → nên confirm hoặc theo policy group
- summon specialist → được nếu group cho phép
- mutate nhiều object cùng lúc → nên confirm

---

## 14. V1 minimal endpoint set

Nếu build thực dụng, V1 chỉ cần trước:
- `POST /api/chat/ingest/message`
- `GET /api/chat/threads/:id`
- `GET /api/chat/threads/:id/context`
- `POST /api/chat/threads/:id/refresh-summary`
- `POST /api/chat/threads/:id/invoke-coordinator`
- `POST /api/chat/threads/:id/invoke-specialist`
- `POST /api/chat/threads/:id/create-project`
- `POST /api/chat/threads/:id/create-task`
- `PATCH /api/chat/groups/:channel/:chatId`

---

## 15. Non-goals cho V1

- không cần full chat UI API clone Telegram
- không cần expose toàn bộ raw platform provider behavior
- không cần vector retrieval API public riêng ngay
- không cần graph orchestration API quá phức tạp từ đầu

---

## 16. One-line conclusion

**Chat Orchestration API V1 nên tập trung vào ingest events, đọc thread state, trigger coordinator/specialist invocations, và apply outputs thành project/task/clarification/note — đủ để biến group chat tự nhiên thành frontstage thật của Work OS mà không cần dựng một messaging system mới từ đầu.**
