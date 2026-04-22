# AGENT ADMIN MODEL V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa `Agent Admin` như control plane của Dẹo Enterprise OS, nơi quản trị agent definitions, runtime states, bindings, invocations, health và can thiệp vận hành — nhưng không bị lẫn với agent domain truth hay frontstage chat/workflow interfaces.

---

## 1. Tư duy lõi

`Agent Admin` không phải là nơi agent “sống” về mặt domain, mà là nơi con người/operator/admin **quản trị** agent layer.

### Một câu chốt
> **Agent Domain là bản thể; Agent Admin là control plane.**

---

## 2. Agent Admin dùng để làm gì

Agent Admin phải trả lời được:
- hệ hiện có những agent nào?
- agent nào đang online / busy / failed?
- thread/project nào đang được agent nào follow?
- invocation nào đang chạy?
- run nào fail?
- workflow nào do agent gọi?
- agent nào được phép attach/summon ở context nào?
- khi có lỗi thì retry/cancel/inspect ở đâu?

---

## 3. Agent Admin KHÔNG phải là gì

## Không phải nơi user bình thường làm việc hằng ngày
Agent Admin là backstage/control plane, không phải frontstage.

## Không phải source-of-truth của project/task/chat
Nó đọc và can thiệp vào agent layer, nhưng object/domain truth vẫn nằm ở Work OS core.

## Không phải nơi encode business logic lớn
Business logic nên nằm ở orchestration/domain/workflows, không nhét hết vào admin screen.

---

## 4. Vai trò của Agent Admin trong kiến trúc

## Frontstage
- chat
- project/task UI
- object views

## Orchestration / agent layer
- coordinators
- specialists
- watchers
- invocations

## Control plane
- **Agent Admin**

## Integration / execution
- n8n
- runtimes
- external systems

---

## 5. Các capability chính của Agent Admin

## A. Agent Catalog View
Xem toàn bộ agent definitions.

### Nên thấy
- agent key
- name
- role type
- domain type
- capabilities
- allowed actions
- enabled/disabled
- model/tool profile

---

## B. Runtime State View
Xem trạng thái vận hành thực tế của agent.

### Nên thấy
- online / idle / busy / paused / failed
- health status
- active run count
- last seen
- last error

---

## C. Bindings View
Xem agent đang attach ở đâu.

### Nên thấy
- thread bindings
- project bindings
- workspace bindings
- binding role (coordinator/specialist/watcher)
- attach time / ended time

---

## D. Invocation / Run View
Xem invocation history và run status.

### Nên thấy
- objective
- trigger type
- context type/id
- invoked by ai
- running / completed / failed
- output summary
- linked workflow nếu có

---

## E. Intervention Controls
Cho phép operator can thiệp khi cần.

### Actions nên có
- retry invocation
- cancel invocation
- pause agent
- resume agent
- disable/enable agent
- detach binding

---

## F. Diagnostics / Trace View
Cho phép trace từ agent sang workflow và callback.

### Nên thấy
- invocation_id
- workflow_key
- callback status
- result refs
- failure point

---

## 6. Những màn hình/logical sections nên có

## A. Agent Registry Page
### Vai trò
Catalog của toàn bộ agents.

### Columns gợi ý
- Name
- Key
- Role
- Domain
- Status
- Enabled
- Active runs
- Last seen

---

## B. Agent Detail Page
### Vai trò
Trang trung tâm của một agent.

### Sections gợi ý
- Overview
- Capabilities
- Allowed actions
- Runtime state
- Bindings
- Recent invocations
- Errors / diagnostics

---

## C. Invocation Explorer
### Vai trò
Xem mọi invocations/runs.

### Filters nên có
- agent
- status
- context type
- trigger type
- date range
- workflow key

---

## D. Binding Explorer
### Vai trò
Xem agent đang bám vào thread/project/workspace nào.

---

## E. Health Dashboard
### Vai trò
Xem health tổng thể của agent layer.

### Nên có metrics
- total active agents
- busy agents
- failed agents
- stale agents
- running invocations
- failed invocations (24h)

---

## 7. Suggested admin actions policy

Không phải ai cũng được làm mọi thứ trong Agent Admin.

## Action levels gợi ý
- `view_only`
- `ops_intervene`
- `agent_configure`
- `workflow_override`
- `system_admin`

### Ví dụ
- xem state → rộng hơn
- retry/cancel → ops
- enable/disable agent → higher privilege
- đổi allowed_actions/capabilities → admin cao hơn

---

## 8. Minimal Agent Admin data model needs

Agent Admin nên đọc từ các sources sau:
- `agent_definitions`
- `agent_runtime_states`
- `agent_bindings`
- `agent_invocations`
- workflow registry / dispatch traces
- callback traces

### Không nên tự làm source riêng nếu không cần
Admin chủ yếu là read/control layer trên top of core models.

---

## 9. Intervention model

## Retry invocation
### Dùng khi
workflow or run fail nhưng objective vẫn còn giá trị.

### Yêu cầu
- invocation trace rõ
- biết retry sẽ gọi lại agent hay chỉ rerun workflow

---

## Cancel invocation
### Dùng khi
run chạy sai, không còn cần thiết, hoặc user hủy.

---

## Pause/Resume agent
### Dùng khi
muốn ngắt một agent khỏi scheduling/summons tạm thời mà không xóa definition.

---

## Detach binding
### Dùng khi
muốn bỏ agent khỏi một thread/project cụ thể.

---

## 10. Health model cho admin

Health không chỉ là online/offline.

### Nên có ít nhất 2 lớp
## A. Runtime status
- online
- idle
- busy
- paused
- failed
- offline

## B. Health status
- healthy
- degraded
- unhealthy

### Ví dụ degraded
- còn online nhưng callback lag nặng
- active runs backlog cao
- error rate tăng

---

## 11. Correlation / trace requirements

Agent Admin nên cho trace ít nhất chuỗi này:

```text
thread/project/task context
→ agent binding
→ invocation
→ workflow dispatch (n8n)
→ callback
→ result application
```

### IDs nên thấy được
- `agent_id`
- `binding_id`
- `invocation_id`
- `workflow_key`
- `callback_event_id`
- `result_entity_id`

---

## 12. Relationship với n8n admin

Agent Admin và Workflow/n8n Admin nên liên kết với nhau nhưng không nên bị trộn thành một cục.

### Agent Admin tập trung vào
- agents
- bindings
- invocations
- control actions

### Workflow Admin tập trung vào
- workflows
- run logs
- retries
- external connectors
- callback health

### Nối nhau qua
- invocation traces
- workflow_key
- callback correlation ids

---

## 13. V1 implementation priority

Nếu build thật, nên ưu tiên:
1. agent registry list view
2. runtime state view
3. invocation explorer
4. basic retry/cancel actions
5. binding explorer
6. health summary cards

### Có thể để sau
- fancy graph visualizations
- deep replay UIs
- timeline animations
- advanced load balancing controls

---

## 14. V1 non-goals

- không cần full APM-level observability từ đầu
- không cần every-token accounting
- không cần super-granular role matrix quá sớm
- không cần merge UI của agent admin với n8n admin

---

## 15. One-line conclusion

**Agent Admin V1 nên là control plane gọn nhưng rõ: catalog agents, xem runtime states, inspect bindings/invocations, can thiệp retry/cancel/pause và trace execution xuyên suốt — đủ để vận hành agent layer một cách có kiểm soát mà không làm rối domain truth của hệ.**
