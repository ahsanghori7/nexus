#!/bin/bash
set -e

KEY_SOURCE="/opt/environments/repos/nexus/app.c-link/docusign_privateKey2.key"
KEY_DEST="/var/www/html/app.c-link/docusign_privateKey2.key"
CONTAINER_NAME="app.c-link"
TMP_DIR="/tmp/docusign"


if [ ! -f "$KEY_SOURCE" ]; then
  echo "DocuSign private key not found on host"
  exit 1
fi

# Create /tmp/docusign directory inside container
docker exec "$CONTAINER_NAME" mkdir -p "$TMP_DIR"
docker exec "$CONTAINER_NAME" chown www-data:www-data "$TMP_DIR"

docker cp "$KEY_SOURCE" "$CONTAINER_NAME:$KEY_DEST"
docker exec "$CONTAINER_NAME" chown www-data:www-data "$KEY_DEST"
docker exec "$CONTAINER_NAME" chmod 600 "$KEY_DEST"
