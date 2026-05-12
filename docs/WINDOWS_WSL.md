# Windows + WSL2 Deployment Guide

Running Paperclip + Hermes + Worker Console on Windows via WSL2.

## Why WSL2, not Docker?

- **Network simplicity**: WSL2 mirrored networking (Windows 11 Build 18975+) makes `localhost:3100` and `localhost:5173` from Windows browser "just work" — no extra port-forwarding config.
- **Native POSIX**: Bash scripts (`bootstrap.sh`, `install-hermes.sh`, `dev.sh`) run directly without Docker overhead.
- **Persistence**: Git worktrees (created by agents) and Hermes memory files live in real filesystem, not container volumes.
- **Lighter**: No container image build, no volume mounts, no daemon restart ceremonies.

If you prefer Docker, see `docs/DOCKER_COMPOSE.md` (forthcoming).

## Prerequisites

1. **Windows 11 Build 22000+** (or Windows 10 Build 19041 with manual WSL2 config).
   - Check: `winver` → Settings → System → About.
   - If older: upgrade Windows or use Docker instead.

2. **WSL2 installed and default**.
   ```powershell
   wsl --install -d Ubuntu-22.04
   wsl --set-default-version 2
   wsl -d Ubuntu-22.04
   ```
   - Verify inside WSL: `uname -r` should show `5.x` or higher (not `4.19` from WSL1).
   - If you see `4.19`, you're on WSL1 — switch: `wsl --set-version Ubuntu-22.04 2`, then restart.

3. **Git cloned or mounted into WSL**.
   - Option A (recommended): Clone fresh inside WSL.
     ```bash
     cd ~ && git clone https://github.com/vucaotung/deo-enterprise-os.git && cd deo-enterprise-os
     git checkout claude/paperclip-hermes-rebuild-c1hjk
     ```
   - Option B: Mount Windows folder into WSL.
     ```bash
     cd /mnt/c/Users/YourName/path/to/deo-enterprise-os
     ```
     (Slower due to cross-filesystem overhead; Option A preferred.)

## Setup Steps

### Step 1: Bootstrap Paperclip

```bash
cd ~/deo-enterprise-os
scripts/bootstrap.sh
```

**What it does:**
- Clones Paperclip into `paperclip/` (gitignored).
- Runs `pnpm install` in `paperclip/` and installs Worker Console deps in `apps/web/`.
- Runs Paperclip migrations: `pnpm db:migrate` (creates SQLite/Postgres, seeds schema).
- Outputs: `.env.local` (check it; set `PAPERCLIP_PORT=3100` if needed).

**Expected output:**
```
✓ Paperclip cloned to ./paperclip (pinned at c445e5925628d11bf59d52604b8aa63a6e9aa800)
✓ Dependencies installed
✓ Migrations completed
✓ Worker Console deps ready
→ Next: scripts/install-hermes.sh
```

**Troubleshooting:**
- **`pnpm: command not found`**: Install Node.js + pnpm.
  ```bash
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  source ~/.bashrc
  ```
- **`Migrations failed`**: Paperclip uses a local SQLite by default. Check `paperclip/.env.local` for `DATABASE_URL`.
  ```bash
  cat paperclip/.env.local | grep DATABASE
  ```
  If it's pointing to Postgres and Postgres isn't running, either (a) install Postgres in WSL, or (b) change to SQLite:
  ```bash
  echo "DATABASE_URL=file:./paperclip.db" >> paperclip/.env.local
  cd paperclip && pnpm db:migrate
  ```

### Step 2: Install Hermes Agent

```bash
scripts/install-hermes.sh
```

**What it does:**
- Runs official Hermes installer: `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`.
- Verifies `hermes --version` (must print version, not "command not found").
- Checks `~/.hermes/config.json` exists.

**Expected output:**
```
✓ Hermes installed at ~/.hermes/bin/hermes
✓ Version: hermes 2.0.1 (or later)
✓ Config skeleton created at ~/.hermes/config.json
→ Next: scripts/dev.sh
```

**Troubleshooting:**
- **`hermes: command not found` after install**: Hermes puts itself in `~/.hermes/bin/`. Add to PATH:
  ```bash
  echo 'export PATH="$PATH:$HOME/.hermes/bin"' >> ~/.bashrc
  source ~/.bashrc
  hermes --version
  ```
- **Installer hangs**: The Hermes install script may prompt for language / location. If it hangs, Ctrl-C and try manually:
  ```bash
  wget https://github.com/NousResearch/hermes/releases/download/v2.0.1/hermes-linux-amd64 -O ~/.hermes/bin/hermes
  chmod +x ~/.hermes/bin/hermes
  ~/.hermes/bin/hermes --version
  ```
  (Replace `v2.0.1` with latest from https://github.com/NousResearch/hermes/releases.)

### Step 3: Start Dev Environment

From WSL (both servers):
```bash
scripts/dev.sh
```

**What it does:**
- Spawns `pnpm --filter paperclip dev` (Paperclip @ `localhost:3100`).
- Spawns `cd apps/web && npm run dev` (Worker Console @ `localhost:5173`).
- On Ctrl-C, kills both.

**Expected output:**
```
[Paperclip] Starting server at http://localhost:3100
[Paperclip] Database ready at …
[Worker Console] VITE v5.x.x ready in xxx ms
[Worker Console] → Local: http://localhost:5173
```

**Troubleshooting:**
- **`EADDRINUSE: address already in use :::3100`**: Port 3100 still occupied (e.g., from a previous run).
  ```bash
  lsof -i :3100 | grep -v PID | awk '{print $2}' | xargs kill -9
  ```
  Then restart `scripts/dev.sh`.
- **`pnpm: command not found`**: Same as Step 1; ensure pnpm is in PATH.

### Step 4: Verify from Windows Browser

Open **Windows browser** (not WSL terminal):

1. **Paperclip UI**: `http://localhost:3100`
   - Should see login page (better-auth).
   - If blank / spinning, wait 10 sec (Vite bundling first time takes ~15s).

2. **Worker Console**: `http://localhost:5173`
   - Redirects to Paperclip login if not authenticated.
   - After login, shows company switcher (if companies exist).

**If `localhost` doesn't resolve from Windows:**

WSL2 mirrored networking may not be enabled. Check:
```powershell
# In Windows PowerShell (Admin)
wsl --update
```

If that doesn't work, use WSL internal IP instead:
```bash
# Inside WSL
hostname -I
# Returns something like: 172.31.42.1 (your WSL2 IP)
```

Then from Windows browser, use that IP:
- `http://172.31.42.1:3100` (Paperclip)
- `http://172.31.42.1:5173` (Worker Console)

(This is less convenient; upgrade WSL if possible.)

### Step 5: Register Secrets (in Paperclip UI)

1. Log in to Paperclip (`http://localhost:3100`).
2. Click **Settings** (bottom left).
3. Go to **Secrets**.
4. Create new secret **ANTHROPIC_API_KEY**:
   - Value: your Anthropic API key (from https://console.anthropic.com).
   - Copy the secret UUID that Paperclip generates.

5. (Optional) Create **OPENROUTER_API_KEY** if Hermes should use OpenRouter as fallback.

### Step 6: Install Adapters (in Paperclip UI)

1. In Paperclip Settings, go to **Adapters**.
2. Click **Install Adapter**.
3. Paste config from `adapters/hermes-local.json`:
   - Replace `REPLACE_WITH_ANTHROPIC_SECRET_UUID` with the UUID from Step 5.
   - Click **Save**.

4. Repeat for `adapters/claude-local.json`:
   - Same secret UUID.
   - Click **Save**.

**Verify:** Both `hermes_local` and `claude_local` should show in the Adapters list with status "Active".

### Step 7: Smoke Test (End-to-End)

1. **Create a company:**
   - Paperclip home page → **+ New Company**.
   - Name: "Acme Test".
   - Goal: "Reach $10k MRR by Q3".

2. **Hire agents:**
   - Go to company → **Agents** (sidebar).
   - **Hire CEO** → select `claude_local`, model `claude-opus-4-7`.
   - **Hire Engineer** → select `hermes_local`, model `claude-sonnet-4-6`.
   - (Model choices are examples; adjust if needed.)

3. **Trigger CEO strategy:**
   - Go to **Goals** → click the goal "Reach $10k MRR by Q3".
   - Click **Run** or wait for automatic heartbeat (~30s).
   - CEO generates a strategy proposal (e.g., "Launch SaaS dashboard").

4. **Approve in Worker Console:**
   - Switch to `http://localhost:5173` (Worker Console).
   - Go to **Approvals** (/approvals).
   - See pending approval "Approve CEO strategy".
   - Click **Approve**.

5. **Post comment with @mention:**
   - Go to **Issues** → click first issue from the CEO's plan.
   - Scroll to composer (bottom).
   - Type: `@engineer please add unit tests`.
   - Press Ctrl+Enter.

6. **Watch timeline:**
   - Refresh (or live update via WebSocket).
   - Engineer's run should appear in the timeline.
   - See run output, artifacts, completion status.

7. **Typecheck + build:**
   ```bash
   pnpm --filter web typecheck
   pnpm --filter web build
   ```
   Both should pass.

**If any step fails**, see [Troubleshooting](#troubleshooting-common-issues) below.

## Troubleshooting Common Issues

### Browser hangs on login / "Loading..." forever

**Cause:** Vite dev server not bundled yet, or Paperclip slow to start.

**Fix:**
1. Wait 20s on first visit (Vite first-time bundle is slow).
2. Check WSL terminal for errors: `pnpm` or build errors.
3. Restart: Ctrl-C in WSL, run `scripts/dev.sh` again.

### "Cannot POST /api/companies" (401 Unauthorized)

**Cause:** You're logged out or Paperclip session expired.

**Fix:**
1. Log in to Paperclip first: `http://localhost:3100/auth/login`.
2. Ensure cookies are set: DevTools → Application → Cookies → `localhost:3100` should have `better_auth.session_token` (or similar).
3. Refresh `http://localhost:5173`.

### WebSocket connection fails (live timeline doesn't update)

**Cause:** WebSocket proxy not configured, or wrong origin.

**Fix:**
1. Check Vite config: `apps/web/vite.config.ts` should have proxy for `/api/companies/*/events/ws`.
2. Restart `dev.sh` to pick up config changes.
3. Refresh Worker Console in browser.

### Hermes says "hermes: not found" when agent runs

**Cause:** `hermes` not in Paperclip's PATH.

**Fix:**
1. Verify Hermes is in PATH from WSL:
   ```bash
   which hermes
   # Should print: /home/username/.hermes/bin/hermes
   ```
2. Restart `scripts/dev.sh` (child processes inherit parent PATH).
3. If still fails, check adapter config in Paperclip UI:
   - Settings → Adapters → hermes_local → **Command** field.
   - Should be `hermes` (if in PATH) or full path `/home/username/.hermes/bin/hermes`.

### Agent runs time out (task takes >600s)

**Cause:** Default timeout is 600s (10 min). Long tasks (e.g., training models) exceed this.

**Fix:** Edit adapter config in Paperclip UI:
- Settings → Adapters → hermes_local → **Timeout (sec)** → set to 1800 (30 min) or higher.

### "EACCES: permission denied" when creating git worktree

**Cause:** Hermes or claude_local can't write to working directory.

**Fix:**
1. Check adapter config:
   - **Working Directory** should be writable by the WSL user.
   - Typically: `/home/username/workspace-deo` or similar.
2. Create and chmod:
   ```bash
   mkdir -p ~/workspace-deo
   chmod 755 ~/workspace-deo
   ```
3. Update adapter config in Paperclip UI to point to this dir.

### Windows Defender / antivirus blocks Hermes daemon

**Cause:** Downloaded binary flagged as suspicious.

**Fix:**
1. Add exception to Windows Defender:
   - Windows Security → Virus & threat protection → Manage settings.
   - Add exception: `C:\Users\YourName\AppData\Roaming\hermes\bin\hermes.exe` (or wherever WSL installs it).
2. Or: Re-download from official Hermes release page (ensure checksum matches).

## Stopping Services

To stop Paperclip + Worker Console:
- Press **Ctrl-C** in the WSL terminal running `scripts/dev.sh`.
- Both will shut down gracefully.

To stop WSL entirely:
```powershell
wsl --shutdown
```

(You can restart it anytime: `wsl -d Ubuntu-22.04`.)

## Next Steps

1. **Production deployment**: See `docs/DOCKER_COMPOSE.md` (forthcoming) for containerized setup.
2. **Monitoring**: Add Prometheus/Datadog endpoints to Paperclip config for production metrics.
3. **Persistent data**: Backup `paperclip/.env.local`, `paperclip/prisma/`, `~/.hermes/` regularly.

## Reference

- **Paperclip docs**: https://docs.paperclip.ing
- **Hermes docs**: https://github.com/NousResearch/hermes
- **deo-enterprise-os rebuild guide**: `docs/REBUILD.md`
