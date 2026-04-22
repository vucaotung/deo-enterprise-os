# Dẹo Enterprise OS — Version 1.2 Upgrade Plan
**Status:** Planning
**Target Version:** 1.2.0
**Previous Version:** 1.0.0
**Date:** April 2026
**Author:** Tung Vu Ca

---

## 🎯 Tầm nhìn v1.2

> "Từ một app quản lý doanh nghiệp → thành một **living system** biết nhớ, biết học, biết tổng hợp."

Version 1.0 đã có: API đủ mạnh, dashboard, agent orchestration cơ bản.

Version 1.2 thêm **não bộ** vào hệ thống:
- **Google Drive** = kho lưu trữ tập trung, source-of-truth cho files
- **VPS (2nd Brain Hub)** = trung tâm xử lý, tổng hợp, lưu trữ knowledge
- **Obsidian** = giao diện con người với 2nd brain, sync với VPS

---

## 📐 Architecture Overview v1.2

```
┌─────────────────────────────────────────────────────────────┐
│                    HUMAN INTERFACE LAYER                     │
│   Telegram │ Webapp │ Obsidian (local) │ Email │ Zalo        │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────▼───────────────┐
          │        VPS CORE            │
          │   (173.249.51.69)          │
          │                            │
          │  ┌─────────────────────┐   │
          │  │  DEO ENTERPRISE OS  │   │
          │  │  API + Worker       │   │
          │  │  PostgreSQL + Redis │   │
          │  └─────────┬───────────┘   │
          │            │               │
          │  ┌─────────▼───────────┐   │
          │  │   2ND BRAIN HUB     │   │◄──── Obsidian Sync
          │  │   Obsidian Vault    │   │      (git / rclone)
          │  │   Vector Store      │   │
          │  │   Knowledge Graph   │   │
          │  └─────────┬───────────┘   │
          └────────────┼───────────────┘
                       │
          ┌────────────▼───────────────┐
          │      GOOGLE DRIVE          │
          │   (Primary File Storage)   │
          │   DEO-OS/ folder           │
          │   ↕ rclone sync            │
          └────────────────────────────┘
```

---

## 🗂️ Google Drive — Cấu Trúc Thư Mục Chính Thức

Google Drive là **kho lưu trữ file tập trung** — mọi file quan trọng đều qua đây.

```
📁 DEO-OS/
│
├── 📁 00_INBOX/
│   ├── 📁 _capture/           # Drop file bất kỳ vào đây trước
│   ├── 📁 _to-process/        # Đã capture, chờ phân loại
│   └── 📁 _done/              # Đã xử lý (auto-archive sau 30 ngày)
│
├── 📁 01_CLIENTS/
│   └── 📁 {TenKhachHang}/
│       ├── 📁 contracts/       # Hợp đồng (PDF)
│       ├── 📁 proposals/       # Báo giá, đề xuất
│       ├── 📁 briefs/          # Brief dự án
│       ├── 📁 deliverables/    # Files bàn giao
│       ├── 📁 meetings/        # Biên bản, ghi chú họp
│       └── 📁 correspondence/  # Email, tin nhắn quan trọng
│
├── 📁 02_PROJECTS/
│   └── 📁 {TenDuAn}_{YYYYMM}/
│       ├── 📁 00_brief/        # Brief ban đầu
│       ├── 📁 01_research/     # Nghiên cứu, tham khảo
│       ├── 📁 02_planning/     # Kế hoạch, timeline
│       ├── 📁 03_execution/    # Files làm việc
│       ├── 📁 04_review/       # Review, feedback
│       ├── 📁 05_delivery/     # Bàn giao cuối
│       └── 📄 _PROJECT_LOG.md  # Log tiến độ
│
├── 📁 03_FINANCE/
│   ├── 📁 invoices/
│   │   ├── 📁 outgoing/        # Hóa đơn xuất
│   │   └── 📁 incoming/        # Hóa đơn nhận
│   ├── 📁 receipts/            # Chứng từ, biên lai
│   │   └── 📁 {YYYY-MM}/      # Theo tháng
│   ├── 📁 reports/
│   │   └── 📁 {YYYY}/          # Báo cáo tài chính năm
│   └── 📁 contracts/           # Hợp đồng tài chính
│
├── 📁 04_AGENTS/
│   ├── 📁 configs/             # Agent config files (JSON)
│   ├── 📁 prompts/             # System prompts
│   ├── 📁 logs/                # Agent output logs
│   │   └── 📁 {YYYY-MM}/
│   └── 📁 templates/           # Task templates
│
├── 📁 05_KNOWLEDGE/
│   ├── 📁 wiki-exports/        # Export từ Obsidian vault
│   │   └── 📁 {YYYY-MM}/
│   ├── 📁 research/            # Nghiên cứu, tài liệu học
│   ├── 📁 sops/                # Standard Operating Procedures
│   └── 📁 playbooks/           # Playbooks theo domain
│
├── 📁 06_SYSTEM/
│   ├── 📁 backups/
│   │   ├── 📁 database/        # PostgreSQL dumps
│   │   └── 📁 configs/         # Config backups
│   ├── 📁 configs/             # .env templates, docker configs
│   └── 📁 docs/                # Internal documentation
│
└── 📁 07_ARCHIVE/
    └── 📁 {YYYY}/              # Archive theo năm
```

**Quy tắc Google Drive:**
- Mọi file business đều vào `00_INBOX/_capture/` trước
- Không đặt file ở root của DEO-OS/
- Tên thư mục dùng `SNAKE_CASE_VIET_NAM` hoặc tên tiếng Việt rõ ràng
- File archive sau 2 năm hoạt động

---

## 🖥️ VPS — Cấu Trúc Thư Mục 2nd Brain Hub

VPS là **trung tâm xử lý** — nơi tất cả dữ liệu hội tụ, được xử lý và kết nối.

```
/opt/deo-enterprise-os/          # Repo chính (code)
/opt/deo-brain/                  # 2nd Brain Hub (DATA, tách biệt code)
/opt/deo-data/                   # Persistent data (DB, uploads, cache)
```

### `/opt/deo-brain/` — 2nd Brain Hub

```
/opt/deo-brain/
│
├── 📁 vault/                    # Obsidian Vault (git-tracked)
│   ├── 📁 00-inbox/             # Capture nhanh (= GDrive inbox)
│   ├── 📁 01-notes/             # Notes ngắn, fleeting notes
│   ├── 📁 02-projects/          # Project notes (link → GDrive)
│   ├── 📁 03-areas/             # Areas of responsibility
│   │   ├── 📁 business/
│   │   ├── 📁 tech/
│   │   ├── 📁 finance/
│   │   └── 📁 personal/
│   ├── 📁 04-resources/         # Reference material
│   │   ├── 📁 clients/          # Client profiles
│   │   ├── 📁 vendors/
│   │   └── 📁 sops/             # SOPs, playbooks
│   ├── 📁 05-archive/           # Done projects, old notes
│   ├── 📁 06-journal/           # Daily notes
│   │   └── 📁 {YYYY}/
│   │       └── 📄 {YYYY-MM-DD}.md
│   ├── 📁 07-wiki/              # Knowledge wiki pages
│   │   ├── 📁 business/
│   │   ├── 📁 tech/
│   │   └── 📁 market/
│   ├── 📁 .obsidian/            # Obsidian config
│   └── 📄 _INDEX.md             # Master index
│
├── 📁 vector-store/             # RAG embeddings
│   ├── 📁 chroma/               # ChromaDB data
│   └── 📁 indexes/              # Index metadata
│
├── 📁 sync/                     # Sync scripts & logs
│   ├── 📄 gdrive-sync.sh        # rclone GDrive ↔ VPS
│   ├── 📄 obsidian-sync.sh      # git push/pull vault
│   ├── 📄 embed-sync.py         # Vault → vector store
│   └── 📁 logs/
│       └── 📁 {YYYY-MM}/
│
├── 📁 exports/                  # Exports từ vault
│   └── 📁 {YYYY-MM}/
│
└── 📄 brain-config.json         # Brain hub configuration
```

### `/opt/deo-data/` — Persistent Data

```
/opt/deo-data/
│
├── 📁 postgres/                 # PostgreSQL data volume
├── 📁 redis/                    # Redis data volume
├── 📁 uploads/                  # File uploads từ API
│   └── 📁 {YYYY-MM}/           # Phân theo tháng
├── 📁 backups/                  # DB backups
│   ├── 📁 daily/               # 7 ngày gần nhất
│   ├── 📁 weekly/              # 4 tuần gần nhất
│   └── 📁 monthly/             # 12 tháng gần nhất
├── 📁 gdrive-mirror/            # rclone mirror của GDrive
│   └── 📁 DEO-OS/              # Mirror cấu trúc GDrive
└── 📁 logs/                     # Application logs
    └── 📁 {YYYY-MM}/
```

### `/opt/deo-enterprise-os/` — Repo Code (Updated v1.2)

```
/opt/deo-enterprise-os/
│
├── 📁 apps/
│   ├── 📁 api/                  # Backend (không đổi)
│   └── 📁 web/                  # Frontend (không đổi)
│
├── 📁 brain/                    ← MỚI trong v1.2
│   ├── 📁 connectors/           # Kết nối GDrive, Obsidian, etc.
│   │   ├── 📄 gdrive.ts         # Google Drive API connector
│   │   ├── 📄 obsidian.ts       # Obsidian vault reader/writer
│   │   └── 📄 embedder.ts       # Text → vector embeddings
│   ├── 📁 processors/           # Xử lý dữ liệu
│   │   ├── 📄 inbox-processor.ts  # Xử lý inbox items
│   │   ├── 📄 note-linker.ts    # Tạo links giữa notes
│   │   └── 📄 wiki-builder.ts   # Build wiki pages
│   ├── 📁 services/             # Brain services
│   │   ├── 📄 rag.ts            # RAG query service
│   │   ├── 📄 knowledge.ts      # Knowledge graph service
│   │   └── 📄 context.ts        # Context enrichment
│   └── 📄 index.ts              # Brain module entry
│
├── 📁 infrastructure/
│   ├── 📁 postgres/             # Migrations (thêm brain tables)
│   ├── 📁 nginx/
│   └── 📁 brain/               ← MỚI
│       ├── 📄 chromadb.yml      # ChromaDB service
│       └── 📄 rclone.conf.example
│
├── 📁 scripts/
│   ├── 📄 deploy.sh
│   ├── 📄 setup-vps.sh          # Updated: setup brain hub
│   ├── 📄 backup.sh
│   ├── 📄 health-check.sh
│   ├── 📄 brain-sync.sh        ← MỚI: sync brain data
│   └── 📄 setup-brain.sh       ← MỚI: first-time brain setup
│
├── 📁 docs/
│   ├── 📄 ARCHITECTURE.md
│   ├── 📄 DEPLOYMENT_GUIDE_VN.md
│   ├── 📄 BRAIN_SETUP.md       ← MỚI
│   └── 📄 OBSIDIAN_GUIDE.md    ← MỚI
│
├── 📄 docker-compose.prod.yml  # Updated: thêm chromadb
├── 📄 VERSION.md
├── 📄 CHANGELOG.md
└── 📄 README.md
```

---

## 🔗 Obsidian Vault — Cấu Trúc Chi Tiết

Obsidian vault trên VPS được sync với local Obsidian app qua **git**.

```
vault/
│
├── 00-inbox/
│   └── 📄 {YYYY-MM-DD}-capture-{slug}.md   # Auto-created bởi API
│
├── 01-notes/
│   ├── 📄 {YYYY-MM-DD}-{slug}.md
│   └── ...
│
├── 02-projects/
│   └── 📁 {TenDuAn}/
│       ├── 📄 _index.md                      # Project overview
│       ├── 📄 timeline.md
│       ├── 📄 decisions.md                   # Decision log
│       └── 📄 retro.md                       # Retrospective
│
├── 03-areas/
│   ├── 📁 business/
│   │   ├── 📄 5balance-overview.md           # 5Balance company note
│   │   ├── 📄 strategy-{YYYY}.md
│   │   └── 📄 okrs-{YYYY-QN}.md
│   ├── 📁 tech/
│   │   ├── 📄 deo-enterprise-os.md           # System note
│   │   ├── 📄 agent-architecture.md
│   │   └── 📄 stack-decisions.md
│   └── 📁 finance/
│       └── 📄 cashflow-{YYYY-MM}.md
│
├── 04-resources/
│   ├── 📁 clients/
│   │   └── 📁 {TenKhachHang}/
│   │       ├── 📄 profile.md                 # Client profile
│   │       └── 📄 history.md                 # Interaction history
│   └── 📁 sops/
│       ├── 📄 onboarding-client.md
│       ├── 📄 monthly-finance-review.md
│       └── 📄 agent-task-creation.md
│
├── 06-journal/
│   └── 2026/
│       └── 📄 2026-04-10.md                  # Daily note
│
└── 07-wiki/
    ├── 📁 business/
    │   ├── 📄 crm-playbook.md
    │   └── 📄 sales-process.md
    └── 📁 tech/
        ├── 📄 api-reference.md               # Auto-generated từ code
        └── 📄 agent-guide.md
```

**Obsidian Properties (YAML frontmatter) chuẩn:**
```yaml
---
title: "Tên note"
date: 2026-04-10
type: note | project | client | sop | wiki | journal
status: active | archived | draft
tags: [business, tech, finance, ...]
gdrive: "DEO-OS/02_PROJECTS/{folder}"   # Link tới GDrive folder
related:
  - "[[Tên note liên quan]]"
---
```

---

## 🔄 Data Flow — Cách Dữ Liệu Chảy

```
CAPTURE
  │
  ▼
[Telegram / Chat / Manual]
  │
  ▼
DEO API → PostgreSQL                    [structured data]
  │
  ├──► Google Drive (via rclone)        [files, documents]
  │         │
  │         ▼
  │    GDrive mirror trên VPS
  │
  └──► Obsidian Vault (via API writer)  [notes, wiki]
            │
            ▼
       Vector Store (ChromaDB)          [embeddings for RAG]
            │
            ▼
       RAG Service ◄──── Agent queries
            │
            ▼
       Enriched context → Agent response
```

---

## 📦 New Database Tables (v1.2)

Thêm vào schema `deo.*`:

```sql
-- Brain: Obsidian note tracking
deo.brain_notes (
  id, vault_path, title, type, status,
  gdrive_path, tags, frontmatter,
  content_hash, embedded_at,
  created_at, updated_at
)

-- Brain: Knowledge chunks for RAG
deo.brain_chunks (
  id, note_id, chunk_index,
  content, embedding_id,
  created_at
)

-- Storage: Google Drive file index
deo.gdrive_files (
  id, gdrive_id, name, path,
  mime_type, size, 
  entity_type, entity_id,    -- liên kết tới task/client/project
  synced_at, created_at
)

-- System: Sync log
deo.sync_log (
  id, sync_type, direction,
  status, records_processed,
  error_message, started_at, finished_at
)
```

---

## 🔧 New API Endpoints (v1.2)

```
# Brain / Knowledge
GET    /api/brain/search           → RAG search
POST   /api/brain/capture          → Capture note to inbox
GET    /api/brain/notes            → List vault notes
GET    /api/brain/notes/:path      → Get note content
POST   /api/brain/notes            → Create/update note

# Google Drive Integration
GET    /api/storage/files          → List GDrive files
POST   /api/storage/upload         → Upload → GDrive
GET    /api/storage/sync-status    → Sync status
POST   /api/storage/sync           → Trigger manual sync

# Context (Enhanced)
GET    /api/context/:entity_type/:id  → Enriched context (+ brain data)
```

---

## 🚀 Implementation Plan — 4 Sprint

### Sprint 1: Infrastructure Foundation (Tuần 1-2)
**Mục tiêu:** Setup Google Drive + VPS structure + Obsidian vault ban đầu

- [ ] Tạo cấu trúc folder trên Google Drive (thủ công lần đầu)
- [ ] Setup `/opt/deo-brain/` trên VPS
- [ ] Setup `/opt/deo-data/` với proper permissions
- [ ] Cài rclone + config Google Drive remote
- [ ] Tạo Obsidian vault trên VPS (`/opt/deo-brain/vault/`)
- [ ] Setup git repo cho vault (private repo)
- [ ] Script `setup-brain.sh` để automate setup
- [ ] Test sync GDrive ↔ VPS mirror

**Deliverables:**
- GDrive folder structure tạo xong
- VPS brain hub up và running
- rclone sync chạy được
- Obsidian vault trên VPS, sync với local

---

### Sprint 2: Brain Connectors (Tuần 3-4)
**Mục tiêu:** Code connectors GDrive + Obsidian vào API

- [ ] `brain/connectors/gdrive.ts` — Google Drive API
- [ ] `brain/connectors/obsidian.ts` — Read/write vault notes
- [ ] `brain/connectors/embedder.ts` — Text embedding
- [ ] ChromaDB service trong docker-compose
- [ ] Migration 006: brain tables
- [ ] API endpoints: `/api/storage/*`
- [ ] API endpoints: `/api/brain/capture` (create note)

**Deliverables:**
- API có thể tạo note vào Obsidian vault
- File upload đi thẳng vào GDrive
- ChromaDB chạy và nhận embeddings

---

### Sprint 3: RAG + Context Enrichment (Tuần 5-6)
**Mục tiêu:** Hệ thống tìm kiếm knowledge và enrich context cho agents

- [ ] `brain/services/rag.ts` — RAG query
- [ ] `brain/processors/embed-sync.py` — Vault → ChromaDB
- [ ] Cron job: embed mới notes mỗi giờ
- [ ] API: `/api/brain/search`
- [ ] Upgrade `/api/context/:entity/:id` — thêm brain data
- [ ] Agent task context tự động include relevant notes

**Deliverables:**
- Agent nhận được context từ vault khi nhận task
- Search semantic hoạt động
- Cron embed chạy ổn định

---

### Sprint 4: Automation + Polish (Tuần 7-8)
**Mục tiêu:** Automate workflows, daily notes, wiki generation

- [ ] Daily note tự động tạo mỗi sáng (cron + API)
- [ ] `brain/processors/wiki-builder.ts` — Auto wiki từ patterns
- [ ] `brain/processors/note-linker.ts` — Auto-link related notes
- [ ] Inbox processor: auto-classify notes từ API captures
- [ ] GDrive sync cron (15 phút/lần)
- [ ] Health check cho brain services
- [ ] Dashboard widget: Brain status (notes count, last sync)
- [ ] Docs: `BRAIN_SETUP.md`, `OBSIDIAN_GUIDE.md`

**Deliverables:**
- Daily note flow hoàn chỉnh
- Wiki tự động build từ patterns
- System tự maintain

---

## 🔐 Environment Variables Mới (v1.2)

```bash
# Google Drive
GDRIVE_CLIENT_ID=
GDRIVE_CLIENT_SECRET=
GDRIVE_REFRESH_TOKEN=
GDRIVE_ROOT_FOLDER_ID=     # ID của folder DEO-OS/

# Brain / Obsidian
BRAIN_VAULT_PATH=/opt/deo-brain/vault
BRAIN_GIT_REPO=git@github.com:vucaotung/deo-brain-vault.git
BRAIN_EMBED_MODEL=text-embedding-3-small   # OpenAI hoặc local

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION=deo_brain

# Sync
GDRIVE_SYNC_INTERVAL=15m
VAULT_SYNC_INTERVAL=5m
EMBED_SYNC_INTERVAL=1h
```

---

## 📋 Checklist Trước Khi Code

- [ ] **Google Drive:** Tạo Service Account hoặc OAuth2 credentials
- [ ] **GDrive Folder:** Tạo cấu trúc folder theo plan ở trên
- [ ] **VPS:** Xác nhận có đủ disk space (recommend 50GB+)
- [ ] **Obsidian Local:** Cài Obsidian app + plugin Git
- [ ] **Private Git Repo:** Tạo repo cho vault (deo-brain-vault)
- [ ] **rclone:** Cài trên VPS, config GDrive remote
- [ ] **ChromaDB:** Test docker image
- [ ] **Embedding model:** Chọn OpenAI API hoặc local model (nomic-embed-text)

---

## 🔑 Key Decisions

| Decision | Choice | Lý do |
|----------|--------|-------|
| File storage | Google Drive | Đã quen dùng, free, mobile app |
| Vault sync | Git (private repo) | Version control, offline support |
| Vector DB | ChromaDB | Đơn giản, self-hosted, Python-native |
| Embedding | OpenAI text-embedding-3-small | Chất lượng cao, giá rẻ |
| Obsidian sync local↔VPS | Obsidian Git plugin | Đơn giản nhất |
| Note structure | PARA (Projects/Areas/Resources/Archive) | Proven system |

---

## 📊 Success Metrics v1.2

| Metric | Target |
|--------|--------|
| GDrive file index | 100% files có metadata trong DB |
| Vault sync latency | < 5 phút từ note tạo → synced |
| RAG accuracy | Relevant docs trong top-3 cho 80% queries |
| Brain uptime | 99% (cron + sync) |
| Capture time | < 30 giây từ ý tưởng → vault note |

---

## 🗓️ Timeline

```
Tuần 1-2:  Sprint 1 — Infrastructure
Tuần 3-4:  Sprint 2 — Connectors
Tuần 5-6:  Sprint 3 — RAG + Context
Tuần 7-8:  Sprint 4 — Automation + Polish
─────────────────────────────────────────
Total: 8 tuần → Release v1.2.0
```

---

**Người thực hiện code:** Claude Code (Claude Code sẽ nhận từng sprint)
**Review:** Tung Vu Ca
**Repo:** https://github.com/vucaotung/deo-enterprise-os
