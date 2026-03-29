#!/bin/bash
echo "→ Déploiement GitHub Pages..."

git checkout gh-pages
git merge main --no-commit --no-ff
sed -i "s/STORAGE_BACKEND: 'remote'/STORAGE_BACKEND: 'local'/g" js/config.js
git add -A
git commit -m "deploy: gh-pages $(date +%Y%m%d-%H%M)"
git push origin gh-pages
git checkout main

echo "✅ GitHub Pages déployé !"
echo "   → https://arkomorph.github.io/MissionsHeroes/"