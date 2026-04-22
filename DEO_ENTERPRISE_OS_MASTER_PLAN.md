# Dẹo Enterprise OS — Master Plan v2.0
> Kiến trúc đầy đủ trên nền GoClaw · Xeon Workstation + VPS · 11 AI Agents

---

## MỤC LỤC

1. [Tổng quan kiến trúc hệ thống](#1-tổng-quan-kiến-trúc)
2. [Hạ tầng & Phân vai máy chủ](#2-hạ-tầng--phân-vai)
3. [Cấu trúc thư mục workspace](#3-cấu-trúc-thư-mục)
4. [11 AI Agents — Thiết kế & Config](#4-11-ai-agents)
5. [Agent Teams & Orchestration](#5-agent-teams--orchestration)
6. [Sơ đồ workflow chi tiết](#6-sơ-đồ-workflow)
7. [GoClaw config.json đầy đủ](#7-goclaw-configjson)
8. [Cron & Heartbeat schedule](#8-cron--heartbeat)
9. [MCP Tools — Shared & Per-agent](#9-mcp-tools)
10. [Skills system — SKILL.md library](#10-skills-system)
11. [Database schema — Postgres modules](#11-database-schema)
12. [Agent tự học & tự nâng cấp](#12-agent-tự-học--tự-nâng-cấp)
13. [Dashboard UI/UX](#13-dashboard-uiux)
14. [Migration plan từ OpenClaw](#14-migration-plan)

---

## 1. TỔNG QUAN KIẾN TRÚC

```
╔══════════════════════════════════════════════════════════════════╗
║                    DẸO ENTERPRISE OS v2.0                        ║
║                  Powered by GoClaw Gateway                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   HUMAN INTERFACE LAYER                                          ║
║   ├── Telegram (nhân viên, quản lý)                              ║
║   ├── Zalo OA  (khách hàng, đối tác)                             ║
║   ├── Web Dashboard (admin, reporting)                           ║
║   └── WebSocket API (internal tools)                             ║
║                                                                  ║
║   ORCHESTRATION LAYER                                            ║
║   └── Dẹo Admin (AI COO) ─── routes ──→ chuyên biệt agents       ║
║                                                                  ║
║   AGENT LAYER (11 agents)                                        ║
║   ├── Kế Toán    ├── Pháp Chế   ├── HR/Nhân Sự                   ║
║   ├── Admin/VP   ├── Logistics  ├── Marketing                    ║
║   ├── Dự Án      ├── IT Team    ├── Kho Vận                       ║
║   └── CSKH       └── (mở rộng)                                   ║
║                                                                  ║
║   SHARED CAPABILITY LAYER                                        ║
║   ├── OfficeCLI MCP  (doc/xlsx/pptx)                             ║
║   ├── MarkItDown MCP (đọc file input)                            ║
║   ├── Postgres MCP   (query DB)                                  ║
║   └── Skills Library (business logic VN)                         ║
║                                                                  ║
║   DATA LAYER                                                     ║
║   ├── Postgres 16 + pgvector (memory, KG, business data)         ║
║   ├── Redis (session cache)                                      ║
║   └── Workspace filesystem (files in/out)                        ║
╚══════════════════════════════════════════════════════════════════╝
```

### Nguyên tắc thiết kế

- **Tận dụng GoClaw tối đa**: memory, KG, evolution, teams, cron, heartbeat — không build lại những gì đã có
- **Hub-and-spoke orchestration**: Dẹo Admin là điểm trung tâm duy nhất, agents không tự giao tiếp trừ workflow tự động
- **Shared tools, specialized skills**: MCP tools mount ở `defaults`, SKILL.md riêng per-agent
- **File-first output**: mọi tác vụ quan trọng đều kết thúc bằng file docx/xlsx có thể download
- **Vietnam-aware**: múi giờ Asia/Ho_Chi_Minh, ngôn ngữ vi, luật VN trong skills

---

## 2. HẠ TẦNG & PHÂN VAI

### Xeon E-2124G Workstation (văn phòng — 24/7)

```
Xeon Workstation
├── GoClaw gateway          :18790  ← AI brain, tất cả agents
├── Postgres 16             :5433   ← GoClaw internal DB (goclaw schema)
├── Redis                   :6380   ← session cache
├── OfficeCLI MCP           :stdio  ← shared office tool
├── MarkItDown MCP          :stdio  ← shared file reader
├── Cloudflare Tunnel               ← expose ra internet
│   └── goclaw.enterpriseos.bond → localhost:18790
└── /workspace/                     ← file storage (xem mục 3)
```

### VPS (production services)

```
VPS
├── Next.js Dashboard       :3000   ← web UI, calls GoClaw API
├── Postgres 16             :5432   ← deo.* business schema
│   └── DB name: deo_os
├── Cloudflare Tunnel
│   ├── app.enterpriseos.bond  → localhost:3000
│   └── db.enterpriseos.bond   → localhost:5432 (internal only)
└── Nginx reverse proxy
```

### Kết nối giữa hai máy

```
Xeon GoClaw ──→ VPS Postgres (qua tunnel hoặc WireGuard)
Xeon GoClaw ←── VPS Dashboard (REST API / WebSocket)
```

**Postgres MCP** trên Xeon connect vào VPS Postgres để agents query business data trực tiếp:
```bash
POSTGRES_MCP_DSN="postgresql://deo:xxx@db.enterpriseos.bond:5432/deo_os"
```

---

## 3. CẤU TRÚC THƯ MỤC WORKSPACE

```
/workspace/                          ← GOCLAW_WORKSPACE
│
├── skills/                          ← GoClaw Skills Library
│   ├── ke-toan/SKILL.md
│   ├── phap-che/SKILL.md
│   ├── hr/SKILL.md
│   ├── office-docs/SKILL.md         ← shared office skill
│   ├── logistics/SKILL.md
│   ├── marketing/SKILL.md
│   ├── du-an/SKILL.md
│   ├── it-team/SKILL.md
│   ├── kho-van/SKILL.md
│   └── cskh/SKILL.md
│
├── templates/                       ← File templates chuẩn công ty
│   ├── contracts/
│   │   ├── hop-dong-lao-dong.docx
│   │   ├── hop-dong-dich-vu.docx
│   │   ├── hop-dong-mua-ban.docx
│   │   └── phu-luc-hop-dong.docx
│   ├── hr/
│   │   ├── quyet-dinh-tuyen-dung.docx
│   │   ├── bien-ban-phong-van.docx
│   │   └── bang-luong.xlsx
│   ├── ke-toan/
│   │   ├── phieu-thu-chi.docx
│   │   ├── bao-cao-tai-chinh.xlsx
│   │   └── de-nghi-thanh-toan.docx
│   ├── logistics/
│   │   ├── phieu-nhap-kho.xlsx
│   │   ├── phieu-xuat-kho.xlsx
│   │   └── bien-ban-giao-nhan.docx
│   ├── marketing/
│   │   ├── ke-hoach-marketing.docx
│   │   └── bao-cao-chien-dich.xlsx
│   └── du-an/
│       ├── ke-hoach-du-an.docx
│       └── bao-cao-tien-do.xlsx
│
├── inputs/                          ← File đầu vào từ người dùng
│   ├── ke-toan/
│   ├── phap-che/
│   ├── hr/
│   ├── logistics/
│   └── {agent}/YYYY-MM/             ← auto-organized by date
│
├── outputs/                         ← File đầu ra hoàn thiện
│   ├── ke-toan/
│   │   ├── bang-luong/
│   │   │   └── 2025-05-bang-luong.xlsx
│   │   ├── bao-cao/
│   │   └── chung-tu/
│   ├── phap-che/
│   │   ├── hop-dong/
│   │   └── bien-ban/
│   ├── hr/
│   │   ├── quyet-dinh/
│   │   └── ho-so/
│   ├── logistics/
│   │   ├── phieu-kho/
│   │   └── don-hang/
│   └── {agent}/YYYY-MM/
│
├── agents/                          ← Per-agent context files (GoClaw native)
│   ├── deo-admin/
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   ├── CAPABILITIES.md
│   │   └── TOOLS.md
│   ├── ke-toan/
│   ├── phap-che/
│   ├── hr/
│   └── {agent}/
│
└── shared/                          ← Tài liệu dùng chung
    ├── company-info.md              ← Thông tin công ty
    ├── employees.md                 ← Danh sách nhân viên (cập nhật)
    ├── org-chart.md                 ← Sơ đồ tổ chức
    └── policies/                    ← Chính sách nội bộ
        ├── quy-dinh-luong.md
        ├── quy-trinh-mua-hang.md
        └── noi-quy-cong-ty.md
```

---

## 4. 11 AI AGENTS — THIẾT KẾ & CONFIG

### Nguyên tắc chung

Mỗi agent có:
- `agent_type: "predefined"` — persistent context, phù hợp business agents
- Shared MCP tools (từ defaults)
- Skills riêng (domain knowledge)
- SOUL.md định nghĩa tính cách chuyên môn
- Workspace riêng để không lẫn file

---

### 4.1 Dẹo Admin (AI COO — Orchestrator)

**Vai trò**: Nhận tất cả yêu cầu từ người dùng, phân loại intent, delegate cho agent chuyên biệt hoặc xử lý trực tiếp.

**SOUL.md**:
```markdown
Bạn là Dẹo Admin, AI COO của doanh nghiệp. Bạn nói chuyện bằng tiếng Việt,
chuyên nghiệp nhưng thân thiện. Khi nhận yêu cầu, bạn:
1. Xác định thuộc bộ phận nào
2. Delegate cho agent chuyên biệt hoặc tự xử lý
3. Tổng hợp kết quả và trả về rõ ràng
Không bao giờ bịa số liệu. Luôn xác nhận trước khi làm việc quan trọng.
```

**Config**:
```jsonc
"deo-admin": {
  "displayName": "Dẹo Admin 🏢",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.3,
  "max_tool_iterations": 30,
  "skills": ["office-docs"],
  "identity": { "name": "Dẹo Admin", "emoji": "🏢" },
  "default": true
}
```

---

### 4.2 Agent Kế Toán (💰)

**Vai trò**: Bảng lương, chứng từ, báo cáo tài chính, thuế, công nợ.

**Tác vụ thường xuyên**:
- Tạo bảng lương tháng (xlsx)
- Xuất phiếu thu/chi (docx)
- Báo cáo dòng tiền (xlsx)
- Kiểm tra công nợ, nhắc thanh toán
- Cron: báo cáo thuế hàng tháng

**SKILL.md** (key content):
```markdown
# Kế Toán Skill

## Bảng lương
Template: templates/ke-toan/bang-luong.xlsx
Cột bắt buộc: STT, Họ Tên, CCCD, Chức vụ, Lương CB,
  Phụ cấp, Tổng Gross, BHXH(8%), BHYT(1.5%), BHTN(1%),
  Thuế TNCN, Thực lĩnh
Công thức BHXH: =Gross * 8%
Công thức TNCN: theo biểu thuế lũy tiến VN (9 bậc)
Output: outputs/ke-toan/bang-luong/YYYY-MM-bang-luong.xlsx

## Phiếu thu/chi
Template: templates/ke-toan/phieu-thu-chi.docx
Số chứng từ: PT-YYYY-XXXX hoặc PC-YYYY-XXXX
Bắt buộc: người nộp/nhận, diễn giải, số tiền bằng số và chữ

## Thuế GTGT
Kỳ kê khai: tháng (doanh thu > 1 tỷ) hoặc quý
Hạn nộp tờ khai: ngày 20 tháng sau
Hạn nộp thuế: cùng ngày nộp tờ khai
```

**Config**:
```jsonc
"agent-ke-toan": {
  "displayName": "Kế Toán 💰",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.1,
  "skills": ["ke-toan", "office-docs"],
  "workspace": "./workspace/ke-toan",
  "identity": { "name": "Kế Toán", "emoji": "💰" },
  "heartbeat": {
    "enabled": true,
    "interval_minutes": 480,
    "checklist": [
      "Kiểm tra công nợ quá hạn trong DB",
      "Nhắc nhở nếu có chứng từ chưa xử lý"
    ]
  }
}
```

---

### 4.3 Agent Pháp Chế (⚖️)

**Vai trò**: Soạn hợp đồng, review pháp lý, theo dõi hiệu lực hợp đồng, văn bản pháp quy.

**Tác vụ thường xuyên**:
- Soạn hợp đồng lao động, dịch vụ, mua bán
- Review điều khoản hợp đồng đối tác
- Theo dõi hợp đồng sắp hết hạn
- Tra cứu quy định pháp luật VN hiện hành

**SKILL.md** (key content):
```markdown
# Pháp Chế Skill

## Hợp đồng lao động
Căn cứ: Bộ luật Lao động 2019, NĐ 145/2020
Các loại HĐ: xác định thời hạn (≤36 tháng), không xác định thời hạn
Bắt buộc ghi: điều kiện làm việc, lương, thời gian thử việc (≤60 ngày),
  thời gian nghỉ phép (12 ngày/năm)
Template: templates/contracts/hop-dong-lao-dong.docx

## Hợp đồng dịch vụ
Phải có: phạm vi công việc, thời hạn, giá trị, điều kiện thanh toán,
  bảo mật, xử lý vi phạm, luật áp dụng (Luật VN)
Template: templates/contracts/hop-dong-dich-vu.docx

## Nhắc hết hạn
Query DB: SELECT * FROM contracts WHERE expiry_date < NOW() + INTERVAL '30 days'
Cron: ngày 1 mỗi tháng kiểm tra và gửi danh sách
```

**Config**:
```jsonc
"agent-phap-che": {
  "displayName": "Pháp Chế ⚖️",
  "agent_type": "predefined",
  "model": "anthropic/claude-opus-4-6",
  "temperature": 0.1,
  "skills": ["phap-che", "office-docs"],
  "workspace": "./workspace/phap-che",
  "tools": { "alsoAllow": ["web_search"] },
  "identity": { "name": "Pháp Chế", "emoji": "⚖️" }
}
```

---

### 4.4 Agent HR / Nhân Sự (👥)

**Vai trò**: Tuyển dụng, hồ sơ nhân viên, onboarding, kỷ luật, nghỉ phép, đánh giá.

**Tác vụ thường xuyên**:
- Soạn quyết định tuyển dụng / thôi việc
- Theo dõi ngày phép còn lại
- Chuẩn bị hồ sơ onboarding nhân viên mới
- Nhắc sinh nhật, kỷ niệm ngày làm việc
- Tổng hợp chấm công

**Config**:
```jsonc
"agent-hr": {
  "displayName": "HR / Nhân Sự 👥",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.4,
  "skills": ["hr", "office-docs"],
  "workspace": "./workspace/hr",
  "identity": { "name": "HR", "emoji": "👥" },
  "heartbeat": {
    "enabled": true,
    "interval_minutes": 1440,
    "checklist": [
      "Kiểm tra sinh nhật nhân viên hôm nay",
      "Kiểm tra hợp đồng thử việc sắp hết hạn (7 ngày)"
    ]
  }
}
```

---

### 4.5 Agent Admin / Văn Phòng (📋)

**Vai trò**: Soạn thảo văn bản hành chính, công văn, biên bản họp, lịch họp, quản lý tài sản văn phòng.

**Tác vụ thường xuyên**:
- Soạn công văn đi/đến
- Biên bản cuộc họp
- Theo dõi lịch họp, nhắc nhở
- Quản lý văn phòng phẩm, tài sản

**Config**:
```jsonc
"agent-admin": {
  "displayName": "Admin VP 📋",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.3,
  "skills": ["admin", "office-docs"],
  "workspace": "./workspace/admin",
  "identity": { "name": "Admin VP", "emoji": "📋" }
}
```

---

### 4.6 Agent Logistics / Vận Hành (🚚)

**Vai trò**: Quản lý đơn hàng, vận chuyển, nhà cung cấp, theo dõi giao hàng.

**Tác vụ thường xuyên**:
- Tạo/theo dõi đơn mua hàng (PO)
- Xác nhận lịch giao hàng
- Báo cáo tình trạng đơn hàng
- Tìm và so sánh nhà cung cấp

**Config**:
```jsonc
"agent-logistics": {
  "displayName": "Logistics 🚚",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.2,
  "skills": ["logistics", "office-docs"],
  "workspace": "./workspace/logistics",
  "identity": { "name": "Logistics", "emoji": "🚚" }
}
```

---

### 4.7 Agent Marketing (📣)

**Vai trò**: Content marketing, kế hoạch chiến dịch, phân tích hiệu quả, social media.

**Tác vụ thường xuyên**:
- Lên kế hoạch nội dung tháng
- Viết bài blog, caption mạng xã hội
- Báo cáo hiệu quả chiến dịch (xlsx)
- Phân tích đối thủ cạnh tranh

**Config**:
```jsonc
"agent-marketing": {
  "displayName": "Marketing 📣",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.7,
  "skills": ["marketing", "office-docs"],
  "workspace": "./workspace/marketing",
  "tools": { "alsoAllow": ["web_search", "browser"] },
  "identity": { "name": "Marketing", "emoji": "📣" }
}
```

---

### 4.8 Agent Quản Lý Dự Án (📊)

**Vai trò**: Lập kế hoạch dự án, theo dõi tiến độ, quản lý rủi ro, báo cáo milestone.

**Tác vụ thường xuyên**:
- Tạo kế hoạch dự án (Gantt-style xlsx)
- Cập nhật tiến độ từ team
- Báo cáo tuần/tháng cho ban lãnh đạo
- Quản lý task board, assign công việc

**Config**:
```jsonc
"agent-du-an": {
  "displayName": "Quản Lý Dự Án 📊",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.3,
  "skills": ["du-an", "office-docs"],
  "workspace": "./workspace/du-an",
  "identity": { "name": "PM", "emoji": "📊" },
  "heartbeat": {
    "enabled": true,
    "interval_minutes": 480,
    "checklist": [
      "Kiểm tra task quá deadline trong DB",
      "Tổng hợp tiến độ dự án đang chạy"
    ]
  }
}
```

---

### 4.9 Agent IT Team (💻)

**Vai trò**: Hỗ trợ kỹ thuật nội bộ, triển khai code, quản lý hệ thống, security.

**Tác vụ thường xuyên**:
- Hỗ trợ nhân viên vấn đề kỹ thuật
- Deploy code, manage VPS
- Monitor hệ thống qua heartbeat
- Viết tài liệu kỹ thuật
- Claude Code integration cho dev tasks

**Config**:
```jsonc
"agent-it": {
  "displayName": "IT Team 💻",
  "agent_type": "predefined",
  "provider": "acp",
  "model": "claude-sonnet-4-5",
  "temperature": 0.2,
  "max_tool_iterations": 50,
  "skills": ["office-docs"],
  "workspace": "./workspace/it",
  "tools": { "profile": "coding" },
  "sandbox": { "mode": "non-main" },
  "identity": { "name": "IT Team", "emoji": "💻" }
}
```

*Lưu ý: agent IT dùng ACP provider (Claude Code) để có khả năng chạy code, bash, deploy.*

---

### 4.10 Agent Kho Vận / Warehouse (📦)

**Vai trò**: Quản lý tồn kho, nhập/xuất kho, kiểm kê, cảnh báo hàng sắp hết.

**Tác vụ thường xuyên**:
- Tạo phiếu nhập/xuất kho (xlsx)
- Báo cáo tồn kho thời điểm
- Cảnh báo hàng dưới mức tối thiểu
- Kiểm kê định kỳ

**Config**:
```jsonc
"agent-kho-van": {
  "displayName": "Kho Vận 📦",
  "agent_type": "predefined",
  "model": "anthropic/claude-sonnet-4-5",
  "temperature": 0.1,
  "skills": ["kho-van", "office-docs"],
  "workspace": "./workspace/kho-van",
  "identity": { "name": "Kho Vận", "emoji": "📦" },
  "heartbeat": {
    "enabled": true,
    "interval_minutes": 240,
    "checklist": [
      "Kiểm tra hàng tồn kho dưới mức tối thiểu",
      "Kiểm tra đơn nhập hàng đang chờ"
    ]
  }
}
```

---

### 4.11 Agent CSKH / Customer Service (🎯)

**Vai trò**: Trả lời khách hàng qua Zalo OA, xử lý khiếu nại, tra cứu đơn hàng, hỗ trợ sau bán.

**Tác vụ thường xuyên**:
- Trả lời câu hỏi sản phẩm/dịch vụ
- Tra cứu tình trạng đơn hàng
- Xử lý khiếu nại, escalate khi cần
- Thu thập feedback khách hàng
- Tạo ticket hỗ trợ

**Config**:
```jsonc
"agent-cskh": {
  "displayName": "CSKH 🎯",
  "agent_type": "open",
  "model": "anthropic/claude-haiku-4-5-20251001",
  "temperature": 0.5,
  "skills": ["cskh"],
  "workspace": "./workspace/cskh",
  "tools": { "deny": ["bash", "exec"] },
  "identity": { "name": "CSKH", "emoji": "🎯" }
}
```

*Lưu ý: CSKH dùng Haiku (nhanh + rẻ) và `agent_type: open` vì mỗi khách hàng là một user riêng biệt. Deny bash/exec vì không cần.*

---

## 5. AGENT TEAMS & ORCHESTRATION

### Team: Dẹo Core Team

```
Lead:    deo-admin
Members: ke-toan, phap-che, hr, admin, logistics,
         marketing, du-an, it, kho-van, cskh
```

**Delegation links** (ai có thể delegate cho ai):

| Từ | Đến | Mode | Use case |
|---|---|---|---|
| deo-admin | tất cả | sync | Orchestrate yêu cầu phức tạp |
| ke-toan | phap-che | sync | Hợp đồng cần review pháp lý |
| du-an | ke-toan | async | Báo cáo chi phí dự án |
| du-an | it | async | Tech task trong dự án |
| logistics | kho-van | sync | Xác nhận tồn kho trước PO |
| hr | ke-toan | sync | Thông tin lương cho bảng lương |

### Orchestration Mode

- **Auto**: Dẹo Admin tự quyết định delegate hay tự xử lý
- **Explicit**: User chỉ định "@ke-toan làm X"
- **Manual**: Admin cấu hình rule cố định trong config

---

## 6. SƠ ĐỒ WORKFLOW

### Workflow 1: Yêu cầu đơn giản (1 agent)

```
User (Telegram)
    │ "soạn hợp đồng lao động cho Nguyễn Văn A"
    ▼
Dẹo Admin
    │ intent: hợp đồng lao động → phap-che
    │ delegate sync → agent-phap-che
    ▼
agent-phap-che
    ├── đọc shared/employees.md (tìm thông tin nhân viên)
    ├── query DB: SELECT * FROM employees WHERE name LIKE 'Nguyễn Văn A'
    ├── gọi OfficeCLI: merge template + data → hop-dong-ld-nguyen-van-a.docx
    └── lưu outputs/phap-che/hop-dong/2025-05/
    ▼
Dẹo Admin
    │ nhận file path
    ▼
User ← "✅ Hợp đồng đã soạn xong. [file]"
```

---

### Workflow 2: Yêu cầu phức tạp (multi-agent)

```
User: "Chuẩn bị hồ sơ vay vốn ngân hàng cho công ty X"
    ▼
Dẹo Admin (orchestrate)
    ├── delegate sync → ke-toan: "Tạo BCTC 3 năm gần nhất"
    │       └── ke-toan: query DB → tạo bao-cao-tai-chinh.xlsx
    │
    ├── delegate sync → phap-che: "Tạo danh sách hợp đồng còn hiệu lực"
    │       └── phap-che: query DB → danh-sach-hop-dong.xlsx
    │
    └── delegate sync → hr: "Tạo danh sách nhân sự chủ chốt"
            └── hr: query DB → danh-sach-nhan-su.xlsx
    ▼
Dẹo Admin
    ├── gọi OfficeCLI: tạo ho-so-vay-von.docx (tổng hợp)
    └── zip 4 files → ho-so-vay-von-cty-x-2025.zip
    ▼
User ← "✅ Hồ sơ vay vốn hoàn thiện. [zip]"
```

---

### Workflow 3: Cron tự động — Bảng lương tháng

```
[Cron: 8:00 ngày 25 hàng tháng]
    ▼
agent-ke-toan (isolated session)
    ├── query DB: SELECT * FROM employees, attendance WHERE month = current
    ├── tính lương, BHXH, thuế theo luật VN
    ├── delegate sync → hr: "Xác nhận ngày nghỉ phép tháng này"
    ├── delegate sync → phap-che: "Có nhân viên nào thay đổi HĐ tháng này?"
    ├── tổng hợp → gọi OfficeCLI → bang-luong-2025-05.xlsx
    ├── lưu outputs/ke-toan/bang-luong/
    └── gửi Telegram group #ke-toan: "✅ Bảng lương T5/2025 đã tạo xong [file]"
```

---

### Workflow 4: CSKH — Human in the loop

```
Khách hàng (Zalo OA)
    │ "Đơn hàng #DH-2025-001 của tôi đang ở đâu?"
    ▼
agent-cskh
    ├── query DB: SELECT * FROM orders WHERE order_id = 'DH-2025-001'
    ├── lấy trạng thái giao hàng
    └── trả lời khách
    │
    │ [Nếu khiếu nại phức tạp]
    ▼
agent-cskh → escalate → Dẹo Admin
    ▼
Dẹo Admin → notify Telegram (nhân viên phụ trách)
    "⚠️ Khách hàng [tên] cần hỗ trợ thêm. Xem ticket #XXX"
```

---

### Workflow 5: Kho Vận — Heartbeat cảnh báo

```
[Heartbeat: mỗi 4 giờ]
    ▼
agent-kho-van
    ├── query: SELECT * FROM inventory WHERE qty < min_qty
    │   → [Phát hiện: Sản phẩm A còn 5 cái, min = 20]
    ├── query: SELECT * FROM purchase_orders WHERE status = 'pending'
    └── gửi Telegram: "⚠️ Cảnh báo tồn kho:
                      - Sản phẩm A: còn 5/20 (cần đặt thêm)
                      [Link Dashboard]"
    │
    │ [Nếu user confirm: "đặt hàng luôn đi"]
    ▼
agent-kho-van → delegate → logistics
    └── logistics: tạo PO, gửi nhà cung cấp
```

---

## 7. GOCLAW CONFIG.JSON ĐẦY ĐỦ

```jsonc
{
  // ═══════════════════════════════════════════
  // GATEWAY
  // ═══════════════════════════════════════════
  "gateway": {
    "host": "0.0.0.0",
    "port": 18790,
    "token": "env:GOCLAW_GATEWAY_TOKEN",
    "owner_ids": ["YOUR_TELEGRAM_ID"],
    "max_message_chars": 32000,
    "rate_limit_rpm": 60,
    "injection_action": "warn",
    "inbound_debounce_ms": 1000,
    "tool_status": true,
    "task_recovery_interval_sec": 300,
    "quota": {
      "enabled": false  // tắt quota cho internal use
    }
  },

  // ═══════════════════════════════════════════
  // PROVIDERS
  // ═══════════════════════════════════════════
  "providers": {
    "anthropic": { "api_key": "env:GOCLAW_ANTHROPIC_API_KEY" },
    "openrouter": { "api_key": "env:GOCLAW_OPENROUTER_API_KEY" },
    "acp": {
      "binary": "claude",
      "model": "claude-sonnet-4-5",
      "work_dir": "/workspace/it/acp-work",
      "idle_ttl": "10m",
      "perm_mode": "approve-all"
    }
  },

  // ═══════════════════════════════════════════
  // MEMORY (GoClaw built-in — pgvector)
  // ═══════════════════════════════════════════
  "memory": {
    "enabled": true,
    "embedding_provider": "openrouter",
    "embedding_model": "openai/text-embedding-3-small",
    "max_results": 8,
    "max_chunk_len": 1200,
    "vector_weight": 0.7,
    "text_weight": 0.3,
    "min_score": 0.3
  },

  // ═══════════════════════════════════════════
  // AGENTS DEFAULTS
  // ═══════════════════════════════════════════
  "agents": {
    "defaults": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250929",
      "max_tokens": 8192,
      "temperature": 0.4,
      "max_tool_iterations": 25,
      "max_tool_calls": 30,
      "context_window": 200000,
      "agent_type": "predefined",
      "workspace": "./workspace",
      "memory": { "enabled": true },
      "tools": {
        "mcp": [
          {
            "name": "office",
            "command": "officecli",
            "args": ["mcp", "serve"],
            "tool_prefix": "office"
          },
          {
            "name": "markitdown",
            "command": "markitdown-mcp",
            "tool_prefix": "read"
          },
          {
            "name": "postgres",
            "command": "mcp-server-postgres",
            "args": ["env:POSTGRES_MCP_DSN"],
            "tool_prefix": "db"
          }
        ]
      }
    },

    // ─────────────────────────────────────
    // AGENT LIST
    // ─────────────────────────────────────
    "list": {

      "deo-admin": {
        "displayName": "Dẹo Admin 🏢",
        "agent_type": "predefined",
        "model": "claude-sonnet-4-5-20250929",
        "temperature": 0.3,
        "max_tool_iterations": 40,
        "skills": ["office-docs"],
        "identity": { "name": "Dẹo Admin", "emoji": "🏢" },
        "default": true
      },

      "agent-ke-toan": {
        "displayName": "Kế Toán 💰",
        "temperature": 0.1,
        "skills": ["ke-toan", "office-docs"],
        "workspace": "./workspace/ke-toan",
        "identity": { "name": "Kế Toán", "emoji": "💰" },
        "heartbeat": {
          "enabled": true,
          "interval_minutes": 480,
          "checklist": [
            "Kiểm tra công nợ quá hạn trong bảng receivables",
            "Kiểm tra chứng từ chưa được duyệt"
          ],
          "quiet_hours": { "from": "22:00", "to": "07:00", "tz": "Asia/Ho_Chi_Minh" }
        }
      },

      "agent-phap-che": {
        "displayName": "Pháp Chế ⚖️",
        "model": "claude-opus-4-6",
        "temperature": 0.1,
        "skills": ["phap-che", "office-docs"],
        "workspace": "./workspace/phap-che",
        "tools": { "alsoAllow": ["web_search"] },
        "identity": { "name": "Pháp Chế", "emoji": "⚖️" }
      },

      "agent-hr": {
        "displayName": "HR 👥",
        "temperature": 0.4,
        "skills": ["hr", "office-docs"],
        "workspace": "./workspace/hr",
        "identity": { "name": "HR", "emoji": "👥" },
        "heartbeat": {
          "enabled": true,
          "interval_minutes": 1440,
          "checklist": [
            "Kiểm tra sinh nhật nhân viên hôm nay",
            "Kiểm tra hợp đồng thử việc hết hạn trong 7 ngày"
          ],
          "quiet_hours": { "from": "18:00", "to": "08:00", "tz": "Asia/Ho_Chi_Minh" }
        }
      },

      "agent-admin": {
        "displayName": "Admin VP 📋",
        "temperature": 0.3,
        "skills": ["admin", "office-docs"],
        "workspace": "./workspace/admin",
        "identity": { "name": "Admin VP", "emoji": "📋" }
      },

      "agent-logistics": {
        "displayName": "Logistics 🚚",
        "temperature": 0.2,
        "skills": ["logistics", "office-docs"],
        "workspace": "./workspace/logistics",
        "identity": { "name": "Logistics", "emoji": "🚚" }
      },

      "agent-marketing": {
        "displayName": "Marketing 📣",
        "temperature": 0.7,
        "skills": ["marketing", "office-docs"],
        "workspace": "./workspace/marketing",
        "tools": { "alsoAllow": ["web_search", "browser"] },
        "identity": { "name": "Marketing", "emoji": "📣" }
      },

      "agent-du-an": {
        "displayName": "Quản Lý DA 📊",
        "temperature": 0.3,
        "skills": ["du-an", "office-docs"],
        "workspace": "./workspace/du-an",
        "identity": { "name": "PM", "emoji": "📊" },
        "heartbeat": {
          "enabled": true,
          "interval_minutes": 480,
          "checklist": [
            "Kiểm tra task quá deadline",
            "Tổng hợp tiến độ milestones tuần này"
          ]
        }
      },

      "agent-it": {
        "displayName": "IT Team 💻",
        "provider": "acp",
        "model": "claude-sonnet-4-5",
        "temperature": 0.2,
        "max_tool_iterations": 50,
        "skills": ["office-docs"],
        "workspace": "./workspace/it",
        "tools": { "profile": "coding" },
        "sandbox": { "mode": "non-main" },
        "identity": { "name": "IT Team", "emoji": "💻" }
      },

      "agent-kho-van": {
        "displayName": "Kho Vận 📦",
        "temperature": 0.1,
        "skills": ["kho-van", "office-docs"],
        "workspace": "./workspace/kho-van",
        "identity": { "name": "Kho Vận", "emoji": "📦" },
        "heartbeat": {
          "enabled": true,
          "interval_minutes": 240,
          "checklist": [
            "Kiểm tra hàng tồn kho dưới mức min_qty",
            "Kiểm tra đơn nhập hàng quá hạn giao"
          ]
        }
      },

      "agent-cskh": {
        "displayName": "CSKH 🎯",
        "agent_type": "open",
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001",
        "temperature": 0.5,
        "skills": ["cskh"],
        "workspace": "./workspace/cskh",
        "tools": { "deny": ["bash", "exec", "write_file"] },
        "identity": { "name": "CSKH", "emoji": "🎯" }
      }
    }
  },

  // ═══════════════════════════════════════════
  // CHANNELS
  // ═══════════════════════════════════════════
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "env:TELEGRAM_BOT_TOKEN_MAIN",
      "allow_from": ["env:TELEGRAM_OWNER_ID"],
      "dm_policy": "allowlist",
      "group_policy": "allowlist",
      "require_mention": false,
      "dm_stream": true,
      "draft_transport": true,
      "reaction_level": "full",
      "groups": {
        "env:TG_GROUP_KE_TOAN": { "agent_id": "agent-ke-toan" },
        "env:TG_GROUP_PHAP_CHE": { "agent_id": "agent-phap-che" },
        "env:TG_GROUP_HR":      { "agent_id": "agent-hr" },
        "env:TG_GROUP_ADMIN":   { "agent_id": "agent-admin" },
        "env:TG_GROUP_LOGISTICS": { "agent_id": "agent-logistics" },
        "env:TG_GROUP_MARKETING": { "agent_id": "agent-marketing" },
        "env:TG_GROUP_DU_AN":   { "agent_id": "agent-du-an" },
        "env:TG_GROUP_IT":      { "agent_id": "agent-it" },
        "env:TG_GROUP_KHO_VAN": { "agent_id": "agent-kho-van" }
      }
    },
    "zalo": {
      "enabled": true,
      "token": "env:ZALO_OA_TOKEN",
      "dm_policy": "open",
      "webhook_url": "https://goclaw.enterpriseos.bond/zalo/webhook",
      "webhook_secret": "env:ZALO_WEBHOOK_SECRET"
    }
  },

  // ═══════════════════════════════════════════
  // BINDINGS — Agent routing
  // ═══════════════════════════════════════════
  "bindings": {
    "telegram:env:TG_GROUP_CSKH": "agent-cskh",
    "zalo:*": "agent-cskh"
  },

  // ═══════════════════════════════════════════
  // CRON JOBS
  // ═══════════════════════════════════════════
  "cron": [
    {
      "name": "bang-luong-thang",
      "agent_id": "agent-ke-toan",
      "schedule": "0 8 25 * *",
      "prompt": "Tổng hợp bảng lương tháng này. Lấy dữ liệu từ DB (bảng employees, attendance). Tính BHXH, BHYT, BHTN, thuế TNCN theo biểu thuế lũy tiến. Tạo file bang-luong-[YYYY-MM].xlsx vào outputs/ke-toan/bang-luong/. Gửi thông báo khi xong.",
      "session": "isolated",
      "enabled": true,
      "tz": "Asia/Ho_Chi_Minh"
    },
    {
      "name": "nhac-nop-thue",
      "agent_id": "agent-ke-toan",
      "schedule": "0 9 18 * *",
      "prompt": "Nhắc nhở: còn 2 ngày đến hạn nộp tờ khai thuế GTGT. Kiểm tra xem đã chuẩn bị chưa và báo cáo tình trạng.",
      "session": "isolated",
      "enabled": true,
      "tz": "Asia/Ho_Chi_Minh"
    },
    {
      "name": "kiem-tra-hop-dong-het-han",
      "agent_id": "agent-phap-che",
      "schedule": "0 9 1 * *",
      "prompt": "Query DB: tìm tất cả hợp đồng hết hạn trong 30 ngày tới. Tạo báo cáo danh sách vào outputs/phap-che/. Gửi thông báo Telegram với tóm tắt.",
      "session": "isolated",
      "enabled": true,
      "tz": "Asia/Ho_Chi_Minh"
    },
    {
      "name": "bao-cao-tuan-du-an",
      "agent_id": "agent-du-an",
      "schedule": "0 7 * * 1",
      "prompt": "Tổng hợp tiến độ tất cả dự án đang chạy trong tuần vừa qua. Tạo báo cáo tuần dạng xlsx. Highlight task trễ hạn và milestone quan trọng tuần tới.",
      "session": "isolated",
      "enabled": true,
      "tz": "Asia/Ho_Chi_Minh"
    },
    {
      "name": "bao-cao-cuoi-ngay",
      "agent_id": "deo-admin",
      "schedule": "0 17 * * 1-5",
      "prompt": "Tổng hợp các hoạt động trong ngày hôm nay: số task hoàn thành, file tạo ra, vấn đề nổi bật. Gửi digest tóm tắt.",
      "session": "isolated",
      "enabled": true,
      "tz": "Asia/Ho_Chi_Minh"
    }
  ],

  // ═══════════════════════════════════════════
  // COMPACTION & CONTEXT
  // ═══════════════════════════════════════════
  "compaction": {
    "reserveTokensFloor": 20000,
    "maxHistoryShare": 0.75,
    "minMessages": 50,
    "keepLastMessages": 4,
    "memoryFlush": { "enabled": true }
  },

  "context_pruning": {
    "mode": "cache-ttl",
    "keepLastAssistants": 3,
    "softTrimRatio": 0.3,
    "hardClearRatio": 0.5
  },

  // ═══════════════════════════════════════════
  // SUBAGENTS
  // ═══════════════════════════════════════════
  "subagents": {
    "maxConcurrent": 10,
    "maxSpawnDepth": 2,
    "maxChildrenPerAgent": 5,
    "archiveAfterMinutes": 60,
    "model": "claude-haiku-4-5-20251001"
  }
}
```

---

## 8. CRON & HEARTBEAT SCHEDULE

### Cron Jobs tổng hợp

| Job | Agent | Schedule | Mô tả |
|---|---|---|---|
| Bảng lương | ke-toan | `0 8 25 * *` | Ngày 25 mỗi tháng |
| Nhắc thuế GTGT | ke-toan | `0 9 18 * *` | Ngày 18 mỗi tháng |
| Kiểm HĐ hết hạn | phap-che | `0 9 1 * *` | Ngày 1 mỗi tháng |
| Báo cáo tuần | du-an | `0 7 * * 1` | Thứ Hai 7h |
| Digest cuối ngày | deo-admin | `0 17 * * 1-5` | T2-T6, 17h |
| Tồn kho thấp | kho-van | heartbeat | Mỗi 4h |
| Công nợ quá hạn | ke-toan | heartbeat | Mỗi 8h |
| Task trễ deadline | du-an | heartbeat | Mỗi 8h |
| Sinh nhật NV | hr | heartbeat | Mỗi ngày 8h |

---

## 9. MCP TOOLS

### Shared (agents.defaults) — tất cả agents đều có

| MCP Server | Công cụ cung cấp | Prefix |
|---|---|---|
| OfficeCLI | create_docx, create_xlsx, create_pptx, merge_template, read_doc | `office__` |
| MarkItDown | convert_to_markdown (docx/xlsx/pdf/png → text) | `read__` |
| Postgres MCP | query, execute, describe_table | `db__` |

### Per-agent additions

| Agent | Extra MCP | Lý do |
|---|---|---|
| marketing | browser (Playwright) | Web scraping, competitor analysis |
| phap-che | web_search | Tra cứu quy định pháp luật mới nhất |
| it | ACP/Claude Code | Chạy code, bash, deploy |

---

## 10. SKILLS SYSTEM

### Skills là gì trong GoClaw?

GoClaw tự động inject SKILL.md vào system prompt khi agent cần. Skills là "domain knowledge files" — business rules, templates guide, cách xử lý nghiệp vụ.

### office-docs/SKILL.md (Shared skill)

```markdown
# Office Documents Skill

## Tạo văn bản Word (.docx)
Tool: office__create_docx hoặc office__merge_template
Quy tắc:
- Header: Logo công ty + tên công ty + địa chỉ
- Font: Times New Roman 13pt (nội dung), 14pt bold (tiêu đề)
- Lề: trên 2cm, dưới 2cm, trái 3cm, phải 2cm (chuẩn văn bản hành chính VN)
- Số văn bản: [Mã]-[Năm]-[Số thứ tự] (VD: HĐLĐ-2025-001)
- Lưu vào: outputs/{department}/{category}/

## Tạo bảng tính Excel (.xlsx)
Tool: office__create_xlsx
Quy tắc:
- Sheet đầu tiên: dữ liệu chính
- Sheet thứ hai: summary/tổng hợp nếu cần
- Cột tiêu đề: bold, background màu xanh nhạt (#E3F2FD)
- Số tiền: định dạng #,##0 VND
- Ngày tháng: DD/MM/YYYY

## Đọc file đầu vào
Tool: read__convert_to_markdown
Dùng khi user gửi file docx/xlsx/pdf để phân tích
```

### ke-toan/SKILL.md

```markdown
# Kế Toán Skill — Nghiệp vụ VN

## Bảng lương
...công thức BHXH, thuế TNCN chi tiết...

## Công nợ
Query: SELECT * FROM receivables WHERE due_date < CURRENT_DATE AND status != 'paid'
Phân loại: <30 ngày, 30-60 ngày, >60 ngày (bad debt)

## Thuế GTGT
...quy định kê khai, hạch toán...
```

---

## 11. DATABASE SCHEMA

### GoClaw internal schema (tự quản lý, không đụng vào)

```sql
-- GoClaw tự tạo và manage
goclaw.agents
goclaw.sessions
goclaw.messages
goclaw.memories          -- pgvector embeddings
goclaw.knowledge_graph   -- entities + relationships
goclaw.cron_jobs
goclaw.agent_heartbeats
goclaw.team_tasks
goclaw.llm_providers
goclaw.skills
```

### deo.* Business schema (bạn tự quản lý)

```sql
-- ── NHÂN SỰ ──────────────────────────────────────
CREATE TABLE deo.employees (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(20) UNIQUE,   -- NV001
  full_name    VARCHAR(100),
  dob          DATE,
  cccd         VARCHAR(12),
  phone        VARCHAR(15),
  email        VARCHAR(100),
  department   VARCHAR(50),          -- ke-toan, hr, it...
  position     VARCHAR(100),
  hire_date    DATE,
  contract_type VARCHAR(20),         -- chinh_thuc, thu_viec, partime
  base_salary  DECIMAL(15,2),
  status       VARCHAR(20),          -- active, resigned, maternity
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deo.attendance (
  id          SERIAL PRIMARY KEY,
  employee_id INT REFERENCES deo.employees(id),
  work_date   DATE,
  check_in    TIME,
  check_out   TIME,
  work_hours  DECIMAL(4,2),
  status      VARCHAR(20)  -- present, absent, leave, holiday
);

CREATE TABLE deo.leave_requests (
  id          SERIAL PRIMARY KEY,
  employee_id INT REFERENCES deo.employees(id),
  leave_type  VARCHAR(30), -- annual, sick, unpaid
  from_date   DATE,
  to_date     DATE,
  days        INT,
  reason      TEXT,
  status      VARCHAR(20), -- pending, approved, rejected
  approved_by INT REFERENCES deo.employees(id)
);

-- ── KẾ TOÁN ──────────────────────────────────────
CREATE TABLE deo.payroll (
  id           SERIAL PRIMARY KEY,
  employee_id  INT REFERENCES deo.employees(id),
  month        DATE,  -- first day of month
  gross        DECIMAL(15,2),
  bhxh         DECIMAL(15,2),
  bhyt         DECIMAL(15,2),
  bhtn         DECIMAL(15,2),
  tax          DECIMAL(15,2),
  net          DECIMAL(15,2),
  paid         BOOLEAN DEFAULT FALSE,
  file_path    VARCHAR(500)
);

CREATE TABLE deo.invoices (
  id           SERIAL PRIMARY KEY,
  invoice_no   VARCHAR(30) UNIQUE,
  type         VARCHAR(20),  -- receivable, payable
  partner_name VARCHAR(200),
  amount       DECIMAL(15,2),
  tax_amount   DECIMAL(15,2),
  issue_date   DATE,
  due_date     DATE,
  status       VARCHAR(20),  -- draft, sent, paid, overdue
  notes        TEXT
);

-- ── PHÁP CHẾ ─────────────────────────────────────
CREATE TABLE deo.contracts (
  id           SERIAL PRIMARY KEY,
  contract_no  VARCHAR(50) UNIQUE,
  type         VARCHAR(50),  -- lao_dong, dich_vu, mua_ban
  party_name   VARCHAR(200),
  value        DECIMAL(15,2),
  start_date   DATE,
  expiry_date  DATE,
  status       VARCHAR(20),  -- active, expired, terminated
  file_path    VARCHAR(500),
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ── KHO VẬN ──────────────────────────────────────
CREATE TABLE deo.products (
  id           SERIAL PRIMARY KEY,
  sku          VARCHAR(50) UNIQUE,
  name         VARCHAR(200),
  unit         VARCHAR(20),
  qty_on_hand  DECIMAL(10,2),
  min_qty      DECIMAL(10,2),
  location     VARCHAR(100),  -- kho, vị trí
  cost_price   DECIMAL(15,2)
);

CREATE TABLE deo.stock_movements (
  id           SERIAL PRIMARY KEY,
  product_id   INT REFERENCES deo.products(id),
  type         VARCHAR(20),  -- in, out, adjustment
  qty          DECIMAL(10,2),
  reference_no VARCHAR(50),
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  created_by   INT REFERENCES deo.employees(id)
);

-- ── LOGISTICS ────────────────────────────────────
CREATE TABLE deo.purchase_orders (
  id           SERIAL PRIMARY KEY,
  po_no        VARCHAR(30) UNIQUE,
  supplier     VARCHAR(200),
  status       VARCHAR(20),  -- draft, sent, confirmed, received
  expected_date DATE,
  total_amount DECIMAL(15,2),
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deo.orders (
  id           SERIAL PRIMARY KEY,
  order_no     VARCHAR(30) UNIQUE,
  customer     VARCHAR(200),
  status       VARCHAR(30),  -- pending, processing, shipped, delivered
  total_amount DECIMAL(15,2),
  shipping_address TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ── DỰ ÁN ────────────────────────────────────────
CREATE TABLE deo.projects (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(20) UNIQUE,
  name         VARCHAR(200),
  status       VARCHAR(20),  -- planning, active, completed, paused
  start_date   DATE,
  end_date     DATE,
  budget       DECIMAL(15,2),
  manager_id   INT REFERENCES deo.employees(id)
);

CREATE TABLE deo.project_tasks (
  id           SERIAL PRIMARY KEY,
  project_id   INT REFERENCES deo.projects(id),
  title        TEXT,
  assignee_id  INT REFERENCES deo.employees(id),
  status       VARCHAR(20),  -- todo, in_progress, review, done
  priority     VARCHAR(10),  -- high, medium, low
  due_date     DATE,
  completed_at TIMESTAMP
);

-- ── CSKH ─────────────────────────────────────────
CREATE TABLE deo.support_tickets (
  id           SERIAL PRIMARY KEY,
  ticket_no    VARCHAR(30) UNIQUE,
  customer     VARCHAR(200),
  channel      VARCHAR(20),  -- zalo, telegram, phone
  subject      TEXT,
  status       VARCHAR(20),  -- open, in_progress, resolved, closed
  priority     VARCHAR(10),
  assigned_to  INT REFERENCES deo.employees(id),
  created_at   TIMESTAMP DEFAULT NOW(),
  resolved_at  TIMESTAMP
);

-- ── AGENT AUDIT LOG (Bạn tự build) ───────────────
CREATE TABLE deo.agent_actions (
  id           SERIAL PRIMARY KEY,
  agent_id     VARCHAR(50),
  action_type  VARCHAR(50),  -- file_created, query_run, delegation
  description  TEXT,
  file_path    VARCHAR(500),
  triggered_by VARCHAR(100), -- telegram_user_id, cron, heartbeat
  created_at   TIMESTAMP DEFAULT NOW()
);
```

---

## 12. AGENT TỰ HỌC & TỰ NÂNG CẤP

### GoClaw cung cấp sẵn 3 cơ chế — dùng luôn, không build lại:

#### Cơ chế 1: Agent Evolution (built-in)

<cite>GoClaw có self-evolution pipeline 3 giai đoạn: metrics collection → suggestion analysis → guardrail-protected auto-adaptation.</cite>

Agent có thể tự cải thiện `CAPABILITIES.md` (domain expertise) nhưng **không bao giờ thay đổi** SOUL.md, IDENTITY.md, tên, hoặc mục đích cốt lõi.

**Kích hoạt**: Bật trong Dashboard → Agent Settings → Evolution → Enable

**Cách hoạt động**:
```
Sau mỗi N sessions:
1. GoClaw thu thập metrics: response time, user satisfaction, retry rate
2. Phân tích: "agent thường được hỏi gì? sai ở đâu? cần thêm kiến thức gì?"
3. Đề xuất: "Thêm section X vào CAPABILITIES.md"
4. Bạn approve → agent tự cập nhật file
```

#### Cơ chế 2: Memory Consolidation (built-in)

GoClaw có memory consolidation pipeline: episodic → semantic → dreaming promotion, chạy async sau mỗi session.

Ý nghĩa thực tế:
- Agent ke-toan nhớ "Công ty hay bị nhắc thuế trễ tháng 3" → tự nhắc sớm hơn
- Agent phap-che nhớ "Khách hàng X hay yêu cầu điều khoản bảo mật đặc biệt"
- Agent hr nhớ "Manager A thích nhận thông tin dạng bullet points"

#### Cơ chế 3: Knowledge Graph (built-in)

GoClaw tự extract entities và relationships từ conversations → searchable graph.

```
"Nguyễn Văn A" ──[là]──→ "Kế toán trưởng"
"Kế toán trưởng" ──[quản lý]──→ "Team Kế Toán"
"Hợp đồng ABC-001" ──[ký với]──→ "Công ty XYZ"
```

Agents dùng KG để tra cứu context mà không cần user giải thích lại.

#### Cơ chế 4: Skills tự cập nhật (bạn quản lý + agent đề xuất)

Agent có thể dùng tool `write_file` để đề xuất cập nhật SKILL.md của mình:
```
Agent ke-toan: "Tôi phát hiện cách tính phụ cấp độc hại năm 2025 đã thay đổi.
                Tôi đã cập nhật ke-toan/SKILL.md. Vui lòng review."
```
Bạn review, approve → skill được cập nhật cho tất cả lần sau.

---

## 13. DASHBOARD UI/UX

### GoClaw Dashboard (built-in tại :18790)

GoClaw đã có web dashboard React built-in. Tận dụng tối đa:

**Màn hình có sẵn**:
- Agent list + trạng thái online/offline
- Session history + full conversation search
- Task Board (team tasks)
- Cron jobs management
- Knowledge Graph visualization
- Memory explorer
- Cost tracking (token usage)
- Logs viewer (live tail)

### Custom Dashboard trên VPS (Next.js — bổ sung)

Chỉ build thêm những gì GoClaw **chưa có**:

```
app.enterpriseos.bond/
│
├── /dashboard              ← Overview tổng thể
│   ├── KPI cards: tasks hôm nay, files tạo ra, agents active
│   ├── Activity feed realtime
│   └── Quick actions: trigger agent, upload file
│
├── /agents                 ← Gọi GoClaw API
│   ├── Chat với từng agent
│   └── Trạng thái heartbeat
│
├── /files                  ← File manager cho workspace/outputs/
│   ├── Browse by department
│   ├── Download / Preview
│   └── Search fulltext
│
├── /ke-toan                ← Business modules
│   ├── Danh sách chứng từ
│   ├── Bảng lương lịch sử
│   └── Công nợ tracking
│
├── /phap-che
│   ├── Danh sách hợp đồng
│   └── Contract expiry timeline
│
├── /hr
│   ├── Danh sách nhân viên
│   └── Org chart
│
├── /kho-van
│   ├── Tồn kho realtime
│   └── Movement history
│
└── /reports                ← Aggregated reports
    ├── Kéo từ GoClaw outputs/
    └── Chart/visualization từ deo.* DB
```

### UX Principles cho Dashboard

- **Mobile-first**: quản lý qua điện thoại là chính, không phải desktop
- **Action-oriented**: mỗi màn hình có "Quick Send to Agent" button
- **File-centric**: output files là kết quả, phải dễ tìm/download
- **Notification hub**: tổng hợp thông báo từ tất cả agents

---

## 14. MIGRATION PLAN TỪ OPENCLAW

### Giai đoạn 1 — Chuẩn bị (1-2 ngày)

```bash
# Xeon: cài GoClaw song song OpenClaw
./goclaw onboard
# GoClaw chạy port 18790, OpenClaw vẫn chạy port cũ

# Cài MCP tools
npm install -g officecli
pip install markitdown-mcp --break-system-packages
npm install -g @modelcontextprotocol/server-postgres

# Tạo cấu trúc thư mục workspace
mkdir -p /workspace/{skills,templates,inputs,outputs,agents,shared}
mkdir -p /workspace/templates/{contracts,hr,ke-toan,logistics,marketing,du-an}
mkdir -p /workspace/outputs/{ke-toan,phap-che,hr,admin,logistics,marketing,du-an,it,kho-van,cskh}
```

### Giai đoạn 2 — Copy workspace từ OpenClaw (30 phút)

```bash
# Import SOUL.md, MEMORY.md từ OpenClaw workspaces
cp ~/.openclaw/workspaces/main/SOUL.md /workspace/agents/deo-admin/
cp ~/.openclaw/workspaces/*/MEMORY.md  /workspace/agents/*/
# GoClaw migration wizard sẽ tự detect và offer import
```

### Giai đoạn 3 — Config & Test (1 ngày)

1. Paste `config.json` từ mục 7 vào `/workspace/config.json`
2. Tạo `.env.local` với tất cả secrets
3. Chạy `./goclaw migrate up`
4. Test từng agent qua Telegram
5. Thêm Cloudflare hostname mới: `goclaw.enterpriseos.bond`

### Giai đoạn 4 — Cutover (1 ngày)

1. Cập nhật webapp VPS → gọi GoClaw endpoint mới
2. Di chuyển Telegram bot token sang GoClaw config
3. Chạy Zalo OA setup
4. Bật các cron jobs
5. Tắt OpenClaw

---

## CHECKLIST TRIỂN KHAI

### Xeon Workstation
- [ ] GoClaw cài đặt và chạy `:18790`
- [ ] Postgres GoClaw schema migrate xong
- [ ] OfficeCLI MCP chạy được
- [ ] MarkItDown MCP chạy được
- [ ] Postgres MCP connect VPS DB được
- [ ] Cloudflare Tunnel hostname `goclaw.enterpriseos.bond`
- [ ] Tất cả 11 agents tạo xong, SOUL.md viết xong
- [ ] Skills library tạo xong (11 SKILL.md files)
- [ ] Template files copy vào `/workspace/templates/`
- [ ] Cron jobs enabled
- [ ] Heartbeat enabled cho ke-toan, hr, du-an, kho-van

### VPS
- [ ] deo.* schema migrate xong (tất cả tables từ mục 11)
- [ ] Next.js dashboard deploy
- [ ] Postgres MCP DSN config đúng
- [ ] CORS whitelist cho GoClaw origin

### Channels
- [ ] Telegram bot chính hoạt động
- [ ] Telegram groups từng bộ phận setup
- [ ] Zalo OA webhook active
- [ ] Test round-trip: Telegram → GoClaw → file output → Telegram

---

*Document này được tạo cho Dẹo Enterprise OS v2.0 — GoClaw Edition*
*Cập nhật: 04/2026 | Tác giả: Dẹo OS Architecture Team*
