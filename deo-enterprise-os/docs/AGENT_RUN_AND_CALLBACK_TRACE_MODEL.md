# AGENT RUN AND CALLBACK TRACE MODEL

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa model trace V1 cho `agent runs`, `workflow dispatches`, `callbacks` và `result application`, để toàn bộ execution chain trong Dẹo Enterprise OS có thể debug, retry, inspect và audit được từ đầu tới cuối.

---

## 1. Tư duy lõi

Một hệ có agent + workflow + callbacks mà không có trace model rõ ràng sẽ nhanh chóng thành mớ spaghetti:
- không biết ai gọi ai
- không biết workflow nào chạy vì message nào
- callback về rồi nhưng không biết update object nào
- fail ở đâu cũng mù

### Một câu chốt
> **Execution trace phải được xem là hạ tầng cốt lõi, không phải tiện ích debug phụ.**

---

## 2. Chuỗi cần trace trong hệ này

Tối thiểu phải trace được chuỗi sau:

```text
user/system event
→ thread/project/task context
→ agent invocation/run
→ workflow dispatch (optional)
→ workflow run / callback
→ result application
→ output entity / thread event
```

---

## 3. Tại sao cần model riêng

### Để làm được
- inspect nguyên nhân fail
- retry đúng chỗ
- phân biệt lỗi agent vs lỗi workflow vs lỗi callback vs lỗi apply result
- audit tại sao object nào đó được tạo
- answer “ai/luồng nào đã gây ra hành động này?”

---

## 4. Thực thể trace chính

## A. `agent_invocations`
Mỗi lần agent được gọi để làm một objective.

## B. `workflow_dispatches`
Mỗi lần invocation quyết định dispatch sang n8n/workflow layer.

## C. `workflow_callbacks`
Mỗi callback/result event quay về từ workflow engine.

## D. `result_applications`
Mỗi lần Work OS apply kết quả vào thread/object layer.

### Kết luận
Trace chain nên được biểu diễn bằng nhiều thực thể riêng, không nhét tất cả vào một bảng log lộn xộn.

---

## 5. Invocation model

```ts
interface AgentInvocation {
  id: string;
  agent_id: string;
  trigger_type: 'manual' | 'mention' | 'command' | 'auto' | 'workflow';
  trigger_message_id?: string;

  invoked_by_type: 'human' | 'agent' | 'system';
  invoked_by_id?: string;

  context_type: 'thread' | 'project' | 'task' | 'client' | 'workspace' | 'general';
  context_id?: string;
  thread_id?: string;

  objective: string;
  expected_output_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

  error_stage?: 'agent_reasoning' | 'dispatch' | 'workflow' | 'callback' | 'result_application';
  error_message?: string;

  created_at: string;
  started_at?: string;
  completed_at?: string;
}
```

---

## 6. Workflow dispatch model

```ts
interface WorkflowDispatch {
  id: string;
  invocation_id: string;
  workflow_key: string;
  dispatch_mode: 'sync' | 'async' | 'scheduled' | 'webhook';
  execution_style: 'direct' | 'callback' | 'approval_required' | 'event_driven';

  request_payload_json: any;
  callback_url?: string;
  callback_token?: string;

  status: 'queued' | 'dispatched' | 'accepted' | 'failed';
  dispatch_error?: string;

  created_at: string;
  dispatched_at?: string;
}
```

---

## 7. Workflow callback model

```ts
interface WorkflowCallbackEvent {
  id: string;
  dispatch_id: string;
  invocation_id: string;
  workflow_key: string;

  callback_status: 'completed' | 'failed' | 'partial' | 'cancelled';
  output_summary?: string;
  output_payload_json?: any;
  error_message?: string;

  received_at: string;
}
```

---

## 8. Result application model

```ts
interface ResultApplication {
  id: string;
  invocation_id: string;
  callback_event_id?: string;

  application_target_type: 'thread' | 'project' | 'task' | 'clarification' | 'notebook' | 'crm' | 'finance' | 'other';
  application_target_id?: string;

  operation_type: 'append_message' | 'create_entity' | 'update_entity' | 'link_entity' | 'noop';
  status: 'pending' | 'applied' | 'failed';
  result_ref_type?: string;
  result_ref_id?: string;
  error_message?: string;

  created_at: string;
  applied_at?: string;
}
```

---

## 9. Correlation IDs phải có

Toàn hệ nên dùng correlation IDs nhất quán để nối các bước.

### Tối thiểu cần
- `thread_id`
- `trigger_message_id`
- `invocation_id`
- `dispatch_id`
- `workflow_key`
- `callback_event_id`
- `result_application_id`
- `result_entity_id`

### Nếu có thể
Thêm `trace_id` tổng cho toàn execution chain.

---

## 10. Error staging model

Lỗi nên được gắn stage rõ ràng.

## Stage 1 — Agent reasoning
Ví dụ:
- objective không rõ
- context assemble lỗi
- agent output invalid

## Stage 2 — Dispatch
Ví dụ:
- workflow key invalid
- workflow disabled
- dispatch request malformed

## Stage 3 — Workflow execution
Ví dụ:
- connector fail
- external API fail
- timeout / retry exhausted

## Stage 4 — Callback
Ví dụ:
- callback không tới
- payload callback sai contract
- auth callback fail

## Stage 5 — Result application
Ví dụ:
- callback ok nhưng create/update object fail
- thread append fail
- domain validation fail

---

## 11. Retry model

Retry phải biết retry ở lớp nào.

## Retry invocation
Dùng khi cần re-run lại từ đầu reasoning/dispatch.

## Retry dispatch
Dùng khi agent decision đúng rồi nhưng dispatch sang workflow fail.

## Retry workflow run
Dùng khi workflow step fail ở n8n/external systems.

## Retry result application
Dùng khi callback ok nhưng apply vào Work OS fail.

### Một câu chốt
> **Không phải mọi failure đều nên “retry toàn bộ”; trace model phải chỉ ra retry point phù hợp.**

---

## 12. Status transitions đề xuất

## Invocation
`queued → running → completed|failed|cancelled`

## Dispatch
`queued → dispatched → accepted|failed`

## Callback
`received(completed|failed|partial|cancelled)`

## Result application
`pending → applied|failed`

---

## 13. Minimal observability views nên có

## A. Invocation timeline
Cho 1 `invocation_id`, xem:
- trigger
- context
- dispatch
- callback
- result apply

## B. Workflow trace panel
Cho 1 `dispatch_id`, xem:
- workflow key
- request payload summary
- callback result
- downstream applications

## C. Object source trace
Cho 1 task/project/note, xem:
- nó được tạo từ invocation nào
- trigger message nào
- workflow nào tham gia

---

## 14. Example trace 1 — Create project from Telegram thread

```text
Message: @Dẹo tạo project cho job này
→ thread_id = th_001
→ invocation_id = inv_101 (project_agent)
→ dispatch_id = disp_201 (project.bootstrap.v1)
→ callback_event_id = cb_301 (completed)
→ result_application_id = app_401 (create project)
→ project_id = proj_501
→ thread message appended: "Đã tạo project..."
```

---

## 15. Example trace 2 — File extract pipeline

```text
Message: @Dẹo bóc PDF này giúp
→ invocation_id = inv_102 (knowledge_agent)
→ dispatch_id = disp_202 (file.ingest.extract.v1)
→ callback_event_id = cb_302 (completed with extracted text)
→ result_application_id = app_402 (append note draft to thread)
```

---

## 16. Example trace 3 — Failed finance workflow

```text
Message: @Dẹo check khoản chi này
→ invocation_id = inv_103 (finance_agent)
→ dispatch_id = disp_203 (finance.expense.capture.v1)
→ workflow fails at connector step
→ callback_event_id = cb_303 (failed)
→ invocation marked failed
→ error_stage = workflow
→ retry possible at workflow layer
```

---

## 17. Storage hints

Nếu build thật, nên có ít nhất các bảng:
- `agent_invocations`
- `workflow_dispatches`
- `workflow_callbacks`
- `result_applications`

### Có thể thêm về sau
- payload blob store riêng
- normalized event timeline table
- correlation analytics tables

---

## 18. Relationship với Agent Admin

Agent Admin cần đọc model này để:
- inspect invocation
- see failure stage
- retry đúng point
- trace result lineage

### Nói cách khác
Trace model là xương sống quan sát/debug của Agent Admin.

---

## 19. Relationship với n8n workflow registry

Workflow registry trả lời:
- workflow nào tồn tại và contract gì

Trace model trả lời:
- workflow đó đã được gọi lúc nào, vì sao, kết quả ra sao

### Một câu chốt
> **Registry = definition truth**  
> **Trace model = execution truth**

---

## 20. V1 implementation priority

Nếu build thực dụng, nên ưu tiên:
1. `agent_invocations`
2. `workflow_dispatches`
3. `workflow_callbacks`
4. `result_applications`
5. timeline query by invocation_id
6. retry actions gắn đúng stage

---

## 21. One-line conclusion

**Agent Run and Callback Trace Model V1 phải giúp toàn hệ trace được execution chain từ trigger ban đầu tới object cuối cùng, phân biệt rõ failure stage và retry point, để Dẹo Enterprise OS có thể debug, vận hành và audit agent-driven workflows một cách nghiêm túc thay vì mò trong bóng tối.**
