#!/bin/bash
NAS_HOST="192.168.1.10"
NAS_PORT="30022"
NAS_USER="jonathan"
NAS_WEB="/volume1/web/missionsheroes/"

echo "→ Déploiement frontend sur Syno..."
rsync -avz --delete \
  -e "ssh -p $NAS_PORT" \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='docs' \
  --exclude='site' \
  --exclude='*.md' \
  --exclude='.gitignore' \
  --exclude='.claudeignore' \
  --exclude='deploy-syno.sh' \
  --exclude='deploy-github.sh' \
  ./ \
  ${NAS_USER}@${NAS_HOST}:${NAS_WEB}

echo "✅ Déploiement Syno terminé !"
echo "   → https://missionsheroes.iteract.ch"