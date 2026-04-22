# Attendance System - Database Design & Module Integration

**Ngày phân tích:** 2026-03-31  
**Nguồn:** Google Sheets chấm công mẫu  
**Mục tiêu:** Tích hợp module chấm công vào deo-enterprise-os

---

## 📊 Phân tích Sheet hiện tại

### Cấu trúc 5 tabs

#### 1. **Dashboard** (Tab chính - Visualization)
- Tổng quan nhân sự theo phòng ban
- Thống kê theo chức vụ / giới tính
- Biểu đồ:
  - Đi muộn / về sớm theo phòng ban
  - Nghỉ phép theo tuần
  - Làm thêm giờ
  - Top 10 vi phạm
- KPI cards: số lần đi muộn, số phút, số người nghỉ, số giờ OT

#### 2. **Data** (Tab nhập liệu chính)
- Header: Mã NV, Tên, Giới tính, Phòng/ban, Chức vụ
- Cột ngày: 1-31 (mỗi ngày có IN/OUT)
- Tuần: W1-W5
- Tính toán tự động:
  - Tổng số lần vào trễ
  - Tổng số phút vào trễ
  - Tổng số lần ra sớm
  - Tổng số phút ra sớm
  - Tổng số giờ làm thêm
  - Số ngày công đi làm
  - Số ngày nghỉ
  - Số ngày làm nửa ngày
  - Phân tích theo tuần (W1-W5)

#### 3. **Phân loại nghỉ**
- Mã NV, Tên, Giới tính, Phòng/ban, Chức vụ
- Cột ngày 1-31: đánh dấu loại nghỉ
  - **O** = Nghỉ ốm
  - **P** = Nghỉ phép
  - **KL** = Nghỉ không lương
  - **TS** = Nghỉ thai sản
  - **KH** = Nghỉ kết hôn
  - **H** = Học tập, công tác
- Tổng số ngày nghỉ theo loại
- Số đơn nghỉ trong tháng

#### 4. **Setup** (Tab tính toán pivot)
- Tổng hợp theo phòng ban
- Tổng hợp theo giới tính
- Top performers / violators
- Data source cho charts

#### 5. **Info**
- Hướng dẫn sử dụng
- Ký hiệu
- Metadata

---

## 🗄️ Database Schema Design

### Core Tables

#### 1. `employees` (Nhân viên)
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  department_id INT REFERENCES departments(id),
  position VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_department ON employees(department_id);
```

#### 2. `departments` (Phòng ban)
```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  manager_id INT REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `attendance_records` (Bản ghi chấm công)
```sql
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  work_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  late_minutes INT DEFAULT 0,
  early_leave_minutes INT DEFAULT 0,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  work_type VARCHAR(20) DEFAULT 'full_day', -- full_day, half_day, absent
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(work_date);
CREATE INDEX idx_attendance_month ON attendance_records(DATE_TRUNC('month', work_date));
```

#### 4. `leave_requests` (Đơn xin nghỉ)
```sql
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  leave_type VARCHAR(20) NOT NULL, -- sick, annual, unpaid, maternity, wedding, study
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(3,1) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_by INT REFERENCES employees(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);
```

#### 5. `leave_balances` (Số ngày phép còn lại)
```sql
CREATE TABLE leave_balances (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  year INT NOT NULL,
  leave_type VARCHAR(20) NOT NULL,
  total_days DECIMAL(4,1) NOT NULL,
  used_days DECIMAL(4,1) DEFAULT 0,
  remaining_days DECIMAL(4,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, year, leave_type)
);

CREATE INDEX idx_balance_employee_year ON leave_balances(employee_id, year);
```

#### 6. `attendance_summary_monthly` (Tổng hợp tháng)
```sql
CREATE TABLE attendance_summary_monthly (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  year INT NOT NULL,
  month INT NOT NULL,
  total_work_days INT DEFAULT 0,
  total_present_days INT DEFAULT 0,
  total_absent_days INT DEFAULT 0,
  total_half_days INT DEFAULT 0,
  total_late_count INT DEFAULT 0,
  total_late_minutes INT DEFAULT 0,
  total_early_leave_count INT DEFAULT 0,
  total_early_leave_minutes INT DEFAULT 0,
  total_overtime_hours DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, year, month)
);

CREATE INDEX idx_summary_employee_period ON attendance_summary_monthly(employee_id, year, month);
```

#### 7. `work_shifts` (Ca làm việc)
```sql
CREATE TABLE work_shifts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INT DEFAULT 0, -- Thời gian cho phép đi muộn
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mặc định: 8:00 - 17:00
INSERT INTO work_shifts (name, start_time, end_time, grace_period_minutes, is_default)
VALUES ('Ca hành chính', '08:00', '17:00', 0, true);
```

#### 8. `attendance_violations` (Vi phạm chấm công)
```sql
CREATE TABLE attendance_violations (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  work_date DATE NOT NULL,
  violation_type VARCHAR(30) NOT NULL, -- late, early_leave, absent_no_leave
  severity VARCHAR(20) DEFAULT 'minor', -- minor, major, critical
  minutes INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_violations_employee ON attendance_violations(employee_id);
CREATE INDEX idx_violations_date ON attendance_violations(work_date);
```

---

## 🔧 Business Logic & Rules

### 1. Tính toán đi muộn / về sớm
```javascript
// Pseudo-code
function calculateLateEarly(checkIn, checkOut, shift) {
  const lateMinutes = checkIn > shift.startTime 
    ? diffMinutes(checkIn, shift.startTime) - shift.gracePeriodMinutes
    : 0;
  
  const earlyMinutes = checkOut < shift.endTime
    ? diffMinutes(shift.endTime, checkOut)
    : 0;
  
  return { lateMinutes: Math.max(0, lateMinutes), earlyMinutes };
}
```

### 2. Tính toán làm thêm giờ
```javascript
function calculateOvertime(checkOut, shift) {
  if (checkOut <= shift.endTime) return 0;
  
  const overtimeMinutes = diffMinutes(checkOut, shift.endTime);
  return overtimeMinutes / 60; // Convert to hours
}
```

### 3. Xử lý nghỉ phép
```javascript
function processLeaveRequest(leaveRequest) {
  // 1. Check balance
  const balance = getLeaveBalance(leaveRequest.employeeId, leaveRequest.leaveType);
  if (balance.remainingDays < leaveRequest.totalDays) {
    throw new Error('Insufficient leave balance');
  }
  
  // 2. Create attendance records for leave days
  for (let date = leaveRequest.startDate; date <= leaveRequest.endDate; date++) {
    if (isWorkday(date)) {
      createAttendanceRecord({
        employeeId: leaveRequest.employeeId,
        workDate: date,
        workType: 'absent',
        notes: `Leave: ${leaveRequest.leaveType}`
      });
    }
  }
  
  // 3. Update balance
  updateLeaveBalance(leaveRequest.employeeId, leaveRequest.leaveType, -leaveRequest.totalDays);
}
```

### 4. Tổng hợp tháng (Trigger hoặc Cron)
```sql
-- Trigger tự động cập nhật summary khi có attendance record mới
CREATE OR REPLACE FUNCTION update_monthly_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO attendance_summary_monthly (
    employee_id, year, month,
    total_late_count, total_late_minutes,
    total_early_leave_count, total_early_leave_minutes,
    total_overtime_hours
  )
  VALUES (
    NEW.employee_id,
    EXTRACT(YEAR FROM NEW.work_date),
    EXTRACT(MONTH FROM NEW.work_date),
    CASE WHEN NEW.late_minutes > 0 THEN 1 ELSE 0 END,
    NEW.late_minutes,
    CASE WHEN NEW.early_leave_minutes > 0 THEN 1 ELSE 0 END,
    NEW.early_leave_minutes,
    NEW.overtime_hours
  )
  ON CONFLICT (employee_id, year, month)
  DO UPDATE SET
    total_late_count = attendance_summary_monthly.total_late_count + EXCLUDED.total_late_count,
    total_late_minutes = attendance_summary_monthly.total_late_minutes + EXCLUDED.total_late_minutes,
    total_early_leave_count = attendance_summary_monthly.total_early_leave_count + EXCLUDED.total_early_leave_count,
    total_early_leave_minutes = attendance_summary_monthly.total_early_leave_minutes + EXCLUDED.total_early_leave_minutes,
    total_overtime_hours = attendance_summary_monthly.total_overtime_hours + EXCLUDED.total_overtime_hours,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_summary
AFTER INSERT OR UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION update_monthly_summary();
```

---

## 🎯 API Endpoints Design

### Attendance Module Routes

```typescript
// apps/api/src/routes/attendance.ts

// ==================== Attendance Records ====================
GET    /api/attendance                    // List records (filters: employee, date range, department)
POST   /api/attendance                    // Create/update check-in/out
GET    /api/attendance/:id                // Get single record
PUT    /api/attendance/:id                // Update record
DELETE /api/attendance/:id                // Delete record

// ==================== Check In/Out ====================
POST   /api/attendance/check-in           // Quick check-in (employee_id, timestamp)
POST   /api/attendance/check-out          // Quick check-out (employee_id, timestamp)
GET    /api/attendance/today              // Today's attendance for all employees

// ==================== Leave Requests ====================
GET    /api/leave-requests                // List leave requests
POST   /api/leave-requests                // Create leave request
GET    /api/leave-requests/:id            // Get leave request
PUT    /api/leave-requests/:id            // Update leave request
POST   /api/leave-requests/:id/approve    // Approve leave
POST   /api/leave-requests/:id/reject     // Reject leave
DELETE /api/leave-requests/:id            // Delete leave request

// ==================== Leave Balances ====================
GET    /api/leave-balances                // List balances (filters: employee, year)
GET    /api/leave-balances/:employeeId    // Get employee's balances
POST   /api/leave-balances                // Create/update balance
PUT    /api/leave-balances/:id            // Update balance

// ==================== Reports & Analytics ====================
GET    /api/attendance/summary/monthly    // Monthly summary (filters: year, month, department)
GET    /api/attendance/summary/employee/:id  // Employee summary (year, month)
GET    /api/attendance/violations         // List violations (filters: employee, date range, type)
GET    /api/attendance/dashboard          // Dashboard KPIs
GET    /api/attendance/reports/late       // Late report (top violators)
GET    /api/attendance/reports/overtime   // Overtime report
GET    /api/attendance/reports/leave      // Leave report

// ==================== Employees (extend existing) ====================
GET    /api/employees/:id/attendance      // Employee's attendance history
GET    /api/employees/:id/leave-balance   // Employee's leave balance
```

---

## 📦 Module Structure

```
deo-enterprise-os/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── attendance.ts          # Attendance CRUD
│   │   │   │   ├── leave-requests.ts      # Leave management
│   │   │   │   ├── attendance-reports.ts  # Reports & analytics
│   │   │   │   └── employees.ts           # Extend with attendance endpoints
│   │   │   ├── services/
│   │   │   │   ├── attendance.service.ts  # Business logic
│   │   │   │   ├── leave.service.ts       # Leave logic
│   │   │   │   └── summary.service.ts     # Summary calculations
│   │   │   ├── types/
│   │   │   │   └── attendance.types.ts    # TypeScript types
│   │   │   └── utils/
│   │   │       ├── time.utils.ts          # Time calculations
│   │   │       └── attendance.utils.ts    # Attendance helpers
│   │
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Attendance/
│       │   │   │   ├── AttendanceList.tsx      # List view
│       │   │   │   ├── AttendanceCalendar.tsx  # Calendar view
│       │   │   │   ├── CheckInOut.tsx          # Quick check-in/out
│       │   │   │   ├── LeaveRequests.tsx       # Leave management
│       │   │   │   └── AttendanceDashboard.tsx # Dashboard
│       │   │   └── ...
│       │   ├── components/
│       │   │   ├── attendance/
│       │   │   │   ├── AttendanceTable.tsx
│       │   │   │   ├── AttendanceCard.tsx
│       │   │   │   ├── LeaveForm.tsx
│       │   │   │   ├── ViolationBadge.tsx
│       │   │   │   └── OvertimeChart.tsx
│       │   │   └── ...
│       │   └── api/
│       │       └── attendance.api.ts      # API client
│
├── migrations/
│   └── 003_attendance_module.sql         # Database migration
│
└── docs/
    └── attendance-module.md              # Module documentation
```

---

## 🔄 Integration với modules hiện có

### 1. Liên kết với `employees` / `users`
- Attendance records link tới `employees.id`
- Dashboard hiển thị attendance của user hiện tại
- Manager có thể xem attendance của team

### 2. Liên kết với `tasks`
- Task có thể link tới overtime hours
- "Làm thêm giờ cho task X"
- Report: task completion vs overtime

### 3. Liên kết với `expenses`
- Overtime pay calculation
- Travel expenses khi đi công tác (leave type = study/business)

### 4. Liên kết với `companies` / `projects`
- Multi-tenant: mỗi company có attendance riêng
- Project-based attendance tracking

---

## 🎨 Frontend Components

### 1. Attendance Dashboard
```typescript
// AttendanceDashboard.tsx
interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  overtimeThisMonth: number;
  topViolators: Employee[];
  departmentStats: DepartmentStat[];
}

// KPI Cards:
// - Tổng nhân viên
// - Đi làm hôm nay
// - Nghỉ hôm nay
// - Đi muộn hôm nay
// - Tổng giờ OT tháng này

// Charts:
// - Đi muộn theo phòng ban (bar chart)
// - Nghỉ phép theo tuần (line chart)
// - Làm thêm giờ theo phòng ban (pie chart)
// - Top 10 vi phạm (horizontal bar)
```

### 2. Attendance Calendar
```typescript
// AttendanceCalendar.tsx
// Hiển thị lịch tháng
// Mỗi ngày show:
// - Check-in / check-out time
// - Late / early badge
// - Leave type badge
// - Overtime hours
// Click vào ngày → edit modal
```

### 3. Check-In/Out Widget
```typescript
// CheckInOut.tsx
// Quick action widget
// - Current time
// - Check-in button (if not checked in)
// - Check-out button (if checked in)
// - Today's status: on-time / late / overtime
```

### 4. Leave Request Form
```typescript
// LeaveForm.tsx
interface LeaveFormData {
  leaveType: 'sick' | 'annual' | 'unpaid' | 'maternity' | 'wedding' | 'study';
  startDate: Date;
  endDate: Date;
  reason: string;
}

// Show remaining balance
// Validate dates
// Submit for approval
```

---

## 📊 Reports & Analytics

### 1. Monthly Report
```sql
-- Báo cáo tháng theo phòng ban
SELECT 
  d.name AS department,
  COUNT(DISTINCT e.id) AS total_employees,
  SUM(asm.total_late_count) AS total_late,
  SUM(asm.total_late_minutes) AS total_late_minutes,
  SUM(asm.total_early_leave_count) AS total_early_leave,
  SUM(asm.total_overtime_hours) AS total_overtime,
  SUM(asm.total_absent_days) AS total_absent
FROM departments d
JOIN employees e ON e.department_id = d.id
LEFT JOIN attendance_summary_monthly asm ON asm.employee_id = e.id
WHERE asm.year = 2024 AND asm.month = 2
GROUP BY d.id, d.name;
```

### 2. Top Violators
```sql
-- Top 10 nhân viên đi muộn nhiều nhất
SELECT 
  e.employee_code,
  e.full_name,
  d.name AS department,
  asm.total_late_count,
  asm.total_late_minutes
FROM employees e
JOIN departments d ON d.id = e.department_id
JOIN attendance_summary_monthly asm ON asm.employee_id = e.id
WHERE asm.year = 2024 AND asm.month = 2
ORDER BY asm.total_late_count DESC, asm.total_late_minutes DESC
LIMIT 10;
```

### 3. Overtime Report
```sql
-- Báo cáo làm thêm giờ
SELECT 
  e.employee_code,
  e.full_name,
  d.name AS department,
  SUM(ar.overtime_hours) AS total_overtime,
  COUNT(*) AS overtime_days
FROM attendance_records ar
JOIN employees e ON e.id = ar.employee_id
JOIN departments d ON d.id = e.department_id
WHERE ar.work_date BETWEEN '2024-02-01' AND '2024-02-29'
  AND ar.overtime_hours > 0
GROUP BY e.id, e.employee_code, e.full_name, d.name
ORDER BY total_overtime DESC;
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Tables & Basic CRUD (1-2 days)
- [ ] Create database migration
- [ ] Create `employees`, `departments` tables
- [ ] Create `attendance_records` table
- [ ] Basic API endpoints (CRUD)
- [ ] Simple list view in frontend

### Phase 2: Check-In/Out & Calculations (1-2 days)
- [ ] Check-in/out endpoints
- [ ] Late/early calculation logic
- [ ] Overtime calculation
- [ ] Attendance summary trigger
- [ ] Check-in/out widget in frontend

### Phase 3: Leave Management (1-2 days)
- [ ] `leave_requests` table
- [ ] `leave_balances` table
- [ ] Leave request API
- [ ] Approval workflow
- [ ] Leave form & list in frontend

### Phase 4: Reports & Dashboard (2-3 days)
- [ ] Monthly summary API
- [ ] Violation tracking
- [ ] Dashboard KPIs
- [ ] Charts & visualizations
- [ ] Export to Excel/PDF

### Phase 5: Advanced Features (optional)
- [ ] Shift management
- [ ] Biometric integration
- [ ] Mobile check-in (GPS)
- [ ] Notifications (late, leave approval)
- [ ] Payroll integration

---

## 🔐 Permissions & Access Control

### Roles
- **Admin**: Full access
- **Manager**: View team attendance, approve leave
- **Employee**: View own attendance, submit leave requests
- **HR**: Manage all attendance, generate reports

### Permission Matrix
| Action | Admin | Manager | Employee | HR |
|--------|-------|---------|----------|-----|
| View own attendance | ✅ | ✅ | ✅ | ✅ |
| View team attendance | ✅ | ✅ | ❌ | ✅ |
| View all attendance | ✅ | ❌ | ❌ | ✅ |
| Check-in/out | ✅ | ✅ | ✅ | ✅ |
| Edit own attendance | ✅ | ✅ | ❌ | ✅ |
| Edit team attendance | ✅ | ✅ | ❌ | ✅ |
| Submit leave request | ✅ | ✅ | ✅ | ✅ |
| Approve leave | ✅ | ✅ (team only) | ❌ | ✅ |
| Generate reports | ✅ | ✅ (team only) | ❌ | ✅ |

---

## 📱 Mobile Considerations

### Features for mobile app
- Quick check-in/out with GPS
- View today's attendance
- Submit leave request
- View leave balance
- Push notifications

### API optimizations
- Lightweight endpoints for mobile
- Pagination
- Caching
- Offline support (sync later)

---

## 🔄 Pattern để tích hợp modules tương tự

### 1. Module Structure Template
```
new-module/
├── database/
│   ├── schema.sql           # Tables
│   ├── triggers.sql         # Triggers
│   └── seed.sql             # Sample data
├── api/
│   ├── routes/
│   │   └── module.routes.ts
│   ├── services/
│   │   └── module.service.ts
│   └── types/
│       └── module.types.ts
├── web/
│   ├── pages/
│   │   └── ModulePage.tsx
│   ├── components/
│   │   └── module/
│   └── api/
│       └── module.api.ts
└── docs/
    └── module.md
```

### 2. Integration Checklist
- [ ] Define database schema
- [ ] Create migration file
- [ ] Define TypeScript types
- [ ] Create API routes
- [ ] Implement business logic in services
- [ ] Create frontend pages
- [ ] Create reusable components
- [ ] Add to navigation menu
- [ ] Add permissions/roles
- [ ] Write tests
- [ ] Write documentation

### 3. Common Patterns

#### Pattern A: Master-Detail Module
Ví dụ: Inventory, Products, Customers
- Master table (main entity)
- Detail tables (related data)
- CRUD operations
- List + Detail views
- Search & filters

#### Pattern B: Workflow Module
Ví dụ: Leave requests, Purchase orders, Approvals
- Request table
- Status field (pending, approved, rejected)
- Approval workflow
- Notifications
- Audit trail

#### Pattern C: Time-Series Module
Ví dụ: Attendance, Sales, Metrics
- Records with timestamps
- Aggregation by period (day, week, month)
- Summary tables
- Charts & trends
- Export reports

#### Pattern D: Document Module
Ví dụ: Contracts, Invoices, Reports
- Document metadata table
- File storage (local or cloud)
- Version control
- Templates
- PDF generation

---

## 🎯 Kết luận

### Attendance module là ví dụ điển hình cho:
1. **Time-series data** với aggregation
2. **Business rules** phức tạp (late, overtime, leave)
3. **Multi-level reporting** (employee, department, company)
4. **Workflow** (leave approval)
5. **Dashboard & visualization**

### Pattern này có thể áp dụng cho:
- **Payroll** (tính lương dựa trên attendance)
- **Performance** (đánh giá nhân viên)
- **Sales tracking** (doanh số theo thời gian)
- **Inventory** (nhập xuất tồn)
- **Project time tracking** (giờ làm việc cho dự án)

### Key takeaways:
1. **Tách bảng summary** để tối ưu query
2. **Dùng triggers** cho tính toán tự động
3. **Indexes** cho các trường thường query (employee_id, date)
4. **Validation** ở cả API và DB level
5. **Audit trail** cho mọi thay đổi quan trọng

---

**Prepared by:** Dẹo 🫸😈🫷  
**Date:** 2026-03-31  
**Next:** Implement Phase 1 hoặc chọn module khác để phân tích
