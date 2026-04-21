# GoClaw Agents Registry — Dẹo Enterprise OS

> Danh sách tất cả agents cần add vào GoClaw cho hệ thống Enterprise Human-AI Hybrid OS.
> Mỗi agent có key, type, purpose, tools, channels, và context files cần upload.

---

## Tổng quan

| Key | Tên | Type | Phase | Channels | Mức độ ưu tiên |
|---|---|---|---|---|---|
| `enterprise-assistant` | Enterprise Assistant | Predefined | Phase 0 | Telegram, Zalo | 🔴 Critical |
| `task-manager` | Task Manager | Predefined | Phase 1 | Telegram, Zalo | 🔴 Critical |
| `ops-admin` | Ops Admin | Open | Phase 1 | Telegram | 🟠 High |
| `van-phong-agent` | Văn Phòng Agent | Predefined | Phase 1 | Telegram, Zalo, Internal | 🟠 High |
| `report-agent` | Report Agent | Predefined | Phase 2 | Internal / Web | 🟠 High |
| `crm-agent` | CRM Agent | Predefined | Phase 4 | Telegram, Zalo | 🟡 Medium |
| `finance-agent` | Finance Agent | Predefined | Phase 6 | Telegram, Zalo | 🟡 Medium |
| `attendance-agent` | Attendance Agent | Predefined | Phase 5 | Telegram, Zalo | 🟡 Medium |
| `knowledge-agent` | Knowledge Agent | Predefined | Phase 7 | Telegram, Zalo, Web | 🟡 Medium |
| `helpdesk-agent` | Helpdesk Agent | Predefined | Phase 7 | Telegram, Zalo | 🟡 Medium |
| `dream-agent` | Dream / Reflection Agent | Predefined | Phase 3 | Internal (cron only) | 🟢 Normal |

---

## Agent 1 — Enterprise Assistant

**Key:** `enterprise-assistant`
**Type:** Predefined Agent
**Phase:** 0 (setup ngay khi GoClaw deploy)
**Mô tả:** Agent chính, đa năng. Người dùng tương tác hàng ngày — tạo task, hỏi status, nhận briefing, v.v.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### LLM
- Model: `claude-sonnet-4-6` (default)
- Extended thinking: `false` (bật cho complex queries nếu cần)

### MCP Tools dùng (từ Enterprise OS)
- `eos_create_task`
- `eos_update_task_status`
- `eos_query_tasks`
- `eos_add_task_comment`
- `eos_list_projects`
- `eos_query_project`
- `eos_create_reminder`
- `eos_get_dashboard_summary`
- `eos_register_drive_artifact`
- `eos_log_agent_action`

### Built-in GoClaw Tools
- `memory_search` — tìm trong L0/L1/L2
- `vault_search` — tìm trong Knowledge Vault
- `vault_link` — tạo liên kết giữa documents
- `web_search` — tìm kiếm web khi cần
- `spawn` — delegate sang specialized agents

### Context Files cần upload
```
SOUL.md        → personality, values, operating principles
IDENTITY.md    → tên, ngôn ngữ, tone, domain
AGENTS.md      → biết các agent khác + khi nào delegate
TOOLS.md       → (managed via Dashboard, không phải file)
```

### Cron Jobs gắn với agent này
- `morning-briefing` — 8:00 weekdays
- (Dream agent xử lý reflection riêng)

---

## Agent 2 — Task Manager

**Key:** `task-manager`
**Type:** Predefined Agent
**Phase:** 1 (sau khi MCP bridge hoạt động)
**Mô tả:** Chuyên sâu về task và project management. Được delegate từ Enterprise Assistant khi cần xử lý phức tạp về tasks — bulk update, status review, assignment.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### LLM
- Model: `claude-sonnet-4-6`

### MCP Tools dùng
- `eos_create_task` (với bulk support)
- `eos_update_task_status`
- `eos_query_tasks`
- `eos_add_task_comment`
- `eos_list_projects`
- `eos_query_project`
- `eos_create_reminder`
- `eos_get_dashboard_summary`

### Built-in GoClaw Tools
- `memory_search`
- `vault_search`
- `team_task_dispatch` — delegate subagents cho parallel task processing

### Use Cases
- "Review tất cả task overdue của team"
- "Tạo 5 tasks từ meeting notes này"
- "Assign lại tasks của A cho B"
- "Summarize status dự án X"

### Context Files
```
SOUL.md        → focused, precise, action-oriented
IDENTITY.md    → Task Manager persona
AGENTS.md      → biết khi nào escalate về Enterprise Assistant
```

---

## Agent 3 — Ops Admin

**Key:** `ops-admin`
**Type:** Open Agent (full control cho admin)
**Phase:** 1
**Mô tả:** Agent dành riêng cho sếp/admin. Có quyền truy cập đầy đủ, có thể chạy queries phức tạp, debug, system checks. Không dùng cho general staff.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist",
    "allowlist": ["<admin_telegram_id>"] }
]
```

### LLM
- Model: `claude-opus-4-6` (dùng model mạnh hơn cho complex admin tasks)
- Extended thinking: `true`

### MCP Tools dùng
- Tất cả `eos_*` tools
- `eos_admin_query` (raw query, Phase sau)
- `eos_list_audit_events`
- `eos_get_system_health`

### Built-in GoClaw Tools
- `memory_search`, `vault_search`, `vault_link`
- `web_search`, `web_browse`
- `code_execute` (nếu cần)
- `file_read`, `file_write`
- `spawn`

### Use Cases
- Debug production issues
- System health checks
- Audit trail queries
- Complex data analysis
- Setup và configuration tasks

---

## Agent 4 — Văn Phòng Agent

**Key:** `van-phong-agent`
**Type:** Predefined Agent
**Phase:** 1 (deploy ngay sau khi task-manager hoạt động)
**Mô tả:** Chuyên gia tạo và xử lý file văn phòng — DOCX, XLSX, PPTX, PDF. Được delegate từ Enterprise Assistant khi user cần tạo hoặc xử lý file. Không tương tác về tasks hay business data.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" },
  { "channel": "internal", "access_policy": "open" }
]
```

### LLM
- Model: `claude-sonnet-4-6`
- Extended thinking: `false`

### MCP Tools dùng
- `eos_register_drive_artifact` — đăng ký file output vào Drive (Phase 2+)
- `eos_log_agent_action` — audit trail
- Các file operation tools (built-in): `file_read`, `file_write`, `code_execute`

### Built-in GoClaw Tools
- `file_read` — đọc file mẫu user upload
- `file_write` — ghi file output
- `code_execute` — chạy python/node scripts tạo file
- `vault_search` — tìm templates, standards trong Knowledge Vault
- `memory_search` — nhớ format preferences của user

### Skills
```
SKILL_van_phong.md → uploaded lên Knowledge Vault của agent
```
> Agent đọc SKILL_van_phong.md trước khi tạo bất kỳ file nào.

### Use Cases
- "Soạn công văn gửi đối tác XYZ"
- "Tạo tờ trình đề xuất mua thiết bị"
- "Làm slide báo cáo kết quả Q2"
- "Tạo bảng tracking tiến độ dự án A"
- "Ghép 3 file PDF này lại"
- "Chuyển file word này sang PDF"
- "Bắt chước format file này, thay nội dung mới"
- "Tạo báo cáo theo chuẩn NĐ 30"

### Context Files cần upload
```
SOUL.md       → personality, principles, escalation rules
IDENTITY.md   → capabilities, trigger phrases, format table, QA checklist
```

### Skill cần upload vào Knowledge Vault
```
goclaw/skills/SKILL_van_phong.md → đặt tên "van-phong" trong Vault
```

### Dependencies (cần có trên GoClaw server)
```bash
pip install python-docx openpyxl pypdf pdfplumber pdf2docx "markitdown[pptx]" Pillow
npm install -g pptxgenjs
apt-get install libreoffice  # hoặc soffice
```

---

## Agent 6 — Report Agent

**Key:** `report-agent`
**Type:** Predefined Agent
**Phase:** 2 (sau khi Drive + n8n bridge có)
**Mô tả:** Chuyên tạo báo cáo và export ra Google Drive / Sheets. Được trigger từ Enterprise Assistant hoặc cron.

### Channels
```json
[
  { "channel": "internal", "access_policy": "open" }
]
```
> Internal only — không expose ra Telegram/Zalo trực tiếp, được delegate từ agents khác.

### LLM
- Model: `claude-sonnet-4-6`

### MCP Tools dùng
- `eos_query_tasks`
- `eos_list_projects`
- `eos_get_dashboard_summary`
- `eos_register_drive_artifact`
- n8n MCP tools (Phase 2): `n8n_trigger_workflow`, `n8n_get_execution_status`

### Use Cases
- Weekly project status report → Drive
- Monthly task completion summary → Sheets
- Dashboard snapshot export
- Sprint review report

### Cron Jobs
- `weekly-report` — Thứ Sáu 5:00 PM
- `monthly-summary` — Ngày 1 hàng tháng 8:00 AM

---

## Agent 7 — CRM Agent

**Key:** `crm-agent`
**Type:** Predefined Agent
**Phase:** 4
**Mô tả:** Quản lý CRM — deals, clients, follow-ups. Nhận input từ chat, ghi vào Enterprise OS CRM module.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### MCP Tools dùng (Phase 4+)
- `eos_create_client`
- `eos_update_deal`
- `eos_log_interaction`
- `eos_create_crm_note`
- `eos_list_deals`
- `eos_create_reminder` (follow-up)

### Built-in GoClaw Tools
- `memory_search` — nhớ context của client
- `vault_search` — tìm proposal, contract templates
- `web_search` — research client/company

### Use Cases
- "Ghi note cuộc gọi với anh A từ công ty B"
- "Deal ABC đang ở stage nào?"
- "Set follow-up với C sau 3 ngày"
- "Tạo client mới: tên, contact, company"

### Cron Jobs
- `crm-followup-reminder` — 9:00 AM daily (check deals cần follow-up hôm nay)

---

## Agent 8 — Finance Agent

**Key:** `finance-agent`
**Type:** Predefined Agent
**Phase:** 6
**Mô tả:** Capture chi phí từ chat, query số liệu, tạo digest tài chính định kỳ.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### MCP Tools dùng (Phase 6+)
- `eos_create_expense`
- `eos_list_expenses`
- `eos_get_account_balance`
- `eos_create_invoice`
- `eos_get_finance_summary`

### Built-in GoClaw Tools
- `memory_search`
- `vault_search` (tìm policy chi phí)
- Image processing (đọc hóa đơn từ ảnh)

### Use Cases
- "Vừa mua cà phê 85k, ghi vào chi phí văn phòng"
- "Tháng này chi bao nhiêu rồi?"
- Gửi ảnh bill → agent parse → tạo expense tự động

### Cron Jobs
- `weekly-finance-digest` — Thứ Sáu 6:00 PM
- `monthly-finance-summary` — Ngày 1 hàng tháng

---

## Agent 9 — Attendance Agent

**Key:** `attendance-agent`
**Type:** Predefined Agent
**Phase:** 5
**Mô tả:** Xử lý chấm công — check-in/out, xin nghỉ, overtime, xem lịch.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### MCP Tools dùng (Phase 5+)
- `eos_checkin`
- `eos_checkout`
- `eos_create_leave_request`
- `eos_get_attendance_summary`
- `eos_list_shifts`

### Use Cases
- "Check in" → ghi giờ vào
- "Check out" → ghi giờ ra
- "Xin nghỉ ngày mai"
- "Tháng này tôi đi muộn mấy lần?"

### Cron Jobs
- `attendance-reminder-morning` — 8:30 AM weekdays (nhắc check-in nếu chưa)
- `attendance-reminder-evening` — 5:30 PM weekdays (nhắc check-out nếu chưa)

---

## Agent 10 — Knowledge Agent

**Key:** `knowledge-agent`
**Type:** Predefined Agent
**Phase:** 7
**Mô tả:** Q&A về tài liệu công ty — SOP, policy, handbook, quyết định. Dùng GoClaw Knowledge Vault là primary source.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" },
  { "channel": "websocket", "access_policy": "open" }
]
```

### LLM
- Model: `claude-sonnet-4-6`

### Built-in GoClaw Tools
- `vault_search` — primary tool
- `vault_link` — tạo liên kết giữa docs
- `memory_search`
- `web_search` (fallback)

### Use Cases
- "Quy trình xin nghỉ phép là gì?"
- "Có template hợp đồng nào không?"
- "Chính sách OT của công ty?"
- "Tìm tài liệu onboarding cho dev mới"

---

## Agent 11 — Helpdesk Agent

**Key:** `helpdesk-agent`
**Type:** Predefined Agent
**Phase:** 7
**Mô tả:** Tiếp nhận yêu cầu nội bộ, tạo ticket, track SLA, escalation.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" },
  { "channel": "zalo",     "access_policy": "allowlist" }
]
```

### MCP Tools dùng (Phase 7+)
- `eos_create_ticket`
- `eos_update_ticket_status`
- `eos_get_ticket`
- `eos_escalate_ticket`

### Built-in GoClaw Tools
- `vault_search` — tìm KB articles trước khi tạo ticket
- `memory_search`
- `spawn` — delegate sang Knowledge Agent nếu có KB article giải quyết được

### Use Cases
- "Máy tính bị lỗi, cần IT hỗ trợ"
- "Xin cấp thêm quyền truy cập hệ thống X"
- "Ticket của tôi đang ở đâu?"

---

## Agent 12 — Dream / Reflection Agent

**Key:** `dream-agent`
**Type:** Predefined Agent
**Phase:** 3 (chỉ cần config, không cần build)
**Mô tả:** Chạy nền qua cron. Tổng hợp, chiêm nghiệm, tạo insights, gửi digest. Người dùng không tương tác trực tiếp — chỉ cron triggers.

### Channels
```json
[
  { "channel": "telegram", "access_policy": "allowlist" }
]
```
> Output gửi ra Telegram/Zalo nhưng không nhận input từ user trực tiếp.

### LLM
- Model: `claude-opus-4-6` (cần model mạnh hơn cho synthesis)
- Extended thinking: `true`

### MCP Tools dùng
- `eos_query_tasks` (tasks overdue, blocked, recently completed)
- `eos_list_projects` (project health)
- `eos_get_dashboard_summary`
- `eos_get_finance_summary` (Phase 6+)

### Built-in GoClaw Tools
- `memory_search` — truy vấn L0/L1/L2 memory
- `vault_search` — tìm context từ Knowledge Vault
- `memory_write` — ghi insights vào L1/L2

### Cron Jobs

```json5
[
  {
    "name": "daily-reflection",
    "schedule": "0 21 * * 1-5",
    "agent": "dream-agent",
    "message": "Daily reflection: Review hôm nay. Tasks overdue? Blockers chưa escalate? Deals cần follow-up? Gửi digest về Telegram nếu có điểm đáng chú ý.",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  {
    "name": "weekly-synthesis",
    "schedule": "0 8 * * 1",
    "agent": "dream-agent",
    "message": "Weekly synthesis: Tổng hợp tuần trước. Highlight wins, flag risks, suggest priorities cho tuần mới. Gửi summary về Telegram.",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  {
    "name": "morning-briefing",
    "schedule": "0 8 * * 1-5",
    "agent": "enterprise-assistant",
    "message": "Morning briefing: Tasks overdue, items cần quyết định hôm nay, deals cần follow-up. Ngắn gọn — top 5 priorities.",
    "timezone": "Asia/Ho_Chi_Minh"
  }
]
```

### Notes
- GoClaw L2 Dreaming tự chạy automatic qua DomainEventBus — dream-agent via cron là **thêm vào trên L2**, không thay thế.
- Output L2 được distill vào memory tự động.

---

## Setup Order (theo Phase)

### Phase 0 — Setup ngay
1. `enterprise-assistant` — agent chính, mọi user tương tác

### Phase 1 — Sau khi MCP bridge có
2. `task-manager` — sau khi `eos_*` MCP tools hoạt động
3. `ops-admin` — sau khi service token và auth sẵn sàng
4. `van-phong-agent` — deploy ngay sau task-manager (không cần MCP phức tạp, chỉ cần file ops)

### Phase 2 — Sau khi Drive + n8n bridge có
4. `report-agent` — sau khi `eos_register_drive_artifact` hoạt động

### Phase 3 — Configure, không cần build
5. `dream-agent` — config cron + SOUL.md + model

### Phase 4
6. `crm-agent` — sau khi CRM module có

### Phase 5
7. `attendance-agent` — sau khi Attendance module có

### Phase 6
8. `finance-agent` — sau khi Finance module có

### Phase 7
9. `knowledge-agent` — sau khi Vault populated
10. `helpdesk-agent` — sau khi Helpdesk module có

---

## Delegation Map (agent nào gọi agent nào)

```text
enterprise-assistant
    ├── → task-manager        (khi cần bulk/complex task ops)
    ├── → van-phong-agent     (khi cần tạo/sửa file DOCX/XLSX/PPTX/PDF)
    ├── → report-agent        (khi cần tạo báo cáo formal + export Drive)
    ├── → crm-agent           (khi context là CRM)
    ├── → finance-agent       (khi context là chi phí/tài chính)
    ├── → attendance-agent    (khi context là chấm công)
    ├── → knowledge-agent     (khi cần tìm tài liệu)
    └── → helpdesk-agent      (khi cần tạo ticket)

dream-agent
    └── (standalone, cron only, không delegate)

ops-admin
    └── (standalone, full access, không delegate)
```

---

## Context Files Template Summary

| File | Dùng trong agents | Ghi chú |
|---|---|---|
| `SOUL.md` | Tất cả | Personality + values của từng agent |
| `IDENTITY.md` | Tất cả | Tên, ngôn ngữ, tone, domain |
| `AGENTS.md` | enterprise-assistant, task-manager | Biết agent nào khác để delegate |
| `BOOTSTRAP.md` | enterprise-assistant | User-specific context (per-user) |
| `MEMORY.md` | enterprise-assistant | User memory seed (per-user) |
| `SKILL_van_phong.md` | van-phong-agent (Knowledge Vault) | Standards DOCX/XLSX/PPTX/PDF, color palettes, NĐ 30 |

> Context file templates xem trong thư mục `goclaw/agents/<agent-key>/`

---

*Registry v1.1 — 2026-04-21 (thêm van-phong-agent)*
*Tham khảo: docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v3_GOCLAW.md*
