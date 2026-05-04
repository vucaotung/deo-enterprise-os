import { query as dbQuery } from '../db';
import { v4 as uuidv4 } from 'uuid';

export type EventHandler = (event: any) => Promise<void>;

interface EventListener {
  eventType: string;
  handler: EventHandler;
}

class EventService {
  private listeners: EventListener[] = [];

  async emit(event: {
    type: string;
    company_id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    data?: any;
  }) {
    try {
      const eventId = uuidv4();

      await dbQuery(
        `INSERT INTO deo.audit_events (id, company_id, user_id, action, entity_type, entity_id, new_values, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          eventId,
          event.company_id,
          event.user_id,
          event.action,
          event.entity_type,
          event.entity_id,
          event.data ? JSON.stringify(event.data) : null,
        ]
      );

      const matchingListeners = this.listeners.filter((l) => l.eventType === event.type || l.eventType === '*');

      for (const listener of matchingListeners) {
        try {
          await listener.handler(event);
        } catch (error) {
          console.error('Event handler error', { eventType: event.type, error });
        }
      }
    } catch (error) {
      console.error('Failed to emit event', { error });
    }
  }

  on(eventType: string, handler: EventHandler) {
    this.listeners.push({ eventType, handler });

    return () => {
      this.listeners = this.listeners.filter((l) => !(l.eventType === eventType && l.handler === handler));
    };
  }

  off(eventType: string, handler: EventHandler) {
    this.listeners = this.listeners.filter((l) => !(l.eventType === eventType && l.handler === handler));
  }

  removeAllListeners() {
    this.listeners = [];
  }
}

export const eventService = new EventService();

export default eventService;
