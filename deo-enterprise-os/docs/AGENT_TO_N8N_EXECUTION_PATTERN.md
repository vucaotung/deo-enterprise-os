# AGENT TO N8N EXECUTION PATTERN

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt pattern thực thi giữa `agent domain` và `n8n` trong Dẹo Enterprise OS, để rõ agent quyết định gì, n8n chạy gì, callback quay về đâu, và toàn bộ flow có traceability như thế nào.

---

## 1. Tư duy lõi

Agent và n8n không nên làm cùng một việc.

### Vai trò đúng
- **Agent**: hiểu ngữ cảnh, reason, chọn action, quyết định workflow nào cần chạy
- **n8n**: thực thi chuỗi bước automation/integration có cấu trúc

### Một câu chốt
> **Agent decides the work; n8n runs the flow.**

---

## 2. Tại sao cần execution pattern riêng

Nếu không chốt pattern này, hệ sẽ bị loạn ở các điểm:
- agent tự gọi lung tung các integration
- n8n tự ôm luôn business logic đáng ra agent phải quyết
- callback về thread/task/project không thống nhất
- khó debug khi workflow fail
- không biết object/result nào do agent nào kích hoạt

---

## 3. Kiến trúc tổng quát

## Frontstage
- Telegram/Zalo/web thread
- human interaction

## Decision layer
- coordinator agent
- specialist agent

## Execution bridge
- agent invocation record
- workflow dispatch record

## Execution substrate
- n8n workflow

## Callback/application layer
- update invocation status
- append thread event
- create/update object
- notify user/group

---

## 4. Pattern chuẩn nhất

## Step 1 — Trigger xuất hiện
Trigger có thể đến từ:
- user mention trong thread
- admin action
- workflow event
- scheduled event
- object state change

## Step 2 — Agent reasoning
Agent đọc context và quyết định:
- có cần workflow không
- workflow nào phù hợp
- objective của workflow là gì
- input payload nào cần gửi
- allowed actions là gì

## Step 3 — Dispatch sang n8n
Work OS tạo execution request và gọi workflow tương ứng trong n8n.

## Step 4 — n8n chạy flow
n8n thực hiện:
- API calls
- integrations
- transformations
- retries
- waits/approvals
- fan-out/fan-in steps

## Step 5 — Callback về Work OS
n8n gửi result/callback về hệ.

## Step 6 — Result application
Work OS:
- update `agent_invocation`
- append message/event vào thread
- create/update task/project/note/clarification nếu cần
- notify đúng context

---

## 5. Khi nào agent nên gọi n8n

## Nên gọi n8n khi
- action có nhiều bước integration
- cần gọi nhiều external systems
- cần retries/recoverability tốt
- cần scheduled/async flow
- cần human approval wait states
- cần ETL/data movement có cấu trúc

### Ví dụ
- tạo lead + folder + sheet row + notify group
- lưu file vào Drive rồi link lại project
- đồng bộ CRM ↔ Work OS ↔ email sequence
- nightly digest / sync / reminders

---

## 6. Khi nào KHÔNG cần n8n

## Không cần n8n khi
- chỉ cần trả lời chat
- chỉ cần tóm tắt ngắn
- chỉ cần draft text đơn giản
- chỉ cần tạo object nội bộ một bước rất nhỏ
- action quá nhỏ để đáng tạo workflow riêng

### Khi đó
Agent hoặc Work OS service layer có thể xử trực tiếp.

---

## 7. Phân loại execution patterns

## Pattern A — Sync inline execution
### Dùng khi
workflow ngắn, nhanh, ít step.

### Flow
- agent quyết định
- dispatch n8n
- đợi result nhanh
- trả kết quả về ngay thread/UI

### Ví dụ
- transform dữ liệu nhỏ
- gọi 1-2 external API đơn giản

---

## Pattern B — Async background execution
### Dùng khi
workflow dài hơn hoặc có nhiều step.

### Flow
- agent quyết định
- tạo invocation/run
- n8n chạy nền
- callback khi xong
- thread nhận system event hoặc summary

### Ví dụ
- research ingestion
- file processing pipeline
- multi-system provisioning

---

## Pattern C — Human-in-the-loop workflow
### Dùng khi
workflow cần duyệt/confirm giữa chừng.

### Flow
- agent quyết định workflow
- n8n chạy đến checkpoint
- tạo approval request
- chờ user/admin
- tiếp tục flow sau approval

### Ví dụ
- approve before sending external email
- approve expense/action before committing

---

## Pattern D — Scheduled / event-driven execution
### Dùng khi
không phải user trực tiếp gọi.

### Flow
- scheduled trigger hoặc external event
- n8n start flow
- nếu cần reasoning thì callback sang Work OS/agent
- result quay lại object/thread phù hợp

### Ví dụ
- weekly digest
- SLA monitor
- webhook từ external system

---

## 8. Dispatch contract đề xuất

Khi agent quyết định gọi n8n, payload nên có contract rõ.

```ts
interface WorkflowDispatchRequest {
  invocation_id: string;
  workflow_key: string;
  objective: string;

  initiated_by: {
    type: 'human' | 'agent' | 'system';
    id?: string;
  };

  context: {
    type: 'thread' | 'project' | 'task' | 'client' | 'general';
    id?: string;
    thread_id?: string;
    project_id?: string;
    task_id?: string;
  };

  payload: any;
  allowed_actions: string[];
  callback: {
    url: string;
    token?: string;
  };
}
```

---

## 9. Workflow registry idea

Work OS nên biết workflow nào tồn tại ở n8n và dùng cho mục đích gì.

### Ví dụ registry entry
```ts
interface WorkflowDefinition {
  key: string;
  name: string;
  description: string;
  trigger_mode: 'sync' | 'async' | 'scheduled' | 'webhook';
  suitable_for_agents: string[];
  input_schema_key?: string;
  output_schema_key?: string;
  is_enabled: boolean;
}
```

### Lợi ích
- agent không gọi workflow bằng tên tự chế
- admin kiểm soát workflow nào đang được dùng
- dễ trace mapping agent → workflow

---

## 10. Callback contract đề xuất

n8n callback về Work OS nên nhất quán.

```ts
interface WorkflowCallbackPayload {
  invocation_id: string;
  workflow_key: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  output_summary?: string;
  output_payload?: any;
  result_refs?: Array<{
    entity_type: string;
    entity_id: string;
  }>;
  error_message?: string;
  completed_at: string;
}
```

---

## 11. Result application rules

Sau khi callback về, Work OS mới là nơi quyết định apply kết quả vào domain nào.

### Có thể làm
- update `agent_invocation`
- append `system_event` vào thread
- append `agent_result` message
- create/update task
- create/update project note
- create/update clarification
- update CRM/finance objects nếu workflow đó thuộc domain tương ứng

### Không nên
để n8n tự viết lung tung vào mọi domain truth mà không qua API/contract của Work OS.

---

## 12. Traceability model

Mọi execution nên trace được chuỗi sau:

```text
thread/message/user action
→ agent invocation
→ workflow dispatch
→ n8n execution
→ callback result
→ object update / thread event
```

### Nên có IDs nối nhau
- `thread_id`
- `trigger_message_id`
- `invocation_id`
- `workflow_key`
- `callback_event_id`
- `result_entity_id`

---

## 13. Example flow 1 — Create task + notify + drive folder

## Bối cảnh
User trong Telegram group nói:
- `@Dẹo tạo project cho job này rồi set thư mục drive luôn`

## Flow đẹp
1. coordinator hiểu intent
2. Work OS tạo `agent_invocation`
3. agent chọn workflow `project.bootstrap.v1`
4. n8n chạy:
   - create Drive folder
   - create Google Sheet row / metadata record
   - notify relevant channel/system
5. callback về Work OS
6. Work OS create/update project + append result về thread

---

## 14. Example flow 2 — File processing pipeline

## Bối cảnh
User gửi PDF brief và bảo:
- `@Dẹo bóc nội dung rồi tạo task draft`

## Flow đẹp
1. coordinator hiểu action
2. n8n workflow `file.ingest.extract.v1` chạy:
   - fetch attachment
   - OCR/text extract
   - normalize output
3. callback result về Work OS
4. agent/coordinator dùng extracted content để draft tasks
5. draft task trả lại thread

---

## 15. Example flow 3 — Finance approval

## Bối cảnh
User muốn thực hiện một action cần duyệt.

## Flow đẹp
1. finance agent decide cần workflow approval
2. n8n tạo approval step
3. callback waiting state về Work OS/thread
4. user/admin approve
5. n8n tiếp tục flow
6. callback final result

---

## 16. Failure handling

n8n và Work OS phải có ranh giới lỗi rõ.

## Nếu workflow fail
Work OS nên:
- mark invocation = `failed`
- lưu `error_message`
- append system/agent result event về thread nếu phù hợp
- cho retry nếu policy cho phép

## Retry policy
- retry ở n8n cho step-level failures
- retry ở Work OS cho invocation-level decisions

---

## 17. Admin implications

### Agent Admin cần thấy
- agent nào gọi workflow nào
- invocation status
- objective / context / result

### Workflow Admin cần thấy
- workflow runs
- failure hotspots
- callback issues
- external integration health

### Tốt nhất
liên kết 2 view qua `invocation_id` / `workflow_key`, nhưng không gộp thành một cục mù mờ.

---

## 18. V1 implementation priority

Nếu build thật, nên ưu tiên:
1. `workflow registry` tối thiểu
2. `dispatch contract` từ Work OS sang n8n
3. `callback endpoint` từ n8n về Work OS
4. `invocation trace` linking
5. `2-3 workflows đầu tiên` thật sự hữu ích

### Workflow đầu tiên nên làm
- `project.bootstrap.v1`
- `file.ingest.extract.v1`
- `thread.summary.digest.v1` hoặc `task.followup.notify.v1`

---

## 19. One-line conclusion

**Pattern đúng giữa agent và n8n là: agent mang ngữ cảnh và quyết định workflow nào cần chạy, Work OS tạo invocation trace và dispatch contract, n8n thực thi flow nhiều bước/integrations, rồi callback kết quả về Work OS để apply lại vào thread và object layer một cách có kiểm soát.**
