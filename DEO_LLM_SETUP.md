# Dẹo OS — LLM Provider Setup & Model Routing
> Claude Pro · Gemma 4.0 (Nvidia NIM) · Qwen (DashScope) · GPT Unlimited

---

## TÓM TẮT 4 NGUỒN LỰC BẠN CÓ

| Nguồn | Loại | Dùng cho | Chi phí |
|---|---|---|---|
| **Claude Pro** | Subscription → ACP/claude-cli | Agent IT, tác vụ phức tạp, coding | Cố định/tháng |
| **Gemma 4.0 (Nvidia NIM)** | OpenAI-compatible API | Tác vụ trung bình, fallback, heartbeat | Free tier 40 req/min |
| **Qwen (DashScope)** | OpenAI-compatible API | Tác vụ tiếng Việt, OCR, long context | Pay-per-token, rất rẻ |
| **GPT Unlimited** | OpenAI API | Fallback cao cấp, tác vụ đặc thù OpenAI | Subscription |

**Vấn đề cần giải quyết**: Claude Pro là *subscription*, không phải API key — không gọi trực tiếp được qua HTTP. Phải dùng qua **ACP provider** (Claude Code CLI) hoặc **claude_cli provider** trong GoClaw.

---

## 1. SETUP TỪNG PROVIDER

### 1.1 Claude (qua ACP — Claude Code CLI)

Claude Pro subscription dùng qua `claude` CLI binary, không cần API key riêng.

**Bước 1: Xác thực Claude Code trên Xeon (Windows PowerShell)**
```powershell
# Chạy trên Windows PowerShell (không phải WSL)
claude login
# → Browser mở, đăng nhập Claude.ai với tài khoản Pro của bạn
# → Sau khi xong, copy credentials sang WSL2:
cp C:\Users\Admin\.claude\* \\wsl$\Ubuntu\home\user\.claude\
```

**Bước 2: Verify**
```bash
# Trong WSL2 hoặc Linux
claude --version
claude "say hello"  # test nhanh
```

**Trong GoClaw config.json:**
```jsonc
"providers": {
  "acp": {
    "binary": "claude",
    "args": [],
    "model": "claude-sonnet-4-5",
    "work_dir": "/workspace/it/acp-work",
    "idle_ttl": "10m",
    "perm_mode": "approve-all"
  },
  "claude_cli": {
    "cli_path": "/usr/local/bin/claude",
    "model": "claude-opus-4-6",
    "base_work_dir": "/workspace/claude-cli-work",
    "perm_mode": "bypassPermissions"
  }
}
```

**Dùng cho:** `agent-it` (ACP, cần chạy code/bash), tác vụ cực phức tạp (claude_cli).

**Lưu ý quan trọng:** Claude Pro có giới hạn message/ngày. Không nên dùng cho heartbeat hay cron chạy liên tục — để dành cho tác vụ thực sự cần Opus-level reasoning.

---

### 1.2 Gemma 4.0 qua Nvidia NIM

<cite index="76-1">Nvidia NIM cung cấp OpenAI-compatible API tại `https://integrate.api.nvidia.com/v1` cho hơn 100 open-weight models, miễn phí với 40 requests/phút.</cite>

**Lấy API key:**
1. Vào https://build.nvidia.com
2. Đăng ký developer account (free)
3. Generate API key → prefix `nvapi-...`

<cite index="72-1">Model ID cho Gemma 4 31B trên NIM là `google/gemma-4-31b-it`</cite>, expose qua endpoint `/v1/chat/completions` chuẩn OpenAI.

**Trong GoClaw config.json:**
```jsonc
"providers": {
  "nvidia": {
    "api_key": "env:GOCLAW_NVIDIA_API_KEY",
    "base_url": "https://integrate.api.nvidia.com/v1"
  }
}
```

**Trong .env.local:**
```bash
GOCLAW_NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Model strings để dùng trong agent config:**
```
google/gemma-4-31b-it     ← Gemma 4 31B multimodal (text + image)
nvidia/llama-3.1-nemotron-ultra-253b-v1  ← nếu cần model mạnh hơn
meta/llama-3.3-70b-instruct              ← alternative
```

**Dùng cho:** agent-admin, agent-logistics, agent-kho-van, heartbeat jobs — tác vụ trung bình, không cần Claude-level reasoning.

---

### 1.3 Qwen qua DashScope (Alibaba Cloud)

<cite index="86-1">Qwen trên DashScope hỗ trợ OpenAI-compatible interface. BASE_URL cho Singapore region: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`.</cite>

**Lấy API key:**
1. Vào https://dashscope.aliyuncs.com (hoặc international: https://www.alibabacloud.com/product/modelscope)
2. Đăng ký, vào Model Studio → API Keys → Create
3. Key prefix `sk-...`

GoClaw đã có DashScope provider built-in nên setup rất đơn giản:

**Trong GoClaw config.json:**
```jsonc
"providers": {
  "dashscope": {
    "api_key": "env:GOCLAW_DASHSCOPE_API_KEY"
  }
}
```

**Trong .env.local:**
```bash
GOCLAW_DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Model strings:**
```
qwen-max              ← Qwen Max, mạnh nhất, giá cao hơn
qwen-plus             ← Qwen Plus, cân bằng tốt
qwen-turbo            ← Qwen Turbo, rẻ + nhanh
qwen-long             ← 10M token context! dùng cho doc dài
qwen2.5-72b-instruct  ← model cụ thể
qwen2.5-7b-instruct   ← nhỏ, nhanh, rẻ
```

**Dùng cho:** agent-cskh (xử lý tiếng Việt tốt), agent-phap-che (doc dài), cron jobs nhẹ, embedding.

**Giá tham khảo Qwen Turbo:** ~$0.05/1M input tokens — cực rẻ cho heartbeat/cron.

---

### 1.4 GPT qua OpenAI API

GoClaw có OpenAI provider built-in.

**Trong GoClaw config.json:**
```jsonc
"providers": {
  "openai": {
    "api_key": "env:GOCLAW_OPENAI_API_KEY"
  }
}
```

**Trong .env.local:**
```bash
GOCLAW_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

**Model strings:**
```
gpt-4o                ← flagship, multimodal
gpt-4o-mini           ← rẻ + nhanh
o3                    ← reasoning mạnh
o4-mini               ← reasoning + rẻ hơn
```

**Dùng cho:** fallback khi Anthropic down, tác vụ cần multimodal vision (ảnh + text), agent-marketing.

---

## 2. MODEL ROUTING STRATEGY

### Nguyên tắc phân tầng (3-tier)

```
TIER 1 — PREMIUM (Claude Opus / GPT o3)
├── Tác vụ: pháp lý phức tạp, coding, architecture decisions
├── Cost: cao
└── Agents: agent-phap-che, agent-it (ACP)

TIER 2 — WORKHORSE (Claude Sonnet / Qwen Max / GPT-4o)
├── Tác vụ: soạn văn bản, phân tích dữ liệu, orchestration
├── Cost: trung bình
└── Agents: deo-admin, agent-ke-toan, agent-hr, agent-du-an, agent-marketing

TIER 3 — CHEAP (Gemma 4 NIM / Qwen Turbo / GPT-4o-mini)
├── Tác vụ: heartbeat, cron check, CSKH đơn giản, routing
├── Cost: thấp / miễn phí
└── Agents: agent-cskh, heartbeat jobs, subagents
```

---

## 3. CONFIG PROVIDERS ĐẦY ĐỦ TRONG GOCLAW

### providers section (thêm vào config.json từ Master Plan):

```jsonc
"providers": {

  // ── ANTHROPIC (native HTTP+SSE, prompt caching)
  // Dùng cho agents cần Sonnet qua API key trực tiếp
  // Claude Pro KHÔNG dùng ở đây — dùng ACP/claude_cli bên dưới
  "anthropic": {
    "api_key": "env:GOCLAW_ANTHROPIC_API_KEY"
    // Nếu bạn CÓ API key riêng (khác Pro subscription)
    // Nếu chỉ có Pro, bỏ trống hoặc để null
  },

  // ── OPENAI
  "openai": {
    "api_key": "env:GOCLAW_OPENAI_API_KEY"
  },

  // ── DASHSCOPE (Qwen) — GoClaw built-in
  "dashscope": {
    "api_key": "env:GOCLAW_DASHSCOPE_API_KEY"
  },

  // ── NVIDIA NIM — custom provider (OpenAI-compatible)
  "nvidia": {
    "api_key": "env:GOCLAW_NVIDIA_API_KEY",
    "base_url": "https://integrate.api.nvidia.com/v1"
  },

  // ── ACP (Claude Code CLI) — dùng Claude Pro subscription
  "acp": {
    "binary": "claude",
    "args": [],
    "model": "claude-sonnet-4-5",
    "work_dir": "/workspace/it/acp-work",
    "idle_ttl": "10m",
    "perm_mode": "approve-all"
  },

  // ── CLAUDE CLI — alternative cho ACP, dùng Opus
  "claude_cli": {
    "cli_path": "/usr/local/bin/claude",
    "model": "claude-opus-4-6",
    "base_work_dir": "/workspace/claude-cli-work",
    "perm_mode": "bypassPermissions"
  }
}
```

### .env.local đầy đủ:

```bash
# ── GOCLAW CORE
GOCLAW_GATEWAY_TOKEN=your-strong-random-token-here
GOCLAW_ENCRYPTION_KEY=your-32-char-aes-key-here
GOCLAW_POSTGRES_DSN=postgresql://goclaw:password@localhost:5433/goclaw_os

# ── LLM PROVIDERS
GOCLAW_ANTHROPIC_API_KEY=sk-ant-...        # nếu có API key (optional nếu chỉ dùng Pro qua ACP)
GOCLAW_OPENAI_API_KEY=sk-...               # GPT unlimited
GOCLAW_DASHSCOPE_API_KEY=sk-...            # Qwen
GOCLAW_NVIDIA_API_KEY=nvapi-...            # Nvidia NIM (Gemma 4)

# ── CHANNELS
TELEGRAM_BOT_TOKEN_MAIN=bot_token_here
TELEGRAM_OWNER_ID=your_telegram_user_id
ZALO_OA_TOKEN=zalo_token_here
ZALO_WEBHOOK_SECRET=webhook_secret_here

# ── TELEGRAM GROUPS (chat IDs, số âm)
TG_GROUP_KE_TOAN=-100xxxxxxxxx
TG_GROUP_PHAP_CHE=-100xxxxxxxxx
TG_GROUP_HR=-100xxxxxxxxx
TG_GROUP_ADMIN=-100xxxxxxxxx
TG_GROUP_LOGISTICS=-100xxxxxxxxx
TG_GROUP_MARKETING=-100xxxxxxxxx
TG_GROUP_DU_AN=-100xxxxxxxxx
TG_GROUP_IT=-100xxxxxxxxx
TG_GROUP_KHO_VAN=-100xxxxxxxxx
TG_GROUP_CSKH=-100xxxxxxxxx

# ── DATABASE VPS
POSTGRES_MCP_DSN=postgresql://deo:password@db.enterpriseos.bond:5432/deo_os

# ── REDIS (optional)
GOCLAW_REDIS_DSN=redis://localhost:6380
```

---

## 4. MODEL ASSIGNMENT PER AGENT

```jsonc
"agents": {
  "defaults": {
    // Fallback mặc định khi không có override
    "provider": "dashscope",
    "model": "qwen-plus"
  },

  "list": {

    // ── DẸO ADMIN: Sonnet qua Anthropic API (hoặc ACP nếu không có key)
    "deo-admin": {
      "provider": "anthropic",          // hoặc "acp" nếu chỉ có Pro sub
      "model": "claude-sonnet-4-5-20250929"
    },

    // ── KẾ TOÁN: Qwen Max — tốt với số liệu, rẻ, tiếng Việt ổn
    "agent-ke-toan": {
      "provider": "dashscope",
      "model": "qwen-max"
    },

    // ── PHÁP CHẾ: Claude Opus qua CLI — cần reasoning sâu nhất
    "agent-phap-che": {
      "provider": "claude_cli",
      "model": "claude-opus-4-6"
    },

    // ── HR: Qwen Plus — cân bằng, tiếng Việt tốt
    "agent-hr": {
      "provider": "dashscope",
      "model": "qwen-plus"
    },

    // ── ADMIN VP: Gemma 4 NIM — tác vụ văn phòng đơn giản, free tier
    "agent-admin": {
      "provider": "nvidia",
      "model": "google/gemma-4-31b-it"
    },

    // ── LOGISTICS: Gemma 4 NIM
    "agent-logistics": {
      "provider": "nvidia",
      "model": "google/gemma-4-31b-it"
    },

    // ── MARKETING: GPT-4o — vision tốt, creative tasks
    "agent-marketing": {
      "provider": "openai",
      "model": "gpt-4o"
    },

    // ── DỰ ÁN: Qwen Plus — phân tích, báo cáo, planning
    "agent-du-an": {
      "provider": "dashscope",
      "model": "qwen-plus"
    },

    // ── IT: ACP (Claude Code = Claude Pro subscription)
    "agent-it": {
      "provider": "acp",
      "model": "claude-sonnet-4-5"
    },

    // ── KHO VẬN: Gemma 4 NIM — query đơn giản, free tier
    "agent-kho-van": {
      "provider": "nvidia",
      "model": "google/gemma-4-31b-it"
    },

    // ── CSKH: Qwen Turbo — rẻ nhất, nhanh nhất, đủ cho FAQ
    "agent-cskh": {
      "provider": "dashscope",
      "model": "qwen-turbo"
    }
  }
}
```

---

## 5. SUBAGENTS & CRON MODEL ROUTING

Subagents (worker agents tạm thời) và cron isolated sessions nên dùng model rẻ nhất:

```jsonc
// Subagents: Qwen Turbo (gần như free)
"subagents": {
  "maxConcurrent": 10,
  "model": "qwen-turbo"   // override provider từ dashscope defaults
},

// Cron jobs nên dùng model nhẹ:
"cron": [
  {
    "name": "bang-luong-thang",
    "agent_id": "agent-ke-toan",
    // ke-toan đã config qwen-max → dùng luôn
    ...
  },
  {
    "name": "heartbeat-check-nhanh",
    "agent_id": "agent-kho-van",
    // kho-van dùng gemma-4 NIM → free tier đủ dùng
    ...
  }
]
```

---

## 6. FALLBACK CHAIN

Khi provider chính down, GoClaw tự failover. Cấu hình trong Dashboard → Agent → Fallback models:

```
Pháp Chế:   claude_cli (Opus) → anthropic (Sonnet) → openai (GPT-4o)
Kế Toán:    dashscope (Qwen Max) → openai (GPT-4o-mini) → nvidia (Gemma 4)
Admin/Log:  nvidia (Gemma 4) → dashscope (Qwen Turbo) → openai (GPT-4o-mini)
CSKH:       dashscope (Qwen Turbo) → nvidia (Gemma 4) → openai (GPT-4o-mini)
IT:         acp (Claude Code) → anthropic (Sonnet) → openai (GPT-4o)
```

---

## 7. MEMORY & EMBEDDING PROVIDER

GoClaw dùng embedding để lưu semantic memory (pgvector). Dùng DashScope cho embedding — rẻ và ổn định:

```jsonc
"memory": {
  "enabled": true,
  "embedding_provider": "dashscope",
  "embedding_model": "text-embedding-v3",
  "max_results": 8,
  "vector_weight": 0.7,
  "text_weight": 0.3,
  "min_score": 0.3
}
```

Nếu muốn dùng OpenAI embedding (chất lượng cao hơn):
```jsonc
"memory": {
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small"
}
```

---

## 8. CHI PHÍ ƯỚC TÍNH / THÁNG

Dựa trên usage trung bình doanh nghiệp vừa (~500 requests/ngày):

| Agent | Provider | Model | Est. req/ngày | Chi phí/tháng |
|---|---|---|---|---|
| deo-admin | Anthropic | Sonnet | 100 | ~$15 (API) hoặc $0 (ACP) |
| ke-toan | DashScope | Qwen Max | 50 | ~$3 |
| phap-che | claude_cli | Opus | 20 | $0 (Pro sub) |
| hr | DashScope | Qwen Plus | 40 | ~$1 |
| admin/logistics | Nvidia | Gemma 4 | 80 | $0 (free tier) |
| marketing | OpenAI | GPT-4o | 30 | ~$5 |
| du-an | DashScope | Qwen Plus | 40 | ~$1 |
| it | ACP | Claude | 30 | $0 (Pro sub) |
| kho-van | Nvidia | Gemma 4 | 60 | $0 (free tier) |
| cskh | DashScope | Qwen Turbo | 150 | ~$0.5 |
| Cron/heartbeat | DashScope | Qwen Turbo | ~200 | ~$0.5 |
| **TỔNG** | | | **~800** | **~$26/tháng** |

*Chưa tính Claude Pro subscription (~$20/tháng) và GPT Unlimited subscription.*

**Tổng chi phí thực tế:** ~$26 API + $20 Claude Pro + GPT sub = **~$46-70/tháng** cho toàn bộ hệ thống 11 agents.

---

## 9. SETUP NHANH — THỨ TỰ LÀM

```bash
# Bước 1: Lấy API keys
# - Nvidia NIM: build.nvidia.com → Developer → API Keys
# - DashScope: dashscope.aliyuncs.com → API Keys (5 phút)
# - GPT: platform.openai.com → API Keys (đã có)

# Bước 2: Tạo .env.local trên Xeon
cat > /workspace/.env.local << EOF
GOCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
GOCLAW_ENCRYPTION_KEY=$(openssl rand -hex 16)
GOCLAW_POSTGRES_DSN=postgresql://goclaw:yourpass@localhost:5433/goclaw_os
GOCLAW_OPENAI_API_KEY=sk-...
GOCLAW_DASHSCOPE_API_KEY=sk-...
GOCLAW_NVIDIA_API_KEY=nvapi-...
EOF

# Bước 3: Test từng provider
curl https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Authorization: Bearer $GOCLAW_NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemma-4-31b-it","messages":[{"role":"user","content":"Hello"}]}'

# DashScope test
curl https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer $GOCLAW_DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-turbo","messages":[{"role":"user","content":"Xin chào"}]}'

# Bước 4: Authenticate Claude CLI
claude login  # trên Windows PowerShell trước
# rồi copy sang Linux

# Bước 5: Khởi động GoClaw
source /workspace/.env.local && ./goclaw

# Bước 6: Verify providers trong Dashboard
# → http://localhost:18790 → Settings → Providers
# Tất cả providers phải hiển thị status ✅
```

---

## 10. LƯU Ý QUAN TRỌNG

### Claude Pro vs API Key

Bạn có **Claude Pro subscription** — đây là tài khoản claude.ai, không phải Anthropic API key. Hai thứ này **khác nhau hoàn toàn**:

- **Claude Pro** → dùng qua `claude` CLI (ACP/claude_cli provider trong GoClaw) → không tốn thêm tiền, nhưng có rate limit của subscription
- **Anthropic API Key** → gọi trực tiếp HTTP, tính tiền per-token, không giới hạn nếu có credit

**Quyết định cho Dẹo OS:**
- Nếu chỉ có Pro sub → dùng ACP cho agent-it và agent-phap-che, tốt cho tác vụ ít nhưng phức tạp
- Nếu cần scale → mua thêm Anthropic API key riêng cho deo-admin và ke-toan

### Nvidia NIM Rate Limit

<cite index="76-1">Free tier giới hạn 40 requests/phút.</cite> Với 3 agents dùng NIM (admin, logistics, kho-van) cộng heartbeat, cần đảm bảo không quá 40 req/phút tổng cộng. Nếu vượt, config fallback sang DashScope Qwen Turbo.

### Qwen tiếng Việt

Qwen 2.5+ xử lý tiếng Việt khá tốt, đặc biệt Qwen Max. Phù hợp cho CSKH và HR. Tuy nhiên với văn bản pháp lý phức tạp (pháp chế) vẫn nên dùng Claude.

---

*Document này là phần bổ sung cho DEO_ENTERPRISE_OS_MASTER_PLAN.md*
*Provider configs được test với GoClaw v2.x, tháng 4/2026*
