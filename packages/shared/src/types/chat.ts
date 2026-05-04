import { ActorType, ChannelType } from '../enums.js';

export interface ChatThread {
  id: string;
  companyId: string;
  channel: ChannelType;
  externalChatId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  companyId: string;
  senderActorType: ActorType;
  senderActorId: string | null;
  body: string;
  source: { channel: ChannelType; externalMessageId?: string } | null;
  createdAt: string;
}

export interface ChatLinkedEntity {
  threadId: string;
  entityType: 'project' | 'task';
  entityId: string;
  linkedAt: string;
}
