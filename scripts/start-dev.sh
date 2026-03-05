#!/usr/bin/env bash
# =============================================================================
# AlgoBrute Dev Startup
# Starts: Redis (Docker), Backend (port 4001), Frontend (port 5173)
# =============================================================================

set -u

BACKEND_DIR="/media/smalik/data/github/algobrute-engine"
FRONTEND_DIR="/media/smalik/data/github/algobrute"
BACKEND_LOG="/tmp/algobrute-backend.log"
FRONTEND_LOG="/tmp/algobrute-frontend.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── 1. Redis ─────────────────────────────────────────────────────────────────
info "Checking Redis..."
if docker exec algobrute-redis redis-cli ping >/dev/null 2>&1; then
  info "Redis already running."
elif redis-cli ping >/dev/null 2>&1; then
  info "Redis (native) already running."
else
  info "Starting Redis via Docker..."
  docker rm -f algobrute-redis >/dev/null 2>&1 || true
  docker run -d --name algobrute-redis -p 6379:6379 redis:7-alpine >/dev/null
  sleep 2
  docker exec algobrute-redis redis-cli ping | grep -q PONG \
    && info "Redis started." \
    || { error "Redis failed to start."; exit 1; }
fi

# ── 2. Backend ────────────────────────────────────────────────────────────────
info "Checking backend (port 4001)..."
if curl -s --max-time 2 http://localhost:4001/health/live >/dev/null 2>&1; then
  info "Backend already running on port 4001."
else
  info "Starting backend..."

  # Kill any stale processes on 4001
  pkill -f "uvicorn algobrute.api" 2>/dev/null || true
  sleep 1

  # Load .env then start uvicorn — Python wrapper ensures os.environ is populated
  # for all services that read env vars directly (OpenAI, Alpaca, etc.)
  (
    cd "$BACKEND_DIR"
    python3 - <<'PYEOF' &
import subprocess, sys
from dotenv import load_dotenv
load_dotenv(override=True)
result = subprocess.run([
    sys.executable, "-m", "uvicorn", "algobrute.api.run:app",
    "--host", "0.0.0.0",
    "--port", "4001",
])
sys.exit(result.returncode)
PYEOF
  ) > "$BACKEND_LOG" 2>&1 &

  BACKEND_PID=$!
  echo $BACKEND_PID > /tmp/algobrute-backend.pid
  info "Backend PID: $BACKEND_PID — waiting for startup..."

  # Wait up to 30 seconds for the backend to become live
  for i in $(seq 1 30); do
    sleep 1
    # The engine responds with 401 on authenticated routes when running (not 404/connection error)
    status=$(curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost:4001/api/fleet/state 2>/dev/null)
    if [ "$status" = "200" ] || [ "$status" = "401" ]; then
      info "Backend ready (HTTP $status)."
      break
    fi
    if [ $i -eq 30 ]; then
      error "Backend did not start in 30s. Check $BACKEND_LOG"
      tail -30 "$BACKEND_LOG"
      exit 1
    fi
  done
fi

# ── 3. Frontend ───────────────────────────────────────────────────────────────
info "Checking frontend (port 5173)..."
if curl -s --max-time 2 http://localhost:5173 >/dev/null 2>&1; then
  info "Frontend already running on port 5173."
else
  info "Starting frontend (Next.js)..."
  (
    cd "$FRONTEND_DIR"
    npm run dev:fast
  ) > "$FRONTEND_LOG" 2>&1 &

  FRONTEND_PID=$!
  echo $FRONTEND_PID > /tmp/algobrute-frontend.pid
  info "Frontend PID: $FRONTEND_PID — waiting for startup..."

  for i in $(seq 1 30); do
    sleep 1
    if curl -s --max-time 2 http://localhost:5173 >/dev/null 2>&1; then
      info "Frontend ready."
      break
    fi
    if [ $i -eq 30 ]; then
      error "Frontend did not start in 30s. Check $FRONTEND_LOG"
      tail -20 "$FRONTEND_LOG"
      exit 1
    fi
  done
fi

echo ""
info "All services running:"
info "  Frontend  → http://localhost:5173"
info "  Backend   → http://localhost:4001"
info "  Logs: $BACKEND_LOG  |  $FRONTEND_LOG"
