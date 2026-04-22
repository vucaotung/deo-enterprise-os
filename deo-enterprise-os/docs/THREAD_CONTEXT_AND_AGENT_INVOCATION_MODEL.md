# THREAD CONTEXT AND AGENT INVOCATION MODEL

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa mô hình kỹ thuật cho thread context trong chat-based Work OS và cách main coordinator handoff context sang specialist agents sao cho tự nhiên, ít đốt token và giữ continuity tốt.

---

## 1. Tư duy lõi

Trong mô hình này, agent **không nên tự mò toàn bộ thế giới** mỗi khi được gọi.

Thay vào đó:
- thread giữ context state
- orchestration layer đóng gói context
- specialist agent nhận context đã được chuẩn hóa
- output quay lại thread và/hoặc tạo structured objects

### Một câu chốt
> **Thread giữ continuity, orchestrator đóng gói context, specialist agent chỉ xử đúng việc nó được gọi.**

---

## 2. Các lớp trong mô hình

## A. Conversation Thread Layer
Giữ trạng thái của cuộc trao đổi.

## B. Context Assembly Layer
Gom dữ liệu liên quan từ project/task/CRM/notebooks/clarifications/files.

## C. Orchestration Layer
Quyết định có cần gọi agent hay không, gọi agent nào, với input nào.

## D. Specialist Agent Layer
Nhận context đã đóng gói, thực thi nhiệm vụ, trả kết quả.

## E. Action Application Layer
Đẩy output vào chat/thread hoặc apply sang object layer:
- project
- task
- clarification
- notebook
- CRM object

---

## 3. Thread là gì trong hệ này

Thread không chỉ là danh sách message.

### Thread phải được coi là work context container
Nó phải biết:
- mọi người đang bàn chuyện gì
- đang gắn với object nào
- cái gì đã chốt
- cái gì chưa chốt
- agent nào đang active
- pending actions là gì

---

## 4. Thread schema đề xuất

```ts
interface WorkThread {
  id: string;
  channel: 'telegram' | 'zalo' | 'web';
  chat_id: string;
  title: string;

  primary_context_type: 'project' | 'task' | 'client' | 'general_job' | 'incident' | 'general';
  primary_context_id?: string;

  participants: ThreadParticipant[];
  active_agents: ThreadAgentBinding[];
  watcher_agents: ThreadAgentBinding[];

  linked_projects: string[];
  linked_tasks: string[];
  linked_clients: string[];
  linked_notebooks: string[];
  linked_files: ThreadFileRef[];

  thread_summary_short: string;
  thread_summary_working: string;
  current_goal?: string;
  last_decision_summary?: string;

  pending_actions: PendingAction[];
  open_questions: OpenQuestion[];
  open_clarifications_count: number;

  mode: 'mention_only' | 'suggest_only' | 'assisted_execution' | 'high_automation';
  created_at: string;
  updated_at: string;
}
```

---

## 5. Core supporting types

```ts
interface ThreadParticipant {
  id: string;
  kind: 'human' | 'agent' | 'system';
  display_name: string;
  role?: 'owner' | 'manager' | 'member' | 'observer';
}

interface ThreadAgentBinding {
  agent_key: string;
  role: 'coordinator' | 'specialist' | 'watcher';
  status: 'active' | 'idle' | 'paused';
  attached_at: string;
}

interface ThreadFileRef {
  id: string;
  name: string;
  mime_type?: string;
  url?: string;
  source_message_id?: string;
  tags?: string[];
}

interface PendingAction {
  id: string;
  label: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  owner_type?: 'human' | 'agent';
  owner_id?: string;
  due_at?: string;
}

interface OpenQuestion {
  id: string;
  text: string;
  status: 'open' | 'resolved';
  related_entity_type?: 'task' | 'project' | 'client' | 'clarification';
  related_entity_id?: string;
}
```

---

## 6. Thread summary strategy

Để tránh đốt token, thread phải có ít nhất 2 lớp summary:

## A. `thread_summary_short`
- 1-5 câu
- dùng cho quick recall
- suitable for lightweight checks

## B. `thread_summary_working`
- dài hơn
- giữ:
  - objective
  - constraints
  - decisions
  - unresolved points
  - file/context refs

### Có thể thêm lớp thứ 3 về sau
## C. `decision_log`
- mốc những gì đã chốt
- phù hợp để sync sang notebook/knowledge

---

## 7. Context assembly là gì

Đây là lớp cực quan trọng.

Nó lấy dữ liệu từ nhiều object nhưng **chỉ assemble phần cần cho action hiện tại**.

### Sources có thể gồm
- recent messages
- thread summaries
- linked project
- linked tasks
- linked client
- linked notebooks
- open clarifications
- uploaded files metadata

### Không nên làm
- dump toàn bộ raw history cho agent
- attach mọi object liên quan dù không cần
- để từng specialist tự fetch lung tung

---

## 8. Context package proposal

```ts
interface AgentInvocationContext {
  thread: {
    id: string;
    title: string;
    channel: string;
    primary_context_type: string;
    primary_context_id?: string;
    mode: string;
  };

  objective: string;
  user_request: string;

  thread_memory: {
    summary_short: string;
    summary_working: string;
    last_decision_summary?: string;
    pending_actions: PendingAction[];
    open_questions: OpenQuestion[];
  };

  recent_messages: Array<{
    id: string;
    sender: string;
    text: string;
    created_at: string;
  }>;

  linked_context: {
    projects?: any[];
    tasks?: any[];
    clients?: any[];
    notebooks?: any[];
    clarifications?: any[];
    files?: ThreadFileRef[];
  };

  constraints?: string[];
  allowed_actions?: string[];
  expected_output: 'reply' | 'summary' | 'task_draft' | 'clarification_draft' | 'note_draft' | 'analysis';
}
```

---

## 9. Agent invocation contract

Mỗi agent invocation nên rõ 4 phần:

### A. Goal
Agent được gọi để làm gì.

### B. Context
Những gì agent cần biết để xử đúng.

### C. Permission scope
Agent được phép làm gì.

### D. Expected output shape
Agent phải trả về kiểu kết quả nào.

---

## 10. Example invocation

```json
{
  "thread": {
    "id": "thread_abc",
    "title": "Job ABC - Proposal",
    "channel": "telegram",
    "primary_context_type": "general_job",
    "mode": "assisted_execution"
  },
  "objective": "Tạo task breakdown ban đầu cho job mới",
  "user_request": "@Dẹo bóc thành task giúp",
  "thread_memory": {
    "summary_short": "Nhóm đang bàn proposal cho khách ABC, deadline tuần sau.",
    "summary_working": "Đã có brief PDF, 2 reference images, cần proposal + estimate, còn 2 điểm chưa rõ về scope.",
    "pending_actions": [],
    "open_questions": [
      { "id": "q1", "text": "Scope landing page gồm bao nhiêu section?", "status": "open" }
    ]
  },
  "recent_messages": [
    { "id": "m1", "sender": "Vincent", "text": "Brief ở file PDF trên nhé", "created_at": "..." },
    { "id": "m2", "sender": "Vincent", "text": "@Dẹo bóc thành task giúp", "created_at": "..." }
  ],
  "linked_context": {
    "files": [
      { "id": "f1", "name": "brief.pdf" }
    ]
  },
  "allowed_actions": ["draft_tasks", "suggest_clarifications"],
  "expected_output": "task_draft"
}
```

---

## 11. Kinds of agent outputs

## A. Reply output
Dùng khi chỉ cần trả lời vào chat.

## B. Summary output
Dùng khi cần recap/tóm tắt.

## C. Structured action draft
Dùng khi tạo:
- task drafts
- clarification drafts
- notebook drafts
- CRM follow-up drafts

## D. Analysis output
Dùng cho research, planning, risk review.

---

## 12. Suggested output envelope

```ts
interface AgentInvocationResult {
  kind: 'reply' | 'summary' | 'task_draft' | 'clarification_draft' | 'note_draft' | 'analysis';
  text?: string;
  structured_payload?: any;
  suggested_actions?: Array<{
    action_key: string;
    label: string;
    confidence?: number;
  }>;
  follow_up_questions?: string[];
  next_recommended_agent?: string;
}
```

---

## 13. Handoff rules giữa coordinator và specialist

## Rule 1
Coordinator không nên làm thay specialist nếu task đó cần domain reasoning riêng.

## Rule 2
Specialist không nên được gọi nếu chỉ cần action đơn giản/rule-based.

## Rule 3
Coordinator phải đóng gói context trước khi gọi specialist.

## Rule 4
Specialist không nên tự mutate object mạnh nếu chưa có permission rõ.

## Rule 5
Kết quả của specialist phải quay về thread dưới dạng dễ hiểu với con người.

---

## 14. Trigger examples

## Trigger type A — explicit summon
- `@Dẹo gọi research agent`
- `/summon finance`

## Trigger type B — action ask
- `@Dẹo tạo project`
- `@Dẹo mở clarification`

## Trigger type C — strong inference
Chỉ khi mode cho phép:
- job mới đã có đủ brief + deadline → gợi ý tạo project
- discussion đang kẹt do ambiguity → gợi ý clarification

---

## 15. Token discipline

### Nên làm
- dùng summaries
- dùng recent relevant messages only
- đóng gói context theo task hiện tại
- chỉ gọi specialist khi trigger đủ mạnh

### Không nên làm
- feed full raw thread
- gọi 3 specialist cùng lúc cho việc nhỏ
- để specialist tự fetch vô hạn từ mọi domain

---

## 16. Object write policy

Agent invocation có thể dẫn tới write operations, nhưng nên theo policy rõ ràng.

### Allowed levels
- `read_only`
- `draft_only`
- `suggest_only`
- `execute_with_confirmation`
- `auto_execute_limited`

### Khuyến nghị cho V1
Ưu tiên:
- `suggest_only`
- `draft_only`
- `execute_with_confirmation`

---

## 17. Minimal V1 implementation

Nếu build V1 thực dụng, nên có:
- thread state table/model
- rolling thread summary
- coordinator agent binding
- context assembler tối thiểu
- specialist invocation envelope
- 3 output kinds đầu tiên:
  - reply
  - summary
  - task_draft

---

## 18. One-line conclusion

**Trong chat-based Work OS, thread phải giữ continuity và state; main coordinator đóng gói context đúng nhu cầu rồi mới handoff sang specialist agents, để agent làm việc có ngữ cảnh mà không phải đốt token vào việc reread toàn bộ cuộc trò chuyện.**
