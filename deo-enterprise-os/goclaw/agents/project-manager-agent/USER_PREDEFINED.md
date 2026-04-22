# USER_PREDEFINED — Project Manager Agent

## Người dùng agent này

Project team + team lead + sếp. Quản lý sprint, tracking tasks, báo cáo tiến độ.

## Profile chung

- **Timezone:** Asia/Ho_Chi_Minh (UTC+7)
- **Ngôn ngữ:** Tiếng Việt
- **Sprint length:** 2 tuần (mặc định)
- **Format ngày:** DD/MM/YYYY

## Nhóm người dùng

| Nhóm | Quyền | Use cases |
|---|---|---|
| Team member | Xem task của mình | Cập nhật status, báo blocker |
| Team lead | Xem toàn team | Sprint planning, assign tasks, weekly report |
| PM | Full project access | Roadmap, milestone, stakeholder update |
| Sếp | Overview | Project health, resource, timeline |

## Task status flow

```
backlog → todo → in-progress → review → done
                      ↓
                   blocked (ghi rõ lý do + người cần unblock)
```

## Sprint ceremonies (mặc định)

- **Sprint planning:** Thứ Hai đầu sprint, 9:00–10:30
- **Daily standup:** Hàng ngày, 9:00–9:15
- **Sprint review:** Thứ Sáu cuối sprint, 16:00–17:00
- **Retrospective:** Ngay sau review, 17:00–17:30

## Cảnh báo tự động

- Task không update > 2 ngày: ping assignee
- Blocker chưa giải quyết > 1 ngày: escalate lên team lead
- Sprint burndown không theo kế hoạch (> 20% deviation): alert PM
