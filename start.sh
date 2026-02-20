#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
PID_FILE="$SCRIPT_DIR/.server.pid"
PORT=3000

# Cek proses dari PID file
if [[ -f "$PID_FILE" ]]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Server sudah jalan (PID $OLD_PID). Pakai ./stop.sh dulu."
    exit 1
  fi
  rm -f "$PID_FILE"
fi

# Cek PID proses yang memakai port
get_port_pids() {
  if command -v lsof &>/dev/null; then
    lsof -i ":$PORT" -t 2>/dev/null || true
  elif command -v netstat &>/dev/null; then
    netstat -anp 2>/dev/null | grep ":$PORT " | awk '{print $NF}' | cut -d'/' -f1 || true
  fi
}

PORT_PID=$(get_port_pids)
if [[ -n "$PORT_PID" ]]; then
  echo "Port $PORT sudah dipakai (PID: $PORT_PID). Menghentikan proses..."
  echo "$PORT_PID" | xargs kill 2>/dev/null || true
  sleep 1
  PORT_PID2=$(get_port_pids)
  if [[ -n "$PORT_PID2" ]]; then
    echo "Proses masih jalan. Paksa hentikan: echo $PORT_PID2 | xargs kill -9"
    exit 1
  fi
fi

if [[ ! -d server/node_modules ]]; then
  echo "Installing server dependencies..."
  (cd server && npm install)
fi

echo "Starting Kaito Whale server..."
(cd server && node server.js) &
echo $! > "$PID_FILE"
sleep 0.5
if ! kill -0 $(cat "$PID_FILE") 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "Server gagal start (port $PORT mungkin masih dipakai). Coba ./stop.sh lalu ./start.sh lagi."
  exit 1
fi
echo "Server started (PID $(cat "$PID_FILE"))."
echo "Buka: http://localhost:$PORT"
echo "Dari HP (WiFi sama): http://<IP-komputer>:$PORT"
echo "Hentikan: ./stop.sh"
