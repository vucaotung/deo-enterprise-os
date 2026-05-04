# GoClaw Agent Hooks — Setup Plan
# Dẹo Enterprise OS v3.0

> Hooks bổ sung cho n8n — không thay thế.
> n8n = time-based + integration fabric | Hooks = event-based middleware on every request

---

## Tổng quan

GoClaw hooks là lifecycle middleware fires trên mỗi agent request:

```
User message
    ↓
[before_chat hook] ← inject context, block, rate-limit
    ↓
Agent processes
    ↓
[after_chat hook]  ← log, transform, forward
    ↓
Response to user
```

Hook là HTTP webhook calls từ GoClaw → EOS API. EOS API xử lý logic rồi trả response.

---

## Hook Types (GoClaw Standard)

| Hook | Trigger | Có thể làm |
|---|---|---|
| `before_chat` | Trước khi agent xử lý message | Inject context, block request, rate-limit, enrich user info |
| `after_chat` | Sau khi agent respond | Log conversation, transform response, forward to n8n |
| `on_error` | Khi agent throw error | Fallback, alert, retry logic |

---

## Hooks cần setup cho Dẹo OS

### Hook 1 — User Context Injection (PRIORITY: HIGH)
**Type:** `before_chat`
**Scope:** Tất cả agents

**Vấn đề hiện tại:** Agents không biết user là ai (tên, role, team, timezone). USER.md chỉ có nội dung static.

**Hook làm gì:**
```
GoClaw nhận message từ user_id: zl_12345
    ↓
before_chat hook gọi: POST /hooks/before-chat
    ↓
EOS API lookup user từ DB (theo user_id)
    ↓
Trả về context injection:
  {
    "inject": "User: Nguyễn Văn A | Role: Sales | Team: B2B | Timezone: Asia/Ho_Chi_Minh"
  }
    ↓
GoClaw prepend vào system prompt của agent
```

**Kết quả:** Agent biết đang nói chuyện với ai mà không cần user tự giới thiệu.

---

### Hook 2 — Conversation Logger (PRIORITY: HIGH)
**Type:** `after_chat`
**Scope:** Tất cả agents

**Vấn đề hiện tại:** Không có audit trail nào của conversations. Dream-agent không có gì để đọc khi tổng hợp daily reflection.

**Hook làm gì:**
```
Agent respond xong
    ↓
after_chat hook gọi: POST /hooks/after-chat
    ↓
EOS API lưu vào DB:
  {
    agent_id, user_id, channel, timestamp,
    user_message, agent_response,
    tokens_used, latency_ms
  }
    ↓
Return 200 (non-blocking — không ảnh hưởng response time)
```

**Kết quả:** Dream-agent có data thực để tổng hợp. Analytics khả dụng.

---

### Hook 3 — Rate Limiter (PRIORITY: MEDIUM)
**Type:** `before_chat`
**Scope:** Tất cả agents (khác limit cho staff vs management)

**Logic:**
```
Staff:      max 20 messages/hour/agent
Management: max 100 messages/hour/agent
System:     unlimited
```

**Hook làm gì:**
```
before_chat: check Redis counter cho user_id + agent_id
    ↓
Nếu vượt limit: return { "block": true, "message": "Bạn đã dùng quá giới hạn..." }
Nếu OK: return { "block": false } + increment counter
```

---

### Hook 4 — Error Alerter (PRIORITY: MEDIUM)
**Type:** `on_error`
**Scope:** deo, ops-admin, finance-agent (critical agents)

**Hook làm gì:**
```
Agent throw error (500, timeout, model error)
    ↓
on_error hook gọi: POST /hooks/on-error
    ↓
EOS API:
  1. Log error với full context
  2. Nếu P0 agent (deo/finance/hr): push Telegram alert tới sếp
  3. Increment error counter — nếu > 3 lần/5 phút: disable agent tạm, alert ops-admin
```

---

### Hook 5 — Off-hours Blocker (PRIORITY: LOW)
**Type:** `before_chat`
**Scope:** hr-agent, finance-agent, legal-agent

**Logic:** Ngoài giờ làm việc (trước 7:00, sau 20:00, cuối tuần) → redirect sang deo với message giải thích.

```
before_chat: check current time Asia/Ho_Chi_Minh
    ↓
Ngoài giờ: block + "Ngoài giờ làm việc. Liên hệ Dẹo cho urgent requests."
Trong giờ: pass through
```

---

## Implementation Plan

### Phase 1 — Infrastructure (1-2 ngày)

**1.1 Tạo Hooks Router trong EOS API**

```
POST /hooks/before-chat   → HookController.beforeChat()
POST /hooks/after-chat    → HookController.afterChat()
POST /hooks/on-error      → HookController.onError()
```

Auth: GoClaw gọi với `X-Hook-Secret` header (shared secret trong .env).

**1.2 Payload từ GoClaw (cần verify với GoClaw docs)**

GoClaw gửi payload dạng:
```json
{
  "hook_type": "before_chat",
  "agent_id": "hr-agent",
  "user_id": "zl_12345",
  "channel": "zalo",
  "message": "...",
  "tenant_id": "0193a5b0-7000-7000-8000-000000000001",
  "timestamp": "2026-04-22T10:30:00Z"
}
```

**1.3 Response format**

`before_chat` response:
```json
{
  "block": false,
  "inject": "User: Nguyễn A | Role: Sales",
  "metadata": {}
}
```

`after_chat` và `on_error` — chỉ cần trả 200 OK (fire-and-forget).

---

### Phase 2 — Hook 1: User Context Injection (ưu tiên trước)

**2.1 EOS API: `/hooks/before-chat`**

```typescript
async beforeChat(payload: HookPayload) {
  const user = await userService.findByChannelId(
    payload.channel,
    payload.user_id
  );

  if (!user) return { block: false }; // unknown user — let through

  const context = buildUserContext(user);
  // "User: ${name} | Role: ${role} | Team: ${team}"

  return {
    block: false,
    inject: context
  };
}
```

**2.2 GoClaw config — add hook to agents**

Vào Dashboard → Agent → Edit → Hooks tab:
```json
{
  "before_chat": {
    "url": "http://host.docker.internal:3000/hooks/before-chat",
    "secret": "hook_secret_xxx",
    "timeout_ms": 500
  }
}
```

> **`host.docker.internal`** — vì GoClaw chạy trong Docker, cần dùng hostname này để gọi ra Windows host.
> Port `3000` = EOS API port. Điều chỉnh nếu khác.

---

### Phase 3 — Hook 2: Conversation Logger

**3.1 DB schema**

```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY,
  agent_id VARCHAR(50),
  user_id VARCHAR(100),
  channel VARCHAR(20),
  user_message TEXT,
  agent_response TEXT,
  tokens_prompt INT,
  tokens_completion INT,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3.2 EOS API: `/hooks/after-chat`**

```typescript
async afterChat(payload: AfterChatPayload) {
  await db.agentConversations.insert({
    agent_id: payload.agent_id,
    user_id: payload.user_id,
    channel: payload.channel,
    user_message: payload.user_message,
    agent_response: payload.agent_response,
    tokens_prompt: payload.usage?.prompt_tokens,
    tokens_completion: payload.usage?.completion_tokens,
    created_at: new Date()
  });

  return { ok: true }; // fire-and-forget
}
```

**3.3 Dùng async — không block agent response**

```typescript
// Non-blocking: don't await
this.logConversation(payload).catch(err =>
  logger.error('Hook logging failed', err)
);
return { ok: true };
```

---

### Phase 4 — Hook 3: Rate Limiter (dùng Redis)

**4.1 Redis key pattern**
```
rate:{user_id}:{agent_id}:{hour_bucket}
TTL: 3600s
```

**4.2 Logic**
```typescript
const limit = getUserLimit(user.role); // staff: 20, management: 100
const key = `rate:${userId}:${agentId}:${hourBucket()}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 3600);

if (count > limit) {
  return {
    block: true,
    inject: `⚠️ Bạn đã gửi ${count} messages trong giờ này. Giới hạn: ${limit}.`
  };
}
```

---

## Hook vs n8n — Ranh giới rõ ràng

| Việc | Dùng Hook | Dùng n8n |
|---|---|---|
| Inject user context vào agent | ✅ before_chat | ✗ |
| Log mọi conversation | ✅ after_chat | ✗ |
| Rate limiting | ✅ before_chat | ✗ |
| Trigger dream-agent lúc 21:00 | ✗ | ✅ Cron |
| Tạo Drive folder sau khi agent quyết định | ✗ | ✅ Workflow |
| Gửi email khi onboarding lead | ✗ | ✅ Workflow |
| Sync data sang Google Sheets | ✗ | ✅ Integration |
| Error alert khi agent down | ✅ on_error | (cũng có thể) |

> **Rule:** Nếu cần fire on **every request** → Hook. Nếu cần trigger **theo time hoặc external event** → n8n.

---

## Setup Order

```
Week 1:
  [x] Đọc GoClaw hook docs → verify payload format
  [ ] Tạo /hooks/* endpoints trong EOS API
  [ ] Setup X-Hook-Secret auth
  [ ] Deploy + test với dream-agent trước (low risk)

Week 2:
  [ ] Hook 1 (User Context Injection) — roll out dần từng agent
  [ ] Hook 2 (Conversation Logger) — roll out all agents
  [ ] Verify dream-agent nhận conversation data

Week 3:
  [ ] Hook 3 (Rate Limiter) nếu cần
  [ ] Hook 4 (Error Alerter) cho critical agents
  [ ] Hook 5 (Off-hours) nếu muốn

Sau đó:
  [ ] Build analytics dashboard từ agent_conversations table
  [ ] Dream-agent đọc từ DB thay vì "không có data"
```

---

## Prerequisite

- EOS API đang chạy và accessible từ GoClaw container
- `host.docker.internal` resolve được (Windows Docker Desktop — mặc định có)
- Redis instance (dùng cho rate limiting — có thể skip ở Phase 1)
- GoClaw docs xác nhận payload format và hook config syntax

---

*HOOKS_PLAN.md — Dẹo Enterprise OS v3.0 | 2026-04-22*
