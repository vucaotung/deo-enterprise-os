# GoClaw Agents Registry — Dẹo Enterprise OS v2

> 13 agents. Mỗi agent có key, type, model, template, channels, và context files đầy đủ.
> Context files: SOUL.md (personality) + IDENTITY.md (name/role) + AGENTS.md (rules/delegation)

---

## Tổng quan

| # | Key | Tên | Template | Model | Phase | Channels | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `deo` | Dẹo | Full | sonnet | 0 | **Telegram** (sếp only) | 🔴 Critical |
| 2 | `office-agent` | Office Agent | Task | sonnet | 1 | Zalo, Internal | 🟠 High |
| 3 | `hr-agent` | HR Agent | Task | sonnet | 1 | Zalo | 🟠 High |
| 4 | `finance-agent` | Finance Agent | Task | sonnet | 1 | Zalo | 🟠 High |
| 5 | `crm-agent` | CRM Agent | Task | sonnet | 1 | Zalo | 🟠 High |
| 6 | `it-dev-agent` | IT/Dev Agent | Task | sonnet | 1 | Telegram | 🟠 High |
| 7 | `office-admin-agent` | Office Admin Agent | Task | sonnet | 2 | Zalo | 🟡 Medium |
| 8 | `marketing-agent` | Marketing Agent | Task | sonnet | 2 | Zalo, Internal | 🟡 Medium |
| 9 | `legal-agent` | Legal Agent | Task | sonnet | 2 | Zalo, Internal | 🟡 Medium |
| 10 | `project-manager-agent` | Project Manager Agent | Task | sonnet | 2 | Zalo, Internal | 🟡 Medium |
| 11 | `researcher-agent` | Researcher Agent | Task | sonnet | 2 | Telegram, Internal | 🟡 Medium |
| 12 | `dream-agent` | Dream Agent | Minimal | opus | 3 | Internal (cron only) | 🟢 Normal |
| 13 | `ops-admin` | Ops Admin | Full | opus | 1 | Zalo (admin only) | 🟠 High |

---

## Chi tiết từng agent

---

### 1. `deo` — Dẹo Personal Assistant

**Template:** Full (~4.8K) — interactive chat hàng ngày
**Model:** claude-sonnet-4-6
**SOUL evolution:** ✅ Bật — học từ preference của sếp
**Persona GoClaw:** 🦊 Fox Spirit

**Channels:**
```json
[
  { "channel": "telegram", "access_policy": "allowlist" }
]
```
> ⚠️ Chỉ Telegram — trợ lý cá nhân sếp + super admin hệ thống. Không dùng Zalo.

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Action-oriented, ngắn gọn, nhớ context, delegate đúng |
| `IDENTITY.md` | Tên Dẹo 🦊, tiếng Việt, domain: task + điều phối |
| `AGENTS.md` | Delegation map đầy đủ 11 agents, memory triggers, format confirm |

**Delegation map:**
```
deo → office-agent        (file DOCX/XLSX/PPTX/PDF)
deo → hr-agent            (chấm công, nghỉ phép, nhân sự)
deo → finance-agent       (chi phí, hóa đơn, thuế)
deo → crm-agent           (khách hàng, deals, follow-up)
deo → it-dev-agent        (lỗi IT, bug, technical)
deo → office-admin-agent  (hành chính, đặt phòng, mua sắm)
deo → marketing-agent     (marketing, phân tích thị trường)
deo → legal-agent         (hợp đồng, pháp lý)
deo → project-manager-agent (dự án, sprint)
deo → researcher-agent    (research chuyên sâu)
```

**Cron:** morning-briefing 8:00 weekdays

---

### 2. `office-agent` — Office Document Agent

**Template:** Task (~1.3K) — file creation automation
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** ✍️ Writer

**Channels:**
```json
[
  { "channel": "zalo",     "access_policy": "allowlist" },
  { "channel": "internal", "access_policy": "open" }
]
```

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Craft-focused, standards first, verify before declare |
| `IDENTITY.md` | ✍️, DOCX/XLSX/PPTX/PDF capabilities, trigger phrases |
| `AGENTS.md` | QA checklist, kỹ thuật theo loại file, escalation rules |

**Knowledge Vault:** Upload `SKILL_van_phong.md` → tên `van-phong`

---

### 3. `hr-agent` — HR Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🎧 Support

**Channels:**
```json
[
  { "channel": "zalo", "access_policy": "allowlist" }
]
```

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Empathetic, bảo mật, chính xác, chủ động nhắc |
| `IDENTITY.md` | 👥, attendance/leave/recruitment/onboarding |
| `AGENTS.md` | Bảo mật thông tin nhân sự, quy trình xin nghỉ, cron triggers |

**MCP Tools (Phase 1+):** `eos_checkin`, `eos_checkout`, `eos_create_leave_request`, `eos_get_attendance_summary`

**Cron:** attendance-checkin-reminder 8:30, attendance-checkout-reminder 17:30, monthly-attendance-report ngày 1

---

### 4. `finance-agent` — Finance Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 💻 Coder (dùng tạm — chưa có Finance persona)

**Channels:**
```json
[
  { "channel": "zalo", "access_policy": "allowlist" }
]
```

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Con số không được nhầm, minh bạch, cảnh báo sớm |
| `IDENTITY.md` | 💰, expense/invoice/budget/tax/kế toán VN |
| `AGENTS.md` | Categories chi phí, cảnh báo tự động, quy trình ghi expense |

**MCP Tools (Phase 1+):** `eos_create_expense`, `eos_list_expenses`, `eos_get_finance_summary`

**Cron:** weekly-finance-digest Thứ Sáu 18:00, monthly-finance-summary ngày 1

---

### 5. `crm-agent` — CRM Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🎧 Support

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Deal không nguội, context-first, ghi chép kịp thời |
| `IDENTITY.md` | 🤝, client/deals/interactions/pipeline/brief |
| `AGENTS.md` | Pipeline stages, quy trình ghi note, cảnh báo deal nguội |

**Cron:** crm-followup-reminder 9:00 weekdays

---

### 6. `it-dev-agent` — IT/Dev Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 💻 Coder

**Channels:**
```json
[
  { "channel": "telegram", "access_policy": "allowlist" }
]
```

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Diagnose trước fix, document, no downtime không cần thiết |
| `IDENTITY.md` | 💻, IT support/bug/infra/code review/access |
| `AGENTS.md` | Severity levels, bug quy trình, access cấp quyền, deploy checklist |

---

### 7. `office-admin-agent` — Office Admin Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🎧 Support

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Proactive, organized, service mindset |
| `IDENTITY.md` | 🗂️, văn thư/đặt phòng/tài sản/yêu cầu nội bộ |
| `AGENTS.md` | Ticket quy trình, SLA, mua sắm quy trình |

---

### 8. `marketing-agent` — Marketing Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🎨 Artisan

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Data-informed creativity, market first, iterative |
| `IDENTITY.md` | 📊, market research/campaign/content/competitive/BD |
| `AGENTS.md` | Research framework, campaign planning 7 bước, memory triggers |

---

### 9. `legal-agent` — Legal Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🎧 Support

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Prevention over cure, clear not complex, biết giới hạn |
| `IDENTITY.md` | ⚖️, contract review/drafting/compliance/risk |
| `AGENTS.md` | Review quy trình, risk categories, checklist HĐ thường gặp, confidentiality |

---

### 10. `project-manager-agent` — Project Manager Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 💻 Coder

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Clarity over complexity, proactive về blockers, rhythm matters |
| `IDENTITY.md` | 🗓️, sprint/tracking/blockers/milestone/reporting |
| `AGENTS.md` | Sprint lifecycle, task status flow, cảnh báo tự động, weekly report format |

---

### 11. `researcher-agent` — Researcher Agent

**Template:** Task (~1.3K)
**Model:** claude-sonnet-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🔮 Astrologer

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Evidence over opinion, synthesis not summary, knowledge compounds |
| `IDENTITY.md` | 🔍, market/competitive/tech/policy/knowledge management |
| `AGENTS.md` | Research framework, output format, source quality hierarchy, Vault management |

---

### 12. `dream-agent` — Dream / Reflection Agent

**Template:** Minimal (~570) — background tasks, observe-only
**Model:** claude-opus-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 🔮 Astrologer

**Channels:** Internal (cron only, không nhận input từ user)

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Observe/synthesize/reflect, không phán xét, actionable insights |
| `IDENTITY.md` | 🔮, daily digest/weekly synthesis/L2 memory |
| `AGENTS.md` | Data sources, output format chuẩn, memory writes |

**Cron:**
- `daily-reflection`: 21:00 weekdays
- `weekly-synthesis`: Thứ Hai 8:30
- `monthly-summary`: Ngày 1 hàng tháng 8:00

---

### 13. `ops-admin` — Ops Admin

**Template:** Full (~4.8K) — full access
**Model:** claude-opus-4-6
**SOUL evolution:** ❌
**Persona GoClaw:** 💻 Coder

**Channels:**
```json
[
  { "channel": "zalo", "access_policy": "allowlist",
    "allowlist": ["<admin_zalo_id>"] }
]
```

**Context files:**
| File | Nội dung |
|---|---|
| `SOUL.md` | Power + responsibility, verify before execute, no silent failures |
| `IDENTITY.md` | ⚙️, full system access, admin only |
| `AGENTS.md` | Destructive ops checklist, access scope, emergency protocol |

---

## Delegation Map (toàn hệ thống)

```
deo (hub)
  ├── office-agent          ← DOCX/XLSX/PPTX/PDF
  ├── hr-agent              ← chấm công, nhân sự
  ├── finance-agent         ← chi phí, kế toán, thuế
  ├── crm-agent             ← khách hàng, deals
  ├── it-dev-agent          ← IT, bug, infra
  ├── office-admin-agent    ← hành chính, vận hành
  ├── marketing-agent       ← marketing, thị trường
  ├── legal-agent           ← hợp đồng, pháp lý
  ├── project-manager-agent ← dự án, sprint
  └── researcher-agent      ← research chuyên sâu

dream-agent   (cron only, standalone)
ops-admin     (admin only, standalone)
```

## Cross-agent collaboration (agents gọi agents)

```
office-agent    ← nhận từ: deo, finance, legal, marketing, project-manager
hr-agent        ← nhận từ: deo, project-manager
finance-agent   ← nhận từ: deo, crm, office-admin, marketing
crm-agent       ↔ marketing-agent, legal-agent, finance-agent
legal-agent     ← nhận từ: deo, crm, hr, office-admin, marketing
researcher-agent← nhận từ: deo, marketing, crm, legal
```

---

## Setup Order

### Phase 0 — Ngay lập tức
1. `deo` — hub chính

### Phase 1 — Sau khi MCP bridge có
2. `ops-admin`
3. `office-agent` + upload SKILL_van_phong vào Knowledge Vault
4. `hr-agent`
5. `finance-agent`
6. `crm-agent`
7. `it-dev-agent`

### Phase 2 — Sau khi hệ thống ổn định
8. `office-admin-agent`
9. `marketing-agent`
10. `legal-agent`
11. `project-manager-agent`
12. `researcher-agent`

### Phase 3 — Configure only
13. `dream-agent`

---

## GoClaw Dashboard Checklist

Khi tạo mỗi agent:
- [x] Key đúng (lowercase, hyphens)
- [x] Provider + model đã set (xem bảng model thực tế bên dưới)
- [x] Upload SOUL.md, IDENTITY.md, AGENTS.md, CAPABILITIES.md, USER_PREDEFINED.md
- [x] Connect channels phù hợp (Telegram: deo, it-dev, researcher / Zalo: còn lại)
- [ ] Test 1 câu với từng agent sau khi setup xong
- [ ] SOUL evolution: bật cho `deo` trên dashboard

---

## Model thực tế (2026-04-22)

| Agent | Model hiện tại | Target |
|---|---|---|
| `deo` | gpt-5.4 | claude-sonnet-4-6 |
| `office-agent` | gpt-5.4 | claude-sonnet-4-6 |
| `hr-agent` | google/gemma-4-31b-it | claude-sonnet-4-6 |
| `finance-agent` | minimax/minimax-m2.5:free | claude-sonnet-4-6 |
| `crm-agent` | gpt-4o | claude-sonnet-4-6 |
| `it-dev-agent` | gpt-4o | claude-sonnet-4-6 |
| `office-admin-agent` | gpt-4o | claude-sonnet-4-6 |
| `marketing-agent` | gpt-5.4 | claude-sonnet-4-6 |
| `legal-agent` | gpt-5.4 | claude-sonnet-4-6 |
| `project-manager-agent` | gpt-5.4 | claude-sonnet-4-6 |
| `researcher-agent` | minimax/minimax-m2.5:free | claude-sonnet-4-6 |
| `dream-agent` | google/gemma-4-31b-it | claude-opus-4-6 |
| `ops-admin` | minimax/minimax-m2.5:free | claude-opus-4-6 |

> **TODO:** Sau khi có Anthropic API key → đổi tất cả sang target model.

---

*Registry v2.1 — 2026-04-22*
*13 agents active | GoClaw Docker port 18790*
