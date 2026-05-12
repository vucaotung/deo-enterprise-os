import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LiveEvent } from '@/types';

// Subscribes to Paperclip's company-scoped WebSocket and invalidates the
// React Query caches that match the event type. Tabs in the background
// drop the connection — that's fine, React Query refetches on focus.

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export function useLiveEvents(companyId: string | undefined): void {
  const qc = useQueryClient();
  const seenIds = useRef(new Set<number>());

  useEffect(() => {
    if (!companyId) return;
    let socket: WebSocket | null = null;
    let attempt = 0;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const url = `${
      window.location.protocol === 'https:' ? 'wss' : 'ws'
    }://${window.location.host}/api/companies/${companyId}/events/ws`;

    const onMessage = (evt: MessageEvent<string>) => {
      let parsed: LiveEvent;
      try {
        parsed = JSON.parse(evt.data) as LiveEvent;
      } catch {
        return;
      }
      if (seenIds.current.has(parsed.id)) return;
      seenIds.current.add(parsed.id);

      switch (parsed.type) {
        case 'agent.status':
          qc.invalidateQueries({ queryKey: ['agents', companyId] });
          break;
        case 'activity.logged':
          qc.invalidateQueries({ queryKey: ['activity', companyId] });
          break;
        case 'heartbeat.run.queued':
        case 'heartbeat.run.status':
        case 'heartbeat.run.event':
        case 'heartbeat.run.log': {
          const issueId =
            (parsed.payload as { issueId?: string }).issueId ?? undefined;
          qc.invalidateQueries({ queryKey: ['live-runs', companyId] });
          if (issueId) {
            qc.invalidateQueries({ queryKey: ['issue', issueId] });
            qc.invalidateQueries({ queryKey: ['issue-runs', issueId] });
            qc.invalidateQueries({ queryKey: ['issue-comments', issueId] });
          }
          break;
        }
        default:
          break;
      }
    };

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(url);
      socket.addEventListener('open', () => {
        attempt = 0;
      });
      socket.addEventListener('message', onMessage);
      socket.addEventListener('close', () => {
        if (stopped) return;
        attempt += 1;
        const wait = Math.min(
          RECONNECT_MAX_MS,
          RECONNECT_MIN_MS * 2 ** Math.min(attempt, 5),
        );
        reconnectTimer = setTimeout(connect, wait);
      });
      socket.addEventListener('error', () => {
        socket?.close();
      });
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [companyId, qc]);
}
