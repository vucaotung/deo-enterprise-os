import { query as dbQuery } from '../db';

export interface RoutedAgent {
  agent_id: string;
  name: string;
  display_name: string | null;
  reason: string;
}

/**
 * Pick an online agent best matching the task's tags against agents.capabilities.
 * Both `tasks.tags` and `agents.capabilities` are JSONB arrays of strings.
 * Falls back to any online agent if no capability match.
 * Returns null when no agent is online.
 */
export async function pickAgentForTask(task: {
  id?: string;
  tags?: unknown;
  category_id?: string | null;
}): Promise<RoutedAgent | null> {
  const tags = normalizeTags(task.tags);

  if (tags.length > 0) {
    const result = await dbQuery(
      `SELECT id, name, display_name
         FROM deo.agents
        WHERE status = 'online'
          AND capabilities ?| $1::text[]
        ORDER BY last_heartbeat DESC NULLS LAST
        LIMIT 1`,
      [tags]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        agent_id: row.id,
        name: row.name,
        display_name: row.display_name,
        reason: `capability_match:${tags.join(',')}`,
      };
    }
  }

  const fallback = await dbQuery(
    `SELECT id, name, display_name
       FROM deo.agents
      WHERE status = 'online'
      ORDER BY last_heartbeat DESC NULLS LAST
      LIMIT 1`
  );
  if (fallback.rows.length > 0) {
    const row = fallback.rows[0];
    return {
      agent_id: row.id,
      name: row.name,
      display_name: row.display_name,
      reason: 'fallback_any_online',
    };
  }

  return null;
}

function normalizeTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === 'string');
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}
