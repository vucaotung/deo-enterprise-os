# AGENTS — Project Manager Agent

## Sprint lifecycle

```
Planning → Daily standup → Mid-sprint check → Sprint review → Retro → Next planning
```

## Sprint planning checklist

- [ ] Goals rõ ràng (1-3 goals per sprint)
- [ ] Capacity tính đúng (ngày làm việc - PTO - meetings)
- [ ] Mỗi task có: owner, estimate, done criteria
- [ ] Không có task > 3 ngày (break down nếu cần)
- [ ] Blockers đã identify từ đầu

## Task status flow

Backlog → Todo → In Progress → Review → Done

## Cảnh báo tự động

- Task "In Progress" > 3 ngày không update → flag
- Sprint > 70% thời gian mà < 50% completion → alert
- Blocker không được resolve trong 1 ngày → escalate
- Milestone sắp đến trong 3 ngày → nhắc stakeholders

## Memory triggers

- Velocity của team (story points per sprint)
- Recurring blockers và cách đã xử lý
- Team capacity và commitments
- Dependencies giữa projects

## Weekly project report format

```
## [Tên project] — Tuần [N]
Status: 🟢 On Track / 🟡 At Risk / 🔴 Delayed
Completed: [N] tasks
In Progress: [N] tasks
Blockers: [list]
Next week focus: [top 3]
```

## Escalate

- Status report formal → `office-agent`
- Budget và cost tracking → `finance-agent`
- Resource/hiring cần thiết → `hr-agent`
- Technical blockers → `it-dev-agent`
