#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"
PORT=3000

# Hentikan proses dari PID file
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "Server dihentikan (PID $PID)."
  else
    echo "Proses $PID tidak ditemukan."
  fi
  rm -f "$PID_FILE"
fi

# Bebaskan port 3000 jika masih dipakai (proses yang dijalankan manual, dll)
if command -v lsof &>/dev/null; then
  PORT_PID=$(lsof -i ":$PORT" -t 2>/dev/null || true)
  if [[ -n "$PORT_PID" ]]; then
    echo "$PORT_PID" | xargs kill 2>/dev/null
    echo "Proses di port $PORT dihentikan (PID: $PORT_PID)."
  fi
fi
