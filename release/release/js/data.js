// ══════════════════════════════════════════════
// SEED / CONSTANT DATA
// Extracted from migrateV3toV4() — global constants
// ══════════════════════════════════════════════

const CAT_ID_MAP = {
  '📬 Courrier':'courrier','👕 Lessive':'lessive','🌿 Jardin':'jardin',
  '💻 Ordi':'ordi','💰 Budget':'budget','🔧 Atelier':'atelier',
  '🍳 Cuisine':'cuisine','🐱 Soigneur Mira':'soigneur-mira',
  '🤍 Care & Famille':'care-famille','🏛️ Conseil':'conseil'
};

const CSS_TO_HEX = {
  'var(--n1)':'#00E676','var(--n1b)':'#071A0F',
  'var(--n2)':'#00BFFF','var(--n2b)':'#001828',
  'var(--n3)':'#FFB300','var(--n3b)':'#1E1400',
  'var(--n4)':'#D05070','var(--n4b)':'#1E0810'
};

const SEED_LEVELS = [
  {id:'N1',label:'APPRENTI',    emoji:'🟢',color:'var(--n1)',bg:'var(--n1b)',seuil:0},
  {id:'N2',label:'ORGANISATEUR',emoji:'🔵',color:'var(--n2)',bg:'var(--n2b)',seuil:20},
  {id:'N3',label:'EXPERT',      emoji:'🟠',color:'var(--n3)',bg:'var(--n3b)',seuil:45},
  {id:'N4',label:'MAÎTRE',      emoji:'🟣',color:'var(--n4)',bg:'var(--n4b)',seuil:90},
];

const SEED_CAT = {
  '📬 Courrier':'#4FC3F7','👕 Lessive':'#CE93D8','🌿 Jardin':'#A5D6A7','💻 Ordi':'#80DEEA',
  '💰 Budget':'#FFCC80','🔧 Atelier':'#BCAAA4','🍳 Cuisine':'#EF9A9A','🐱 Soigneur Mira':'#F48FB1',
  '🤍 Care & Famille':'#F8BBD0','🏛️ Conseil':'#FFD54F',
};

const SEED_MISSIONS = [
  // ── N1 ──
  {id:'M01',niv:'N1',cat:'📬 Courrier',      nom:'Relever la boîte aux lettres et poser sur le bureau',chf:2},
  {id:'M02',niv:'N1',cat:'📬 Courrier',      nom:'Trier le courrier (jeter pub, classer important)',chf:3},
  {id:'M03',niv:'N1',cat:'👕 Lessive',       nom:'Trier les habits sales par couleur / matière',chf:2},
  {id:'M04',niv:'N1',cat:'👕 Lessive',       nom:'Mettre une machine + la faire tourner',chf:3},
  {id:'M05',niv:'N1',cat:'🌿 Jardin',        nom:'Arroser les plantes / le jardin',chf:2},
  {id:'M06',niv:'N1',cat:'💻 Ordi',          nom:"Organiser les photos du mois en dossiers datés",chf:4},
  {id:'M07',niv:'N1',cat:'💻 Ordi',          nom:"Renommer les fichiers d'un dossier (date + nom propre)",chf:3},
  {id:'M08',niv:'N2',cat:'💰 Budget',        nom:'Créer son tableau budget (entrées / dépenses)',chf:3, gateway:true},
  {id:'M09',niv:'N1',cat:'💰 Budget',        nom:'Saisir ses dépenses de la semaine',chf:2},
  {id:'M10',niv:'N1',cat:'🔧 Atelier',       nom:"Ranger les outils à leur place après utilisation",chf:2},
  {id:'M11',niv:'N1',cat:'🔧 Atelier',       nom:"Nettoyer l'établi",chf:2},
  {id:'M12',niv:'N1',cat:'🍳 Cuisine',       nom:'Faire la vaisselle du repas',chf:2},
  {id:'M13',niv:'N1',cat:'🍳 Cuisine',       nom:'Nettoyer le plan de travail après le repas',chf:2},
  {id:'M14',niv:'N1',cat:'🐱 Soigneur Mira', nom:"Changer l'eau et remplir la gamelle de Mira",chf:2},
  {id:'M15',niv:'N1',cat:'🐱 Soigneur Mira', nom:'Nettoyer et changer la litière',chf:3},
  {id:'M45',niv:'N1',cat:'🤍 Care & Famille',nom:'Lire une histoire à Marius (au moins 10 min)',chf:2},
  {id:'M46',niv:'N1',cat:'🤍 Care & Famille',nom:'Jouer avec Marius 20 min (jeu de son choix)',chf:2},
  {id:'M47',niv:'N1',cat:'🤍 Care & Famille',nom:"Faire un dessin ou une carte pour quelqu'un de la famille",chf:2},
  {id:'M48',niv:'N1',cat:'🤍 Care & Famille',nom:'Écrire un mot gentil à un proche ou aux grands-parents',chf:2},
  {id:'M58',niv:'N1',cat:'🏛️ Conseil',       nom:'Demander et préparer un Conseil de famille',chf:5},
  // ── N2 ──
  {id:'M16',niv:'N2',cat:'📬 Courrier',      nom:'Créer un classeur "à traiter / archives"',chf:6},
  {id:'M17',niv:'N2',cat:'📬 Courrier',      nom:'Saisir les factures du mois dans un tableau',chf:7},
  {id:'M18',niv:'N2',cat:'👕 Lessive',       nom:'Plier et ranger le linge propre',chf:4},
  {id:'M19',niv:'N2',cat:'👕 Lessive',       nom:'Gérer une lessive complète de A à Z (trier → ranger)',chf:7},
  {id:'M20',niv:'N2',cat:'🌿 Jardin',        nom:'Désherber une zone définie',chf:6},
  {id:'M21',niv:'N2',cat:'🌿 Jardin',        nom:'Ramasser les feuilles mortes',chf:5},
  {id:'M22',niv:'N2',cat:'💻 Ordi',          nom:"Supprimer les doublons photos d'un dossier",chf:6},
  {id:'M23',niv:'N2',cat:'💰 Budget',        nom:'Tenir son budget 4 semaines consécutives sans oubli',chf:6},
  {id:'M24',niv:'N2',cat:'🔧 Atelier',       nom:"Faire l'inventaire des outils (liste complète)",chf:6},
  {id:'M25',niv:'N2',cat:'🔧 Atelier',       nom:'Nettoyer et ranger après un projet bricolage',chf:5},
  {id:'M26',niv:'N2',cat:'🍳 Cuisine',       nom:'Aider à préparer un plat simple (commis de cuisine)',chf:5},
  {id:'M27',niv:'N2',cat:'🐱 Soigneur Mira', nom:'Brosser Mira',chf:4},
  {id:'M28',niv:'N2',cat:'🐱 Soigneur Mira', nom:"Gérer les soins de Mira 3 jours d'affilée",chf:7},
  {id:'M49',niv:'N2',cat:'🤍 Care & Famille',nom:'Donner un massage des épaules à papa ou maman (5 min)',chf:4},
  {id:'M50',niv:'N2',cat:'🤍 Care & Famille',nom:"Préparer le petit-déjeuner au lit pour quelqu'un",chf:5},
  {id:'M51',niv:'N2',cat:'🤍 Care & Famille',nom:'Faire une activité créative avec Émile (Lego, dessin, jeu)',chf:4},
  {id:'M52',niv:'N2',cat:'🤍 Care & Famille',nom:'Inventer et raconter une histoire à Marius (sans livre)',chf:4},
  {id:'M53',niv:'N2',cat:'🤍 Care & Famille',nom:'Gérer le bain ou la douche de Marius (supervisé)',chf:5},
  {id:'M54',niv:'N2',cat:'🤍 Care & Famille',nom:"Prendre soin de quelqu'un de malade (tisane, couverture)",chf:5},
  {id:'M59',niv:'N2',cat:'🏛️ Conseil',       nom:"Préparer un ordre du jour pour le Conseil de famille",chf:6},
  // ── N3 ──
  {id:'M29',niv:'N3',cat:'📬 Courrier',      nom:'Archiver 3 mois de courrier en retard',chf:12},
  {id:'M30',niv:'N3',cat:'👕 Lessive',       nom:'Gérer 2 machines en autonomie dans la semaine',chf:12},
  {id:'M31',niv:'N3',cat:'🌿 Jardin',        nom:'Tondre la pelouse (supervisé)',chf:14},
  {id:'M32',niv:'N3',cat:'🌿 Jardin',        nom:'Préparer un carré potager (retourner, nettoyer)',chf:12},
  {id:'M33',niv:'N3',cat:'💻 Ordi',          nom:"Classer toutes les photos d'une année entière",chf:14},
  // M34 supprimé (épargne mensuelle — remplacé par le cycle budget hebdomadaire)
  {id:'M35',niv:'N3',cat:'🔧 Atelier',       nom:"Organiser entièrement l'atelier (zones + rangement)",chf:14},
  {id:'M36',niv:'N3',cat:'🍳 Cuisine',       nom:'Préparer le repas du soir de A à Z (recette choisie)',chf:14},
  {id:'M37',niv:'N3',cat:'🐱 Soigneur Mira', nom:'Tenir un carnet de soins de Mira sur 1 mois',chf:12},
  {id:'M42',niv:'N3',cat:'💰 Budget',        nom:'Présenter son bilan de 4 semaines à l\'oral (tendances + décisions)',chf:12, gateway:true},
  {id:'M55',niv:'N3',cat:'🤍 Care & Famille',nom:"Préparer une surprise pour un anniversaire (déco + gâteau)",chf:12},
  {id:'M56',niv:'N3',cat:'🤍 Care & Famille',nom:'Organiser une soirée jeu de société pour toute la famille',chf:12},
  {id:'M60',niv:'N3',cat:'🏛️ Conseil',       nom:'Animer le Conseil de famille',chf:10},
  // ── N4 ──
  {id:'M38',niv:'N4',cat:'📬 Courrier',      nom:"Créer un système d'archivage complet pour la famille",chf:22},
  {id:'M39',niv:'N4',cat:'👕 Lessive',       nom:'Gérer toute la lessive de la famille sur 2 semaines',chf:22},
  {id:'M40',niv:'N4',cat:'🌿 Jardin',        nom:'Planifier et réaliser un aménagement jardin (projet)',chf:25},
  {id:'M41',niv:'N4',cat:'💻 Ordi',          nom:'Créer un album photo de famille (PDF ou diaporama)',chf:22},
  {id:'M43',niv:'N4',cat:'🍳 Cuisine',       nom:'Planifier le menu, faire les courses + cuisiner un repas',chf:25},
  {id:'M44',niv:'N4',cat:'🐱 Soigneur Mira', nom:'Préparer Mira pour une visite vétérinaire (dossier)',chf:20},
  {id:'M57',niv:'N4',cat:'🤍 Care & Famille',nom:'Organiser une sortie complète pour la famille',chf:22},
  {id:'M61',niv:'N4',cat:'🏛️ Conseil',       nom:'Proposer une nouvelle règle familiale au Conseil',chf:18},
  // ── SECRETS ──
  {id:'S01',niv:'N2',cat:'📬 Courrier',      nom:'[🔮] Créer une newsletter mensuelle de la famille',chf:10,secret:'📬 Courrier'},
  {id:'S02',niv:'N2',cat:'👕 Lessive',       nom:'[🔮] Apprendre à repasser une chemise',chf:9, secret:'👕 Lessive'},
  {id:'S03',niv:'N2',cat:'🌿 Jardin',        nom:'[🔮] Planter des légumes ou herbes aromatiques',chf:10,secret:'🌿 Jardin'},
  {id:'S04',niv:'N3',cat:'💻 Ordi',          nom:'[🔮] Créer un tutoriel vidéo pour la famille',chf:15,secret:'💻 Ordi'},
  {id:'S05',niv:'N3',cat:'💰 Budget',        nom:'[🔮] Négocier et planifier un achat personnel',chf:14,secret:'💰 Budget'},
  {id:'S06',niv:'N3',cat:'🔧 Atelier',       nom:'[🔮] Réaliser un projet bricolage en autonomie',chf:16,secret:'🔧 Atelier'},
  {id:'S07',niv:'N3',cat:'🍳 Cuisine',       nom:'[🔮] Inventer et réaliser une recette originale',chf:15,secret:'🍳 Cuisine'},
  {id:'S08',niv:'N2',cat:'🐱 Soigneur Mira', nom:'[🔮] Créer le carnet de santé complet de Mira',chf:10,secret:'🐱 Soigneur Mira'},
  {id:'S09',niv:'N3',cat:'🤍 Care & Famille',nom:'[🔮] Organiser une journée surprise pour la famille',chf:15,secret:'🤍 Care & Famille'},
  {id:'S10',niv:'N4',cat:'🏛️ Conseil',       nom:"[🔮] Rédiger le règlement intérieur de la famille",chf:24,secret:'🏛️ Conseil'},
];

const SEED_BADGES = [
  {id:'BC1',nm:'Facteur Junior',    em:'📬',cat:'📬 Courrier',      niv:'N1'},
  {id:'BC2',nm:'Gestionnaire',      em:'📂',cat:'📬 Courrier',      niv:'N2'},
  {id:'BC3',nm:'Archiviste Pro',    em:'🗂️',cat:'📬 Courrier',      niv:'N3'},
  {id:'BL1',nm:'Trieuse',           em:'👕',cat:'👕 Lessive',       niv:'N1'},
  {id:'BL2',nm:'Lavandier',         em:'🌀',cat:'👕 Lessive',       niv:'N2'},
  {id:'BL3',nm:'Chef du Linge',     em:'✨',cat:'👕 Lessive',       niv:'N3'},
  {id:'BJ1',nm:'Jardinier',         em:'🌱',cat:'🌿 Jardin',        niv:'N1'},
  {id:'BJ2',nm:'Désherbeur',        em:'🌿',cat:'🌿 Jardin',        niv:'N2'},
  {id:'BJ3',nm:'Paysagiste',        em:'🏡',cat:'🌿 Jardin',        niv:'N3'},
  {id:'BO1',nm:'Organisateur',      em:'📁',cat:'💻 Ordi',          niv:'N1'},
  {id:'BO2',nm:'Data Manager',      em:'💾',cat:'💻 Ordi',          niv:'N2'},
  {id:'BO3',nm:'Photo Master',      em:'📸',cat:'💻 Ordi',          niv:'N3'},
  {id:'BB1',nm:'Économe',           em:'💰',cat:'💰 Budget',        niv:'N1'},
  {id:'BB2',nm:'Comptable',         em:'📊',cat:'💰 Budget',        niv:'N2'},
  {id:'BB3',nm:'Financier',         em:'🏦',cat:'💰 Budget',        niv:'N3'},
  {id:'BA1',nm:'Apprenti Bricoleur',em:'🔧',cat:'🔧 Atelier',       niv:'N1'},
  {id:'BA2',nm:'Inventoriste',      em:'📋',cat:'🔧 Atelier',       niv:'N2'},
  {id:'BA3',nm:"Chef d'Atelier",    em:'🏭',cat:'🔧 Atelier',       niv:'N3'},
  {id:'BK1',nm:'Plongeur',          em:'🍽️',cat:'🍳 Cuisine',       niv:'N1'},
  {id:'BK2',nm:'Commis',            em:'👨‍🍳',cat:'🍳 Cuisine',     niv:'N2'},
  {id:'BK3',nm:'Chef Cuisto',       em:'🍳',cat:'🍳 Cuisine',       niv:'N3'},
  {id:'BM1',nm:'Soigneur',          em:'🐾',cat:'🐱 Soigneur Mira', niv:'N1'},
  {id:'BM2',nm:'Maître Chat',       em:'🐱',cat:'🐱 Soigneur Mira', niv:'N2'},
  {id:'BM3',nm:'Véto Junior',       em:'💊',cat:'🐱 Soigneur Mira', niv:'N3'},
  {id:'BF1',nm:'Petit Attentionné', em:'💝',cat:'🤍 Care & Famille',niv:'N1'},
  {id:'BF2',nm:'Soignant du Cœur',  em:'🤗',cat:'🤍 Care & Famille',niv:'N2'},
  {id:'BF3',nm:'Pilier de Famille', em:'🏠',cat:'🤍 Care & Famille',niv:'N3'},
  {id:'BF4',nm:'Chef de Clan',      em:'👑',cat:'🤍 Care & Famille',niv:'N4'},
  {id:'BQ1',nm:'Citoyen Familial',  em:'🏛️',cat:'🏛️ Conseil',      niv:'N1'},
  {id:'BQ2',nm:'Voix au Chapitre',  em:'🗳️',cat:'🏛️ Conseil',      niv:'N2'},
  {id:'BQ3',nm:'Animateur',         em:'🎙️',cat:'🏛️ Conseil',      niv:'N3'},
  {id:'BQ4',nm:'Législateur',       em:'⚖️',cat:'🏛️ Conseil',      niv:'N4'},
];

const SEED_DAILY_SECTIONS = [
  { id: 'lever',   label: 'En me levant',          em: '🌅' },
  { id: 'matin',   label: 'Le matin',              em: '☀️' },
  { id: 'midi',    label: 'En rentrant à midi',    em: '🏠' },
  { id: 'diner',   label: 'Au dîner',              em: '🍽️' },
  { id: 'aprem',   label: "L'après-midi",          em: '⛅' },
  { id: 'retour-aprem', label: "En rentrant l'après-midi", em: '🎒' },
  { id: 'soir',    label: 'En rentrant le soir',   em: '🌆' },
  { id: 'souper',  label: 'Au souper',             em: '🥘' },
  { id: 'coucher', label: "Avant d'aller au lit",  em: '🌙' },
];

const SEED_DAILY = [
  {id:'dt8', em:'🛏️',lbl:'Faire son lit',                      always:true, section:'lever'},
  {id:'dt6', em:'🦷',lbl:'Brosser les dents — matin',          always:true, section:'lever'},
  {id:'dt3', em:'👔',lbl:'Plier et ranger mes habits du jour', always:true, section:'matin'},
  {id:'dt5', em:'👟',lbl:'Ranger veste et chaussures au gankan',always:true, section:'matin'},
  {id:'dt2', em:'🥄',lbl:'Mettre la table',                    always:true, section:'diner'},
  {id:'dt1', em:'🍽️',lbl:'Débarrasser la table',               always:true, section:'souper'},
  {id:'dt10',em:'📚',lbl:'Faire mes devoirs',                  always:true, section:'aprem'},
  {id:'dt9', em:'🚿',lbl:'Douche',                             days:[0,3],  section:'aprem'},
  {id:'dt4', em:'🧺',lbl:"Mettre au sale ce qui doit y aller", always:true, section:'soir'},
  {id:'dt7', em:'🦷',lbl:'Brosser les dents — soir',           always:true, section:'coucher'},
  {id:'dt11',em:'💬',lbl:'Moment parole du soir',              always:true, section:'coucher',passive:true},
];

const DIFF_BY_NIV = { N1: 1, N2: 2, N3: 3, N4: 4 };
