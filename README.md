# Dẹo Enterprise OS — Business Management Platform

**Version:** 1.0
**Status:** Production Ready
**Language:** Vietnamese
**Repository:** https://github.com/YOUR_USER/deo-enterprise-os

---

## 📋 Overview

Dẹo Enterprise OS là nền tảng quản lý doanh nghiệp kết hợp AI và con người, với giao diện **chat-first** (80% tương tác qua chat, 20% qua webapp visual).

Hệ thống bao gồm:
- **Backend API**: Express.js + TypeScript (80 endpoints)
- **Frontend UI**: React + Vite + TailwindCSS (9 trang)
- **Database**: PostgreSQL 16 (23+ tables)
- **Cache**: Redis 7
- **Orchestration**: Agent task queue + worker daemon
- **Real-time**: WebSocket via Socket.io

---

## 🎯 Core Features

### 📊 Dashboard
- KPI cards (open tasks, expenses, leads, agents online, pending clarifications)
- Charts (expense by category, task burn-down, agent activity)
- Activity feed

### 💬 Chat Center (3-column)
- Real-time messaging (Telegram ↔ Webapp sync)
- Auto-populated context panel (client/task/agent info)
- Inline clarifications (agent asks, human answers immediately)
- Rich attachments (images, files)

### ✅ Task Management
- Kanban board (5 columns: TODO, IN PROGRESS, BLOCKED, IN REVIEW, DONE)
- Subtasks support
- Agent assignment
- Priority & due dates
- Activity timeline

### 💰 Finance
- Expense tracking (VND currency)
- Categorization with AI auto-classification
- Receipt upload & OCR
- Expense summary & reports

### 👥 CRM
- Lead pipeline (6 stages: NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST)
- Client management
- Interaction history
- Lead scoring

### 🤖 AI Agents Dashboard
- Agent registry (status, capabilities, performance)
- Task assignment & monitoring
- Token budget tracking
- Clarification inbox

### 📝 Notebooks (Knowledge Base)
- Markdown notes
- Entity linking (task, project, client)
- Version history
- Search & filtering

### 🔐 Security & Audit
- JWT authentication (24-hour tokens)
- Role-based access
- Audit trail (every action logged)
- Cloudflare Tunnel for HTTPS

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     INTERACTION LAYER                   │
│  Telegram │ Zalo │ Webapp │ Email       │
└────────────────┬────────────────────────┘
                 │ WebSocket / REST
┌────────────────▼────────────────────────┐
│     API LAYER (Express + TypeScript)    │
│  Routes │ Services │ Middleware         │
└────────────────┬────────────────────────┘
                 │
┌────────┬───────▼───────┬─────────────┐
│        │               │             │
│   PostgreSQL      Redis         Files
│  (23 tables)  (Task queue)    (Google Drive)
│        │               │             │
└────────┴───────┬───────┴─────────────┘
                 │
         ┌───────▼──────────┐
         │  Worker Daemon   │
         │  Agent Executor  │
         └──────────────────┘
```

### Database Schema

**Core Tables:**
- `users`, `companies`, `staff_assignments`
- `projects`, `tasks`, `clarifications`, `notebooks`
- `clients`, `leads`, `interactions`, `quotes`, `contracts`
- `expenses`, `accounts`, `categories`
- `agents`, `agent_jobs`, `messages`
- `command_log`, `ai_usage_log`, `audit_events`

**Key Features:**
- 2-layer task states (workflow vs execution)
- Clarification system (agent asks → human answers → resume)
- Audit trail on every mutation
- Context engine (auto-gather related data)

---

## 📁 Project Structure

```
deo-enterprise-os/
├── apps/
│   ├── api/                 # Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/      # 13 route files (80+ endpoints)
│   │   │   ├── services/    # Business logic (event, context)
│   │   │   ├── middleware/  # Auth, validate, audit
│   │   │   ├── types/       # TypeScript interfaces
│   │   │   ├── db.ts        # PostgreSQL connection
│   │   │   ├── redis.ts     # Redis client
│   │   │   ├── index.ts     # Express server
│   │   │   └── worker.ts    # Background job worker
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                 # Frontend (React + Vite)
│       ├── src/
│       │   ├── pages/       # 9 main pages
│       │   ├── components/  # Reusable UI components
│       │   ├── hooks/       # Auth, chat, context
│       │   ├── lib/         # API, Socket.io, utils
│       │   ├── types/       # TypeScript interfaces
│       │   ├── App.tsx      # Router setup
│       │   └── main.tsx     # React entry point
│       ├── Dockerfile
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── infrastructure/
│   ├── postgres/            # SQL migrations (5 files)
│   │   ├── 001_init.sql
│   │   ├── 002_deo_schema.sql
│   │   ├── 003_deo_v4_update.sql
│   │   ├── 004_many_to_many.sql
│   │   └── 005_orchestration_upgrade.sql
│   └── nginx/
│       └── default.conf     # Reverse proxy config
│
├── scripts/
│   ├── deploy.sh            # Deploy to VPS
│   ├── setup-vps.sh         # Initial VPS setup
│   ├── backup.sh            # Database backup
│   └── health-check.sh      # Service monitoring
│
├── docs/
│   ├── DEPLOYMENT_GUIDE_VN.md       # Full deployment guide (Vietnamese)
│   ├── QUICK_START_CHECKLIST.txt    # Quick checklist
│   └── ARCHITECTURE.md              # Detailed architecture
│
├── docker-compose.prod.yml          # Production docker-compose
├── .env.example                     # Environment variables template
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Local Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USER/deo-enterprise-os.git
cd deo-enterprise-os

# 2. Setup backend
cd apps/api
npm install
npm run dev  # Runs on http://localhost:3001

# 3. Setup frontend (new terminal)
cd apps/web
npm install
npm run dev  # Runs on http://localhost:5173

# 4. Start database (Docker)
docker compose -f ../../docker-compose.yml up postgres redis
```

### VPS Deployment

**For detailed step-by-step guide, see:** `DEPLOYMENT_GUIDE_VN.md`

Quick version:

```bash
# 1. SSH into VPS
ssh root@173.249.51.69

# 2. Clone & config
git clone <your-repo> /opt/deo-enterprise-os
cd /opt/deo-enterprise-os
cp .env.example .env
nano .env  # Fill in passwords + Cloudflare token

# 3. Deploy
bash scripts/deploy.sh

# 4. Access
https://dash.enterpriseos.bond
```

---

## 🔌 API Endpoints (80 total)

### Authentication
```
POST   /api/auth/login          → JWT token
GET    /api/auth/me             → Current user
```

### Dashboard
```
GET    /api/dashboard/summary   → KPI stats
GET    /api/dashboard/charts    → Chart data
```

### Tasks
```
GET    /api/tasks               → List tasks
POST   /api/tasks               → Create task
GET    /api/tasks/:id           → Get detail
PATCH  /api/tasks/:id           → Update
DELETE /api/tasks/:id           → Delete
POST   /api/tasks/:id/pick      → Agent picks task
POST   /api/tasks/:id/progress  → Report progress
POST   /api/tasks/:id/complete  → Mark complete
POST   /api/tasks/:id/fail      → Report failure
POST   /api/tasks/:id/request-review → Request review
```

### Expenses
```
GET    /api/expenses            → List
POST   /api/expenses            → Create
PATCH  /api/expenses/:id        → Update
GET    /api/expenses/summary    → Stats
```

### Clients, Leads, Contacts
```
GET/POST/PATCH   /api/clients
GET/POST/PATCH   /api/leads
GET/POST         /api/interactions
```

### AI Agents
```
POST   /api/agents/register     → Register agent
POST   /api/agents/:id/heartbeat → Keep-alive signal
GET    /api/agents              → List all agents
GET    /api/agents/:id          → Agent detail
PATCH  /api/agents/:id          → Update config
GET    /api/agents/:id/pull     → Poll for new tasks
```

### Clarifications
```
GET    /api/clarifications      → List open questions
POST   /api/clarifications      → Create question
PATCH  /api/clarifications/:id  → Answer question
GET    /api/clarifications/pending → For dashboard widget
```

### Notebooks & Conversations
```
GET/POST/PATCH   /api/notebooks
GET/POST         /api/conversations/:id/messages
GET              /api/conversations/:id/context
```

### Audit Trail
```
GET    /api/audit?entity_type=&entity_id= → All changes
```

**Full API documentation:** [See backend README](apps/api/README.md)

---

## 🗄️ Database

### Schema: `deo.*`

23 tables covering:
- **User Management**: users, companies, staff_assignments
- **Work**: projects, tasks, clarifications, notebooks, agent_jobs
- **CRM**: clients, leads, interactions, contracts, quotes
- **Finance**: expenses, accounts, categories
- **AI**: agents, messages, conversations
- **System**: audit_events, command_log, ai_usage_log, reminders

### Migrations

Run in order:
1. `001_init.sql` — Create database
2. `002_deo_schema.sql` — Core tables (23 tables, seed data)
3. `003_deo_v4_update.sql` — Companies & extended features
4. `004_many_to_many.sql` — Business lines, agent assignments
5. `005_orchestration_upgrade.sql` — Agent orchestration tables

**Auto-migrate on deploy:** `deploy.sh` runs all migrations

---

## 🔐 Security

- **JWT Auth**: 24-hour tokens, stored in localStorage
- **CORS**: Configured per environment
- **SQL Injection**: Parameterized queries ($1, $2 notation)
- **XSS Protection**: No innerHTML, safe React rendering
- **HTTPS**: Cloudflare Tunnel + SSL certificates
- **Rate Limiting**: Nginx config (30 req/s API, 5 req/min login)
- **Audit Trail**: Every action logged with actor, timestamp, changes
- **Password**: Hashed with bcryptjs

---

## 📞 Support & Contact

**Author:** Tung Vu Ca
**Email:** vucaotung@gmail.com
**Domain:** enterpriseos.bond

For issues, questions, or feature requests, contact via email.

---

## 📄 License

Private / Proprietary

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core API & database
- ✅ React dashboard & chat
- ✅ Docker containerization
- ✅ Cloudflare Tunnel deployment

### Phase 2 (Next)
- OpenClaw agent integration
- Telegram bot sync
- n8n automation workflows
- Email notifications

### Phase 3 (Future)
- Mobile app (React Native)
- Multi-language support
- Advanced reporting & analytics
- Machine learning for expense classification
- Zalo OA integration

---

## 📊 Tech Stack

**Backend:**
- Node.js 18+
- Express.js 4.x
- TypeScript 5.x
- PostgreSQL 16
- Redis 7
- Socket.io 4.x

**Frontend:**
- React 18
- TypeScript 5.x
- Vite 4.x
- TailwindCSS 3.x
- React Router 6
- React Query (TanStack)
- Recharts (charts)
- Lucide React (icons)

**DevOps:**
- Docker & Docker Compose
- Nginx 1.27
- Cloudflare Tunnel
- GitHub Actions (CI/CD ready)

**Total LOC:** 7,813 lines of code (backend + frontend)

---

## 🙏 Acknowledgments

Architecture inspired by:
- **ClawTask** — Clarification system, 2-layer task states, agent heartbeat
- **Viet-ERP** — Package structure, audit logging, event-driven design
- **OpenClaw** — Agent orchestration patterns

---

**Last Updated:** April 3, 2026
**Ready for Production Deployment**

