-- ============================================================
-- Dẹo Enterprise OS — 008 PM Seed Data
-- Chạy SAU 007
-- Mục tiêu: seed roles, permissions, workers, demo projects/tasks
-- ============================================================
BEGIN;

-- ============================================================
-- 1. ROLES
-- ============================================================

INSERT INTO deo.roles (key, label, description, is_system) VALUES
    ('owner_admin',         'Owner / Admin',        'Toàn quyền hệ thống',                     TRUE),
    ('operations_manager',  'Operations Manager',   'Quản lý vận hành, xem toàn bộ',           TRUE),
    ('project_manager',     'Project Manager',      'Quản lý dự án, assign task, approve',      TRUE),
    ('staff',               'Staff',                'Nhân viên thực thi task',                  TRUE),
    ('viewer',              'Viewer',               'Chỉ xem, không thao tác',                 TRUE),
    ('ai_agent_system',     'AI Agent (System)',     'Agent AI tự động, dispatch bởi hệ thống', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

INSERT INTO deo.permissions (key, label, description) VALUES
    ('dashboard.view',      'Xem Dashboard',            'Xem tổng quan KPI và widgets'),
    ('projects.view',       'Xem Projects',             'Xem danh sách và chi tiết dự án'),
    ('projects.manage',     'Quản lý Projects',         'Tạo, sửa, xóa dự án'),
    ('tasks.view',          'Xem Tasks',                'Xem danh sách và chi tiết task'),
    ('tasks.manage',        'Quản lý Tasks',            'Tạo, sửa, xóa task'),
    ('tasks.assign',        'Assign Tasks',             'Phân công task cho worker'),
    ('workers.view',        'Xem Workers',              'Xem danh sách nhân sự + AI'),
    ('workers.manage',      'Quản lý Workers',          'Thêm, sửa, vô hiệu hóa worker'),
    ('approvals.view',      'Xem Approvals',            'Xem danh sách phê duyệt'),
    ('approvals.decide',    'Quyết định Approval',      'Approve / reject / need-info'),
    ('ai_jobs.view',        'Xem AI Jobs',              'Xem danh sách AI jobs'),
    ('ai_jobs.run',         'Chạy AI Jobs',             'Tạo và trigger AI jobs'),
    ('documents.view',      'Xem Documents',            'Xem tài liệu dự án'),
    ('documents.manage',    'Quản lý Documents',        'Upload, xóa tài liệu'),
    ('settings.manage',     'Quản lý Settings',         'Thay đổi cấu hình hệ thống')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. ROLE-PERMISSION MAPPING
-- ============================================================

-- owner_admin: toàn quyền
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'owner_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- operations_manager: tất cả trừ settings
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'operations_manager' AND p.key != 'settings.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- project_manager: projects, tasks, workers view, approvals, docs, dashboard, ai_jobs
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'project_manager' AND p.key IN (
    'dashboard.view', 'projects.view', 'projects.manage',
    'tasks.view', 'tasks.manage', 'tasks.assign',
    'workers.view', 'approvals.view', 'approvals.decide',
    'ai_jobs.view', 'documents.view', 'documents.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- staff: view + task manage
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'staff' AND p.key IN (
    'dashboard.view', 'projects.view', 'tasks.view', 'tasks.manage',
    'workers.view', 'approvals.view', 'documents.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- viewer: chỉ view
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'viewer' AND p.key LIKE '%.view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ai_agent_system: tasks + ai_jobs + docs
INSERT INTO deo.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM deo.roles r, deo.permissions p
WHERE r.key = 'ai_agent_system' AND p.key IN (
    'tasks.view', 'tasks.manage', 'ai_jobs.view', 'ai_jobs.run',
    'documents.view', 'documents.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 4. DEMO COMPANY (nếu chưa có)
-- ============================================================

INSERT INTO deo.companies (id, name, code, status) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'DEO Corporation', 'DEO', 'active')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 5. DEMO USERS (nếu chưa có)
-- ============================================================

INSERT INTO deo.users (id, name, email, position, department, is_active) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Vincent (Sếp)',      'vucaotung@gmail.com',    'CEO',              'Management',   TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'Minh Trần',          'minh@deo.vn',            'Project Manager',  'Operations',   TRUE),
    ('b0000000-0000-0000-0000-000000000003', 'Lan Nguyễn',         'lan@deo.vn',             'Designer',         'Design',       TRUE),
    ('b0000000-0000-0000-0000-000000000004', 'Hùng Phạm',          'hung@deo.vn',            'Developer',        'Engineering',  TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 6. WORKERS — bridge từ users + agents
-- ============================================================

-- Human workers
INSERT INTO deo.workers (id, worker_type, display_name, user_id, company_id, role_name, email, status) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'human', 'Vincent (Sếp)',    'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CEO',              'vucaotung@gmail.com',  'active'),
    ('c0000000-0000-0000-0000-000000000002', 'human', 'Minh Trần',        'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Project Manager',  'minh@deo.vn',          'active'),
    ('c0000000-0000-0000-0000-000000000003', 'human', 'Lan Nguyễn',       'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Designer',         'lan@deo.vn',           'active'),
    ('c0000000-0000-0000-0000-000000000004', 'human', 'Hùng Phạm',        'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Developer',        'hung@deo.vn',          'active')
ON CONFLICT (user_id) DO NOTHING;

-- AI workers (link tới agents đã seed ở 005)
INSERT INTO deo.workers (id, worker_type, display_name, agent_id, company_id, role_name, status)
SELECT
    gen_random_uuid(),
    'ai',
    a.display_name,
    a.id,
    NULL,
    'AI Agent',
    'active'
FROM deo.agents a
WHERE NOT EXISTS (SELECT 1 FROM deo.workers w WHERE w.agent_id = a.id);

-- ============================================================
-- 7. WORKER ROLES — gán role cho workers
-- ============================================================

-- Vincent = owner_admin
INSERT INTO deo.worker_roles (worker_id, role_id, scope_type)
SELECT 'c0000000-0000-0000-0000-000000000001', r.id, 'global'
FROM deo.roles r WHERE r.key = 'owner_admin'
ON CONFLICT DO NOTHING;

-- Minh = project_manager
INSERT INTO deo.worker_roles (worker_id, role_id, scope_type)
SELECT 'c0000000-0000-0000-0000-000000000002', r.id, 'global'
FROM deo.roles r WHERE r.key = 'project_manager'
ON CONFLICT DO NOTHING;

-- Lan = staff
INSERT INTO deo.worker_roles (worker_id, role_id, scope_type)
SELECT 'c0000000-0000-0000-0000-000000000003', r.id, 'global'
FROM deo.roles r WHERE r.key = 'staff'
ON CONFLICT DO NOTHING;

-- Hùng = staff
INSERT INTO deo.worker_roles (worker_id, role_id, scope_type)
SELECT 'c0000000-0000-0000-0000-000000000004', r.id, 'global'
FROM deo.roles r WHERE r.key = 'staff'
ON CONFLICT DO NOTHING;

-- AI agents = ai_agent_system
INSERT INTO deo.worker_roles (worker_id, role_id, scope_type)
SELECT w.id, r.id, 'global'
FROM deo.workers w, deo.roles r
WHERE w.worker_type = 'ai' AND r.key = 'ai_agent_system'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. DEMO PROJECTS
-- ============================================================

INSERT INTO deo.projects (id, name, code, company_id, status, priority, description, start_date, end_date, budget, manager_id) VALUES
    ('d0000000-0000-0000-0000-000000000001',
     'Xây dựng nhà kho Bình Dương',
     'PRJ-2026-001',
     'a0000000-0000-0000-0000-000000000001',
     'active',
     'high',
     'Dự án xây dựng nhà kho 2000m2 tại KCN Mỹ Phước, Bình Dương. Bao gồm thiết kế, thi công, và nghiệm thu.',
     '2026-03-01',
     '2026-09-30',
     2500000000,
     'b0000000-0000-0000-0000-000000000001'),

    ('d0000000-0000-0000-0000-000000000002',
     'Website thương mại nông sản',
     'PRJ-2026-002',
     'a0000000-0000-0000-0000-000000000001',
     'planning',
     'medium',
     'Xây dựng website B2B cho mảng thương mại nông sản. Landing page, catalog sản phẩm, contact form.',
     '2026-04-15',
     '2026-06-30',
     150000000,
     'b0000000-0000-0000-0000-000000000002'),

    ('d0000000-0000-0000-0000-000000000003',
     'Thiết kế nội thất văn phòng HCM',
     'PRJ-2026-003',
     'a0000000-0000-0000-0000-000000000001',
     'active',
     'medium',
     'Thiết kế và thi công nội thất văn phòng mới 300m2 tại Quận 7, TP.HCM.',
     '2026-02-15',
     '2026-05-31',
     800000000,
     'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 9. PROJECT MEMBERS
-- ============================================================

INSERT INTO deo.project_members (project_id, worker_id, membership_role) VALUES
    -- PRJ-001: Vincent owner, Minh manager, Hùng contributor
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'manager'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'contributor'),
    -- PRJ-002: Minh owner, Hùng contributor, Lan contributor
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'owner'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'contributor'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'contributor'),
    -- PRJ-003: Minh manager, Lan owner, Vincent approver
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'owner'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'manager'),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'approver')
ON CONFLICT (project_id, worker_id) DO NOTHING;

-- ============================================================
-- 10. DEMO TASKS
-- ============================================================

INSERT INTO deo.tasks (id, title, description, project_id, assigned_to, priority, status, due_date, estimated_hours, progress_percentage, source) VALUES
    -- PRJ-001 tasks
    ('e0000000-0000-0000-0000-000000000001',
     'Khảo sát mặt bằng KCN Mỹ Phước',
     'Đo đạc, chụp ảnh, đánh giá hiện trạng đất. Liên hệ BQL KCN lấy bản vẽ quy hoạch.',
     'd0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000004',
     'high', 'done', '2026-03-15', 16, 100, 'manual'),

    ('e0000000-0000-0000-0000-000000000002',
     'Thiết kế bản vẽ kết cấu nhà kho',
     'Thiết kế kết cấu thép, móng, mái. Bám theo tiêu chuẩn TCVN.',
     'd0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000004',
     'high', 'in_progress', '2026-04-30', 80, 35, 'manual'),

    ('e0000000-0000-0000-0000-000000000003',
     'Xin giấy phép xây dựng',
     'Nộp hồ sơ xin phép tại Sở Xây dựng Bình Dương. Cần bản vẽ + hợp đồng thuê đất.',
     'd0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002',
     'urgent', 'todo', '2026-04-15', 24, 0, 'manual'),

    ('e0000000-0000-0000-0000-000000000004',
     'Đấu thầu nhà thầu thi công',
     'Gửi RFQ cho 5 nhà thầu, thu hồi báo giá, so sánh và chọn.',
     'd0000000-0000-0000-0000-000000000001',
     NULL,
     'medium', 'todo', '2026-05-15', 40, 0, 'manual'),

    -- PRJ-002 tasks
    ('e0000000-0000-0000-0000-000000000005',
     'Thiết kế wireframe website',
     'Wireframe cho 5 trang: Home, About, Products, Contact, Blog.',
     'd0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000003',
     'high', 'todo', '2026-04-30', 24, 0, 'manual'),

    ('e0000000-0000-0000-0000-000000000006',
     'Viết nội dung sản phẩm nông sản',
     'Content cho 20 sản phẩm: mô tả, specs, giá, hình ảnh placeholder.',
     'd0000000-0000-0000-0000-000000000002',
     NULL,
     'medium', 'todo', '2026-05-15', 16, 0, 'manual'),

    ('e0000000-0000-0000-0000-000000000007',
     'Setup domain và hosting',
     'Mua domain, setup VPS, cài Nginx + SSL.',
     'd0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004',
     'medium', 'todo', '2026-04-20', 8, 0, 'manual'),

    -- PRJ-003 tasks
    ('e0000000-0000-0000-0000-000000000008',
     'Đo đạc văn phòng và lên concept',
     'Đo kích thước, chụp hiện trạng, đề xuất 2-3 concept thiết kế.',
     'd0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000003',
     'high', 'done', '2026-03-01', 16, 100, 'manual'),

    ('e0000000-0000-0000-0000-000000000009',
     'Thiết kế 3D render nội thất',
     '3D render cho reception, phòng họp, open office, pantry.',
     'd0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000003',
     'high', 'in_progress', '2026-04-15', 48, 60, 'manual'),

    ('e0000000-0000-0000-0000-000000000010',
     'Chọn và đặt hàng nội thất',
     'Chọn bàn ghế, tủ, đèn. Gửi PO cho nhà cung cấp.',
     'd0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000002',
     'medium', 'todo', '2026-05-01', 24, 0, 'manual')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. DEMO APPROVALS
-- ============================================================

INSERT INTO deo.approvals (entity_type, entity_id, requested_by, assigned_to, status, project_id, company_id) VALUES
    ('task', 'e0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000004',
     'c0000000-0000-0000-0000-000000000001',
     'pending',
     'd0000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000001'),

    ('task', 'e0000000-0000-0000-0000-000000000009',
     'c0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000001',
     'pending',
     'd0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000001');

-- ============================================================
-- 12. DEMO ACTIVITY LOGS
-- ============================================================

INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary) VALUES
    ('project_created', 'human', 'c0000000-0000-0000-0000-000000000001', 'project', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Vincent tạo dự án Xây dựng nhà kho Bình Dương'),
    ('task_created', 'human', 'c0000000-0000-0000-0000-000000000002', 'task', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Minh tạo task Khảo sát mặt bằng'),
    ('task_status_changed', 'human', 'c0000000-0000-0000-0000-000000000004', 'task', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Hùng hoàn thành Khảo sát mặt bằng'),
    ('project_created', 'human', 'c0000000-0000-0000-0000-000000000002', 'project', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Minh tạo dự án Website thương mại nông sản'),
    ('project_created', 'human', 'c0000000-0000-0000-0000-000000000003', 'project', 'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Lan tạo dự án Thiết kế nội thất văn phòng'),
    ('approval_requested', 'human', 'c0000000-0000-0000-0000-000000000004', 'task', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Hùng yêu cầu duyệt bản vẽ kết cấu nhà kho');

COMMIT;

-- VERIFY
SELECT 'roles' AS tbl, count(*) FROM deo.roles
UNION ALL SELECT 'permissions', count(*) FROM deo.permissions
UNION ALL SELECT 'role_permissions', count(*) FROM deo.role_permissions
UNION ALL SELECT 'workers', count(*) FROM deo.workers
UNION ALL SELECT 'worker_roles', count(*) FROM deo.worker_roles
UNION ALL SELECT 'projects', count(*) FROM deo.projects
UNION ALL SELECT 'project_members', count(*) FROM deo.project_members
UNION ALL SELECT 'tasks', count(*) FROM deo.tasks
UNION ALL SELECT 'approvals', count(*) FROM deo.approvals
UNION ALL SELECT 'activity_logs', count(*) FROM deo.activity_logs;
