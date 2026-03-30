# MissionsHéros — Guide de synchronisation

> Basé sur la config réelle du projet au 29 mars 2026.

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    Machine de dev (VSCode)                       │
│                    js/config.js → 'remote'                      │
│                    branch : main                                 │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │                      │
          git push     │                      │  ./deploy-syno.sh
          (automatique)│                      │  (manuel)
                       ▼                      ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  GitHub (privé)          │    │  Synology NAS                   │
│  repo: MissionsHeroes    │    │  missionsheroes.iteract.ch      │
│  branch: main            │    │  config.js → 'remote'           │
│                          │    │  Node.js API → port 3001        │
│  GitHub Action           │    │  state.json → données famille   │
│  deploy-release.yml      │    └─────────────────────────────────┘
│        │ auto                            ↑ SSE (sync temps réel)
│        ▼ sed → 'local'                  │ tablette / téléphones
│        + inject trial.js               └──────────────────────┐
│                          │                                     │
└──────────────────────────┘                                     │
           │                                                     │
           ▼                                                     │
┌─────────────────────────────┐                                  │
│  GitHub (public)            │                                  │
│  repo: MissionsHeroes-Release│                                 │
│  config.js → 'local'        │                                  │
│  + trial.js injecté         │                                  │
│  yourheroes.iteract.ch      │                                  │
└─────────────────────────────┘                                  │
                                                                  │
             Appareils famille ←──────────────────────────────────┘
```

---

## Les trois environnements

| | **Dev (local)** | **Syno (famille)** | **Release (public)** |
|---|---|---|---|
| URL | `localhost` | `missionsheroes.iteract.ch` | `yourheroes.iteract.ch` |
| `STORAGE_BACKEND` | `'remote'` | `'remote'` | `'local'` |
| Données | localStorage (test) | `state.json` sur NAS | localStorage navigateur |
| `trial.js` | ❌ | ❌ | ✅ injecté auto |
| Mise à jour | Immédiate | `./deploy-syno.sh` | `git push origin main` |

---

## Règle d'or

> **`js/config.js` sur `main` est toujours `'remote'`.** Ne jamais le changer manuellement.
>
> Le `sed` dans `deploy-release.yml` gère automatiquement le switch vers `'local'` pour la version publique.

---

## Workflows

### 1. Modifier le code (feature, bug fix)

```bash
# 1. Coder + tester en local (Live Server, config.js déjà en 'remote')
# 2. Committer
git add -A
git commit -m "feat: description de la modification"

# 3. Pusher → déclenche automatiquement le deploy vers Release
git push origin main

# 4. Déployer sur le Syno
./deploy-syno.sh
```

> Le push Git déclenche automatiquement `deploy-release.yml` → la version publique `yourheroes.iteract.ch` est mise à jour.
> Le Syno n'est PAS mis à jour automatiquement — il faut toujours lancer `./deploy-syno.sh`.

---

### 2. Modifier le contenu (missions, tâches, enfants)

**Ne pas toucher au code.** Tout se fait via le backoffice de l'app :

1. Ouvrir `https://missionsheroes.iteract.ch` depuis n'importe quel appareil sur le réseau
2. PIN parent → Back Office
3. Modifier le contenu
4. Les modifications sont sauvegardées automatiquement sur le NAS via `POST /api/state`

> Ton épouse peut éditer en même temps depuis un autre appareil — le SSE synchronise tous les appareils connectés en temps réel.

---

### 3. Synchronisation temps réel entre appareils (SSE)

Quand un appareil modifie le state (enfant qui coche une tâche, parent qui valide) :

```
Appareil A → POST /api/state → Node.js → SSE broadcast → tous les appareils connectés rechargent
```

La tablette en kiosk, le téléphone parent, l'ordi — tous se mettent à jour instantanément sans intervention.

---

### 4. Backup du contenu

Depuis la console du navigateur sur `missionsheroes.iteract.ch` :

```javascript
const state = await storage.load();
const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'state-backup-' + new Date().toISOString().slice(0,10) + '.json';
a.click();
```

**Recommandé après chaque grosse session d'édition de contenu.**

---

### 5. Restaurer un backup

Via SSH sur le Syno :

```bash
ssh -p 30022 jonathan@iteract.ch
# Coller le contenu du fichier backup dans state.json
vi /volume1/sites/missionsheroes/backend/data/state.json
sudo pm2 restart missionsheroes-api
```

---

## deploy-syno.sh — détail

```bash
scp -O -P 30022 -r css js icons site index.html app.html manifest.json \
  jonathan@iteract.ch:/volume1/web/missionsheroes
```

**Ce qui est déployé :** `css/` `js/` `icons/` `site/` `index.html` `app.html` `manifest.json`

**Ce qui n'est PAS déployé (jamais) :**
- `state.json` — données famille, ne quitte jamais le Syno
- `.git/` `.claude/` `docs/` `*.md` — fichiers dev
- `deploy-*.sh` — les scripts eux-mêmes

---

## deploy-release.yml — ce qu'il fait automatiquement

À chaque `git push origin main` :

1. Clone `MissionsHeroes-Release`
2. Rsync tous les fichiers (exclut `.git`, `.github`, `CLAUDE.md`, `.claude`)
3. `sed` → passe `config.js` en `STORAGE_BACKEND: 'local'`
4. Injecte `trial.js` dans `app.html` et `index.html`
5. Commit + push vers le repo public

**Tu n'as rien à faire manuellement pour la version publique.**

---

## deploy-github.sh — statut

⚠️ **Ce script est redondant** — `deploy-release.yml` fait le même travail automatiquement.
Il peut être gardé comme backup manuel mais n'est pas nécessaire dans le workflow normal.

---

## Checklist déploiement complet

```
[ ] git add -A && git commit -m "..."
[ ] git push origin main
    → GitHub Action se déclenche automatiquement
    → yourheroes.iteract.ch mis à jour en ~1 min
[ ] ./deploy-syno.sh
    → missionsheroes.iteract.ch mis à jour
[ ] Vérifier Network tab → GET /api/state retourne le bon state
[ ] Vérifier sur tablette que l'app est à jour (SSE ou refresh)
```
