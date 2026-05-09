import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.user.company_id;

    const [tasksResult, expensesResult, leadsResult, agentsResult, clarificationsResult, completedTasksResult] = await Promise.all([
      dbQuery(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN COALESCE(workflow_status, status) = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN COALESCE(workflow_status, status) IN ('open', 'todo') THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN COALESCE(workflow_status, status) = 'in_progress' THEN 1 ELSE 0 END) as in_progress
         FROM deo.tasks WHERE company_id = $1`,
        [companyId]
      ),
      dbQuery(
        `SELECT SUM(CAST(amount AS BIGINT)) as total,
                COUNT(*) as count,
                SUM(CAST(amount AS BIGINT)) as approved
         FROM deo.expenses WHERE company_id = $1`,
        [companyId]
      ),
      dbQuery(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
         FROM deo.leads WHERE company_id = $1`,
        [companyId]
      ),
      dbQuery(
        `SELECT SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
         FROM deo.agents`
      ),
      dbQuery(
        `SELECT COUNT(*) as total
         FROM deo.clarifications c
         JOIN deo.tasks t ON t.id = c.task_id
         WHERE t.company_id = $1 AND c.status IN ('open', 'pending')`,
        [companyId]
      ),
      dbQuery(
        `SELECT t.id, t.title, COALESCE(a.display_name, u.name, u.email) as actor_name, t.updated_at
         FROM deo.tasks t
         LEFT JOIN deo.agents a ON a.id = t.agent_id
         LEFT JOIN deo.users u ON u.id = t.assigned_to
         WHERE t.company_id = $1
           AND COALESCE(t.workflow_status, t.status) = 'completed'
           AND t.updated_at >= NOW() - INTERVAL '48 hours'
         ORDER BY t.updated_at DESC
         LIMIT 5`,
        [companyId]
      ),
    ]);

    const tasksData = tasksResult.rows[0];
    const expensesData = expensesResult.rows[0];
    const leadsData = leadsResult.rows[0];
    const agentsData = agentsResult.rows[0];
    const clarificationsData = clarificationsResult.rows[0];
    const completedTaskAlerts = completedTasksResult.rows.map((task: any) => ({
      type: 'Task done',
      message: `${task.actor_name || 'Agent'} đã hoàn tất task: ${task.title}`,
      task_id: task.id,
      created_at: task.updated_at,
    }));

    res.json({
      tasks: {
        total: parseInt(tasksData.total) || 0,
        completed: parseInt(tasksData.completed) || 0,
        open: parseInt(tasksData.open) || 0,
        in_progress: parseInt(tasksData.in_progress) || 0,
      },
      expenses: {
        total: parseInt(expensesData.total) || 0,
        count: parseInt(expensesData.count) || 0,
        approved: parseInt(expensesData.approved) || 0,
      },
      leads: {
        total: parseInt(leadsData.total) || 0,
        converted: parseInt(leadsData.converted) || 0,
      },
      agents: {
        online: parseInt(agentsData.online) || 0,
        offline: parseInt(agentsData.offline) || 0,
      },
      clarifications: {
        pending: parseInt(clarificationsData.total) || 0,
      },
      alerts: completedTaskAlerts,
    });
  } catch (error) {
    console.error('Dashboard summary error', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

router.get('/charts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.user.company_id;

    const [tasksChart, expensesChart, leadSourceChart] = await Promise.all([
      dbQuery(
        `SELECT status, COUNT(*) as count FROM deo.tasks WHERE company_id = $1 GROUP BY status`,
        [companyId]
      ),
      dbQuery(
        `SELECT DATE_TRUNC('month', expense_date)::date as month, SUM(CAST(amount AS BIGINT)) as total
         FROM deo.expenses WHERE company_id = $1 GROUP BY month ORDER BY month DESC LIMIT 12`,
        [companyId]
      ),
      dbQuery(
        `SELECT source, COUNT(*) as count FROM deo.leads WHERE company_id = $1 GROUP BY source`,
        [companyId]
      ),
    ]);

    res.json({
      tasks_by_status: tasksChart.rows,
      expenses_by_month: expensesChart.rows,
      leads_by_source: leadSourceChart.rows,
    });
  } catch (error) {
    console.error('Dashboard charts error', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;
