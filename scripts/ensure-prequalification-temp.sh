#!/usr/bin/env bash
set -euo pipefail

PREQUALIFICATION_TMP_DIR="${PREQUALIFICATION_TMP_DIR:-/var/tmp/prequalification}"
MPDF_TMP_DIR="${MPDF_TMP_DIR:-/var/tmp/mpdf}"
APP_CONTAINER_NAME="${APP_CONTAINER_NAME:-app.c-link}"
FRAMEWORK_CONTAINER_NAME="${FRAMEWORK_CONTAINER_NAME:-framework}"
CONTAINER_OWNER="${CONTAINER_OWNER:-www-data:www-data}"
CONTAINER_MODE="${CONTAINER_MODE:-755}"
HOST_MODE="${HOST_MODE:-755}"

run_host_cmd() {
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    "$@"
  fi
}

ensure_host_dir() {
  local path="$1"

  run_host_cmd mkdir -p "$path"
  run_host_cmd chmod "$HOST_MODE" "$path"

  if run_host_cmd chown "$CONTAINER_OWNER" "$path" 2>/dev/null; then
    :
  fi
}

ensure_container_dir() {
  local container="$1"
  local path="$2"

  if ! docker ps --format '{{.Names}}' | grep -Fxq "$container"; then
    echo "Skipping $container: container not running"
    return 0
  fi

  docker exec "$container" sh -lc "mkdir -p '$path' && chown $CONTAINER_OWNER '$path' && chmod $CONTAINER_MODE '$path'"
}

for path in "$PREQUALIFICATION_TMP_DIR" "$MPDF_TMP_DIR"; do
  ensure_host_dir "$path"
  ensure_container_dir "$APP_CONTAINER_NAME" "$path"
  ensure_container_dir "$FRAMEWORK_CONTAINER_NAME" "$path"
  echo "Temp directory ready: $path"
done
