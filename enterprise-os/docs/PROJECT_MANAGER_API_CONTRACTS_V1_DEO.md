# PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục tiêu: định nghĩa API contracts cho MVP module **Project Manager / ERP core** của Dẹo Enterprise OS.

---

## 1. Nguyên tắc API

### 1.1 Mục tiêu
API phải phục vụ được 3 lớp cùng lúc:
- web dashboard / PM UI
- local automation / worker / agent runtime
- future mobile/admin surfaces

### 1.2 Nguyên tắc thiết kế
- REST trước, không over-engineer
- JSON rõ, field naming nhất quán
- status/business semantics bám docs PM module
- pagination/filter/sort có từ đầu
- tách DTO hiển thị khỏi schema nội bộ khi cần

### 1.3 Base conventions
- Base path: `/api/v1`
- Content-Type: `application/json`
- Time format: ISO-8601 UTC (`2026-04-08T09:30:00Z`)
- IDs: UUID
- Enum values: lowercase snake_case hoặc text ổn định

---

## 2. Envelope conventions

## 2.1 Success response
```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

## 2.2 Error response
```json
{
  "ok": false,
  "error": {
    "code": "task_not_found",
    "message": "Task not found",
    "details": {}
  }
}
```

## 2.3 Pagination meta
```json
{
  "ok": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 154,
    "hasNext": true
  }
}
```

---

## 3. Shared query parameters

### 3.1 Pagination
- `page`
- `pageSize`

### 3.2 Sorting
- `sortBy`
- `sortDir=asc|desc`

### 3.3 Filtering
Tuỳ resource, hỗ trợ:
- `status`
- `priority`
- `projectId`
- `workerId`
- `companyId`
- `q`
- `from`
- `to`

---

## 4. Dashboard APIs

## 4.1 GET `/api/v1/dashboard/summary`
### Mục đích
Lấy KPI tổng quan cho dashboard.

### Response
```json
{
  "ok": true,
  "data": {
    "activeProjects": 12,
    "openTasks": 84,
    "overdueTasks": 9,
    "blockedTasks": 3,
    "pendingApprovals": 4,
    "runningAiJobs": 6
  }
}
```

---

## 4.2 GET `/api/v1/dashboard/priority-projects`
### Query
- `limit`
- `companyId`

### Response item
```json
{
  "id": "uuid",
  "code": "DA001",
  "name": "Website TMĐT",
  "status": "active",
  "priority": "high",
  "owner": {
    "id": "uuid",
    "displayName": "QL1"
  },
  "dueDate": "2026-04-30",
  "progressPercent": 56,
  "openTasks": 8,
  "overdueTasks": 2,
  "healthStatus": "at_risk"
}
```

---

## 4.3 GET `/api/v1/dashboard/tasks-due`
### Query
- `window=today|3d|7d`
- `companyId`
- `includeOverdue=true|false`

### Response
List task cards cho due soon / overdue widget.

---

## 4.4 GET `/api/v1/dashboard/approvals`
### Query
- `limit`
- `companyId`

### Response
List approvals pending/expiring soon.

---

## 4.5 GET `/api/v1/dashboard/activity`
### Query
- `limit`
- `companyId`
- `projectId`

### Response
Recent activity feed items.

---

## 4.6 GET `/api/v1/dashboard/workload`
### Query
- `companyId`

### Response
```json
{
  "ok": true,
  "data": {
    "humans": [
      {
        "workerId": "uuid",
        "displayName": "QL1",
        "openTasks": 12,
        "overdueTasks": 2,
        "blockedTasks": 1
      }
    ],
    "aiAgents": [
      {
        "workerId": "uuid",
        "displayName": "Aurora",
        "runningJobs": 4,
        "failedJobs": 1,
        "waitingApprovalJobs": 1
      }
    ]
  }
}
```

---

## 4.7 GET `/api/v1/dashboard/ai-ops`
### Mục đích
Widget riêng cho AI operations.

### Response
- running jobs
- failed recent jobs
- waiting approval jobs

---

## 5. Projects APIs

## 5.1 GET `/api/v1/projects`
### Query
- `page`
- `pageSize`
- `q`
- `companyId`
- `status`
- `priority`
- `ownerWorkerId`
- `sortBy`
- `sortDir`

### Response item
```json
{
  "id": "uuid",
  "code": "DA001",
  "name": "Website TMĐT",
  "description": "...",
  "status": "active",
  "priority": "high",
  "owner": {
    "id": "uuid",
    "displayName": "QL1"
  },
  "startDate": "2026-04-01",
  "dueDate": "2026-04-30",
  "progressPercent": 56,
  "openTasks": 8,
  "overdueTasks": 2,
  "memberCount": 5,
  "healthStatus": "at_risk"
}
```

---

## 5.2 POST `/api/v1/projects`
### Request
```json
{
  "companyId": "uuid",
  "code": "DA001",
  "name": "Website TMĐT",
  "description": "...",
  "priority": "high",
  "ownerWorkerId": "uuid",
  "startDate": "2026-04-01",
  "dueDate": "2026-04-30"
}
```

### Response
Created project detail.

---

## 5.3 GET `/api/v1/projects/:projectId`
### Response
```json
{
  "ok": true,
  "data": {
    "project": {
      "id": "uuid",
      "code": "DA001",
      "name": "Website TMĐT",
      "description": "...",
      "status": "active",
      "priority": "high",
      "owner": { "id": "uuid", "displayName": "QL1" },
      "startDate": "2026-04-01",
      "dueDate": "2026-04-30",
      "progressPercent": 56,
      "healthStatus": "at_risk"
    },
    "summary": {
      "openTasks": 8,
      "blockedTasks": 1,
      "overdueTasks": 2,
      "pendingApprovals": 1,
      "runningAiJobs": 2
    }
  }
}
```

---

## 5.4 PATCH `/api/v1/projects/:projectId`
### Mục đích
Update partial.

### Request fields có thể sửa
- `name`
- `description`
- `status`
- `priority`
- `ownerWorkerId`
- `startDate`
- `dueDate`
- `healthStatus`

---

## 5.5 GET `/api/v1/projects/:projectId/members`
### Response
```json
[
  {
    "workerId": "uuid",
    "displayName": "QL1",
    "workerType": "human",
    "membershipRole": "manager"
  }
]
```

---

## 5.6 POST `/api/v1/projects/:projectId/members`
### Request
```json
{
  "workerId": "uuid",
  "membershipRole": "contributor"
}
```

---

## 5.7 DELETE `/api/v1/projects/:projectId/members/:workerId`
### Mục đích
Remove member khỏi project.

---

## 5.8 GET `/api/v1/projects/:projectId/activity`
### Response
Project activity feed.

---

## 5.9 GET `/api/v1/projects/:projectId/approvals`
### Response
Approvals liên quan project.

---

## 5.10 GET `/api/v1/projects/:projectId/documents`
### Response
Documents linked vào project.

---

## 5.11 GET `/api/v1/projects/:projectId/ai-jobs`
### Response
AI jobs linked tới tasks thuộc project.

---

## 6. Tasks APIs

## 6.1 GET `/api/v1/tasks`
### Query
- `page`
- `pageSize`
- `q`
- `companyId`
- `projectId`
- `status`
- `priority`
- `assigneeWorkerId`
- `ownerWorkerId`
- `dueWindow=today|3d|7d|overdue`
- `view=table|board`
- `sortBy`
- `sortDir`

### Response item
```json
{
  "id": "uuid",
  "title": "Thiết kế giao diện",
  "project": {
    "id": "uuid",
    "code": "DA001",
    "name": "Website TMĐT"
  },
  "status": "in_progress",
  "priority": "high",
  "owner": { "id": "uuid", "displayName": "QL1" },
  "currentAssignee": { "id": "uuid", "displayName": "NV1", "workerType": "human" },
  "dueAt": "2026-04-10T10:00:00Z",
  "requiresApproval": false,
  "hasAiJob": true,
  "updatedAt": "2026-04-08T09:00:00Z"
}
```

---

## 6.2 POST `/api/v1/tasks`
### Request
```json
{
  "companyId": "uuid",
  "projectId": "uuid",
  "parentTaskId": null,
  "title": "Thiết kế giao diện",
  "description": "...",
  "taskType": "design",
  "priority": "high",
  "dueAt": "2026-04-10T10:00:00Z",
  "ownerWorkerId": "uuid",
  "currentAssigneeWorkerId": "uuid",
  "requiresApproval": false
}
```

---

## 6.3 GET `/api/v1/tasks/:taskId`
### Response
```json
{
  "ok": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "Thiết kế giao diện",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "dueAt": "2026-04-10T10:00:00Z",
      "owner": { "id": "uuid", "displayName": "QL1" },
      "currentAssignee": { "id": "uuid", "displayName": "NV1", "workerType": "human" },
      "project": { "id": "uuid", "code": "DA001", "name": "Website TMĐT" },
      "requiresApproval": false,
      "closedAt": null
    }
  }
}
```

---

## 6.4 PATCH `/api/v1/tasks/:taskId`
### Fields có thể sửa
- `title`
- `description`
- `status`
- `priority`
- `dueAt`
- `ownerWorkerId`
- `currentAssigneeWorkerId`
- `requiresApproval`

---

## 6.5 POST `/api/v1/tasks/:taskId/assign`
### Mục đích
Assign/reassign task.

### Request
```json
{
  "assignedToWorkerId": "uuid",
  "assignmentType": "executor"
}
```

### Response
- task snapshot updated
- assignment record created

---

## 6.6 POST `/api/v1/tasks/:taskId/status`
### Request
```json
{
  "status": "waiting_approval",
  "note": "Ready for review"
}
```

### Side effects
- ghi `task_events`
- có thể sinh approval nếu business rule yêu cầu

---

## 6.7 GET `/api/v1/tasks/:taskId/comments`
### Response
List comments.

---

## 6.8 POST `/api/v1/tasks/:taskId/comments`
### Request
```json
{
  "body": "Đã cập nhật bản thiết kế mới",
  "visibility": "internal"
}
```

---

## 6.9 GET `/api/v1/tasks/:taskId/timeline`
### Response
Merge từ `task_events`, comments, approvals, AI jobs liên quan.

---

## 6.10 GET `/api/v1/tasks/:taskId/documents`
### Response
Documents linked vào task.

---

## 6.11 GET `/api/v1/tasks/:taskId/approvals`
### Response
Approvals linked vào task.

---

## 6.12 GET `/api/v1/tasks/:taskId/ai-jobs`
### Response
AI jobs linked vào task.

---

## 7. Workers APIs

## 7.1 GET `/api/v1/workers`
### Query
- `page`
- `pageSize`
- `q`
- `workerType=human|ai`
- `status`
- `role`
- `projectId`

### Response item
```json
{
  "id": "uuid",
  "displayName": "Aurora",
  "workerType": "ai",
  "roleName": "Personal Assistant",
  "status": "active",
  "email": null,
  "chatIdentity": "zalo:...",
  "openTasks": 4,
  "overdueTasks": 0,
  "blockedTasks": 1,
  "runningJobs": 2,
  "lastSeenAt": "2026-04-08T09:20:00Z"
}
```

---

## 7.2 GET `/api/v1/workers/:workerId`
### Response
Worker detail + subtype details.

---

## 7.3 GET `/api/v1/workers/:workerId/tasks`
### Query
- `status`
- `role=owner|assignee`

### Response
Assigned/open/completed tasks.

---

## 7.4 GET `/api/v1/workers/:workerId/workload`
### Response
```json
{
  "ok": true,
  "data": {
    "openTasks": 12,
    "overdueTasks": 2,
    "blockedTasks": 1,
    "waitingApprovalTasks": 3,
    "runningJobs": 0
  }
}
```

---

## 8. Approvals APIs

## 8.1 GET `/api/v1/approvals`
### Query
- `page`
- `pageSize`
- `status`
- `approverWorkerId`
- `approvalType`
- `projectId`
- `taskId`
- `expiresSoon=true|false`

### Response item
```json
{
  "id": "uuid",
  "approvalType": "task_review",
  "summary": "Duyệt bản thiết kế homepage",
  "status": "pending",
  "requestedAt": "2026-04-08T08:00:00Z",
  "expiresAt": "2026-04-09T08:00:00Z",
  "requestedBy": { "id": "uuid", "displayName": "NV1" },
  "approver": { "id": "uuid", "displayName": "QL1" },
  "task": { "id": "uuid", "title": "Thiết kế homepage" }
}
```

---

## 8.2 POST `/api/v1/approvals`
### Request
```json
{
  "approvalType": "task_review",
  "companyId": "uuid",
  "projectId": "uuid",
  "taskId": "uuid",
  "requestedByWorkerId": "uuid",
  "approverWorkerId": "uuid",
  "summary": "Duyệt bản thiết kế homepage",
  "expiresAt": "2026-04-09T08:00:00Z"
}
```

---

## 8.3 GET `/api/v1/approvals/:approvalId`
### Response
Approval detail + steps + timeline.

---

## 8.4 POST `/api/v1/approvals/:approvalId/approve`
### Request
```json
{
  "note": "OK triển khai"
}
```

---

## 8.5 POST `/api/v1/approvals/:approvalId/reject`
### Request
```json
{
  "note": "Cần chỉnh lại layout phần hero"
}
```

---

## 8.6 POST `/api/v1/approvals/:approvalId/request-info`
### Request
```json
{
  "note": "Thiếu file Figma final"
}
```

---

## 9. Activity APIs

## 9.1 GET `/api/v1/activity`
### Query
- `page`
- `pageSize`
- `objectType`
- `projectId`
- `taskId`
- `workerId`
- `from`
- `to`

### Response item
```json
{
  "id": "uuid",
  "createdAt": "2026-04-08T09:15:00Z",
  "actionType": "task_assigned",
  "summary": "QL1 giao task Thiết kế homepage cho NV1",
  "actor": { "id": "uuid", "displayName": "QL1" },
  "objectType": "task",
  "objectId": "uuid",
  "payload": {}
}
```

---

## 10. AI Jobs APIs

## 10.1 GET `/api/v1/ai-jobs`
### Query
- `page`
- `pageSize`
- `status`
- `agentWorkerId`
- `projectId`
- `taskId`
- `jobType`

### Response item
```json
{
  "id": "uuid",
  "jobType": "design_review",
  "status": "running",
  "priority": "normal",
  "queuedAt": "2026-04-08T09:00:00Z",
  "startedAt": "2026-04-08T09:02:00Z",
  "finishedAt": null,
  "agent": { "id": "uuid", "displayName": "Aurora" },
  "task": { "id": "uuid", "title": "Thiết kế homepage" },
  "errorMessage": null
}
```

---

## 10.2 POST `/api/v1/tasks/:taskId/ai-jobs`
### Mục đích
Tạo AI job từ task.

### Request
```json
{
  "agentWorkerId": "uuid",
  "jobType": "design_review",
  "priority": "normal",
  "inputPayload": {
    "instruction": "Review homepage wireframe"
  }
}
```

---

## 10.3 GET `/api/v1/ai-jobs/:jobId`
### Response
Job detail.

---

## 10.4 GET `/api/v1/ai-jobs/:jobId/logs`
### Response
List run logs.

---

## 10.5 GET `/api/v1/ai-jobs/:jobId/outputs`
### Response
List outputs.

---

## 10.6 POST `/api/v1/ai-jobs/:jobId/cancel`
### Mục đích
Cancel job đang queue/running nếu policy cho phép.

---

## 11. Documents APIs (MVP lite)

## 11.1 GET `/api/v1/documents`
### Query
- `projectId`
- `taskId`
- `documentType`

---

## 11.2 POST `/api/v1/documents`
### Request
```json
{
  "companyId": "uuid",
  "projectId": "uuid",
  "taskId": "uuid",
  "title": "Wireframe homepage",
  "documentType": "design",
  "driveUrl": "https://...",
  "driveFileId": "..."
}
```

---

## 11.3 GET `/api/v1/documents/:documentId`
### Response
Document detail + versions.

---

## 12. Notifications APIs (MVP lite)

## 12.1 GET `/api/v1/notifications`
### Query
- `recipientWorkerId`
- `status`
- `channel`

---

## 12.2 POST `/api/v1/notifications/:notificationId/read`
### Mục đích
Mark as read.

---

## 13. Search / quick create helpers

## 13.1 GET `/api/v1/search`
### Query
- `q`
- `types=projects,tasks,workers,documents`

### Response
Grouped lightweight search results.

---

## 13.2 POST `/api/v1/quick-create`
### Mục đích
Phục vụ topbar quick create.

### Request
```json
{
  "type": "task",
  "payload": {
    "projectId": "uuid",
    "title": "Review wireframe"
  }
}
```

---

## 14. DTO notes cho frontend

### 14.1 Frontend-friendly objects
Frontend không nên kéo raw schema mọi lúc.
Cần DTO rõ cho:
- ProjectCardDTO
- TaskRowDTO
- WorkerRowDTO
- ApprovalCardDTO
- ActivityFeedItemDTO
- AiJobRowDTO

### 14.2 Derived fields nên trả từ API
Đừng bắt frontend tự tính hết:
- `progressPercent`
- `openTasks`
- `overdueTasks`
- `memberCount`
- `hasAiJob`
- `healthStatus`
- `runningJobs`

---

## 15. Error codes gợi ý

### Common
- `validation_error`
- `not_found`
- `forbidden`
- `conflict`
- `internal_error`

### Resource-specific
- `project_not_found`
- `task_not_found`
- `worker_not_found`
- `approval_not_found`
- `ai_job_not_found`
- `invalid_status_transition`
- `approval_already_decided`
- `worker_not_project_member`
- `agent_not_available`

---

## 16. API build priority

### Ưu tiên 1
- dashboard/summary
- projects list/detail
- tasks list/detail/create/update
- assign task
- task status update

### Ưu tiên 2
- approvals list/detail/approve/reject
- ai-jobs list/detail/create/logs/outputs
- workers list/detail/workload

### Ưu tiên 3
- activity feed
- documents lite
- notifications
- search/quick-create

---

## 17. Chốt một câu

API v1 cho Project Manager của Dẹo Enterprise OS phải đủ để build:
- dashboard điều hành
- project/task center
- worker overview
- approval flow
- AI jobs visibility

Không cần ôm cả thế giới, nhưng phải làm nổi bật điểm khác biệt cốt lõi của Dẹo OS:
**human + AI cùng làm việc trên một task/approval/activity system.**
