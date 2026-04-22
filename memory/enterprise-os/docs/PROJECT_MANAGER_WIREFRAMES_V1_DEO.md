# PROJECT_MANAGER_WIREFRAMES_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục tiêu: wireframe text-based cho module Project Manager / ERP core của Dẹo Enterprise OS.

---

## 1. Nguyên tắc wireframe
- Desktop-first
- Business clean
- Dễ scan trong 5 giây
- Sidebar cố định
- Topbar có search + quick create + context
- Main content ưu tiên card + table + drawer

---

## 2. Layout khung chung

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Topbar: Search | Company/Project Context | Quick Create | Alerts | Profile │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Sidebar       │ Main content                                                 │
│ - Dashboard   │                                                              │
│ - Projects    │                                                              │
│ - Tasks       │                                                              │
│ - Workers     │                                                              │
│ - Approvals   │                                                              │
│ - Activity    │                                                              │
│ - AI Jobs     │                                                              │
│ - Documents   │                                                              │
│ - Settings    │                                                              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 3. Screen 1 — Dashboard

### 3.1 Mục tiêu
Quản lý nhìn 5 giây là biết:
- hệ đang có gì nóng
- dự án nào cần chú ý
- task nào quá hạn
- approval nào đang chờ
- AI nào đang chạy/lỗi

### 3.2 Wireframe

```text
┌ Dashboard ───────────────────────────────────────────────────────────────────┐
│ Filters: [Company ▼] [Date range ▼] [Saved View ▼]                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ KPI Row                                                                      │
│ [Active Projects] [Open Tasks] [Overdue] [Blocked] [Pending Approvals]      │
│ [AI Jobs Running]                                                            │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ Priority Projects             │ Due Soon / Overdue Tasks                    │
│ - Project A | owner | due     │ - Task X | Project | assignee | overdue     │
│ - Project B | owner | risk    │ - Task Y | Project | due today              │
│ - Project C | progress        │ - Task Z | waiting approval                 │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ Activity Feed                 │ Approval Queue                              │
│ - A assigned task to B        │ - Approval #1 | summary | pending           │
│ - AI finished job on task     │ - Approval #2 | expires soon                │
│ - Document linked             │                                              │
├───────────────────────────────┼──────────────────────────────────────────────┤
│ Workload Snapshot             │ AI Operations                               │
│ - Manager 1: 12 open          │ - Aurora | running | task 123              │
│ - Staff 2: 7 open             │ - Agent X | failed | task 456              │
│ - Agent Aurora: 4 running     │ - Agent Y | waiting approval               │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

### 3.3 Quick actions
- + New Project
- + New Task
- + Assign Task
- + Approval Request
- + Run AI Job

---

## 4. Screen 2 — Projects List

### 4.1 Mục tiêu
Xem nhanh tất cả dự án, filter mạnh, mở detail nhanh.

### 4.2 Wireframe

```text
┌ Projects ────────────────────────────────────────────────────────────────────┐
│ Search [................]  Filters: [Status ▼] [Owner ▼] [Priority ▼]      │
│ View: [Cards] [Table]                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Cards/Table                                                                  │
│ [DA001] Website TMĐT                                                        │
│  owner: QL1 | status: active | due: 11/11 | progress: 56%                  │
│  open tasks: 8 | overdue: 2 | members: 5                                   │
│                                                                            │
│ [DA002] App todo cá nhân                                                   │
│  owner: QL2 | status: planning | due: 20/11 | progress: 12%                │
│  open tasks: 4 | overdue: 0 | members: 3                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Card actions
- Open detail
- Edit project
- Add task
- Change owner/status

---

## 5. Screen 3 — Project Detail

### 5.1 Mục tiêu
Là màn trung tâm của từng dự án.

### 5.2 Wireframe

```text
┌ Project Detail: DA001 - Website TMĐT ───────────────────────────────────────┐
│ Status: active   Priority: high   Owner: QL1   Due: 11/11   Progress: 56%   │
│ Actions: [Edit] [Add Task] [Add Member] [Link Doc] [Request Approval]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Tasks] [Members] [Activity] [Approvals] [Docs] [AI Jobs]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Overview                                                                     │
│ - Description                                                                │
│ - KPI mini cards: open, overdue, blocked, waiting approval                  │
│ - Member avatars                                                             │
│ - Risk/Health                                                                │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ Task Summary                  │ Recent Activity                             │
│ - To do: 4                    │ - Task assigned                             │
│ - In progress: 6              │ - Approval requested                        │
│ - Blocked: 1                  │ - AI job completed                          │
│ - Done: 12                    │ - Document updated                          │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

### 5.3 Task tab in Project Detail

```text
Filters: [Status ▼] [Assignee ▼] [Priority ▼]

| Task | Status | Assignee | Priority | Due | Approval | AI |
|------|--------|----------|----------|-----|----------|----|
| T1   | in_progress | NV1 | high | 09/04 | no  | no  |
| T2   | waiting_approval | QL1 | high | 08/04 | yes | no |
| T3   | queued | Aurora | normal | 10/04 | no | yes |
```

---

## 6. Screen 4 — Task Center

### 6.1 Mục tiêu
Nơi điều phối task toàn hệ.

### 6.2 Wireframe

```text
┌ Tasks ───────────────────────────────────────────────────────────────────────┐
│ Search [..............] Filters: [Project ▼] [Assignee ▼] [Status ▼]        │
│ [Priority ▼] [Due ▼] [Type ▼]  View: [Table] [Board]                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Table view                                                                    │
│ | Task | Project | Status | Assignee | Owner | Priority | Due | AI |        │
│ |------|---------|--------|----------|-------|----------|-----|----|        │
│ | ...                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Board view

```text
[new]          [triaged]        [in_progress]      [waiting_approval] [blocked]
- Task A       - Task B         - Task C           - Task D           - Task E
- Task ...                       - Task ...
```

### 6.4 Task drawer mở bên phải

```text
┌ Task Drawer ────────────────────────────────────────────────────────────────┐
│ Title                                                                        │
│ Status | Priority | Due | Project                                            │
│ Owner | Current Assignee                                                      │
│---------------------------------------------------------------------------   │
│ Description                                                                  │
│---------------------------------------------------------------------------   │
│ Tabs: [Comments] [Timeline] [Approvals] [Docs] [AI Jobs]                     │
│---------------------------------------------------------------------------   │
│ Actions: [Assign] [Change Status] [Request Approval] [Run AI Job]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Screen 5 — Workers

### 7.1 Mục tiêu
Hiển thị human và AI trong cùng hệ điều phối.

### 7.2 Wireframe

```text
┌ Workers ─────────────────────────────────────────────────────────────────────┐
│ Filters: [Type: all/human/ai] [Status ▼] [Role ▼]                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ | Name | Type | Role | Active Tasks | Overdue | Blocked | Last Seen |      │
│ |------|------|------|--------------|---------|---------|-----------|      │
│ | QL1  | human| PM   | 12           | 2       | 1       | 5m ago    |      │
│ | NV1  | human| Staff| 7            | 1       | 0       | now       |      │
│ | Aurora| ai  | Agent| 4 jobs       | -       | 1 fail  | now       |      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Worker detail
- profile summary
- current assignments
- completed tasks
- AI capability summary (nếu là AI)
- approvals involvement

---

## 8. Screen 6 — Approvals

### 8.1 Mục tiêu
Cho quản lý/admin xử lý queue duyệt thật nhanh.

### 8.2 Wireframe

```text
┌ Approvals ───────────────────────────────────────────────────────────────────┐
│ Filters: [Status ▼] [Approver ▼] [Type ▼] [Expires soon ☑]                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ | Summary | Related Object | Requested By | Approver | Status | Expires |  │
│ |---------|----------------|--------------|----------|--------|---------|  │
│ | ...                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Approval detail drawer
- summary
- related task/project/document
- request note
- timeline
- buttons: Approve / Reject / Need Info

---

## 9. Screen 7 — Activity

### 9.1 Mục tiêu
Feed toàn hệ, không cần click sâu vẫn hiểu chuyển động.

### 9.2 Wireframe

```text
┌ Activity ────────────────────────────────────────────────────────────────────┐
│ Filters: [All ▼] [Project ▼] [Worker ▼] [Date ▼]                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ 16:20  QL1 assigned Task A to NV1                                            │
│ 16:15  Aurora finished OCR job on Task PF-022                                │
│ 16:03  Admin approved document revision                                      │
│ 15:50  Project DA001 changed to at_risk                                      │
│ 15:40  Document linked to Task T-101                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Screen 8 — AI Jobs

### 10.1 Mục tiêu
Biến AI jobs thành thứ nhìn thấy được, quản được, debug được.

### 10.2 Wireframe

```text
┌ AI Jobs ─────────────────────────────────────────────────────────────────────┐
│ Filters: [Agent ▼] [Status ▼] [Project ▼] [Task ▼]                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ | Job | Agent | Task | Type | Status | Queued | Started | Finished |        │
│ |-----|-------|------|------|--------|--------|---------|----------|        │
│ | ...                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Job detail drawer
- linked task
- input summary
- logs
- outputs
- error message
- rerun / inspect / open task

---

## 11. Shared components cần build sớm
- StatusChip
- PriorityBadge
- DueBadge
- WorkerAvatar/WorkerPill
- KPIStatCard
- ActivityFeedItem
- ApprovalCard
- AgentJobStatusPill
- FilterBar
- DrawerDetailLayout
- EmptyState / ErrorState / LoadingState

---

## 12. UX flows quan trọng nhất

### 12.1 Flow: tạo project -> thêm member -> tạo task
1. user tạo project
2. add project members
3. tạo task từ project detail
4. assign task cho human/AI
5. task xuất hiện ở Task Center

### 12.2 Flow: task chờ approval
1. task được đẩy sang waiting_approval
2. approval record sinh ra
3. approval hiện ở Dashboard + Approvals
4. approver duyệt
5. activity log + task state update

### 12.3 Flow: AI job
1. từ task, user bấm Run AI Job
2. job sinh ở AI Jobs
3. AI xử lý
4. output/logs được link lại task
5. nếu cần, chuyển sang waiting_approval

---

## 13. Thứ tự dựng màn hợp lý
1. Dashboard
2. Projects List
3. Project Detail
4. Task Center
5. AI Jobs
6. Approvals
7. Workers
8. Activity

---

## 14. Chốt một câu

Wireframe của Project Manager cho Dẹo Enterprise OS phải giữ tinh thần:
- nhìn dễ dùng như demo dashboard/sheet
- nhưng thể hiện được cái lõi mạnh hơn hẳn: human + AI + approvals + audit + jobs.
