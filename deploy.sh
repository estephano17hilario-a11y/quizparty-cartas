#!/usr/bin/env bash
# Sube y arranca QuizParty en tu VPS con Docker Compose y Nginx.
set -euo pipefail
HOST="${1:-root@89.117.73.97}"
DIR=/opt/quizparty
cd "$(dirname "$0")"

echo "→ Subiendo archivos a $HOST:$DIR"
ssh "$HOST" "mkdir -p $DIR/data"
rsync -az --delete --exclude node_modules --exclude data --exclude .git ./ "$HOST:$DIR/"

echo "→ Levantando contenedor Docker en el VPS"
ssh "$HOST" bash -s <<'REMOTE'
set -e
cd /opt/quizparty
if command -v docker >/dev/null; then
  docker compose up -d --build
  echo "✅ Contenedor Docker iniciado en el puerto 3200"
else
  echo "Docker no encontrado, instalando Node.js..."
  if ! command -v node >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs build-essential python3
  fi
  npm install -g pm2
  npm install --omit=dev
  pm2 startOrReload ecosystem.config.js --update-env
  pm2 save
fi
REMOTE

echo "✅ Listo. Abre https://quizparty.89.117.73.97.sslip.io o http://${HOST#*@}:3200"
