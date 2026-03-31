# Commandes utiles — Missions Heroes

## Console navigateur (F12 > Console)

### Etat de l'application

```js
// Voir le state brut complet
MH_DEBUG.state()

// Voir les timestamps de sync pour un enfant (defaut: premier enfant)
MH_DEBUG.timestamps('louis')

// Voir l'etat d'une mission specifique (state, date, timestamps, recurrence)
MH_DEBUG.mission('M01')
```

### Actions de debug

```js
// Forcer le reset des recurrences expirees
MH_DEBUG.resetRecurrences()

// Forcer un reload depuis le serveur (SSE manuel)
MH_DEBUG.reload()
```

### Simulation de temps

```js
// Avancer de N jours (simule le passage du temps)
MH_DEBUG.advanceDays(1)   // demain
MH_DEBUG.advanceDays(7)   // dans une semaine

// Apres avoir avance le temps, forcer le reset des recurrences :
MH_DEBUG.advanceDays(7)
MH_DEBUG.resetRecurrences()

// Revenir au temps reel
MH_DEBUG.resetTime()
```

### Gestion du PIN

```js
// Changer le PIN
const s = JSON.parse(localStorage.getItem('mh_v4'));
s.pin = '5678';
localStorage.setItem('mh_v4', JSON.stringify(s));
location.reload();
```

### Reset complet

```js
// Supprimer toutes les donnees locales (DESTRUCTIF)
localStorage.removeItem('mh_v4');
location.reload();
```

### Inspection rapide

```js
// Voir les missions d'un enfant avec leur etat
getMissions('louis').map(m => ({
  id: m.id, nom: m.nom, niv: m.niv,
  state: MH_DEBUG.state().children.louis.state.missionStates[m.id],
  rec: m.recurrence?.type
}))

// Voir le streak actuel
streak('louis')

// Voir les badges gagnes
earnedBadges('louis')

// Voir les CHF gagnes (missions + daily)
totalE('louis')
```

---

## SSH Synology (backend)

### Acces

```bash
ssh utilisateur@IP_SYNOLOGY
```

### Gestion du service

```bash
# Voir les logs du backend
docker logs missionsheroes-api --tail 50

# Redemarrer le backend
docker restart missionsheroes-api

# Voir si le service tourne
docker ps | grep missionsheroes
```

### State serveur

```bash
# Voir le state brut stocke sur le serveur
cat /path/to/backend/data/state.json | python3 -m json.tool

# Backup du state
cp /path/to/backend/data/state.json /path/to/backup/state_$(date +%Y%m%d).json
```

### Test des endpoints

```bash
# Lire le state depuis l'API
curl http://localhost:3001/api/state | python3 -m json.tool

# Tester la connectivite SSE
curl -N http://localhost:3001/api/events
```

---

## Workflow de debug typique

### Bug : une mission revient a un etat precedent

1. Ouvrir la console sur les deux devices
2. Sur chaque device, verifier l'etat et les timestamps :
   ```js
   MH_DEBUG.mission('M01')
   ```
3. Comparer les `ts` — le plus recent devrait gagner lors du merge
4. Si les timestamps sont absents (`undefined`), le merge ne peut pas fonctionner — recharger les deux devices pour initialiser les timestamps

### Bug : mission weekly pas resetee

1. Verifier la date de completion et la fenetre :
   ```js
   MH_DEBUG.mission('M01')
   // Regarder `inWindow` — si true, la mission est encore dans la fenetre
   ```
2. Forcer le reset :
   ```js
   MH_DEBUG.resetRecurrences()
   ```
3. Simuler le passage au lundi suivant :
   ```js
   MH_DEBUG.advanceDays(7)
   MH_DEBUG.resetRecurrences()
   ```
