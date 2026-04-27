#!/usr/bin/env bash
# Operator runs this once on the VPS to materialise goclaw/agents/<slug>/.env
# files from the current api_token values stored in deo.agents.
#
# Usage: bash /opt/deo-enterprise-os/scripts/provision-agents.sh
#
# Idempotent: each .env is overwritten with the live token. Tokens never
# leave the VPS — they're written to local files only.

set -euo pipefail

REPO_DIR=${REPO_DIR:-/opt/deo-enterprise-os}
COMPOSE="docker compose -f ${REPO_DIR}/docker-compose.prod.yml"
API_BASE=${API_BASE:-https://api.enterpriseos.bond}

cd "$REPO_DIR"

# Pull all (slug, api_token) pairs in TSV format
mapping=$($COMPOSE exec -T postgres psql -U "${POSTGRES_USER:-deo}" -d "${POSTGRES_DB:-deo_os}" -t -A -F $'\t' -c \
  "SELECT slug, api_token FROM deo.agents WHERE slug IS NOT NULL ORDER BY slug;")

if [ -z "$mapping" ]; then
  echo "No agents with slug found in deo.agents. Run migrate first."
  exit 1
fi

count=0
while IFS=$'\t' read -r slug token; do
  [ -z "$slug" ] && continue
  agent_dir="${REPO_DIR}/goclaw/agents/${slug}"
  if [ ! -d "$agent_dir" ]; then
    echo "  skip ${slug} — no agent dir at ${agent_dir}"
    continue
  fi
  cat > "${agent_dir}/.env" <<EOF
AGENT_SLUG=${slug}
AGENT_TOKEN=${token}
API_BASE=${API_BASE}
EOF
  chmod 600 "${agent_dir}/.env"
  count=$((count + 1))
  echo "  wrote ${agent_dir}/.env"
done <<< "$mapping"

echo "Provisioned ${count} agent(s). Each .env is chmod 600."
echo "To start an agent's bridge: source ${REPO_DIR}/goclaw/agents/<slug>/.env && source ${REPO_DIR}/goclaw/agents/bridge.sh && agent_heartbeat_loop &"
