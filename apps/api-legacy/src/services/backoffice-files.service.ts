import { query as dbQuery } from '../db';
import { BACKOFFICE_FILE_STATUSES, BACKOFFICE_GENERATION_MODES } from '../constants/backoffice';

export interface BackofficeCallbackPayload {
  invocation_id?: string;
  workflow_key: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  generated_title?: string;
  file_id?: string;
  file_type?: 'gdoc' | 'gsheet' | 'gfolder' | 'other';
  file_url?: string;
  folder_id?: string;
  folder_path?: string;
  generation_mode?: string;
  document_type?: string;
  reviewer_emails?: string[];
  output_summary?: string;
  output_payload?: any;
  error_message?: string;
  source_thread_id?: string;
  source_message_id?: string;
  linked_project_id?: string;
  linked_task_id?: string;
  linked_client_id?: string;
  owner_user_id?: string;
  version?: string;
  completed_at?: string;
}

class BackofficeFilesService {
  async upsertBackofficeFileRecord(payload: BackofficeCallbackPayload) {
    if (!payload.file_id || !payload.file_url) {
      return null;
    }

    const title = payload.generated_title || payload.file_id;
    const generationMode = payload.generation_mode || BACKOFFICE_GENERATION_MODES.DRIVE_OPERATION;
    const normalizedStatus = payload.status === 'completed'
      ? BACKOFFICE_FILE_STATUSES.REVIEW
      : BACKOFFICE_FILE_STATUSES.DRAFT;

    const result = await dbQuery(
      `INSERT INTO deo.backoffice_files (
        invocation_id, workflow_key, google_file_id, google_file_type, title, url,
        document_type, generation_mode, status, version,
        folder_id, folder_path, source_thread_id, source_message_id,
        linked_project_id, linked_task_id, linked_client_id,
        owner_user_id, reviewer_emails, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20
      )
      ON CONFLICT (google_file_id)
      DO UPDATE SET
        workflow_key = EXCLUDED.workflow_key,
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        document_type = EXCLUDED.document_type,
        generation_mode = EXCLUDED.generation_mode,
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        folder_id = EXCLUDED.folder_id,
        folder_path = EXCLUDED.folder_path,
        source_thread_id = EXCLUDED.source_thread_id,
        source_message_id = EXCLUDED.source_message_id,
        linked_project_id = EXCLUDED.linked_project_id,
        linked_task_id = EXCLUDED.linked_task_id,
        linked_client_id = EXCLUDED.linked_client_id,
        owner_user_id = EXCLUDED.owner_user_id,
        reviewer_emails = EXCLUDED.reviewer_emails,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *`,
      [
        payload.invocation_id || null,
        payload.workflow_key,
        payload.file_id,
        payload.file_type || 'other',
        title,
        payload.file_url,
        payload.document_type || null,
        generationMode,
        normalizedStatus,
        payload.version || 'v1',
        payload.folder_id || null,
        payload.folder_path || null,
        payload.source_thread_id || null,
        payload.source_message_id || null,
        payload.linked_project_id || null,
        payload.linked_task_id || null,
        payload.linked_client_id || null,
        payload.owner_user_id || null,
        JSON.stringify(payload.reviewer_emails || []),
        JSON.stringify({
          output_summary: payload.output_summary || null,
          output_payload: payload.output_payload || null,
          error_message: payload.error_message || null,
          callback_completed_at: payload.completed_at || new Date().toISOString(),
        }),
      ],
    );

    return result.rows[0];
  }

  async listFiles(filters: Record<string, any> = {}) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.generation_mode) {
      params.push(filters.generation_mode);
      conditions.push(`generation_mode = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filters.document_type) {
      params.push(filters.document_type);
      conditions.push(`document_type = $${params.length}`);
    }
    if (filters.project_id) {
      params.push(filters.project_id);
      conditions.push(`linked_project_id = $${params.length}`);
    }
    if (filters.task_id) {
      params.push(filters.task_id);
      conditions.push(`linked_task_id = $${params.length}`);
    }
    if (filters.thread_id) {
      params.push(filters.thread_id);
      conditions.push(`source_thread_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await dbQuery(`SELECT * FROM deo.backoffice_files ${whereClause} ORDER BY updated_at DESC` , params);
    return result.rows;
  }
}

export const backofficeFilesService = new BackofficeFilesService();
