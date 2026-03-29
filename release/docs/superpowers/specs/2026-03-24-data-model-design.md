# Data Model v4 — Design Spec

## Objectif

Remplacer les constantes JS hard-codees (MISSIONS, LEVELS, DAILY, CHILDREN, BADGES, CAT) par un modele de donnees entierement stocke dans `localStorage` sous la cle `mh_v4`. Le code ne contient que la logique et le rendu. Toute la configuration est editable depuis le back office parent.

## Principes

- **Catalogue partage** : missions, taches journalieres, categories et badges definis une seule fois
- **Surcharges par enfant** : chaque enfant reference le catalogue via include/exclude/overrides/extra
- **Niveaux par enfant** : nombre, noms, couleurs, seuils, gateway entierement configurables
- **Migration automatique** : au premier chargement, les donnees Louis sont seedees depuis les constantes v3, puis les constantes sont supprimees du code
- **Back office enrichi** : onglets dans le panneau admin existant (meme PIN)

## Structure `mh_v4`

```js
{
  version: 4,
  pin: '1234',

  // ─── CATALOGUE (base commune) ─────────────────────────────────

  catalog: {

    categories: [
      {
        id: 'courrier',        // string — identifiant unique
        label: '📬 Courrier',  // string — libelle avec emoji
        color: '#4FC3F7'       // string — couleur hex
      }
      // ...
    ],

    missions: [
      {
        id: 'M01',            // string — identifiant unique
        cat: 'courrier',      // string — ref catalog.categories.id
        nom: 'Relever la boite aux lettres et poser sur le bureau',
        niv: 'N1',            // string — niveau par defaut (surchargeable par enfant)
        diff: 1,              // number — difficulte 1-4
        chf: 2,               // number — remuneration par defaut
        secret: null,         // string|null — ID categorie qui debloque (null = pas secrete)
        description: '',      // string — consigne detaillee pour l'enfant
        recurrence: {         // object — regle de recurrence
          type: 'once'        // 'once' | 'weekly' | 'monthly' | 'daily' — implementation a definir
        }
      }
      // ...
    ],

    dailyTasks: [
      {
        id: 'dt1',            // string — identifiant unique
        em: '🍽️',             // string — emoji
        lbl: 'Debarrasser la table',
        days: null,           // number[]|null — jours specifiques (0=dim..6=sam), null = tous les jours
        passive: false,       // boolean — encouragement sans impact financier
        description: ''       // string — consigne optionnelle
      }
      // ...
    ],

    badges: [
      {
        id: 'BC1',            // string — identifiant unique
        nm: 'Facteur Junior', // string — nom du badge
        em: '📬',             // string — emoji (fallback si pas d'image)
        img: null,            // string|null — URL vers image (hebergee sur Synology)
        catId: 'courrier',    // string — ref catalog.categories.id
        nivId: 'N1'           // string — ref niveau par convention (N1/N2/N3/N4)
      }
      // ...
    ]
  },

  // ─── ENFANTS ──────────────────────────────────────────────────

  children: {
    louis: {
      name: 'Louis',
      age: 10,
      emoji: '⚡',
      active: true,          // boolean — profil actif (false = placeholder "bientot")

      // Niveaux propres a cet enfant
      levels: [
        {
          id: 'N1',          // string — DOIT correspondre aux nivId utilises dans badges et missions
          label: 'APPRENTI',
          emoji: '🟢',
          color: '#00E676',   // couleur accent
          bg: '#071A0F',      // couleur fond
          seuil: 0,           // number — CHF cumules requis
          gatewayMission: null // string|null — ID mission gateway (null = acces libre)
        },
        {
          id: 'N2',
          label: 'ORGANISATEUR',
          emoji: '🔵',
          color: '#00BFFF',
          bg: '#001828',
          seuil: 20,
          gatewayMission: 'M08'
        },
        {
          id: 'N3',
          label: 'EXPERT',
          emoji: '🟠',
          color: '#FFB300',
          bg: '#1E1400',
          seuil: 45,
          gatewayMission: 'M23'
        },
        {
          id: 'N4',
          label: 'MAITRE',
          emoji: '🟣',
          color: '#D05070',
          bg: '#1E0810',
          seuil: 90,
          gatewayMission: 'M42'
        }
      ],

      // Surcharges missions
      missions: {
        include: '*',          // '*' = tout le catalogue, ou string[] d'IDs
        exclude: [],           // string[] — IDs a retirer du catalogue
        overrides: {},         // { [missionId]: { chf?, diff?, niv?, nom?, description? } }
        extra: []              // missions specifiques (meme schema, IDs prefixes 'X-childId-')
      },

      // Surcharges taches journalieres
      dailyTasks: {
        include: '*',
        exclude: [],
        overrides: {},         // { [taskId]: { lbl?, days?, passive?, description? } }
        extra: []              // taches specifiques (IDs prefixes 'X-childId-')
      },

      // Etat de jeu
      state: {
        missionStates: {},     // { [missionId]: 'none'|'pending'|'done' }
        daily: {},             // voir schema detaille ci-dessous
        weeklyRec: {}          // { [weekKey]: 'none'|'pending'|'done' }
      }
    },

    emile: {
      name: 'Emile', age: 8, emoji: '🌟', active: false,
      levels: [],              // a configurer par le parent
      missions: { include: '*', exclude: [], overrides: {}, extra: [] },
      dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
      state: { missionStates: {}, daily: {}, weeklyRec: {} }
    },

    marius: {
      name: 'Marius', age: 4, emoji: '🦁', active: false,
      levels: [],
      missions: { include: '*', exclude: [], overrides: {}, extra: [] },
      dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
      state: { missionStates: {}, daily: {}, weeklyRec: {} }
    }
  },

  // ─── CONFIG GLOBALE ───────────────────────────────────────────

  cfg: {
    malus: 0.10,              // CHF par tache manquee
    bonus: 0.20,              // CHF par tache (journee parfaite)
    streakBonus: 1,           // CHF bonus streak
    streakDays: 7             // jours pour un streak
  }
}
```

## Schema detaille : state.daily

```js
state.daily = {
  '2026-03-24': {
    tasks: {                  // { [taskId]: boolean } — coche ou pas
      'dt1': true,
      'dt2': false,
      'dt11': true            // parole (passive) — stocke mais pas dans le calcul
    },
    parentValidated: false,   // boolean — journee validee par parent via PIN
    bonus: 0,                 // number — CHF bonus calcule a la validation (0 si pas journee parfaite)
    malus: 0.10               // number — CHF malus calcule a la validation
  }
}
```

Note : `bonus` et `malus` sont calcules et figes au moment de `valDay()`. Ils incluent le streak bonus si applicable. Ce sont les montants definitifs, pas des valeurs recalculables.

## Mission-to-Level mapping

Chaque mission du catalogue porte un champ `niv` (ex: `'N1'`) qui est son **niveau par defaut**. Ce niveau correspond aux IDs de niveaux definis dans `child.levels`.

Un enfant peut surcharger le niveau d'une mission via `overrides` :
```js
overrides: { 'M01': { niv: 'N2' } }  // M01 passe en N2 pour cet enfant
```

**Convention** : les IDs de niveaux sont `N1`, `N2`, `N3`, `N4` (ou `N1`, `N2` pour un enfant avec 2 niveaux). Les badges referencent ces memes IDs via `nivId`. Un enfant qui n'a pas de niveau N3 ne peut simplement pas obtenir les badges N3.

**Resolution du niveau effectif** :
```js
missionNiv(childId, mission) =
  child.missions.overrides[mission.id]?.niv || mission.niv
```

**Note** : le champ `gateway` est supprime du schema mission. Le gateway est defini dans `child.levels[].gatewayMission` — c'est une propriete du niveau, pas de la mission. Une meme mission peut etre gateway pour un enfant et pas pour un autre.

## Champs surchargeable (whitelist)

Pour eviter la corruption d'identite, seuls ces champs sont surchargeable via `overrides` :

**Missions** : `chf`, `diff`, `niv`, `nom`, `description`
**Taches journalieres** : `lbl`, `days`, `passive`, `description`

Les champs `id`, `cat`, `secret`, `recurrence` (missions) et `id`, `em` (taches) ne sont **pas surchargeable**. Le code de resolution ignore les overrides sur ces champs.

## IDs des missions extra

Les missions et taches extra (specifiques a un enfant) doivent avoir des IDs uniques qui ne collisionnent pas avec le catalogue. Convention : `X-{childId}-{seq}` (ex: `X-louis-01`, `X-marius-03`).

## Streak

Le streak est **calcule dynamiquement** a partir de `state.daily` (en remontant les jours consecutifs avec journee parfaite validee). Il n'est pas stocke dans `state` — pas de risque de donnee perimee. La fonction `streak(childId)` reste la source de verite.

## Recovery (rattrapage)

`state.weeklyRec` stocke l'etat de la mission de rattrapage par semaine :
- Cle : `weekKey` (ex: `'2026-W12'`)
- Valeur : `'none'` | `'pending'` | `'done'`

Quand `'done'`, les malus de la semaine precedente sont annules (ajoutes au total via `earnRec()`). La mission de rattrapage est une tache menagere concrete choisie par le parent — le systeme ne prescrit pas le contenu, il gere seulement le flux (demande → validation PIN → annulation malus).

## Resolution des donnees a l'execution

```js
function missionsEffectives(childId) {
  const child = S.children[childId];
  const inc = child.missions.include;
  return S.catalog.missions
    .filter(m => inc === '*' || inc.includes(m.id))
    .filter(m => !child.missions.exclude.includes(m.id))
    .map(m => {
      const ov = child.missions.overrides[m.id];
      if (!ov) return m;
      // Whitelist only
      const safe = {};
      for (const k of ['chf','diff','niv','nom','description']) {
        if (ov[k] !== undefined) safe[k] = ov[k];
      }
      return { ...m, ...safe };
    })
    .concat(child.missions.extra);
}
```

Meme logique pour `dailyTasksEffectives(childId)` avec whitelist `['lbl','days','passive','description']`.

## Migration v3 → v4

Au premier chargement, si `mh_v3` existe et `mh_v4` n'existe pas :

1. **Lire `mh_v3`** depuis localStorage
2. **Construire `catalog.categories`** a partir de la constante `CAT` :
   - Cle `'📬 Courrier'` → `{ id: 'courrier', label: '📬 Courrier', color: '#4FC3F7' }`
   - Mapping label→id : retirer emoji, lowercase, sans accents
3. **Construire `catalog.missions`** a partir de la constante `MISSIONS` :
   - `cat` : convertir label → id via le mapping (ex: `'📬 Courrier'` → `'courrier'`)
   - `secret` : convertir label → id (ex: `'📬 Courrier'` → `'courrier'`, `null` reste `null`)
   - `niv` : conserver tel quel (`'N1'`, `'N2'`, etc.)
   - Supprimer le champ `gateway` (deplace dans levels)
   - Ajouter `description: ''` et `recurrence: { type: 'once' }`
4. **Construire `catalog.dailyTasks`** a partir de la constante `DAILY` :
   - `always: true` → `days: null` (supprimer le champ `always`)
   - `pNote: true` ou `passive: true` → `passive: true`
   - Ajouter `description: ''`
5. **Construire `catalog.badges`** a partir de la constante `BADGES` :
   - `cat` → `catId` via le mapping label→id
   - `niv` → `nivId`
   - Ajouter `img: null`
6. **Construire `children.louis`** :
   - `levels` : copie de `LEVELS` + `gatewayMission` derive des missions avec `gateway:true`
   - **Migrer `mh_v3.cfg.thresholds`** : si le parent a modifie les seuils, appliquer `mh_v3.cfg.thresholds.N2/N3/N4` sur les niveaux correspondants
   - `missions.include = '*'`
   - **Migrer `mh_v3.cfg.mCHF`** → `missions.overrides` : `{ [missionId]: { chf: value } }` pour chaque entree
   - **Migrer `mh_v3.cfg.mActive`** → `missions.exclude` : chaque mission avec `mActive[id] === false` est ajoutee a `exclude`
   - `state.missionStates` = copie de `mh_v3.ch.louis.m` (memes cles, memes valeurs)
   - `state.daily` = copie de `mh_v3.ch.louis.daily` (meme structure)
   - `state.weeklyRec` = copie de `mh_v3.ch.louis.weeklyRec`
7. **Creer `children.emile` et `children.marius`** inactifs avec state vide
8. **Migrer `cfg`** : `malus`, `bonus`, `streakBonus` depuis `mh_v3.cfg`
9. **Ecrire `mh_v4`** dans localStorage
10. **Supprimer `mh_v3`**

**Pas de perte de donnees** : l'etat de jeu de Louis, ses seuils personnalises, ses CHF modifies et ses missions desactivees sont tous preserves.

## Back Office — Onglets

Le back office existant (overlay plein ecran, PIN) est enrichi avec des onglets :

| Onglet | Contenu |
|--------|---------|
| 📅 **Validation** | Validation journaliere d'hier (comme aujourd'hui) |
| 👨‍👧‍👦 **Enfants** | Creer/editer profils : nom, age, emoji, actif/inactif. Configurer niveaux (ajouter, supprimer, reordonner, seuils, gateway, couleurs) |
| 📋 **Missions** | CRUD sur le catalogue. Voir/editer surcharges par enfant. Ajouter missions extra par enfant |
| ✅ **Taches** | CRUD sur le catalogue journalier. Surcharges par enfant. Flag passive |
| 🏅 **Badges** | CRUD sur les badges. Associer images (URL Synology). Lier a categorie + niveau |
| ⚙️ **Parametres** | PIN, bonus/malus, streak, import/export JSON complet |

## Flux de validation journalier

Note de design : les taches journalieres utilisent un **flux simplifie** (checkbox toggle) et non le flux mission (Fait! → pending → PIN). La validation PIN se fait en batch via le back office le lendemain matin (`valDay`). C'est un choix delibere : le flux PIN unitaire serait trop lourd pour 10 taches quotidiennes.

## Contraintes

- **Zero dependance** : pas de framework, pas de lib. Vanilla JS + localStorage
- **Fichier unique** : tout reste dans `index.html`
- **Retrocompatibilite** : la migration v3→v4 est transparente et sans perte
- **Images badges** : URL absolues vers serveur Synology. Emoji en fallback si URL null ou inaccessible
- **Recurrence missions** : le champ `recurrence` est present dans le schema mais l'implementation (reset periodique, compteurs) est differee a une phase ulterieure
- **IDs de niveaux** : convention N1/N2/N3/N4 pour compatibilite badges. Un enfant peut avoir un sous-ensemble (ex: N1/N2 seulement)
- **Integrite referentielle** : le back office empeche la suppression d'une categorie si des missions la referencent. La suppression d'une mission nettoie les references dans overrides/exclude/missionStates

## Hors scope (a traiter dans des specs separees)

- Canevas Budget interactif (roadmap P1)
- Engagements parentaux (roadmap P1)
- Implementation de la recurrence (reset periodique)
- Persistance multi-device / Supabase (roadmap P3)
- Cross-tab sync (storage event listener)
- Pruning des anciennes donnees daily
