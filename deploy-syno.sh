#!/bin/bash
NAS_HOST="iteract.ch"
NAS_PORT="30022"
NAS_USER="jonathan"
NAS_WEB="/volume1/web/missionsheroes/"
NAS_BACKEND="/volume1/sites/missionsheroes/backend/"

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

echo "→ Déploiement backend sur Syno..."
scp -O -P $NAS_PORT \
  backend/server.js \
  backend/package.json \
  ${NAS_USER}@${NAS_HOST}:${NAS_BACKEND}

echo "→ Redémarrage du serveur API..."
ssh -p $NAS_PORT ${NAS_USER}@${NAS_HOST} \
  "cd ${NAS_BACKEND} && pm2 restart missionsheroes-api"

echo "✅ Déploiement Syno terminé !"
echo "   → https://missionsheroes.iteract.ch"
