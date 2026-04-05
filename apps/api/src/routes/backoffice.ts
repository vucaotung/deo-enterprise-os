import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import { backofficeRegistryService } from '../services/backoffice-registry.service';
import { backofficeFolderService } from '../services/backoffice-folder.service';
import { backofficeDispatchService } from '../services/backoffice-dispatch.service';
import { backofficeFilesService } from '../services/backoffice-files.service';
import { BACKOFFICE_WORKFLOW_KEYS } from '../constants/backoffice';

const router = Router();

router.get('/workflows', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await backofficeRegistryService.listBackofficeWorkflows();
    res.json({ data: workflows });
  } catch (error) {
    console.error('List backoffice workflows error', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/workflows/:key', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await backofficeRegistryService.getWorkflowByKey(req.params.key);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error('Get backoffice workflow error', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.post('/folders/resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const resolved = backofficeFolderService.resolveFolder(req.body);
    res.json(resolved);
  } catch (error) {
    console.error('Resolve backoffice folder error', error);
    res.status(500).json({ error: 'Failed to resolve folder' });
  }
});

router.post('/workflows/dispatch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await backofficeDispatchService.dispatch({
      workflow_key: req.body.workflow_key,
      objective: req.body.objective || 'backoffice workflow dispatch',
      context: req.body.context || {},
      payload: req.body.payload || {},
      reviewers: req.body.reviewers || [],
      invoked_by_type: 'human',
      invoked_by_id: req.user.id,
    });

    res.status(202).json(result);
  } catch (error: any) {
    console.error('Dispatch backoffice workflow error', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch workflow' });
  }
});

router.post('/docs/from-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await backofficeDispatchService.dispatch({
      workflow_key: BACKOFFICE_WORKFLOW_KEYS.DOCS_FROM_TEMPLATE,
      objective: req.body.objective || 'generate document from template',
      context: req.body.context || {},
      payload: {
        template_key: req.body.template_key,
        template_id: req.body.template_id,
        title: req.body.title,
        data: req.body.data || {},
        target_folder: req.body.target_folder || null,
        status: req.body.status || 'draft',
        version: req.body.version || 'v1',
      },
      reviewers: req.body.reviewers || [],
      invoked_by_type: 'human',
      invoked_by_id: req.user.id,
    });

    res.status(202).json(result);
  } catch (error: any) {
    console.error('Dispatch docs.from-template error', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch docs.from-template' });
  }
});

router.post('/workflows/callback', async (req: AuditedRequest, res: Response) => {
  try {
    const expectedToken = process.env.BACKOFFICE_CALLBACK_TOKEN;
    const providedToken = req.headers['x-backoffice-callback-token'];

    if (expectedToken && providedToken !== expectedToken) {
      return res.status(401).json({ error: 'Invalid callback token' });
    }

    const fileRecord = await backofficeFilesService.upsertBackofficeFileRecord(req.body);

    req.auditData = {
      entity_type: 'backoffice_callback',
      entity_id: req.body.file_id || req.body.invocation_id || req.body.workflow_key,
      new_values: req.body,
    };

    res.json({
      ok: true,
      workflow_key: req.body.workflow_key,
      status: req.body.status,
      file: fileRecord,
    });
  } catch (error) {
    console.error('Handle backoffice callback error', error);
    res.status(500).json({ error: 'Failed to handle backoffice callback' });
  }
});

router.get('/files', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const files = await backofficeFilesService.listFiles(req.query as Record<string, any>);
    res.json({ data: files });
  } catch (error) {
    console.error('List backoffice files error', error);
    res.status(500).json({ error: 'Failed to fetch backoffice files' });
  }
});

export default router;
