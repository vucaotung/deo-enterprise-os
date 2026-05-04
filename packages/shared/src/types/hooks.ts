// GoClaw → EOS hooks contract.
// Spec: goclaw/config/HOOKS_PLAN.md

import type { ChannelType } from '../enums.js';

export type HookType = 'before_chat' | 'after_chat' | 'on_error';

export interface HookCommonPayload {
  hookType: HookType;
  agentId: string;
  userId: string;
  channel: ChannelType | string;
  tenantId?: string;
  timestamp: string;
}

export interface BeforeChatPayload extends HookCommonPayload {
  hookType: 'before_chat';
  message: string;
}

export interface AfterChatPayload extends HookCommonPayload {
  hookType: 'after_chat';
  userMessage: string;
  agentResponse: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs?: number;
}

export interface OnErrorPayload extends HookCommonPayload {
  hookType: 'on_error';
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  userMessage?: string;
}

// Response from before_chat — controls whether agent processes the message.
export interface BeforeChatResponse {
  block: boolean;
  inject?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

// after_chat & on_error are fire-and-forget — just ack.
export interface HookAck {
  ok: true;
}
