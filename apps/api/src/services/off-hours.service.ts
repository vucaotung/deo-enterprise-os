// Hook 5: Off-hours blocker.
// Spec: HOOKS_PLAN.md Hook 5 — block hr-agent/finance-agent/legal-agent before 7:00,
// after 20:00, or on weekends (Asia/Ho_Chi_Minh).

const TZ = 'Asia/Ho_Chi_Minh';

const RESTRICTED_AGENTS = new Set(['hr-agent', 'finance-agent', 'legal-agent']);

interface VnTime {
  hour: number;
  weekday: number; // 1 = Mon, 7 = Sun (ISO)
}

const vnNow = (now = new Date()): VnTime => {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const weekdayShort = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const weekdayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return { hour, weekday: weekdayMap[weekdayShort] ?? 1 };
};

export const isOffHours = (now = new Date()): boolean => {
  const { hour, weekday } = vnNow(now);
  if (weekday === 6 || weekday === 7) return true;
  return hour < 7 || hour >= 20;
};

export const isAgentRestricted = (agentId: string): boolean =>
  RESTRICTED_AGENTS.has(agentId);
