# Hướng Dẫn Cài Đặt GoClaw trên Xeon Workstation
> Windows + WSL2 Ubuntu · Postgres 16 · Redis · GoClaw Gateway

---

## BƯỚC 0: KIỂM TRA HỆ THỐNG HIỆN TẠI

```bash
# SSH vào Xeon hoặc mở Windows Terminal → WSL2
wsl --list --verbose
# Xác nhận Ubuntu đang chạy

# Kiểm tra Postgres hiện tại
psql --version
# Postgres 16.x on port 5433 (theo handover doc)

# Kiểm tra Redis
redis-cli -p 6380 ping
# Nếu PONG → OK

# Kiểm tra n8n
curl http://localhost:5678/healthz
```

---

## BƯỚC 1: CÀI ĐẶT DEPENDENCIES

### 1.1 Update system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  ca-certificates \
  gnupg \
  lsb-release \
  jq \
  unzip
```

### 1.2 Cài Go 1.22+ (required cho GoClaw)

```bash
# Check Go version hiện tại
go version

# Nếu < 1.22 hoặc chưa có, cài mới:
wget https://go.dev/dl/go1.23.7.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.23.7.linux-amd64.tar.gz

# Add vào PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
# → go version go1.23.7 linux/amd64
```

### 1.3 Verify Postgres 16

```bash
# Bạn đã có Postgres 16 port 5433 theo handover doc
# Tạo database + user cho GoClaw
sudo -u postgres psql -p 5433 << 'SQL'
CREATE USER goclaw WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE goclaw_os OWNER goclaw;
GRANT ALL PRIVILEGES ON DATABASE goclaw_os TO goclaw;

-- Enable pgvector extension (required cho memory)
\c goclaw_os
CREATE EXTENSION IF NOT EXISTS vector;
SQL

# Test connection
psql "postgresql://goclaw:your_secure_password_here@localhost:5433/goclaw_os" -c "SELECT version();"
```

### 1.4 Verify Redis

```bash
# Bạn đã có Redis port 6380
redis-cli -p 6380 ping
# → PONG

# Nếu chưa có Redis:
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Config Redis port 6380 nếu cần
sudo nano /etc/redis/redis.conf
# Tìm dòng: port 6379
# Đổi thành: port 6380
sudo systemctl restart redis-server
```

---

## BƯỚC 2: DOWNLOAD VÀ CÀI GOCLAW

### 2.1 Clone repository

```bash
cd ~
git clone https://github.com/nextlevelbuilder/goclaw.git
cd goclaw

# Check tag mới nhất
git tag -l | tail -5
# Checkout stable version
git checkout v2.1.0  # hoặc version mới nhất
```

### 2.2 Build từ source

```bash
# Build GoClaw binary
cd ~/goclaw
make build

# Binary sẽ ở: ./bin/goclaw
./bin/goclaw version

# Hoặc install vào system
sudo make install
# → binary được copy vào /usr/local/bin/goclaw
```

**HOẶC** download binary compiled sẵn:

```bash
# Nếu không muốn build
wget https://github.com/nextlevelbuilder/goclaw/releases/download/v2.1.0/goclaw-linux-amd64.tar.gz
tar -xzf goclaw-linux-amd64.tar.gz
sudo mv goclaw /usr/local/bin/
sudo chmod +x /usr/local/bin/goclaw

# Verify
goclaw version
```

---

## BƯỚC 3: TẠO CẤU TRÚC WORKSPACE

```bash
# Tạo thư mục workspace
mkdir -p /workspace/{skills,templates,inputs,outputs,agents,shared}

# Tạo cấu trúc chi tiết
mkdir -p /workspace/templates/{contracts,hr,ke-toan,logistics,marketing,du-an}
mkdir -p /workspace/outputs/{ke-toan,phap-che,hr,admin,logistics,marketing,du-an,it,kho-van,cskh}
mkdir -p /workspace/skills/{ke-toan,phap-che,hr,admin,logistics,marketing,du-an,it,kho-van,cskh,office-docs}
mkdir -p /workspace/agents/{deo-admin,ke-toan,phap-che,hr,admin,logistics,marketing,du-an,it,kho-van,cskh}

# Set permissions
sudo chown -R $USER:$USER /workspace
chmod -R 755 /workspace
```

---

## BƯỚC 4: TẠO CONFIG FILES

### 4.1 Tạo .env.local

```bash
cd /workspace

cat > .env.local << 'ENVFILE'
# ── GOCLAW CORE
GOCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
GOCLAW_ENCRYPTION_KEY=$(openssl rand -hex 16)
GOCLAW_POSTGRES_DSN=postgresql://goclaw:your_secure_password_here@localhost:5433/goclaw_os
GOCLAW_REDIS_DSN=redis://localhost:6380

# ── LLM PROVIDERS (để trống trước, setup sau)
GOCLAW_ANTHROPIC_API_KEY=
GOCLAW_OPENAI_API_KEY=
GOCLAW_DASHSCOPE_API_KEY=
GOCLAW_NVIDIA_API_KEY=

# ── CHANNELS (để trống trước)
TELEGRAM_BOT_TOKEN_MAIN=
TELEGRAM_OWNER_ID=
ZALO_OA_TOKEN=

# ── POSTGRES MCP (VPS)
POSTGRES_MCP_DSN=postgresql://deo:password@db.enterpriseos.bond:5432/deo_os
ENVFILE

# Generate tokens
sed -i "s/\$(openssl rand -hex 32)/$(openssl rand -hex 32)/" .env.local
sed -i "s/\$(openssl rand -hex 16)/$(openssl rand -hex 16)/" .env.local

# Thay password Postgres
read -sp "Nhập password Postgres cho user goclaw: " PGPASS
sed -i "s/your_secure_password_here/$PGPASS/" .env.local
```

### 4.2 Tạo config.json cơ bản

```bash
cat > /workspace/config.json << 'CONFIGFILE'
{
  "gateway": {
    "host": "0.0.0.0",
    "port": 18790,
    "token": "env:GOCLAW_GATEWAY_TOKEN",
    "owner_ids": [],
    "max_message_chars": 32000,
    "rate_limit_rpm": 60,
    "injection_action": "warn",
    "inbound_debounce_ms": 1000,
    "tool_status": true
  },

  "providers": {
    "openai": {
      "api_key": "env:GOCLAW_OPENAI_API_KEY"
    }
  },

  "memory": {
    "enabled": true,
    "embedding_provider": "openai",
    "embedding_model": "text-embedding-3-small",
    "max_results": 8,
    "vector_weight": 0.7,
    "text_weight": 0.3,
    "min_score": 0.3
  },

  "agents": {
    "defaults": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "max_tokens": 8192,
      "temperature": 0.4,
      "agent_type": "predefined",
      "workspace": "/workspace",
      "memory": { "enabled": true }
    },
    
    "list": {
      "deo-admin": {
        "displayName": "Dẹo Admin 🏢",
        "model": "gpt-4o",
        "temperature": 0.3,
        "identity": { "name": "Dẹo Admin", "emoji": "🏢" },
        "default": true
      }
    }
  },

  "compaction": {
    "reserveTokensFloor": 20000,
    "maxHistoryShare": 0.75,
    "minMessages": 50,
    "keepLastMessages": 4
  }
}
CONFIGFILE
```

---

## BƯỚC 5: KHỞI CHẠY GOCLAW LẦN ĐẦU

### 5.1 Chạy migrations

```bash
cd /workspace

# Load env vars
export $(cat .env.local | grep -v '^#' | xargs)

# Run migrations
goclaw migrate up

# Verify tables được tạo
psql "$GOCLAW_POSTGRES_DSN" -c "\dt goclaw.*"
# → Phải thấy tables: agents, sessions, messages, memories, etc.
```

### 5.2 Start GoClaw gateway

```bash
# Chạy trong tmux/screen để giữ process
tmux new -s goclaw

# Start GoClaw
cd /workspace
export $(cat .env.local | grep -v '^#' | xargs)
goclaw

# Logs sẽ hiển thị:
# [INFO] Gateway listening on :18790
# [INFO] Postgres connected
# [INFO] Redis connected
# [INFO] 1 agents loaded

# Detach tmux: Ctrl+B, D
```

### 5.3 Verify service chạy

```bash
# Check port
ss -tlnp | grep 18790
# → LISTEN 0.0.0.0:18790

# Health check
curl http://localhost:18790/health
# → {"status":"ok"}

# Check dashboard
curl -I http://localhost:18790
# → 200 OK
```

---

## BƯỚC 6: TRUY CẬP WEB DASHBOARD

### 6.1 Từ Windows (trên cùng máy Xeon)

Mở browser:
```
http://localhost:18790
```

### 6.2 Từ máy khác trong mạng LAN

```
http://<IP_cua_Xeon>:18790
```

Tìm IP của Xeon:
```bash
ip addr show eth0 | grep inet
```

### 6.3 Dashboard sẽ hiển thị:

- **Agents** → Dẹo Admin (default)
- **Sessions** → rỗng
- **Settings** → Providers (chỉ có OpenAI)

---

## BƯỚC 7: TEST AGENT CƠ BẢN

### 7.1 Qua WebSocket (dashboard)

1. Dashboard → Chat
2. Chọn agent "Dẹo Admin"
3. Gửi: "Xin chào"
4. → Agent trả lời (qua GPT-4o-mini)

### 7.2 Qua cURL (API test)

```bash
export GATEWAY_TOKEN=$(grep GOCLAW_GATEWAY_TOKEN /workspace/.env.local | cut -d= -f2)

curl http://localhost:18790/v1/chat/completions \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deo-admin",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

---

## BƯỚC 8: CÀI MCP TOOLS

### 8.1 OfficeCLI (Word/Excel/PowerPoint)

```bash
# Cài Node.js nếu chưa có
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài OfficeCLI
npm install -g officecli

# Verify
officecli --version
officecli mcp serve --help
```

### 8.2 MarkItDown MCP (đọc files)

```bash
pip install markitdown-mcp --break-system-packages

# Verify
which markitdown-mcp
markitdown-mcp --help
```

### 8.3 Postgres MCP

```bash
npm install -g @modelcontextprotocol/server-postgres

# Verify
which mcp-server-postgres
```

### 8.4 Thêm MCP tools vào config.json

```bash
# Edit config.json
nano /workspace/config.json
```

Thêm vào `agents.defaults`:

```json
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
```

Restart GoClaw:
```bash
tmux attach -t goclaw
# Ctrl+C để stop
goclaw
```

---

## BƯỚC 9: SETUP CLOUDFLARE TUNNEL

### 9.1 Install cloudflared trên Windows

Download từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Hoặc qua PowerShell:
```powershell
# PowerShell as Admin
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$env:USERPROFILE\cloudflared.exe"
```

### 9.2 Login Cloudflare

```powershell
cd $env:USERPROFILE
.\cloudflared.exe tunnel login
# → Browser mở, chọn domain enterpriseos.bond
```

### 9.3 Tạo tunnel mới

```powershell
# Tạo tunnel
.\cloudflared.exe tunnel create deo-goclaw

# Note Tunnel ID và credentials file path
# Tunnel ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Credentials: C:\Users\Admin\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
```

### 9.4 Config tunnel

```powershell
# Tạo config file
notepad C:\Users\Admin\.cloudflared\config.yml
```

Nội dung:
```yaml
tunnel: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: C:\Users\Admin\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: goclaw.enterpriseos.bond
    service: http://localhost:18790
  - service: http_status:404
```

### 9.5 Tạo DNS record

```powershell
.\cloudflared.exe tunnel route dns deo-goclaw goclaw.enterpriseos.bond
```

### 9.6 Chạy tunnel

```powershell
# Test run
.\cloudflared.exe tunnel run deo-goclaw

# Nếu OK, cài service
.\cloudflared.exe service install
.\cloudflared.exe service start
```

### 9.7 Verify

Từ máy ngoài internet:
```bash
curl https://goclaw.enterpriseos.bond/health
```

---

## TROUBLESHOOTING

### Lỗi: Postgres connection refused

```bash
# Check Postgres running
sudo systemctl status postgresql@16-main

# Check port
ss -tlnp | grep 5433

# Test connection
psql -h localhost -p 5433 -U goclaw -d goclaw_os
```

### Lỗi: Redis connection timeout

```bash
# Check Redis
redis-cli -p 6380 ping

# Check config
cat /etc/redis/redis.conf | grep "^port"
```

### Lỗi: Permission denied /workspace

```bash
sudo chown -R $USER:$USER /workspace
chmod -R 755 /workspace
```

### GoClaw crashes khi start

```bash
# Check logs
journalctl -u goclaw -n 50

# Run foreground để debug
cd /workspace
export $(cat .env.local | xargs)
goclaw --log-level debug
```

### MCP tools không hoạt động

```bash
# Test manually
officecli mcp serve
# → Phải không crash

# Check PATH
echo $PATH | grep npm

# Reinstall
npm install -g officecli --force
```

---

## NEXT STEPS

Sau khi cài xong GoClaw cơ bản:

1. ✅ Thêm LLM providers (Nvidia, DashScope) → xem DEO_LLM_SETUP.md
2. ✅ Tạo 11 agents → xem DEO_ENTERPRISE_OS_MASTER_PLAN.md mục 4
3. ✅ Setup Telegram bot
4. ✅ Migrate SOUL.md từ OpenClaw cũ
5. ✅ Cài Skills library
6. ✅ Setup cron jobs

---

*Installation guide cho Dẹo Enterprise OS trên Xeon E-2124G*
*GoClaw v2.x · Ubuntu 22.04/24.04 · Postgres 16 · Redis*
