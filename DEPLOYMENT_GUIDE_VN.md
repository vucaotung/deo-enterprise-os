# Dẹo Enterprise OS — Hướng dẫn triển khai / cập nhật production

**Ngữ cảnh hiện tại:** repo đang trong giai đoạn canonicalization + architecture locking.  
Vì vậy tài liệu deploy này ưu tiên phản ánh **thực tế vận hành hiện tại** thay vì mô tả một flow quá lý tưởng.

---

## 1. Mục tiêu của guide này

Guide này dùng cho 2 việc chính:
1. dựng môi trường production lần đầu trên VPS
2. cập nhật code mới từ máy local lên production theo flow đang dùng thật

---

## 2. Thực tế triển khai hiện tại

Hiện tại production deploy thực tế đang ưu tiên flow:

**local archive → scp → extract trên VPS → rsync vào thư mục app → docker compose build/up**

### Lý do
Thư mục production trên VPS không phải lúc nào cũng là git working copy sạch để `git pull` trực tiếp.

### Hệ quả
- không nên mặc định tài liệu bằng `git pull`
- phải cẩn thận giữ `.env` trên VPS
- update code nên tách với update secrets/config

---

## 3. Yêu cầu tối thiểu

### Trên local
- có source code repo mới nhất
- có `tar` / PowerShell Compress-Archive hoặc tương đương
- có `scp`
- có quyền SSH vào VPS

### Trên VPS
- Docker + Docker Compose hoạt động
- thư mục app tồn tại, ví dụ: `/opt/deo-enterprise-os`
- file `.env` production đã cấu hình sẵn

---

## 4. First-time VPS setup (nếu máy mới hoàn toàn)

### SSH vào VPS
```bash
ssh root@<YOUR_VPS_IP>
```

### Update hệ thống
```bash
apt update && apt upgrade -y
```

### Cài Docker
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
```

### Tạo thư mục app
```bash
mkdir -p /opt/deo-enterprise-os
```

### Chuẩn bị `.env`
```bash
cd /opt/deo-enterprise-os
cp .env.example .env
nano .env
```

> Không commit `.env` vào repo.  
> Khi sync code, phải giữ nguyên `.env` trên VPS.

---

## 5. Flow cập nhật production hiện đang dùng

## Bước 1 — Tạo archive từ local
Ví dụ trên local:

```bash
tar -czf deo-enterprise-os.tar.gz \
  apps \
  docs \
  infrastructure \
  packages \
  scripts \
  docker-compose.prod.yml \
  .env.example \
  README.md \
  ROADMAP_NEXT.md \
  DEPLOYMENT_GUIDE_VN.md
```

> Có thể thêm/bớt file tùy đợt cập nhật.  
> Mục tiêu là đóng gói code + docs cần deploy, không kéo theo file rác local.

## Bước 2 — Upload lên VPS
```bash
scp deo-enterprise-os.tar.gz root@<YOUR_VPS_IP>:/opt/
```

## Bước 3 — Extract trên VPS
```bash
ssh root@<YOUR_VPS_IP>
cd /opt
mkdir -p deo-enterprise-os-upload
cd deo-enterprise-os-upload
tar -xzf ../deo-enterprise-os.tar.gz
```

## Bước 4 — Sync vào thư mục production
```bash
rsync -av --delete \
  --exclude '.env' \
  /opt/deo-enterprise-os-upload/ /opt/deo-enterprise-os/
```

### Cực kỳ quan trọng
- `--exclude '.env'` để không đè config production
- nếu có file/secrets local khác không được phép sync, phải exclude thêm

## Bước 5 — Build và chạy lại services
```bash
cd /opt/deo-enterprise-os
docker compose -f docker-compose.prod.yml build api web
docker compose -f docker-compose.prod.yml up -d api web
```

### Nếu cần rebuild toàn bộ
```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Bước 6 — Kiểm tra trạng thái
```bash
docker compose -f docker-compose.prod.yml ps
```

### Kiểm tra logs nếu có lỗi
```bash
docker compose -f docker-compose.prod.yml logs --tail=100 api
docker compose -f docker-compose.prod.yml logs --tail=100 web
```

---

## 6. Khi nào KHÔNG nên deploy kiểu `git pull`

Không nên mặc định dùng `git pull` nếu:
- thư mục VPS không phải git repo sạch
- có patch/manual edits sống trên VPS
- đang cần giữ `.env` / runtime files / local state cẩn thận
- chưa xác nhận source-of-truth giữa repo và production

---

## 7. Những thứ cần kiểm tra trước mỗi lần deploy

### Code / docs
- repo local đã commit/push đầy đủ chưa
- docs source-of-truth có được cập nhật chưa
- có file mới nào cần thêm vào archive không

### Runtime
- `.env` trên VPS còn đúng không
- migration SQL có thay đổi không
- docker compose file có thay đổi không

### Risk checks
- web build hiện có bị chặn bởi TypeScript debt không
- API có thêm dependency mới không
- migration có backward compatible không

---

## 8. Sau deploy nên check gì

### Container status
```bash
docker compose -f docker-compose.prod.yml ps
```

### API logs
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

### Web logs
```bash
docker compose -f docker-compose.prod.yml logs -f web
```

### Health checks phụ
```bash
bash scripts/health-check.sh
```

---

## 9. Troubleshooting ngắn

### API build fail
- kiểm tra dependency mới trong `apps/api/package.json`
- kiểm tra TypeScript compile errors trong logs

### Web build fail
- rà TypeScript errors toàn app
- xem lại batch cleanup theo roadmap/docs canonicalization

### Migrations không khớp
- check `infrastructure/postgres/`
- xác nhận migration mới đã được đưa vào archive/deploy

### Deploy xong nhưng app vẫn cũ
- kiểm tra `rsync` có chạy đúng vào `/opt/deo-enterprise-os/` chưa
- kiểm tra container đã rebuild thật chưa
- kiểm tra browser cache / reverse proxy cache nếu có

---

## 10. Deploy và kiến trúc mới

Các docs orchestration/agent/n8n mới hiện **chủ yếu là source-of-truth cho implementation sau này**, chưa có nghĩa là production đã chạy full stack đó rồi.

### Nói rõ
- có docs architecture locked
- có implementation plans
- nhưng rollout production vẫn phải đi theo phase
- không được giả định rằng chat/agent/n8n stack đã fully wired end-to-end chỉ vì docs đã có

---

## 11. Tài liệu nên đọc kèm

- `README.md`
- `ROADMAP_NEXT.md`
- `docs/WEB_APP_CANONICALIZATION_PLAN.md`
- `docs/ORCHESTRATION_STACK_V1.md`
- `docs/AGENT_V1_IMPLEMENTATION_PLAN.md`
- `docs/N8N_INTEGRATION_IMPLEMENTATION_PLAN.md`

---

## 12. Một câu chốt

**Ở thời điểm hiện tại, deploy đúng không chỉ là đẩy code lên VPS, mà còn là giữ source-of-truth rõ, không đè config production, và không tự lừa mình rằng docs architecture mới đồng nghĩa production đã sẵn sàng cho mọi flow mới.**
