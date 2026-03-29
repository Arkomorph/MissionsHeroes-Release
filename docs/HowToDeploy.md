Quand je ferais des modifs push sur git, il faudra que je lance le .sh ?15:10Oui exactement. Le workflow est :

Coder + tester en local
git add -A && git commit -m "..." && git push origin main
./deploy-syno.sh → met à jour le Syno
./deploy-github.sh → met à jour GitHub Pages (seulement si changement visible publiquement)

Le push Git et le deploy Syno sont deux choses séparées — Git c'est ton versioning, le .sh c'est la livraison sur le serveur.