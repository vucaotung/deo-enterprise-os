#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — Health Check
# ============================================================
set -euo pipefail

echo "🏥 Dẹo OS Health Check"
echo "================================================"

# Docker containers
echo "🐳 Containers:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   docker-compose not running"

echo ""

# API
echo "🔌 API:"
API_RESPONSE=$(curl -sf http://localhost:3001/api/health 2>/dev/null || echo "UNREACHABLE")
echo "   Status: $API_RESPONSE"

# Database
echo "💾 Database:"
DB_STATUS=$(docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U deo 2>/dev/null && echo "READY" || echo "NOT READY")
echo "   Status: $DB_STATUS"

# Redis
echo "📦 Redis:"
REDIS_STATUS=$(docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null || echo "NOT READY")
echo "   Status: $REDIS_STATUS"

# Disk
echo "💿 Disk:"
df -h / | tail -1 | awk '{print "   Used: " $3 "/" $2 " (" $5 ")"}'

# Memory
echo "🧠 Memory:"
free -h | grep Mem | awk '{print "   Used: " $3 "/" $2}'

echo "================================================"
