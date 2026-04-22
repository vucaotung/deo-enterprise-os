import { query as dbQuery } from '../db';

export interface ContextData {
  user?: any;
  companies: any[];
  relatedEntities: any[];
  openTasks: any[];
  recentInteractions: any[];
  files: any[];
  notebooks: any[];
}

class ContextService {
  async getContextForConversation(conversationId: string): Promise<ContextData> {
    try {
      const conversation = await dbQuery(
        'SELECT * FROM deo.conversations WHERE id = $1',
        [conversationId]
      );

      if (conversation.rows.length === 0) {
        return {
          companies: [],
          relatedEntities: [],
          openTasks: [],
          recentInteractions: [],
          files: [],
          notebooks: [],
        };
      }

      const conv = conversation.rows[0];
      const companyId = conv.company_id;
      const taskId = conv.task_id;

      const [companies, tasks, interactions, files, notebooks] = await Promise.all([
        dbQuery('SELECT * FROM deo.companies WHERE id = $1', [companyId]),
        dbQuery('SELECT * FROM deo.tasks WHERE conversation_id = $1 OR id = $2 ORDER BY created_at DESC LIMIT 10', [
          conversationId,
          taskId,
        ]),
        dbQuery(
          'SELECT * FROM deo.interactions WHERE id IN (SELECT entity_id FROM deo.audit_events WHERE entity_type = $1 AND company_id = $2) ORDER BY created_at DESC LIMIT 10',
          ['interaction', companyId]
        ),
        dbQuery('SELECT * FROM deo.files WHERE entity_type = $1 AND entity_id = $2', ['conversation', conversationId]),
        dbQuery('SELECT * FROM deo.notebooks WHERE entity_type = $1 AND entity_id = $2', ['conversation', conversationId]),
      ]);

      return {
        companies: companies.rows,
        relatedEntities: [conv],
        openTasks: tasks.rows.filter((t: any) => t.status !== 'completed' && t.status !== 'failed'),
        recentInteractions: interactions.rows,
        files: files.rows,
        notebooks: notebooks.rows,
      };
    } catch (error) {
      console.error('Failed to get conversation context', { error });
      return {
        companies: [],
        relatedEntities: [],
        openTasks: [],
        recentInteractions: [],
        files: [],
        notebooks: [],
      };
    }
  }

  async getContextForClient(clientId: string): Promise<ContextData> {
    try {
      const client = await dbQuery('SELECT * FROM deo.clients WHERE id = $1', [clientId]);

      if (client.rows.length === 0) {
        return {
          companies: [],
          relatedEntities: [],
          openTasks: [],
          recentInteractions: [],
          files: [],
          notebooks: [],
        };
      }

      const clientData = client.rows[0];
      const companyId = clientData.company_id;

      const [companies, projects, interactions, tasks, files] = await Promise.all([
        dbQuery('SELECT * FROM deo.companies WHERE id = $1', [companyId]),
        dbQuery('SELECT * FROM deo.projects WHERE client_id = $1', [clientId]),
        dbQuery('SELECT * FROM deo.interactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20', [clientId]),
        dbQuery(
          'SELECT * FROM deo.tasks WHERE project_id IN (SELECT id FROM deo.projects WHERE client_id = $1) AND status != $2 ORDER BY created_at DESC LIMIT 20',
          [clientId, 'completed']
        ),
        dbQuery('SELECT * FROM deo.files WHERE entity_type = $1 AND entity_id = $2', ['client', clientId]),
      ]);

      return {
        companies: companies.rows,
        relatedEntities: [clientData, ...projects.rows],
        openTasks: tasks.rows,
        recentInteractions: interactions.rows,
        files: files.rows,
        notebooks: [],
      };
    } catch (error) {
      console.error('Failed to get client context', { error });
      return {
        companies: [],
        relatedEntities: [],
        openTasks: [],
        recentInteractions: [],
        files: [],
        notebooks: [],
      };
    }
  }

  async getContextForTask(taskId: string): Promise<ContextData> {
    try {
      const task = await dbQuery('SELECT * FROM deo.tasks WHERE id = $1', [taskId]);

      if (task.rows.length === 0) {
        return {
          companies: [],
          relatedEntities: [],
          openTasks: [],
          recentInteractions: [],
          files: [],
          notebooks: [],
        };
      }

      const taskData = task.rows[0];
      const companyId = taskData.company_id;
      const projectId = taskData.project_id;

      const [companies, project, relatedTasks, files, notebooks, clarifications] = await Promise.all([
        dbQuery('SELECT * FROM deo.companies WHERE id = $1', [companyId]),
        projectId ? dbQuery('SELECT * FROM deo.projects WHERE id = $1', [projectId]) : Promise.resolve({ rows: [] }),
        dbQuery(
          'SELECT * FROM deo.tasks WHERE project_id = $1 AND id != $2 AND status != $3 ORDER BY created_at DESC LIMIT 10',
          [projectId || taskData.id, taskId, 'completed']
        ),
        dbQuery('SELECT * FROM deo.files WHERE entity_type = $1 AND entity_id = $2', ['task', taskId]),
        dbQuery('SELECT * FROM deo.notebooks WHERE entity_type = $1 AND entity_id = $2', ['task', taskId]),
        dbQuery('SELECT * FROM deo.clarifications WHERE entity_type = $1 AND entity_id = $2', ['task', taskId]),
      ]);

      return {
        companies: companies.rows,
        relatedEntities: [taskData, ...(project.rows || [])],
        openTasks: relatedTasks.rows,
        recentInteractions: [],
        files: files.rows,
        notebooks: [...notebooks.rows, ...clarifications.rows],
      };
    } catch (error) {
      console.error('Failed to get task context', { error });
      return {
        companies: [],
        relatedEntities: [],
        openTasks: [],
        recentInteractions: [],
        files: [],
        notebooks: [],
      };
    }
  }
}

export const contextService = new ContextService();

export default contextService;
