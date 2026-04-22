# DEO-ENTERPRISE-OS UPGRADE PLAN

**Ngày:** 2026-03-31  
**Mục tiêu:** Nâng cấp deo-enterprise-os dựa trên bài học từ Viet-ERP và thiết kế module Attendance

---

## 📋 EXECUTIVE SUMMARY

Hôm nay đã trao đổi 3 chủ đề chính:

1. **Viet-ERP Analysis** - Phân tích repo ERP 812K LOC để học kiến trúc
2. **Attendance Module Design** - Thiết kế module chấm công từ Google Sheets
3. **Upgrade Strategy** - Kế hoạch nâng cấp deo-enterprise-os

### Kết luận chính:
- **Viet-ERP**: Quá lớn để bê nguyên, nhưng có pattern đáng học
- **Attendance**: Ví dụ điển hình cho time-series + workflow module
- **deo-enterprise-os**: Cần refactor theo pattern modular + scalable

---

## 🎯 CURRENT STATE: deo-enterprise-os

### Tình trạng hiện tại (từ memory)
**Location:** `~/deo-enterprise-os` (WSL)

**Đã có:**
- Backend API (Express + TypeScript)
- Frontend (React + TypeScript + Vite)
- Database: PostgreSQL
- Docker setup
- 7 modules cơ bản:
  - Auth
  - Dashboard
  - Tasks
  - Expenses
  - Clients
  - Business Lines
  - **Agent Jobs** (Phase 2 vừa xong)

**Vấn đề:**
- WSL setup phức tạp, nhiều lỗi networking
- Chưa có structure rõ ràng cho shared logic
- Chưa có audit trail
- Chưa có monitoring
- Chưa có Vietnamese market features
- Chưa deploy VPS

---

## 🚀 UPGRADE ROADMAP

### PHASE 1: Foundation Refactor (3-5 ngày)

#### 1.1 Restructure Project
```
deo-enterprise-os/
├── apps/
│   ├── api/                    # Backend
│   └── web/                    # Frontend
├── packages/                   # NEW: Shared packages
│   ├── auth/                   # Auth utilities
│   ├── audit/                  # Audit trail
│   ├── database/               # Prisma client + helpers
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Common utilities
│   └── vietnam/                # Vietnamese market features
├── migrations/                 # Database migrations
├── docs/                       # Documentation
└── infrastructure/             # Docker, K8s, monitoring
```

#### 1.2 Create Shared Packages

**Package: `@deo/auth`**
```typescript
// packages/auth/src/index.ts
export { authMiddleware } from './middleware';
export { generateToken, verifyToken } from './jwt';
export { hashPassword, comparePassword } from './password';
export type { AuthUser, AuthToken } from './types';
```

**Package: `@deo/audit`**
```typescript
// packages/audit/src/index.ts
export { auditMiddleware } from './middleware';
export { logAction } from './logger';
export { getAuditTrail } from './queries';
export type { AuditLog, AuditAction } from './types';
```

**Package: `@deo/vietnam`**
```typescript
// packages/vietnam/src/index.ts
export { formatVND } from './currency';
export { parseVietnameseDate } from './date';
export { calculateVAT, calculatePIT } from './tax';
export { vietnameseBanks } from './banks';
export type { VATRate, PITBracket } from './types';
```

#### 1.3 Add Audit Trail

**New table:**
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL,
  actor_id INT,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  before_data JSONB,
  after_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

**Middleware:**
```typescript
// packages/audit/src/middleware.ts
export function auditMiddleware(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Log after successful response
      logAudit({
        actorType: 'user',
        actorId: req.user?.id,
        action,
        entityType: req.baseUrl.split('/')[2], // e.g., 'tasks'
        entityId: req.params.id,
        afterData: data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return originalJson(data);
    };
    
    next();
  };
}
```

#### 1.4 Standardize API Responses

**Create response utilities:**
```typescript
// packages/utils/src/response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, meta?: any) {
  return res.json({
    success: true,
    data,
    meta
  });
}

export function sendError(res: Response, status: number, message: string, code: string, details?: any) {
  return res.status(status).json({
    success: false,
    error: { code, message, details }
  });
}
```

---

### PHASE 2: Attendance Module (5-7 ngày)

Implement theo design đã viết trong `ATTENDANCE_MODULE_DESIGN.md`

#### 2.1 Database Migration
```bash
# migrations/003_attendance_module.sql
# Copy từ design doc
```

#### 2.2 API Implementation
```typescript
// apps/api/src/routes/attendance.ts
// apps/api/src/services/attendance.service.ts
// apps/api/src/services/leave.service.ts
```

#### 2.3 Frontend Implementation
```typescript
// apps/web/src/pages/Attendance/
// apps/web/src/components/attendance/
```

#### 2.4 Testing
- Unit tests cho services
- Integration tests cho API
- E2E tests cho critical flows

---

### PHASE 3: Vietnamese Market Features (2-3 ngày)

#### 3.1 Package `@deo/vietnam`

**Currency:**
```typescript
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

export function parseVND(text: string): number {
  return parseFloat(text.replace(/[^\d]/g, ''));
}

export function numberToVietnameseWords(num: number): string {
  // Convert 123456 → "một trăm hai mươi ba nghìn bốn trăm năm mươi sáu"
}
```

**Tax:**
```typescript
export const VAT_RATES = {
  STANDARD: 0.10,
  REDUCED: 0.05,
  SUPER_REDUCED: 0.08,
  ZERO: 0
};

export function calculateVAT(amount: number, rate: number = VAT_RATES.STANDARD) {
  return amount * rate;
}

export const PIT_BRACKETS = [
  { max: 5_000_000, rate: 0.05 },
  { max: 10_000_000, rate: 0.10 },
  { max: 18_000_000, rate: 0.15 },
  { max: 32_000_000, rate: 0.20 },
  { max: 52_000_000, rate: 0.25 },
  { max: 80_000_000, rate: 0.30 },
  { max: Infinity, rate: 0.35 }
];

export function calculatePIT(income: number, deductions: number = 11_000_000) {
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;
  let remaining = taxableIncome;
  
  for (const bracket of PIT_BRACKETS) {
    const taxable = Math.min(remaining, bracket.max);
    tax += taxable * bracket.rate;
    remaining -= taxable;
    if (remaining <= 0) break;
  }
  
  return tax;
}
```

**Banks:**
```typescript
export const vietnameseBanks = [
  { code: 'VCB', name: 'Vietcombank', bin: '970436' },
  { code: 'BIDV', name: 'BIDV', bin: '970418' },
  { code: 'TCB', name: 'Techcombank', bin: '970407' },
  { code: 'MB', name: 'MB Bank', bin: '970422' },
  { code: 'ACB', name: 'ACB', bin: '970416' },
  // ... 15 more
];

export function getBankByBIN(bin: string) {
  return vietnameseBanks.find(b => b.bin === bin);
}
```

#### 3.2 Integrate vào Expenses
```typescript
// apps/api/src/routes/expenses.ts
import { formatVND, calculateVAT } from '@deo/vietnam';

router.post('/expenses', async (req, res) => {
  const { amount, includeVAT } = req.body;
  
  const vatAmount = includeVAT ? calculateVAT(amount) : 0;
  const totalAmount = amount + vatAmount;
  
  // Save to DB
  const expense = await createExpense({
    ...req.body,
    vatAmount,
    totalAmount
  });
  
  return sendSuccess(res, {
    ...expense,
    formattedAmount: formatVND(totalAmount)
  });
});
```

---

### PHASE 4: Monitoring & Observability (2-3 ngày)

#### 4.1 Structured Logging
```typescript
// packages/logger/src/index.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

export function createRequestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: Date.now() - start,
        userId: req.user?.id
      });
    });
    
    next();
  };
}
```

#### 4.2 Health Checks
```typescript
// apps/api/src/routes/health.ts
router.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace()
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

#### 4.3 Metrics (optional - Prometheus)
```typescript
// packages/metrics/src/index.ts
import { Counter, Histogram, register } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode
      };
      
      httpRequestDuration.observe(labels, duration);
      httpRequestTotal.inc(labels);
    });
    
    next();
  };
}

router.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

---

### PHASE 5: VPS Deployment (1-2 ngày)

#### 5.1 Prepare for Production

**Environment variables:**
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/deo_os
JWT_SECRET=<strong-secret>
API_PORT=3001
WEB_PORT=3000
```

**Docker Compose for VPS:**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: deo
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: deo_os
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://deo:${DB_PASSWORD}@postgres:5432/deo_os
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: unless-stopped

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 5.2 Deploy Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying deo-enterprise-os to VPS..."

# 1. Pull latest code
git pull origin main

# 2. Build Docker images
docker-compose -f docker-compose.prod.yml build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml run --rm api npm run migrate

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Health check
sleep 10
curl -f http://localhost:3001/health || exit 1

echo "✅ Deployment successful!"
```

#### 5.3 Nginx Reverse Proxy (optional)
```nginx
# /etc/nginx/sites-available/deo-os
server {
    listen 80;
    server_name deo-os.example.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 IMPLEMENTATION PRIORITY

### Must-Have (Phase 1 + 5)
1. ✅ Restructure project với packages
2. ✅ Add audit trail
3. ✅ Standardize API responses
4. ✅ Deploy VPS

**Timeline:** 4-7 ngày  
**Impact:** Foundation cho tất cả modules sau

### Should-Have (Phase 2 + 3)
1. ✅ Attendance module
2. ✅ Vietnamese market features

**Timeline:** 7-10 ngày  
**Impact:** Core business features

### Nice-to-Have (Phase 4)
1. ⚠️ Monitoring & metrics
2. ⚠️ Advanced logging

**Timeline:** 2-3 ngày  
**Impact:** Operational excellence

---

## 🎯 RECOMMENDED APPROACH

### Option A: Incremental (Recommended)
**Chiến lược:** Làm từng phase, deploy sau mỗi phase

**Pros:**
- Ít risk
- Có thể dùng được ngay sau Phase 1
- Dễ rollback nếu có vấn đề

**Cons:**
- Mất thời gian hơn
- Nhiều lần deploy

**Timeline:** 2-3 tuần

### Option B: Big Bang
**Chiến lược:** Làm hết Phase 1-4, deploy một lần

**Pros:**
- Nhanh hơn về tổng thời gian
- Chỉ deploy 1 lần

**Cons:**
- Risk cao
- Khó debug nếu có vấn đề
- Không dùng được cho đến khi xong hết

**Timeline:** 2 tuần (nhưng không dùng được trong lúc đó)

### Option C: Hybrid (Best Balance)
**Chiến lược:** 
1. Phase 1 + 5 → Deploy VPS (foundation)
2. Phase 2 → Deploy (attendance)
3. Phase 3 → Deploy (vietnam)
4. Phase 4 → Deploy (monitoring)

**Pros:**
- Balance giữa speed và safety
- Có app chạy được sau 1 tuần
- Mỗi phase có value riêng

**Cons:**
- Vẫn cần 4 lần deploy

**Timeline:** 2-3 tuần, nhưng có app chạy được sau tuần 1

---

## 🛠️ EXECUTION PLAN

### Week 1: Foundation + Deploy
**Days 1-3:** Phase 1 (Refactor)
- Restructure project
- Create shared packages
- Add audit trail
- Standardize responses

**Days 4-5:** Phase 5 (Deploy)
- Setup VPS
- Docker compose production
- Deploy & test
- **Milestone:** App chạy được trên VPS

### Week 2: Attendance Module
**Days 6-10:** Phase 2
- Database migration
- API implementation
- Frontend implementation
- Testing
- **Milestone:** Attendance module hoàn chỉnh

### Week 3: Vietnamese + Monitoring
**Days 11-13:** Phase 3 (Vietnam)
- Create @deo/vietnam package
- Integrate vào expenses
- Add bank list
- **Milestone:** Vietnamese features ready

**Days 14-16:** Phase 4 (Monitoring)
- Structured logging
- Health checks
- Metrics (optional)
- **Milestone:** Production-ready monitoring

---

## 📝 NEXT IMMEDIATE STEPS

### 1. Commit hiện tại vào git
```bash
cd ~/deo-enterprise-os
git add .
git commit -m "chore: checkpoint before refactor"
git push
```

### 2. Tạo branch mới cho refactor
```bash
git checkout -b refactor/phase-1-foundation
```

### 3. Bắt đầu Phase 1
Có 2 cách:

**Option A: Dẹo code thủ công**
- Tạo từng file
- Copy/move code
- Update imports
- Test

**Option B: Dùng coding agent (Codex/Claude)**
```bash
# Spawn Codex để refactor
cd ~/deo-enterprise-os
codex exec --full-auto "Refactor project theo structure trong UPGRADE_PLAN.md Phase 1"
```

---

## 🎓 KEY LEARNINGS APPLIED

### From Viet-ERP:
1. ✅ Package hóa shared logic
2. ✅ Tách service layer
3. ✅ Audit trail
4. ✅ Security layer riêng
5. ✅ Vietnamese market features

### From Attendance Design:
1. ✅ Summary tables cho performance
2. ✅ Triggers cho tính toán tự động
3. ✅ Workflow pattern (leave approval)
4. ✅ Time-series data structure
5. ✅ Dashboard KPIs

### From Current Issues:
1. ✅ Deploy VPS thay vì WSL
2. ✅ Standardize API responses
3. ✅ Better error handling
4. ✅ Monitoring & health checks

---

## 🚨 RISKS & MITIGATION

### Risk 1: Breaking Changes
**Mitigation:**
- Commit thường xuyên
- Test sau mỗi thay đổi lớn
- Keep old code trong branch backup

### Risk 2: Time Overrun
**Mitigation:**
- Ưu tiên Phase 1 + 5 trước
- Phase 2-4 có thể làm sau
- Có thể skip Phase 4 nếu cần

### Risk 3: VPS Issues
**Mitigation:**
- Test Docker local trước
- Có rollback plan
- Keep WSL version as backup

---

## 📊 SUCCESS METRICS

### Phase 1 Success:
- [ ] Project structure mới hoạt động
- [ ] Audit trail ghi log đúng
- [ ] API responses chuẩn
- [ ] All existing features vẫn chạy

### Phase 5 Success:
- [ ] App chạy trên VPS
- [ ] Health check returns 200
- [ ] Can login và dùng được
- [ ] Performance acceptable

### Phase 2 Success:
- [ ] Can check-in/out
- [ ] Can submit leave request
- [ ] Dashboard shows correct data
- [ ] Reports work

### Overall Success:
- [ ] App stable trên VPS
- [ ] All modules work
- [ ] Performance good
- [ ] Ready for real users

---

## 🎯 DECISION POINT

**Sếp cần quyết định:**

1. **Approach nào?**
   - [ ] Option A: Incremental
   - [ ] Option B: Big Bang
   - [ ] Option C: Hybrid (recommended)

2. **Bắt đầu với Phase nào?**
   - [ ] Phase 1 (Foundation) - recommended
   - [ ] Phase 2 (Attendance) - nếu cần feature ngay
   - [ ] Phase 5 (Deploy) - nếu muốn lên VPS trước

3. **Ai làm?**
   - [ ] Dẹo code thủ công
   - [ ] Spawn Codex/Claude
   - [ ] Hybrid (Dẹo + agent)

4. **Timeline?**
   - [ ] Nhanh nhất (1 tuần, chỉ Phase 1+5)
   - [ ] Cân bằng (2 tuần, Phase 1+2+5)
   - [ ] Đầy đủ (3 tuần, all phases)

---

**Prepared by:** Dẹo 🫸😈🫷  
**Date:** 2026-03-31 09:01 GMT+7  
**Status:** Waiting for decision
