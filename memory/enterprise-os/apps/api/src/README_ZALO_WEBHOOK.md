# Zalo Webhook Skeleton (A14.2)

## Endpoints
- `GET /health`
- `GET /zalo/webhook`
- `POST /zalo/webhook`

## Environment variables
- `PORT` — default `3001`
- `ZALO_BOT_TOKEN` — bot token (keep secret)
- `ZALO_WEBHOOK_SECRET` — optional shared secret for webhook verification
- `ZALO_SEND_MODE` — `log` (default) or `disabled`

## Current status
This is a **skeleton** for A14.2 only:
- receives webhook calls
- extracts generic text/user envelope
- detects high-level intent
- generates soft assistant-style reply drafts
- logs outgoing reply drafts to server logs

It does **not** yet call the final official Zalo send-message endpoint. That will be wired in the next implementation step after final event/endpoint mapping is confirmed.

## Intents routed in this skeleton
- `reminder_create`
- `agenda_query`
- `note_capture`
- `finance_query`
- `expense_capture`
- `booking_prep`
- `fallback`

## A14.7 additions
The API now also exposes a minimal Aurora control-plane bridge:
- `GET /api/aurora/jobs`
- `POST /api/aurora/jobs`

And several webhook intents can enqueue Aurora jobs into the current Enterprise OS job model for capabilities such as:
- Gmail assist
- Calendar assist
- Sheets assist
- Drive assist
- Docs assist
- Maps assist

## Next step
A14.4/A14.6 should wire final official Zalo send-message flow.
After that, dedicated workers or polling executors can consume Aurora jobs from `deo.agent_jobs`.
