import {
  BACKOFFICE_GENERATION_MODES,
  BACKOFFICE_NAMING_STANDARD_VERSION,
  BACKOFFICE_ROOT_FOLDERS,
} from '../constants/backoffice';

export interface ResolveFolderInput {
  generation_mode: string;
  document_type?: string;
  year?: string | number;
  project_slug?: string;
  client_slug?: string;
}

function normalizeName(input?: string | null): string | null {
  if (!input) return null;
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

class BackofficeFolderService {
  resolveFolder(input: ResolveFolderInput) {
    const year = String(input.year || new Date().getFullYear());
    const documentType = normalizeName(input.document_type) || 'tai lieu khac';
    const projectSlug = normalizeName(input.project_slug);
    const clientSlug = normalizeName(input.client_slug);

    const root = input.generation_mode === BACKOFFICE_GENERATION_MODES.TEMPLATE_BASED
      ? BACKOFFICE_ROOT_FOLDERS.TEMPLATE_OUTPUTS
      : input.generation_mode === BACKOFFICE_GENERATION_MODES.DRAFT_FROM_CONTEXT
        ? BACKOFFICE_ROOT_FOLDERS.REQUEST_OUTPUTS
        : BACKOFFICE_ROOT_FOLDERS.TEMP;

    const pathParts = ['Deo Workspace', root, year, documentType];

    if (projectSlug) {
      pathParts.push(`du an ${projectSlug}`);
    }
    if (clientSlug) {
      pathParts.push(`khach hang ${clientSlug}`);
    }

    return {
      folder_name: pathParts[pathParts.length - 1],
      folder_path: pathParts.join('/'),
      naming_standard_version: BACKOFFICE_NAMING_STANDARD_VERSION,
    };
  }
}

export const backofficeFolderService = new BackofficeFolderService();
