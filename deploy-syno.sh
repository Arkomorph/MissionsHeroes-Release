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

if [ "$1" = "--restart" ]; then
  echo ""
  echo "⚠️  Restart demandé. Connecte-toi au NAS :"
  echo "   ssh -p $NAS_PORT $NAS_USER@$NAS_HOST"
  echo "   sudo kill \$(ps aux | grep 'node.*missionsheroes.*server.js' | grep -v grep | awk '{print \$2}')"
  echo "   cd $NAS_BACKEND && sudo nohup node server.js >> /var/log/missionsheroes.log 2>&1 &"
fi

echo ""
echo "✅ Déploiement Syno terminé !"
echo "   → https://missionsheroes.iteract.ch"
