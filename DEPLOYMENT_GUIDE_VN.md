# Dẹo Enterprise OS — Hướng dẫn triển khai lên VPS Contabo

## 📋 Thông tin VPS của bạn

| Thông tin | Giá trị |
|-----------|--------|
| **IP Address** | 173.249.51.69 |
| **Server Type** | Cloud VPS 10 SSD (no setup) |
| **Location** | Hub Europe |
| **Username** | root |
| **OS** | Ubuntu 22.04 / 24.04 |
| **IPv6 Subnet** | 2a02:c207:2320:2129:0000:0000:0000:0001/64 |

---

## 🔧 Phase 1: Chuẩn bị VPS (15 phút)

### Bước 1: SSH vào VPS

Mở terminal trên máy tính và chạy:

```bash
ssh root@173.249.51.69
```

Nhập password của bạn khi được hỏi.

### Bước 2: Update hệ thống

```bash
apt update && apt upgrade -y
```

### Bước 3: Cài Docker

```bash
curl -fsSL https://get.docker.com | sh
```

```bash
systemctl enable docker && systemctl start docker
```

Kiểm tra:

```bash
docker version
```

### Bước 4: Tạo thư mục ứng dụng

```bash
mkdir -p /opt/deo-enterprise-os
cd /opt/deo-enterprise-os
```

---

## 📦 Phase 2: Clone & Cấu hình (10 phút)

### Bước 1: Clone project từ GitHub

**(Thay YOUR_USER bằng username GitHub của bạn)**

```bash
git clone https://github.com/YOUR_USER/deo-enterprise-os.git .
```

Hoặc nếu chưa push GitHub, copy từ máy local:

```bash
# Trên máy local:
scp -r deo-enterprise-os root@173.249.51.69:/opt/

# Hoặc:
cd deo-enterprise-os
tar -czf deo.tar.gz apps infrastructure scripts docker-compose.prod.yml .env.example .gitignore
scp deo.tar.gz root@173.249.51.69:/opt/
# Trên VPS:
cd /opt && tar -xzf deo.tar.gz
```

### Bước 2: Tạo file .env

```bash
cp .env.example .env
nano .env
```

Điền các giá trị sau:

| Key | Value | Ví dụ |
|-----|-------|-------|
| **POSTGRES_PASSWORD** | Mật khẩu mạnh (tối thiểu 16 ký tự) | `MySecurePass123!@#$` |
| **JWT_SECRET** | 64 ký tự ngẫu nhiên | `openssl rand -hex 32` |
| **TUNNEL_TOKEN** | Sẽ lấy từ Cloudflare Tunnel (bước sau) | `eyJhIjoiY2QwMzU0ZjRkZjQ3ZGE2MDdjNDk4YWY4...` |

#### Tạo JWT_SECRET trên VPS:

```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
```

Copy output vào `JWT_SECRET=...` trong .env

#### Ví dụ file .env:

```
POSTGRES_DB=deo_os
POSTGRES_USER=deo
POSTGRES_PASSWORD=MySecurePass123!@#$
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
TUNNEL_TOKEN=eyJhIjoiY2QwMzU0ZjRkZjQ3ZGE2MDdjNDk4YWY4YzBjZjM4NDUwIiwiYSI6ImhvcWzp6CjRQQSJ9
CORS_ORIGIN=https://dash.enterpriseos.bond
DOMAIN=enterpriseos.bond
```

#### Lưu file:

Bấm `Ctrl+X` → `Y` → `Enter`

---

## 🚀 Phase 3: Deploy (5 phút)

### Bước 1: Chạy deploy script

```bash
bash scripts/deploy.sh
```

Script sẽ:
- ✅ Chạy migrations SQL
- ✅ Build containers
- ✅ Start 7 services
- ✅ Verify health checks

Chờ khi nó hiển thị "✅ Deploy complete!"

### Bước 2: Kiểm tra status

```bash
docker compose -f docker-compose.prod.yml ps
```

Output phải có 7 services, tất cả là `Up`:

```
NAME      STATUS
postgres  Up (healthy)
redis     Up (healthy)
api       Up
worker    Up
web       Up
nginx     Up
tunnel    Up
```

---

## 🔐 Phase 4: Cloudflare Tunnel (5 phút)

### Bước 1: Vào Cloudflare Zero Trust

1. Truy cập: https://one.dash.cloudflare.com
2. Chọn tài khoản / organization
3. Chọn **Access** → **Tunnels**
4. Click **Create a tunnel**

### Bước 2: Setup tunnel

1. **Connector**: Cloudflared
2. **Tunnel name**: `deo-production`
3. Click **Save tunnel**

### Bước 3: Lấy token

Cloudflare sẽ show một dòng lệnh như:

```
cloudflared tunnel run --token eyJhIjoiY2QwMzU0ZjRkZjQ3ZGE2MDdjNDk4YWY4YzBjZjM4NDUwIiwiYSI6Im1kN2Q0...
```

**Extract phần token sau `--token`, thêm vào .env:**

```bash
nano .env
# Tìm dòng TUNNEL_TOKEN, thay bằng token vừa copy
TUNNEL_TOKEN=eyJhIjoiY2QwMzU0ZjRkZjQ3ZGE2MDdjNDk4YWY4YzBjZjM4NDUwIiwiYSI6Im1kN2Q0...
```

Lưu (Ctrl+X → Y → Enter)

### Bước 4: Thêm public hostnames

Trong Cloudflare tunnel details, tab **Public Hostname**, click **Add hostname**:

**Hostname 1:**
- Subdomain: `dash`
- Domain: `enterpriseos.bond`
- Service: `http://nginx:80`

**Hostname 2:**
- Subdomain: `api`
- Domain: `enterpriseos.bond`
- Service: `http://nginx:80`

Sau đó click **Save**.

### Bước 5: Restart tunnel

```bash
docker compose -f docker-compose.prod.yml up -d tunnel
```

Chờ vài giây, check status:

```bash
docker compose -f docker-compose.prod.yml logs tunnel | tail -20
```

Output phải có:

```
tunnel: successfully established a connection to the edge
```

---

## ✅ Bạn đã xong!

### Truy cập ứng dụng

**Dashboard (React UI):**
```
https://dash.enterpriseos.bond
```

**API (REST endpoints):**
```
https://api.enterpriseos.bond
```

### Đăng nhập

- **Email**: `vucaotung@gmail.com` (được seed trong DB)
- **Password**: Dùng API để reset hoặc query trực tiếp DB

Hoặc query DB:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U deo -d deo_os -c "UPDATE deo.users SET password='hashed' WHERE email='vucaotung@gmail.com';"
```

---

## 📌 Các lệnh hữu ích

### Xem logs API

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

### Xem logs hết services

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Health check

```bash
bash scripts/health-check.sh
```

### Backup database

```bash
bash scripts/backup.sh
# Backup sẽ lưu tại: /opt/deo-backups/deo_os_YYYYMMDD_HHMMSS.sql.gz
```

### Restart services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop tất cả

```bash
docker compose -f docker-compose.prod.yml down
```

### Xem Cloudflare Tunnel status

```bash
docker compose -f docker-compose.prod.yml logs tunnel
```

---

## 🔧 Troubleshooting

### API không hoạt động

```bash
docker compose -f docker-compose.prod.yml logs api | tail -50
```

Kiểm tra:
- Database connection: `docker compose -f docker-compose.prod.yml exec postgres pg_isready -U deo`
- Redis: `docker compose -f docker-compose.prod.yml exec redis redis-cli ping`

### Database không kết nối

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U deo -d deo_os -c "SELECT 1;"
```

### Migrations không chạy

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U deo -d deo_os < infrastructure/postgres/002_deo_schema.sql
```

### Cấu hình .env thay đổi

```bash
nano .env  # Chỉnh sửa
docker compose -f docker-compose.prod.yml up -d  # Restart
```

### Xóa hết, bắt đầu lại

```bash
docker compose -f docker-compose.prod.yml down -v  # -v xóa volumes
# Sau đó: bash scripts/deploy.sh
```

---

## 📊 Giám sát

### CPU / Memory

```bash
docker stats
```

### Disk space

```bash
df -h /
du -sh /opt/deo-*
```

### Backup cron

Để auto-backup hàng ngày lúc 2 sáng:

```bash
crontab -e
# Thêm dòng:
0 2 * * * /opt/deo-enterprise-os/scripts/backup.sh
```

---

## 🎉 Các bước tiếp theo (Phase 5)

Sau khi deploy xong:

1. **Cấu hình Email**: Tích hợp SMTP để gửi thông báo
2. **Cấu hình Agent**: Connect OpenClaw agent với API
3. **Cấu hình Telegram Bot**: Link bot với `/api/telegram` endpoint
4. **Cấu hình n8n**: Webhook automation workflows
5. **Setup Backup Cron**: Auto-backup hàng ngày
6. **Custom Domain**: Thay `enterpriseos.bond` bằng domain của bạn

---

**Cần hỗ trợ? Liên hệ: vucaotung@gmail.com**
