#!/bin/bash
NAS_HOST="192.168.1.10"
NAS_PORT="30022"
NAS_USER="jonathan"
NAS_WEB="/volume1/web/missionsheroes/"

echo "→ Déploiement frontend sur Syno..."
scp -O -P $NAS_PORT -r \
  css \
  js \
  icons \
  site \
  index.html \
  app.html \
  manifest.json \
  ${NAS_USER}@${NAS_HOST}:${NAS_WEB}

echo "✅ Déploiement Syno terminé !"
echo "   → https://missionsheroes.iteract.ch"