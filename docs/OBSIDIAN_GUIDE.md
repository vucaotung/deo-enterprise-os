# Obsidian Vault — Hướng Dẫn Sử Dụng Hàng Ngày
**Version:** 1.2.0

---

## Triết Lý Dùng Vault Này

> **Vault = bộ nhớ ngoài của bạn.** Không cần nhớ, chỉ cần capture + link đúng chỗ.

3 nguyên tắc:
1. **Capture nhanh** → `00-inbox/` trước, phân loại sau
2. **Link mọi thứ** → `[[note]]` để tạo mạng lưới
3. **Review hàng tuần** → Inbox → đúng chỗ

---

## Cấu Trúc PARA

| Thư mục | Loại gì | Ví dụ |
|---------|---------|-------|
| `02-projects/` | Dự án đang làm (có deadline) | Website 5Balance Q2 |
| `03-areas/` | Lĩnh vực trách nhiệm (liên tục) | Finance, Tech, Business |
| `04-resources/` | Reference material dùng nhiều lần | Client profiles, SOPs |
| `05-archive/` | Xong rồi, không active nữa | Dự án cũ, notes lỗi thời |

---

## Workflow Hàng Ngày

### Sáng (~5 phút)
1. Mở Daily Note `06-journal/YYYY/YYYY-MM-DD.md` (tự tạo bởi system)
2. Điền: priorities hôm nay, meetings, focus
3. Pull vault: `Ctrl+P → Obsidian Git: Pull`

### Trong ngày
- Ý tưởng, thông tin mới → `00-inbox/` (Ctrl+N, lưu vào inbox)
- Task liên quan đến project → thêm vào note project tương ứng
- Quyết định quan trọng → ghi vào `decisions.md` trong project

### Tối (~10 phút)
1. Review inbox — phân loại notes mới
2. Cập nhật Daily Note: xong gì, blocked gì, insights
3. Push vault: `Ctrl+P → Obsidian Git: Push`

### Cuối tuần (~30 phút)
1. Review tất cả notes trong `00-inbox/` → move đúng chỗ
2. Update project notes
3. Check metrics: tasks done, decisions made

---

## Templates Chuẩn

### Daily Note Template
```markdown
---
title: "Daily {{date}}"
date: {{date}}
type: journal
tags: [journal]
---

## 🎯 Priorities Hôm Nay
- [ ] 
- [ ] 
- [ ] 

## 📅 Meetings / Calls

## 💡 Insights & Captures

## 📊 Review Cuối Ngày
**Done:** 
**Blocked:** 
**Tomorrow:** 
```

### Project Note Template
```markdown
---
title: "{{projectName}}"
date: {{date}}
type: project
status: active
tags: [project]
gdrive: "DEO-OS/02_PROJECTS/{{folderName}}"
related:
  - "[[client profile]]"
---

## 📌 Overview
**Client:** 
**Timeline:** 
**Budget:** 

## 🎯 Goals

## 📋 Tasks
- [ ] 

## 📝 Decisions Log
| Date | Decision | Reason |
|------|----------|--------|

## 📞 Meeting Notes

## 🔗 Links & Resources
```

### Client Profile Template
```markdown
---
title: "{{clientName}}"
date: {{date}}
type: client
status: active
tags: [client]
gdrive: "DEO-OS/01_CLIENTS/{{folderName}}"
---

## 📌 Info
**Company:** 
**Contact:** 
**Email:** 
**Phone:** 

## 🏢 Background

## 🤝 Relationship History

## 📂 Active Projects
- [[project-name]]

## 💡 Notes & Context
```

---

## Search & Query Tips

### Tìm kiếm nhanh
- `Ctrl+O` → Quick switcher (tìm note theo tên)
- `Ctrl+Shift+F` → Full text search
- `/api/brain/search` → Semantic search qua RAG (từ API)

### Dataview queries hữu ích

```dataview
-- Tất cả projects đang active
TABLE status, gdrive FROM "02-projects"
WHERE status = "active"
SORT date DESC
```

```dataview
-- Notes trong inbox chưa xử lý
LIST FROM "00-inbox"
SORT file.mtime DESC
```

---

## Kết Nối Với Dẹo Enterprise OS

Vault tự động nhận dữ liệu từ API:
- Khi tạo task mới → capture note vào inbox
- Khi agent hoàn thành task → update project note
- Daily note tự tạo lúc 6am mỗi ngày
- Client notes tự update khi có interaction mới

Để capture thủ công từ chat/Telegram:
```
/capture [nội dung]
```
→ Tự động tạo note trong `00-inbox/`

---

**Tài liệu liên quan:**
- `BRAIN_SETUP.md` — Setup vault lần đầu
- `VERSION_1.2_PLAN.md` — Kế hoạch tổng thể
