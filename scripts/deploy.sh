#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — Deploy Script
# Usage: ./scripts/deploy.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "🚀 Dẹo Enterprise OS — Deploying..."
echo "================================================"

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Copy from .env.example:"
    echo "   cp .env.example .env"
    exit 1
fi

# Load env
source .env

# Pull latest code (if git repo)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin main || true
fi

# Run migrations
echo "🗄️  Running database migrations..."
for f in infrastructure/postgres/0*.sql; do
    echo "   → $f"
    docker compose -f docker-compose.prod.yml exec -T postgres \
        psql -U "${POSTGRES_USER:-deo}" -d "${POSTGRES_DB:-deo_os}" < "$f" 2>/dev/null || true
done

# Build and start
echo "🔨 Building containers..."
docker compose -f docker-compose.prod.yml build --parallel

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Health checks
echo "🏥 Running health checks..."
API_STATUS=$(curl -sf http://localhost:3001/api/health 2>/dev/null && echo "OK" || echo "FAIL")
WEB_STATUS=$(curl -sf http://localhost:80 2>/dev/null && echo "OK" || echo "FAIL")

echo "================================================"
echo "   API:  $API_STATUS"
echo "   Web:  $WEB_STATUS"
echo "================================================"

if [ "$API_STATUS" = "OK" ] && [ "$WEB_STATUS" = "OK" ]; then
    echo "✅ Deploy complete! Services are running."
    echo ""
    echo "   Dashboard: https://dash.enterpriseos.bond"
    echo "   API:       https://api.enterpriseos.bond"
else
    echo "⚠️  Some services may not be ready. Check logs:"
    echo "   docker compose -f docker-compose.prod.yml logs"
fi
