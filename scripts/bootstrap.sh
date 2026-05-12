#!/usr/bin/env bash
# Bootstrap the deo workspace: fetch Paperclip at the pinned commit, install
# Paperclip's dependencies, and prepare the Worker Console env.
#
# Idempotent. Re-run after `paperclip.lock` is bumped.

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

# shellcheck disable=SC1091
. ./paperclip.lock

if [ ! -d paperclip/.git ]; then
  echo "==> cloning Paperclip ($repo @ $ref)"
  git clone "$repo" paperclip
fi

(
  cd paperclip
  echo "==> checking out $ref"
  git fetch origin "$ref"
  git checkout --detach "$ref"
)

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install pnpm 9.15+ first (https://pnpm.io/installation)." >&2
  exit 1
fi

echo "==> installing Paperclip deps"
( cd paperclip && pnpm install --frozen-lockfile )

if [ -f paperclip/.env.example ] && [ ! -f paperclip/.env ]; then
  echo "==> seeding paperclip/.env from .env.example"
  cp paperclip/.env.example paperclip/.env
fi

echo "==> applying Paperclip migrations"
( cd paperclip && pnpm db:migrate )

echo "==> installing Worker Console deps"
( cd apps/web && npm install )

echo
echo "Done. Next:"
echo "  scripts/install-hermes.sh         # install the Hermes Agent daemon"
echo "  scripts/dev.sh                    # run Paperclip + Worker Console"
