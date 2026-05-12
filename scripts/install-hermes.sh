#!/usr/bin/env bash
# Install the Hermes Agent daemon (Nous Research) and verify it is reachable
# from the Paperclip `hermes_local` adapter.

set -euo pipefail

if ! command -v hermes >/dev/null 2>&1; then
  echo "==> running Hermes installer"
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
fi

echo "==> hermes version"
hermes --version || {
  echo "hermes installed but not on PATH. Add ~/.hermes/bin to your PATH and rerun." >&2
  exit 1
}

echo
echo "Next: open Paperclip UI → Settings → Adapters → Install hermes_local"
echo "Then load the config from adapters/hermes-local.json."
