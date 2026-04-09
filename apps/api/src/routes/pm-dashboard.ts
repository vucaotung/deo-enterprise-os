// ============================================================
// PM Dashboard API — Real data from DB
// ============================================================
import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const WORKFLOW_EXPR = `COALESCE(t.workflow_status,
  CASE
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.status = 'in_progress' THEN 'in_progress'
    WHEN t.status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

// ============================================================
// GET /api/pm/dashboard — Full PM dashboard
// ============================================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.user.company_id;

    const [
      projectStats,
      taskStats,
      tasksByPriority,
      pendingApprovals,
      runningAgents,
      overdueTasks,
      upcomingDeadlines,
      recentActivity,
    ] = await Promise.all([
      // 1. Projects by status
      dbQuery(
        `SELECT status, COUNT(*)::int AS count
         FROM deo.projects
         WHERE company_id = $1 AND status NOT IN ('archived')
         GROUP BY status`,
        [companyId]
      ),

      // 2. Tasks by workflow status
      dbQuery(
        `SELECT ${WORKFLOW_EXPR} AS wf_status, COUNT(*)::int AS count
         FROM deo.tasks t
         WHERE t.company_id = $1
         GROUP BY wf_status`,
        [companyId]
      ),

      // 3. Tasks by priority
      dbQuery(
        `SELECT priority, COUNT(*)::int AS count
         FROM deo.tasks
         WHERE company_id = $1 AND status NOT IN ('completed', 'cancelled')
         GROUP BY priority`,
        [companyId]
      ),

      // 4. Pending approvals count
      dbQuery(
        `SELECT COUNT(*)::int AS count
         FROM deo.approvals
         WHERE company_id = $1 AND status = 'pending'`,
        [companyId]
      ),

      // 5. Running agents count
      dbQuery(
        `SELECT COUNT(*)::int AS count
         FROM deo.agents
         WHERE company_id = $1 AND status = 'online'`,
        [companyId]
      ),

      // 6. Overdue tasks (top 10)
      dbQuery(
        `SELECT t.id, t.title, t.due_date, t.priority, t.assigned_to,
                p.name AS project_name
         FROM deo.tasks t
         LEFT JOIN deo.projects p ON p.id = t.project_id
         WHERE t.company_id = $1
           AND t.due_date < CURRENT_DATE
           AND ${WORKFLOW_EXPR} NOT IN ('completed', 'cancelled')
         ORDER BY t.due_date ASC
         LIMIT 10`,
        [companyId]
      ),

      // 7. Upcoming deadlines (next 7 days, top 10)
      dbQuery(
        `SELECT t.id, t.title, t.due_date, t.priority, t.assigned_to,
                p.name AS project_name
         FROM deo.tasks t
         LEFT JOIN deo.projects p ON p.id = t.project_id
         WHERE t.company_id = $1
           AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
           AND ${WORKFLOW_EXPR} NOT IN ('completed', 'cancelled')
         ORDER BY t.due_date ASC
         LIMIT 10`,
        [companyId]
      ),

      // 8. Recent activity (top 20)
      dbQuery(
        `SELECT al.*,
           w.display_name AS actor_name
         FROM deo.activity_logs al
         LEFT JOIN deo.workers w ON w.id::text = al.actor_id::text
         WHERE al.company_id = $1
         ORDER BY al.created_at DESC
         LIMIT 20`,
        [companyId]
      ),
    ]);

    // Build KPIs
    const projectsByStatus: Record<string, number> = {};
    let activeProjects = 0;
    projectStats.rows.forEach((r: any) => {
      projectsByStatus[r.status] = r.count;
      if (r.status === 'active') activeProjects = r.count;
    });

    const tasksByStatus: Record<string, number> = {};
    let totalTasks = 0;
    let openTasks = 0;
    let doneTasks = 0;
    taskStats.rows.forEach((r: any) => {
      tasksByStatus[r.wf_status] = r.count;
      totalTasks += r.count;
      if (!['completed', 'cancelled'].includes(r.wf_status)) openTasks += r.count;
      if (r.wf_status === 'completed') doneTasks += r.count;
    });

    const tasksByPriorityMap: Record<string, number> = {};
    tasksByPriority.rows.forEach((r: any) => {
      tasksByPriorityMap[r.priority] = r.count;
    });

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    res.json({
      kpis: {
        active_projects: activeProjects,
        total_tasks: totalTasks,
        open_tasks: openTasks,
        overdue_tasks: overdueTasks.rows.length,
        pending_approvals: pendingApprovals.rows[0]?.count || 0,
        running_agents: runningAgents.rows[0]?.count || 0,
        completion_rate: completionRate,
      },
      recent_activity: recentActivity.rows,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriorityMap,
      projects_by_status: projectsByStatus,
      overdue_tasks: overdueTasks.rows,
      upcoming_deadlines: upcomingDeadlines.rows,
    });
  } catch (error) {
    console.error('PM Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch PM dashboard' });
  }
});

// ============================================================
// GET /api/pm/dashboard/project-progress — Per-project progress
// ============================================================
router.get('/project-progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT
         p.id, p.name, p.code, p.status, p.priority,
         COUNT(t.id)::int AS total_tasks,
         COUNT(t.id) FILTER (WHERE ${WORKFLOW_EXPR} = 'completed')::int AS done_tasks,
         CASE WHEN COUNT(t.id) > 0
           THEN ROUND(COUNT(t.id) FILTER (WHERE ${WORKFLOW_EXPR} = 'completed')::numeric / COUNT(t.id) * 100)::int
           ELSE 0
         END AS progress_percent
       FROM deo.projects p
       LEFT JOIN deo.tasks t ON t.project_id = p.id
       WHERE p.company_id = $1 AND p.status NOT IN ('archived', 'cancelled')
       GROUP BY p.id
       ORDER BY p.status = 'active' DESC, p.updated_at DESC`,
      [req.user.company_id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Project progress error:', error);
    res.status(500).json({ error: 'Failed to fetch project progress' });
  }
});

export default router;
