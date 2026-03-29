# ⚡ Missions Héros — Documentation du Projet

> Système gamifié de responsabilisation et de rémunération pour enfants, déployable en mode kiosk sur tablette Android.

---

## 📁 Structure du repo

```
missions-heros/
├── index.html              ← Shell HTML (~120 lignes)
├── css/
│   ├── base.css            ← Reset & base
│   ├── themes.css          ← Palettes enfants (Louis, Émile, Marius)
│   ├── layout.css          ← App shell, navigation, sidebar, responsive
│   ├── components.css      ← Cartes missions, journalier, badges, accordion
│   ├── backoffice.css      ← Interface Back Office parent
│   └── modal.css           ← PIN modal, toast notifications
├── js/
│   ├── data.js             ← Données seed (missions, badges, tâches, niveaux)
│   ├── migration.js        ← Migration v3→v4 + patches versionnés
│   ├── state.js            ← Gestion d'état, cache, résolution missions/tâches
│   ├── helpers.js          ← Utilitaires (streak, badges, XSS, calculs financiers)
│   ├── render.js           ← Rendu UI enfant (missions, journalier, badges)
│   ├── backoffice.js       ← Rendu + actions Back Office parent
│   ├── actions.js          ← Actions utilisateur (PIN, validation, navigation)
│   └── app.js              ← Bootstrap de l'application
├── README.md               ← Ce fichier
├── CLAUDE.md               ← Instructions projet pour Claude Code
└── .gitignore
```

> **Zéro dépendance, zéro build** — ouvrir `index.html` dans un navigateur suffit.

---

## 🚀 Déploiement

### Local (test immédiat)
Ouvrir `index.html` dans n'importe quel navigateur. Les données sont sauvegardées en `localStorage`.

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_USERNAME/missions-heros.git
git push -u origin main
```
Puis **Settings → Pages → Deploy from branch `main`**.
URL : `https://ton_username.github.io/missions-heros/`

### Mode kiosk Android
Installer **Fully Kiosk Browser** (Play Store, gratuit).
Pointer sur l'URL GitHub Pages. Activer le mode kiosk pour bloquer la navigation.

---

## 👨‍👧‍👦 Enfants

| Enfant | Âge | Statut |
|--------|-----|--------|
| ⚡ Louis | 10 ans | ✅ Actif — 61 missions + 10 tâches journalières + 1 encouragement passif |
| 🌟 Émile | 8 ans | 🔜 À construire |
| 🦁 Marius | 4 ans | 🔜 À construire |

---

## 🗺️ Système de niveaux

| Niveau | Seuil CHF cumulés | Missions dispo | Mission gateway à l'ouverture |
|--------|-------------------|---------------|-------------------------------|
| 🟢 N1 Apprenti | 0 CHF | 19 | — (accès libre) |
| 🔵 N2 Organisateur | 20 CHF | 21 | Créer son tableau budget (M08) |
| 🟠 N3 Expert | 45 CHF | 12 | Présenter son bilan de 4 semaines à l'oral (M42) |
| 🟣 N4 Maître | 90 CHF | 8 | — (seuil uniquement) |

> Le seuil est **cumulatif** (total gagné depuis le début). La **mission gateway** est la seule mission active à l'ouverture d'un nouveau niveau : toutes les autres missions du niveau restent verrouillées tant qu'elle n'est pas accomplie et validée par PIN parent.

---

## 📋 Catégories de missions

| Catégorie | Couleur | N1 | N2 | N3 | N4 | Secret |
|-----------|---------|----|----|----|----|--------|
| 📬 Courrier | Bleu | 2 | 2 | 1 | 1 | ✅ |
| 👕 Lessive | Violet | 2 | 2 | 1 | 1 | ✅ |
| 🌿 Jardin | Vert | 1 | 2 | 2 | 1 | ✅ |
| 💻 Ordi | Cyan | 2 | 1 | 1 | 1 | ✅ |
| 💰 Budget | Orange | 1 | 1 | 2 | 1 | ✅ |
| 🔧 Atelier | Marron | 2 | 2 | 1 | — | ✅ |
| 🍳 Cuisine | Rouge | 2 | 1 | 1 | 1 | ✅ |
| 🐱 Soigneur Mira | Rose | 2 | 2 | 1 | 1 | ✅ |
| 🤍 Care & Famille | Rose clair | 4 | 6 | 2 | 1 | ✅ |
| 🏛️ Conseil | Or | 1 | 1 | 1 | 1 | ✅ |

**10 missions secrètes** — une par catégorie, débloquées automatiquement en gagnant le premier badge de la catégorie.

---

## ⚙️ Mécaniques — Table pédagogique complète

| # | Mécanique | Description technique | Ce qu'elle enseigne | Risques & garde-fous |
|---|-----------|----------------------|---------------------|----------------------|
| 1 | **Missions rémunérées** | 61 missions en 4 niveaux, validées par PIN parent. Enfant dit "Fait !", mission passe en ⏳, parent valide. | Le travail a une valeur monétaire. Les missions sont au service réel de la famille — pas fictives. Développe la fierté de contribuer. | ⚠️ Risque de transactionnaliser toute aide familiale ("combien tu me paies ?"). **Garde-fou** : les tâches journalières ne sont **pas** payées — elles sont dues. Cette frontière doit être expliquée explicitement à Louis dès le départ : "les missions c'est ton travail pour la famille, le journalier c'est juste habiter ici ensemble." |
| 2 | **Niveaux progressifs** | Seuil cumulatif en CHF. Le niveau supérieur est visible mais verrouillé. Missions locked affichées mais non cliquables. | L'effort s'accumule dans le temps. Les responsabilités se méritent, elles ne s'achètent pas d'un coup. Métaphore de la progression de carrière. | ⚠️ N4 à 90 CHF peut sembler très loin au démarrage. **Garde-fou** : célébrer chaque déblocage de niveau avec un moment réel en famille — le système numérique ne suffit pas. |
| 3 | **Missions gateway** | Chaque niveau (sauf N1) s'ouvre avec **une seule mission active** : la mission gateway (Budget). Toutes les autres missions du niveau restent verrouillées tant que la gateway n'est pas accomplie. M08 ouvre N2, M23 ouvre N3, M42 ouvre N4. | Certaines choses ne sont pas optionnelles dans la vraie vie. Liberté dans un cadre de responsabilités non négociables. La compétence budgétaire est le fil rouge de la progression. | ⚠️ Si la gateway est trop difficile, elle devient un mur frustrant. **Garde-fou** : le back office permet au parent de la débloquer manuellement en cas de force majeure (maladie, voyage). |
| 4 | **Tâches journalières** | 10 tâches quotidiennes (dont 1 spécifique mer+dim : Douche). Même flux que les missions : l'enfant appuie **✋ Fait !** → tâche passe en ⏳ → parent valide → ✅. **Aucun bonus ni malus à la tâche individuelle.** Ces tâches ne sont pas rémunérées — elles sont dues. Seul le streak les récompense indirectement. | Ces tâches sont des **actes de vie commune**, pas des services rendus. Les payer enverrait le message implicite qu'elles sont optionnelles si on ne veut pas de l'argent. L'objectif est l'internalisation de l'habitude, pas la conformité monétaire. | ⚠️ Ne jamais laisser glisser ces tâches dans la logique marchande. Si Louis demande "combien ça rapporte ?", la réponse est : "rien — c'est ce que ça veut dire d'habiter ici ensemble." |
| 5 | **Streak 7 jours** | 7 journées consécutives 100% complètes → +1 CHF bonus. Barre de progression sobre dans l'interface. Pas de pénalité si le streak est cassé. | Ce qu'on récompense n'est pas "tu as fait ton lit" — c'est "tu es le genre de personne qui fait son lit tous les jours". **L'identité, pas l'acte.** La régularité dans le temps a une valeur propre, distincte de chaque tâche individuelle. | ⚠️ Un streak cassé peut décourager. **Garde-fou** : pas de pénalité, pas de dramatisation visuelle. Le streak repart de 0 discrètement. Ne pas transformer ça en obsession — c'est un miroir, pas un juge. |
| 6 | **Badges** | Un badge par couple catégorie × niveau. Gagné en complétant au moins une mission de ce couple. Toutes les catégories ont des badges N1 à N3 (30 badges). Care & Famille et Conseil ont en plus un badge N4 (total : 32). | Valorise la spécialisation et l'identité. "Je suis le soigneur de Mira." L'expertise dans un domaine se construit par la pratique répétée, pas par la diversification. | ⚠️ Les badges purement cosmétiques s'oublient en 3 semaines. **Garde-fou** : ici ils débloquent les missions secrètes — ils ont un enjeu mécanique réel. |
| 7 | **Missions secrètes** | 10 missions cachées, une par catégorie. Visibles et accessibles seulement après avoir gagné le badge d'entrée de cette catégorie. | Crée la surprise et la découverte. Récompense l'investissement dans une catégorie plutôt que le survol de toutes. Donne envie d'approfondir. | — |
| 8 | **Conseil de famille** | Mission payée dans chaque niveau : préparer, organiser, animer, puis légiférer. Louis propose, le parent accepte ou non. | Développe la parole en public, la capacité à structurer une réunion, à défendre une position, à négocier. Introduit la démocratie et la gouvernance. | ⚠️ Ne pas le laisser devenir une formalité. Le Conseil doit être un vrai moment en famille, pas juste une checkbox à cocher. |
| 9 | **Validation PIN parent** | L'enfant marque "Fait !" → ⏳ En attente → parent entre PIN → ✅ validé + CHF ajoutés. | Le regard de l'adulte reste la référence de validation. La reconnaissance vient de l'autre, pas de soi-même. Développe l'honnêteté et prévient la triche. | ⚠️ Ne pas retarder systématiquement la validation — la frustration prolongée casse la motivation. Viser moins de 24h. |
| 13 | **Moment parole du soir** | **Encouragement passif** affiché dans le journalier, mais **sans impact sur bonus/malus/streak**. Louis peut le cocher pour signaler qu'il a partagé ses succès et difficultés du jour. L'enfant suit ses besoins — ce n'est pas une obligation. | Liant du système : sans parole, les mécaniques restent des chiffres. Développe l'intelligence émotionnelle, la conscience de soi, la relation parent-enfant. | ⚠️ Ne pas gamifier ce moment. Pas de récompense, pas de pénalité. L'enfant doit sentir que c'est un espace libre, pas une performance. |
| 11 | **Back office parent** | Interface séparée (PIN). Permet de **corriger** une tâche journalière mal cochée, ajuster montants, désactiver missions, changer PIN, reset. N'est **pas** la porte principale de validation — celle-ci se fait toujours via le flux ✋ Fait ! → ⏳ → PIN dans l'interface enfant. | Indirectement : Louis comprend que les règles sont construites par des humains et peuvent évoluer. Ouvre la possibilité d'un Conseil de famille pour co-réviser le système. | ⚠️ Être transparent avec Louis sur l'existence du back office. Ne pas s'en servir en secret pour "corriger" des missions contestées sans dialogue. |
| 12 | **Devoirs** | Tâche journalière, cochée par l'enfant, validée le lendemain. | Enseigne que le travail scolaire est une responsabilité personnelle, pas une obligation extérieure imposée. L'enfant en est l'agent, pas la victime. | — |

---

## ⚖️ L'asymétrie parent-enfant

Le système actuel place **toutes les obligations sur les enfants** et aucune sur les parents. C'est pédagogiquement incohérent : si on enseigne la responsabilité et la réciprocité, la famille doit fonctionner comme un système **bilatéral**.

### Propositions pour rééquilibrer

**Option A — Engagements parentaux visibles (recommandée, implémenter en priorité)**
Ajouter dans l'app une section "Nos engagements" consultable par Louis (lecture seule). Exemples :
- Valider les missions dans les 24h
- Tenir le Conseil de famille quand Louis le demande
- Expliquer tout changement de règle avant de l'appliquer
- Verser les CHF chaque dimanche sans oublier

**Option B — Missions parents (optionnelle)**
Les parents ont leurs propres missions, non rémunérées mais visibles dans l'app :
- Lire une histoire à Marius (miroir symétrique de Louis)
- Cuisiner un repas avec Louis comme commis
- Passer un moment seul à seul avec chaque enfant dans la semaine

**Option C — Conseil de famille comme chambre de révision**
Le Conseil (déjà présent comme mission) devient le lieu où Louis peut **soulever l'asymétrie** et proposer des ajustements. Le système acquiert ainsi une légitimité négociée plutôt qu'imposée.

> 💡 **Recommandation** : implémenter l'Option A dès la prochaine version (section statique en lecture seule dans l'interface Louis), et utiliser le Conseil de famille pour les Options B et C au fil du temps.

---

## 💰 Canevas Budget — Apprendre les déductions

L'objectif pédagogique des missions Budget est de faire comprendre à Louis que **le revenu brut n'est pas le revenu disponible** — et de l'entraîner aux calculs réels.

### Structure du canevas (à implémenter en page dédiée)

```
┌─────────────────────────────────────────────────────────┐
│  💰 MON BUDGET — Mois de [MOIS ANNÉE]                     │
├─────────────────────────────────────────────────────────┤
│  REVENUS BRUTS                                           │
│  ├─ Argent de poche (proches)          + 5.00 CHF        │
│  ├─ Missions complétées ce mois        + _____ CHF        │
│  └─ Bonus journalier (streak, etc.)    + _____ CHF        │
│                              TOTAL BRUT  = _____ CHF     │
├─────────────────────────────────────────────────────────┤
│  DÉDUCTIONS (obligatoires)                               │
│  ├─ 💾 Épargne obligatoire (10%)       - _____ CHF        │
│  ├─ 🏠 Loyer (10%)                     - _____ CHF        │
│  └─ 🎁 Dons (cadeau, cause, partage)   - _____ CHF        │
│                         TOTAL DÉDUIT   = _____ CHF       │
├─────────────────────────────────────────────────────────┤
│  REVENU DISPONIBLE NET                 = _____ CHF       │
├─────────────────────────────────────────────────────────┤
│  DÉPENSES DU MOIS                                        │
│  ├─ [Item 1]                           - _____ CHF        │
│  ├─ [Item 2]                           - _____ CHF        │
│  └─ ...                                                  │
│                       TOTAL DÉPENSES   = _____ CHF       │
├─────────────────────────────────────────────────────────┤
│  SOLDE FINAL (net − dépenses)          = _____ CHF       │
│  ÉPARGNE CUMULÉE (tous les mois)       = _____ CHF       │
└─────────────────────────────────────────────────────────┘
```

### Concepts enseignés

| Concept | Analogie adulte en Suisse | Calcul associé |
|---------|--------------------------|----------------|
| Revenu brut | Salaire brut (avant déductions) | Addition |
| Épargne 10% obligatoire | Pilier 3a, prévoyance vieillesse | Pourcentage × base |
| Loyer (10%) | Loyer, charges fixes incompressibles | Pourcentage × base |
| Dons (cadeau, cause) | Dons caritatifs, cadeaux d'anniversaire | Montant libre, décision active |
| Revenu disponible | Salaire net après AVS/AC/LPP | Brut − déductions |
| Suivi de dépenses | Relevé de compte bancaire | Additions cumulées |
| Solde final | Fin de mois : dans le rouge ou pas ? | Revenu − dépenses |
| Épargne cumulée | Compte épargne qui grandit | Additions mois après mois |

### À N3 — l'analogie avec le salaire adulte
Montrer à Louis les vraies déductions salariales en Suisse :
- **AVS** : 5.3% du brut
- **AC** : 1.1% du brut
- **LPP** : variable (~7%)

> Message clé : "Même les adultes ne gardent pas tout ce qu'ils gagnent. C'est comme ça depuis toujours — et c'est juste, parce que ça finance des choses utiles pour tout le monde."

### Progression par niveau

| Niveau | Objectif budget | Calcul requis | Complexity |
|--------|----------------|---------------|-----------|
| N1 | Créer le tableau, noter ses revenus | Additions simples | ⭐ |
| N2 | Calculer le bilan mensuel | Soustraction, balance | ⭐⭐ |
| N3 | Épargne obligatoire 10% | Pourcentage du brut | ⭐⭐⭐ |
| N4 | Présenter bilan complet à l'oral | Synthèse + argumentation | ⭐⭐⭐⭐ |

---

## 🔧 Roadmap technique (Claude Code)

### Priorité 1 — Fiabilité & contenu
- [ ] Canevas Budget interactif (page dédiée dans l'onglet Louis)
- [ ] Section "Engagements parentaux" en lecture seule pour Louis
- [ ] Export/import JSON des données (sauvegarde manuelle)
- [ ] Missions Émile (8 ans) — adapter difficultés et catégories
- [ ] Missions Marius (4 ans) — très simples, visuelles, gros boutons

### Priorité 2 — Expérience
- [ ] Animation de level-up (confettis, son)
- [ ] Vue "historique" des missions complétées avec dates
- [ ] Graphique d'évolution des gains semaine par semaine
- [ ] Objectif d'épargne avec barre de progression dédiée

### Priorité 3 — Infrastructure
- [ ] Persistance multi-device (remplacer localStorage par Supabase free tier)
- [ ] Export PDF du bilan mensuel depuis le back office
- [ ] PWA (icône sur écran d'accueil, offline)

---

## 📌 Décisions de design prises

| Question | Décision retenue | Raison |
|----------|-----------------|--------|
| Journalier : quelle mécanique ? | **Aucun bonus/malus à la tâche — streak uniquement** | Les tâches journalières sont des actes de vie commune, pas des services. Les payer crée une logique marchande qui mine l'internalisation. Seule la régularité (streak 7j) est récompensée — ce qu'on valorise c'est l'identité, pas l'acte. |
| Gateway non faite ? | **Gateway : seule mission active à l'ouverture du niveau** | Certaines choses ne sont pas optionnelles dans la vraie vie. Force l'engagement budgétaire avant toute autre activité du niveau |
| Validation journalier | **Même flux que les missions : ✋ Fait ! → ⏳ → PIN parent → ✅** | Cohérence totale du système. Le back office permet de corriger, pas de valider en premier. |
| Devoirs | **Même flux : ✋ Fait ! → ⏳ → PIN parent → ✅** | Cohérence du système — pas d'exception au flux de validation |
| Moment parole du soir | **Encouragement passif, hors flux bonus/malus/streak** | L'enfant suit ses besoins. Ne pas gamifier la parole — c'est un espace libre |
| Conseil de famille | **Mission ordinaire (pas gateway)** | Doit rester un choix autonome, pas une obligation froide |
| Badges | **Débloquent missions secrètes** | Les badges cosmétiques s'oublient vite — il leur faut un enjeu mécanique |
| Versement des CHF | **Hebdomadaire, chaque dimanche** | Le parent verse en argent réel le solde net de la semaine. Le solde dans l'app est un compteur virtuel, le versement est l'acte concret |
| Périodicité budget | **Mensuelle** | Revenus, déductions et dépenses calculés sur le mois. Cohérent avec le bilan mensuel (gateway N3) |
| Stack technique | **HTML/CSS/JS vanilla, un seul fichier** | Zéro build, zéro dépendance, déployable partout, maintenable avec Claude Code |

---

## 🔑 Commandes utiles

**Changer le PIN via console :**
```js
const s = JSON.parse(localStorage.getItem('mh_v4'));
s.pin = '5678';
localStorage.setItem('mh_v4', JSON.stringify(s));
location.reload();
```

**Réinitialiser toutes les données :**
```js
localStorage.removeItem('mh_v4');
location.reload();
```

**Voir l'état brut des données :**
```js
console.log(JSON.parse(localStorage.getItem('mh_v4')));
```
