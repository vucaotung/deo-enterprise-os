export const BACKOFFICE_WORKFLOW_KEYS = {
  DRIVE_RESOLVE_FOLDER: 'drive.resolve-folder.v1',
  DRIVE_ENSURE_FOLDER_TREE: 'drive.ensure-folder-tree.v1',
  DRIVE_SHARE_FOR_REVIEW: 'drive.share-for-review.v1',
  DOCS_FROM_TEMPLATE: 'docs.from-template.v1',
  DOCS_DRAFT_FROM_CONTEXT: 'docs.draft-from-context.v1',
  DOCS_MATERIALIZE: 'docs.materialize.v1',
  SHEETS_SCHEMA_FROM_CONTEXT: 'sheets.schema-from-context.v1',
  SHEETS_MATERIALIZE: 'sheets.materialize.v1',
  SHEETS_FROM_TEMPLATE: 'sheets.from-template.v1',
  DRIVE_ARCHIVE_FILE: 'drive.archive-file.v1',
} as const;

export const BACKOFFICE_GENERATION_MODES = {
  TEMPLATE_BASED: 'template_based',
  DRAFT_FROM_CONTEXT: 'draft_from_context',
  DRIVE_OPERATION: 'drive_operation',
} as const;

export const BACKOFFICE_FILE_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  FINAL: 'final',
  SIGNED: 'signed',
  ARCHIVED: 'archived',
} as const;

export const BACKOFFICE_NAMING_STANDARD_VERSION = 'v1';

export const BACKOFFICE_ROOT_FOLDERS = {
  TEMPLATES: '01_templates',
  TEMPLATE_OUTPUTS: '02_ho so theo mau',
  REQUEST_OUTPUTS: '03_ho so theo yeu cau',
  PROJECTS: '04_du an',
  CLIENTS: '05_khach hang',
  TEMP: '08_luu tam',
  ARCHIVE: '09_luu tru',
} as const;

export type BackofficeWorkflowKey = typeof BACKOFFICE_WORKFLOW_KEYS[keyof typeof BACKOFFICE_WORKFLOW_KEYS];
export type BackofficeGenerationMode = typeof BACKOFFICE_GENERATION_MODES[keyof typeof BACKOFFICE_GENERATION_MODES];
export type BackofficeFileStatus = typeof BACKOFFICE_FILE_STATUSES[keyof typeof BACKOFFICE_FILE_STATUSES];
