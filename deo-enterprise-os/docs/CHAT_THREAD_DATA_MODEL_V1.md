# CHAT THREAD DATA MODEL V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa data model V1 cho chat-based Work OS, nơi Telegram/Zalo/web conversations được coi là work threads có state, context, linked objects và orchestration metadata đủ để build thật.

---

## 1. Tư duy lõi

Trong mô hình này, chat không chỉ là bảng message.

Chat thread phải là một object có cấu trúc, có thể:
- giữ continuity
- giữ summary
- gắn với project/task/client/notebook
- track agent participation
- track pending actions/open questions
- làm đầu vào cho orchestration engine

### Một câu chốt
> **Thread là work context container, không chỉ là lịch sử hội thoại.**

---

## 2. Phạm vi V1

Data model V1 phải đủ để:
- ingest conversation từ Telegram/Zalo/web
- lưu participants/messages/files cơ bản
- map thread vào project/task/client khi cần
- lưu thread summary
- lưu pending actions/open questions
- lưu active agents / watcher agents
- support agent invocation + traceability

### Chưa cần ở V1
- vector memory phức tạp
- semantic retrieval nâng cao
- branching conversation tree sâu
- multi-tenant policy quá phức tạp
- token accounting chi tiết đến từng sub-call

---

## 3. Các thực thể chính

## A. `chat_threads`
Object gốc của conversation/work thread.

### Fields đề xuất
- `id`
- `channel` (`telegram`, `zalo`, `web`, `other`)
- `chat_id`
- `external_thread_id` (nullable)
- `title`
- `workspace_id` (nullable)
- `team_id` (nullable)
- `group_type` (`new_job`, `project_group`, `team_group`, `incident_group`, `general`)
- `mode` (`mention_only`, `suggest_only`, `assisted_execution`, `high_automation`)
- `primary_context_type` (`project`, `task`, `client`, `general_job`, `incident`, `general`)
- `primary_context_id` (nullable)
- `primary_project_id` (nullable)
- `allow_multi_project_context` (bool)
- `thread_summary_short` (text)
- `thread_summary_working` (text)
- `current_goal` (text nullable)
- `last_decision_summary` (text nullable)
- `open_clarifications_count` (int default 0)
- `last_message_at`
- `last_summary_at` (nullable)
- `created_at`
- `updated_at`

### Ý nghĩa
Đây là bảng sống còn của chat-based Work OS.

---

## B. `chat_participants`
Ai đang tham gia thread.

### Fields đề xuất
- `id`
- `thread_id`
- `participant_type` (`human`, `agent`, `system`)
- `external_user_id` (nullable)
- `internal_user_id` (nullable)
- `agent_key` (nullable)
- `display_name`
- `role` (`owner`, `manager`, `member`, `observer`, `assistant`)
- `joined_at`
- `last_seen_at` (nullable)

---

## C. `chat_messages`
Raw message log.

### Fields đề xuất
- `id`
- `thread_id`
- `external_message_id` (nullable)
- `source_reply_to_message_id` (nullable)
- `sender_participant_id`
- `sender_type` (`human`, `agent`, `system`)
- `message_type` (`text`, `image`, `file`, `voice`, `system_event`, `summary`, `agent_result`)
- `text_content` (nullable)
- `normalized_text` (nullable)
- `metadata_json` (jsonb)
- `created_at`

### Ý nghĩa
Raw record để trace nguồn và feed summary/orchestration.

---

## D. `chat_files`
Tài liệu/file được nhắc tới hoặc upload trong thread.

### Fields đề xuất
- `id`
- `thread_id`
- `source_message_id`
- `name`
- `mime_type`
- `size_bytes` (nullable)
- `storage_url` (nullable)
- `external_url` (nullable)
- `tags_json` (jsonb)
- `created_at`

---

## E. `chat_linked_entities`
Nối thread với object layer.

### Fields đề xuất
- `id`
- `thread_id`
- `entity_type` (`project`, `task`, `client`, `notebook`, `clarification`, `file`, `expense`, `other`)
- `entity_id`
- `link_role` (`primary`, `secondary`, `source`, `reference`, `output`)
- `created_by_type` (`human`, `agent`, `system`)
- `created_by_id` (nullable)
- `created_at`

### Ý nghĩa
Cho phép 1 thread gắn nhiều object khác nhau mà không phá core model.

---

## F. `chat_pending_actions`
Các action đang mở từ thread.

### Fields đề xuất
- `id`
- `thread_id`
- `label`
- `status` (`open`, `in_progress`, `done`, `cancelled`)
- `owner_type` (`human`, `agent`, `unknown`)
- `owner_id` (nullable)
- `related_entity_type` (nullable)
- `related_entity_id` (nullable)
- `due_at` (nullable)
- `source_message_id` (nullable)
- `created_at`
- `updated_at`

---

## G. `chat_open_questions`
Các ambiguity / unresolved points.

### Fields đề xuất
- `id`
- `thread_id`
- `text`
- `status` (`open`, `resolved`, `cancelled`)
- `related_entity_type` (nullable)
- `related_entity_id` (nullable)
- `source_message_id` (nullable)
- `created_at`
- `resolved_at` (nullable)

---

## H. `chat_agent_bindings`
Agent nào đang attach vào thread.

### Fields đề xuất
- `id`
- `thread_id`
- `agent_key`
- `binding_role` (`coordinator`, `specialist`, `watcher`)
- `status` (`active`, `idle`, `paused`, `completed`)
- `attached_by_type` (`human`, `agent`, `system`)
- `attached_by_id` (nullable)
- `started_at`
- `ended_at` (nullable)

### Ý nghĩa
Giúp biết thread đang có những agent nào thật sự tham gia.

---

## I. `chat_summaries`
Lưu lịch sử summary của thread.

### Fields đề xuất
- `id`
- `thread_id`
- `summary_type` (`short`, `working`, `decision`, `handoff`)
- `content`
- `source_message_start_id` (nullable)
- `source_message_end_id` (nullable)
- `generated_by` (`system`, `coordinator_agent`, `specialist_agent`, `human`)
- `generated_by_id` (nullable)
- `created_at`

### Ý nghĩa
Không overwrite hết mọi thứ vào `chat_threads`; giữ cả history summary để audit và handoff.

---

## J. `chat_agent_invocations`
Trace các lần gọi agent.

### Fields đề xuất
- `id`
- `thread_id`
- `trigger_type` (`mention`, `command`, `suggestion_accept`, `auto_trigger`, `manual_admin`)
- `trigger_message_id` (nullable)
- `invoked_by_type` (`human`, `agent`, `system`)
- `invoked_by_id` (nullable)
- `agent_key`
- `invocation_kind` (`coordinator_reasoning`, `specialist_task`, `summary`, `analysis`, `draft`)
- `objective`
- `context_snapshot_json` (jsonb)
- `allowed_actions_json` (jsonb)
- `status` (`queued`, `running`, `completed`, `failed`, `cancelled`)
- `result_message_id` (nullable)
- `result_entity_type` (nullable)
- `result_entity_id` (nullable)
- `created_at`
- `completed_at` (nullable)

---

## 4. Quan hệ chính

- `chat_threads` 1-n `chat_participants`
- `chat_threads` 1-n `chat_messages`
- `chat_threads` 1-n `chat_files`
- `chat_threads` 1-n `chat_linked_entities`
- `chat_threads` 1-n `chat_pending_actions`
- `chat_threads` 1-n `chat_open_questions`
- `chat_threads` 1-n `chat_agent_bindings`
- `chat_threads` 1-n `chat_summaries`
- `chat_threads` 1-n `chat_agent_invocations`

---

## 5. Suggested SQL-ish sketch

```sql
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY,
  channel TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  external_thread_id TEXT,
  title TEXT,
  workspace_id UUID,
  team_id UUID,
  group_type TEXT NOT NULL DEFAULT 'general',
  mode TEXT NOT NULL DEFAULT 'mention_only',
  primary_context_type TEXT NOT NULL DEFAULT 'general',
  primary_context_id UUID,
  primary_project_id UUID,
  allow_multi_project_context BOOLEAN NOT NULL DEFAULT false,
  thread_summary_short TEXT NOT NULL DEFAULT '',
  thread_summary_working TEXT NOT NULL DEFAULT '',
  current_goal TEXT,
  last_decision_summary TEXT,
  open_clarifications_count INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_summary_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Indexing hints

Nên index ít nhất:
- `chat_threads(channel, chat_id)`
- `chat_messages(thread_id, created_at)`
- `chat_linked_entities(thread_id, entity_type)`
- `chat_agent_invocations(thread_id, created_at)`
- `chat_pending_actions(thread_id, status)`
- `chat_open_questions(thread_id, status)`

---

## 7. Minimal V1 read models cần có

## A. Thread overview read model
Để render group/thread summary nhanh.

### Gồm
- title
- current goal
- short summary
- counts:
  - participants
  - pending actions
  - open questions
  - linked tasks
  - open clarifications

## B. Thread context read model
Để feed cho coordinator.

### Gồm
- short + working summary
- recent messages
- linked entities
- pending actions
- open questions
- active agents

## C. Agent invocation read model
Để track ai được gọi, gọi vì sao, ra kết quả gì.

---

## 8. Mapping với project/task model hiện có

Thread nên link sang object model, không nhúng project/task data thẳng vào bảng thread.

### Dùng `chat_linked_entities` để nối với
- `projects`
- `tasks`
- `clients`
- `clarifications`
- `notebooks`

### Lợi ích
- linh hoạt
- một thread có thể gắn nhiều object
- không phá schema core về sau

---

## 9. Traceability là bắt buộc

Vì object sinh từ chat phải trace ngược về source discussion.

### Nên đảm bảo
- task tạo từ chat biết source message/thread
- clarification tạo từ chat biết source ambiguity
- notebook note biết source decision messages
- agent invocation biết do ai/trigger nào gọi

---

## 10. V1 implementation priority

Nếu build V1 thật, nên ưu tiên tạo trước:
1. `chat_threads`
2. `chat_messages`
3. `chat_linked_entities`
4. `chat_pending_actions`
5. `chat_open_questions`
6. `chat_agent_bindings`
7. `chat_agent_invocations`

### Có thể để sau
- `chat_summaries` history table riêng
- `chat_files` metadata phong phú
- advanced memory indices

---

## 11. One-line conclusion

**Data model V1 của chat-based Work OS phải coi thread là một work context container có state, linked entities, summaries, pending actions và agent invocation trace, để Telegram/Zalo conversations có thể trở thành lớp frontstage thật của hệ công việc.**
