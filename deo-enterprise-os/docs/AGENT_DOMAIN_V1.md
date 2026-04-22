# AGENT DOMAIN V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa domain `Agent` trong Dẹo Enterprise OS theo hướng đủ rõ để build được execution layer, orchestration layer, admin layer và integration layer mà không bị lẫn giữa bot, worker, runtime process và UI shell.

---

## 1. Tư duy lõi

Trong hệ này, `Agent` không nên bị hiểu như một chatbot avatar đơn thuần.

Thay vào đó, agent là:
- một **execution-capable actor**
- có **role** riêng
- có **capabilities** riêng
- có thể được **summon / attach / invoke** trong workflow
- có lifecycle, state và policy rõ ràng

### Một câu chốt
> **Agent là actor thực thi có ngữ cảnh trong Work OS, không chỉ là UI persona hay một model call đơn lẻ.**

---

## 2. Agent dùng để làm gì

Agent domain phải trả lời được các câu hỏi:
- trong hệ đang có những agent nào?
- mỗi agent làm được gì?
- agent nào là coordinator, agent nào là specialist?
- agent nào được attach vào thread/project/workspace?
- agent nào đang active, idle, paused, failed?
- ai được quyền summon agent nào?
- agent output quay về đâu?
- làm sao trace một action về đúng agent đã làm?

---

## 3. Scope của V1

Agent domain V1 nên đủ để làm được:
- định danh agent rõ ràng
- phân loại agent theo role
- lưu capabilities/policies cơ bản
- lưu state/lifecycle của agent
- trace invocations/runs
- attach agent vào thread/project khi cần
- distinguish coordinator vs specialist vs watcher

### Chưa cần ở V1
- marketplace agent quá phức tạp
- self-modifying agents
- nested agent economies
- skill graph động quá sâu
- multi-provider arbitration tối ưu cao cấp

---

## 4. Các khái niệm cốt lõi

## A. Agent Definition
Đây là định nghĩa “agent là ai”.

### Bao gồm
- key/name
- description
- role
- capabilities
- allowed actions
- preferred runtime/model/toolset

### Ý nghĩa
Agent definition là lớp ổn định để hệ biết agent đó dùng vào việc gì.

---

## B. Agent Runtime State
Đây là trạng thái vận hành hiện tại của agent.

### Ví dụ
- online
- idle
- busy
- paused
- offline
- failed

### Ý nghĩa
Không phải agent nào được định nghĩa xong cũng đang sẵn sàng làm việc ngay.

---

## C. Agent Invocation / Run
Đây là mỗi lần agent được gọi thực hiện một việc.

### Bao gồm
- ai gọi
- gọi vì mục tiêu gì
- context nào được gửi vào
- trạng thái chạy ra sao
- output gì
- thành công/thất bại

---

## D. Agent Binding
Đây là việc attach agent vào một context nào đó.

### Ví dụ
- attach coordinator vào thread Telegram
- attach project agent vào project X
- attach watcher agent vào incident room

### Ý nghĩa
Agent có thể tồn tại nhưng chưa chắc đã “tham gia” vào một context cụ thể.

---

## 5. Phân loại agent trong hệ này

## A. Coordinator Agent
### Vai trò
Điều phối, giữ continuity, quyết định có cần gọi specialist không.

### Ví dụ
- conversation coordinator
- project coordinator
- ops coordinator

### Đặc điểm
- context-heavy
- orchestration-oriented
- không nên ôm mọi domain reasoning sâu

---

## B. Specialist Agent
### Vai trò
Làm một nhóm việc chuyên môn cụ thể.

### Ví dụ
- research agent
- writer agent
- finance agent
- CRM agent
- task/project agent
- clarification agent
- knowledge agent

### Đặc điểm
- domain-specific
- thường được summon on-demand
- không cần đứng canh mọi thứ thường trực

---

## C. Watcher Agent
### Vai trò
Theo dõi event/state nhẹ, detect trigger hoặc anomaly.

### Ví dụ
- SLA watcher
- incident watcher
- task overdue watcher
- email importance watcher

### Đặc điểm
- lightweight
- event-driven
- không nên reasoning nặng thường trực

---

## D. Execution / Worker Agent
### Vai trò
Thực thi output/task cụ thể hơn theo run.

### Ví dụ
- code agent
- doc transform agent
- extraction agent
- summarization worker

### Đặc điểm
- objective-focused
- often stateless hơn coordinator

---

## 6. Những loại agent cần có cho V1 của hệ này

### Nhóm 1 — Core orchestration
- `conversation_coordinator`
- `project_coordinator`

### Nhóm 2 — Operational specialists
- `task_agent`
- `clarification_agent`
- `knowledge_agent`
- `research_agent`
- `writer_agent`

### Nhóm 3 — Business specialists
- `crm_agent`
- `finance_agent`

### Nhóm 4 — Monitoring / watchers
- `thread_watcher`
- `task_watchdog`
- `agent_health_watcher`

---

## 7. Agent schema đề xuất

```ts
interface AgentDefinition {
  id: string;
  key: string;
  name: string;
  description: string;

  role_type: 'coordinator' | 'specialist' | 'watcher' | 'worker';
  domain_type?: 'conversation' | 'project' | 'task' | 'crm' | 'finance' | 'knowledge' | 'research' | 'writing' | 'ops' | 'general';

  capabilities: string[];
  allowed_actions: string[];
  supported_contexts: string[];

  runtime_kind: 'local' | 'remote' | 'workflow' | 'hybrid';
  model_profile?: string;
  tool_profile?: string;

  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 8. Runtime state schema đề xuất

```ts
interface AgentRuntimeState {
  agent_id: string;
  status: 'online' | 'idle' | 'busy' | 'paused' | 'offline' | 'failed';
  health: 'healthy' | 'degraded' | 'unhealthy';
  current_load?: number;
  active_run_count?: number;
  last_seen_at?: string;
  last_error?: string;
  updated_at: string;
}
```

---

## 9. Invocation schema đề xuất

```ts
interface AgentInvocation {
  id: string;
  agent_id: string;
  trigger_type: 'manual' | 'mention' | 'command' | 'auto' | 'workflow';

  invoked_by_type: 'human' | 'agent' | 'system';
  invoked_by_id?: string;

  context_type: 'thread' | 'project' | 'task' | 'client' | 'incident' | 'general';
  context_id?: string;

  objective: string;
  input_snapshot_json: any;
  expected_output_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

  output_summary?: string;
  output_ref_type?: string;
  output_ref_id?: string;

  created_at: string;
  started_at?: string;
  completed_at?: string;
}
```

---

## 10. Binding schema đề xuất

```ts
interface AgentBinding {
  id: string;
  agent_id: string;
  binding_target_type: 'thread' | 'project' | 'workspace' | 'team';
  binding_target_id: string;
  binding_role: 'coordinator' | 'specialist' | 'watcher';
  status: 'active' | 'idle' | 'paused' | 'ended';
  attached_by_type: 'human' | 'agent' | 'system';
  attached_by_id?: string;
  created_at: string;
  ended_at?: string;
}
```

---

## 11. Capability model

Capabilities nên là lớp semantic dễ query.

### Ví dụ capabilities
- `summarize_thread`
- `detect_open_questions`
- `draft_tasks`
- `create_project_from_context`
- `analyze_finance`
- `draft_proposal`
- `research_competitors`
- `classify_crm_lead`
- `save_decision_note`
- `monitor_overdue_tasks`

### Tại sao cần
Vì sau này coordinator hoặc admin có thể hỏi:
- agent nào làm được việc này?
- specialist nào phù hợp để summon?

---

## 12. Allowed actions model

Capabilities ≠ allowed actions.

### Ví dụ
Agent có capability:
- `create_task_draft`

Nhưng allowed action của nó chỉ là:
- `suggest_only`
- chưa được `auto_create_task`

### Ý nghĩa
Tách được:
- cái agent biết làm
- cái agent được phép làm

---

## 13. Agent lifecycle

## Phase 1 — Defined
Agent đã được định nghĩa trong hệ.

## Phase 2 — Enabled
Agent được bật và có thể được summon.

## Phase 3 — Bound/Attached
Agent được attach vào thread/project/workspace nào đó.

## Phase 4 — Invoked
Agent được gọi chạy một objective cụ thể.

## Phase 5 — Completed / Failed / Paused
Run kết thúc hoặc agent runtime thay đổi state.

---

## 14. Relationship với chat domain

Chat domain không phải là agent domain. Nhưng chúng giao nhau rất mạnh.

### Chat dùng agent domain để
- biết coordinator nào follow thread
- biết summon specialist nào
- biết ai đang active trong thread
- trace agent results về thread

### Agent domain dùng chat domain để
- nhận context thread
- bind agent vào thread
- post output về đúng conversation context

---

## 15. Relationship với project/task domain

Project/task domain là nơi agent tạo ra hoặc cập nhật structured objects.

### Ví dụ
- project agent → create project/task drafts
- clarification agent → open clarification
- knowledge agent → create note from decision
- watcher agent → detect overdue task

### Kết luận
Agent domain là execution layer, project/task là object layer.

---

## 16. Relationship với Agent Admin

Agent Admin không nên bị nhầm với Agent Domain.

### Agent Domain
là model nghiệp vụ của agent.

### Agent Admin
là giao diện/quy trình quản trị để:
- xem agent definitions
- xem runtime states
- xem invocations/runs
- retry/cancel/inspect
- enable/disable agents

### Một câu chốt
> **Agent Domain là bản thể; Agent Admin là control plane.**

---

## 17. Relationship với n8n

n8n không phải agent, nhưng có thể là một execution/workflow substrate cho agent runs.

### Ví dụ
- coordinator decide → trigger n8n workflow
- n8n gọi API / integrations / tools
- output quay lại agent invocation result

### Kết luận
Agent domain và n8n có quan hệ chặt, nhưng không đồng nhất.

---

## 18. V1 implementation priority

Nếu build thật, nên ưu tiên trước:
1. `agent_definitions`
2. `agent_runtime_states`
3. `agent_invocations`
4. `agent_bindings`
5. capability + allowed_actions mapping

### Có thể để sau
- capability taxonomy quá giàu
- cost accounting per run cực chi tiết
- advanced scheduling/placement logic

---

## 19. One-line conclusion

**Agent Domain V1 của Dẹo Enterprise OS phải coi agent là actor thực thi có vai trò, capabilities, permissions, runtime state, bindings và invocation trace rõ ràng — đủ để đứng giữa chat/workflow frontstage và object/integration back-office một cách có cấu trúc.**
