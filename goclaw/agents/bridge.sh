#!/usr/bin/env bash
# GoClaw → Dẹo OS bridge.
#
# Each agent (finance-agent, hr-agent, office-agent, ...) sources this file
# at the top of its session. The bridge keeps the OS up to date about:
#   * agent online status (heartbeat every 60s in background)
#   * task_started / task_completed / task_failed (call agent_event)
#   * clarification_asked when the agent needs human input
#
# Required env (set per-agent in goclaw/agents/<name>/.env or systemd unit):
#   AGENT_SLUG=finance-agent
#   AGENT_TOKEN=<uuid from deo.agents.api_token>
#   API_BASE=https://api.enterpriseos.bond
#
# Usage from inside an agent shell:
#   source /opt/deo-enterprise-os/goclaw/agents/bridge.sh
#   agent_heartbeat_loop &        # background heartbeat
#   agent_event task_started '{"task_id":"..."}'
#   agent_event task_completed '{"task_id":"...","result":"..."}'

set -u

: "${AGENT_SLUG:?AGENT_SLUG must be set}"
: "${AGENT_TOKEN:?AGENT_TOKEN must be set (X-Agent-Token)}"
: "${API_BASE:=https://api.enterpriseos.bond}"

_curl() {
  curl -fsS --max-time 10 \
    -H "Content-Type: application/json" \
    -H "X-Agent-Token: ${AGENT_TOKEN}" \
    "$@"
}

agent_heartbeat() {
  local payload="${1:-{\"slug\":\"${AGENT_SLUG}\"}}"
  _curl -X POST "${API_BASE}/api/agent-ingest/heartbeat" -d "$payload" || true
}

agent_heartbeat_loop() {
  while true; do
    agent_heartbeat
    sleep 60
  done
}

# agent_event <type> <json-payload>
#   type: task_started | task_completed | task_failed | clarification_asked | log | error | metric
agent_event() {
  local type="$1"
  local payload="${2:-{}}"
  _curl -X POST "${API_BASE}/api/agent-ingest/events" \
    -d "{\"type\":\"${type}\",\"payload\":${payload}}" || true
}

# agent_task_event <type> <task_uuid> <json-payload>
agent_task_event() {
  local type="$1"
  local task_id="$2"
  local payload="${3:-{}}"
  _curl -X POST "${API_BASE}/api/agent-ingest/events" \
    -d "{\"type\":\"${type}\",\"task_id\":\"${task_id}\",\"payload\":${payload}}" || true
}

# Pull next assigned task. Returns the JSON of the task (or {"task":null}).
agent_next_job() {
  _curl "${API_BASE}/api/agent-ingest/jobs/next" || echo '{"task":null}'
}

echo "[bridge] ${AGENT_SLUG} bridge loaded; API=${API_BASE}"
