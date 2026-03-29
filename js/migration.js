// ══════════════════════════════════════════════
// V4 DATA LAYER — Migration & Patches
// Depends on: js/data.js (global constants)
// ══════════════════════════════════════════════

function migrateV3toV4() {
  const raw = localStorage.getItem('mh_v3');
  const v3 = raw ? JSON.parse(raw) : null;

  // Build catalog.categories from SEED_CAT constant
  const categories = Object.entries(SEED_CAT).map(([label, color]) => ({
    id: CAT_ID_MAP[label], label, color
  }));

  // Build catalog.missions from SEED_MISSIONS constant
  const missions = SEED_MISSIONS.map(m => {
    const o = {
      id: m.id, cat: CAT_ID_MAP[m.cat], nom: m.nom, niv: m.niv,
      chf: m.chf, diff: m.diff || DIFF_BY_NIV[m.niv] || 1,
      secret: m.secret ? CAT_ID_MAP[m.secret] : null,
      description: '', recurrence: { type: 'once' }
    };
    return o;
  });

  // Build catalog.dailyTasks from SEED_DAILY constant
  const dailyTasks = SEED_DAILY.map(t => ({
    id: t.id, em: t.em, lbl: t.lbl,
    days: t.always ? null : (t.days || null),
    passive: !!t.passive,
    description: ''
  }));

  // Build catalog.badges from SEED_BADGES constant
  const badges = SEED_BADGES.map(b => ({
    id: b.id, nm: b.nm, em: b.em, img: null,
    catId: CAT_ID_MAP[b.cat], nivId: b.niv
  }));

  // Build Louis levels from SEED_LEVELS + gateway missions + v3 thresholds
  const v3cfg = v3 ? v3.cfg : {};
  const v3thresholds = v3cfg.thresholds || {};
  const gatewayByNiv = {};
  SEED_MISSIONS.forEach(m => { if (m.gateway) gatewayByNiv[m.niv] = m.id; });
  const levels = SEED_LEVELS.map(l => ({
    id: l.id, label: l.label, emoji: l.emoji,
    color: CSS_TO_HEX[l.color] || l.color, bg: CSS_TO_HEX[l.bg] || l.bg,
    seuil: v3thresholds[l.id] !== undefined ? v3thresholds[l.id] : l.seuil,
    gatewayMission: gatewayByNiv[l.id] || null
  }));

  // Build Louis overrides from v3 mCHF + mActive
  const mCHFmap = v3cfg.mCHF || {};
  const mActiveMap = v3cfg.mActive || {};
  const overrides = {};
  Object.entries(mCHFmap).forEach(([id, chf]) => { overrides[id] = { chf }; });
  const exclude = Object.entries(mActiveMap)
    .filter(([id, active]) => active === false).map(([id]) => id);

  // Build Louis state from v3
  const v3louis = v3 ? v3.ch.louis : {};
  const louisState = {
    missionStates: v3louis.m || {},
    daily: v3louis.daily || {},
    weeklyRec: v3louis.weeklyRec || {}
  };

  const mkEmptyChild = (name, age, emoji, theme) => ({
    name, age, emoji, active: false, theme: theme || 'theme-louis',
    levels: [],
    missions: { include: '*', exclude: [], overrides: {}, extra: [] },
    dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
    state: { missionStates: {}, daily: {}, weeklyRec: {} }
  });

  return {
    version: 4,
    pin: v3 ? v3.pin : '1234',
    catalog: { categories, missions, dailyTasks, badges },
    children: {
      louis: {
        name: 'Louis', age: 10, emoji: '⚡', active: true, theme: 'theme-louis',
        levels,
        missions: { include: '*', exclude, overrides, extra: [] },
        dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
        state: louisState
      },
      emile: mkEmptyChild('Émile', 8, '🌟', 'theme-emile'),
      marius: mkEmptyChild('Marius', 4, '🦁', 'theme-marius')
    },
    cfg: {
      malus: v3cfg.malus ?? 0.10,
      bonus: v3cfg.bonus ?? 0.20,
      streakBonus: v3cfg.streakBonus ?? 1,
      streakDays: 7
    }
  };
}

// ══════════════════════════════════════════════
// ONE-SHOT PATCHES (versioned)
// ══════════════════════════════════════════════

function applyPatches(S) {
  const pv = S.patchVersion || 0;

  if (pv < 1) {
    // Patch catalog: update Budget missions, add diff, remove M34
    const cm = S.catalog.missions;
    const m23 = cm.find(m => m.id === 'M23');
    if (m23 && m23.niv !== 'N2') { m23.niv = 'N2'; m23.nom = 'Tenir son budget 4 semaines consécutives sans oubli'; }
    const m42 = cm.find(m => m.id === 'M42');
    if (m42 && m42.niv !== 'N3') { m42.niv = 'N3'; m42.nom = "Présenter son bilan de 4 semaines à l'oral (tendances + décisions)"; }
    const i34 = cm.findIndex(m => m.id === 'M34');
    if (i34 !== -1) cm.splice(i34, 1);
    cm.forEach(m => { if (m.diff === undefined) m.diff = ({N1:1,N2:2,N3:3,N4:4})[m.niv] || 1; });

    // Update gateway assignments on levels
    Object.keys(S.children).forEach(cid => {
      const lvls = S.children[cid].levels;
      if (!lvls) return;
      lvls.forEach(l => {
        if (l.id === 'N3' && l.gatewayMission !== 'M42') l.gatewayMission = 'M42';
        if (l.id === 'N4' && l.gatewayMission) l.gatewayMission = null;
      });
    });

    // Add theme field if missing
    if (S.children.louis && !S.children.louis.theme) S.children.louis.theme = 'theme-louis';
    if (S.children.emile && !S.children.emile.theme) S.children.emile.theme = 'theme-emile';
    if (S.children.marius && !S.children.marius.theme) S.children.marius.theme = 'theme-marius';

    S.patchVersion = 1;
  }

  if (pv < 2) {
    // Split emoji from category labels into dedicated 'em' field
    S.catalog.categories.forEach(cat => {
      if (cat.em) return; // already migrated
      const match = cat.label.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
      if (match) {
        cat.em = match[1];
        cat.label = cat.label.slice(match[0].length);
      } else {
        cat.em = '🏷️';
      }
    });
    S.patchVersion = 2;
  }

  if (pv < 3) {
    // Add daily sections catalog
    if (!S.catalog.dailySections) {
      S.catalog.dailySections = SEED_DAILY_SECTIONS.map(s => ({ ...s }));
    }
    // Assign default section to existing tasks
    const sectionMap = {
      dt8: 'lever', dt6: 'lever',
      dt3: 'matin', dt5: 'matin',
      dt2: 'diner',
      dt10: 'aprem', dt9: 'aprem',
      dt4: 'soir',
      dt1: 'souper',
      dt7: 'coucher', dt11: 'coucher',
    };
    S.catalog.dailyTasks.forEach(t => {
      if (!t.section) t.section = sectionMap[t.id] || null;
    });
    S.patchVersion = 3;
  }

  if (pv < 4) {
    // Add missing "En rentrant l'après-midi" section
    const ds = S.catalog.dailySections || [];
    if (!ds.find(s => s.id === 'retour-aprem')) {
      const apremIdx = ds.findIndex(s => s.id === 'aprem');
      const newSec = { id: 'retour-aprem', label: "En rentrant l'après-midi", em: '🎒' };
      if (apremIdx >= 0) ds.splice(apremIdx + 1, 0, newSec);
      else ds.push(newSec);
    }
    S.patchVersion = 4;
  }

  if (pv < 5) {
    // Migrate static themes to simplified model (principal + accent)
    if (!S.catalog.themes) {
      S.catalog.themes = [
        { id: 'theme-louis',  label: 'Techno Bleu',     principal: '#00cfff', accent: '#ff3d7f', fontTitle: "'Share Tech Mono', monospace", fontBody: "'Josefin Sans', sans-serif" },
        { id: 'theme-emile',  label: 'Aventure Orange',  principal: '#ff9a40', accent: '#ff3d7f', fontTitle: "'Righteous', sans-serif",      fontBody: "'Nunito', sans-serif" },
        { id: 'theme-marius', label: 'Ferme Verte',      principal: '#8de84a', accent: '#ff3d7f', fontTitle: "'Baloo 2', sans-serif",        fontBody: "'Patrick Hand', sans-serif" },
      ];
    }
    if (S.cfg.fontSize === undefined) S.cfg.fontSize = 1.0;
    if (!S.cfg.statusColors) S.cfg.statusColors = { success: '#00e676', danger: '#ff3d7f', warning: '#ffb300' };
    S.patchVersion = 5;
  }

  if (pv < 6) {
    // Migrate old theme format (colors object) to simplified (principal + accent)
    (S.catalog.themes || []).forEach(th => {
      if (th.colors && !th.principal) {
        th.principal = th.colors.hi || '#00cfff';
        th.accent = th.colors.acc || '#ff3d7f';
        delete th.colors;
        delete th.bar;
      }
    });
    S.patchVersion = 6;
  }

  if (pv < 7) {
    // Migrate secret missions: link badge → mission via secretMissionId
    const nivOrder = ['N1','N2','N3','N4'];
    S.catalog.badges.forEach(b => { if (b.secretMissionId === undefined) b.secretMissionId = null; });
    S.catalog.missions.forEach(m => {
      if (!m.secret) return;
      // Find badge with same category, closest level ≤ mission level
      const mNivIdx = nivOrder.indexOf(m.niv);
      const candidates = S.catalog.badges.filter(b => b.catId === m.secret);
      let best = null;
      candidates.forEach(b => {
        const bIdx = nivOrder.indexOf(b.nivId);
        if (bIdx <= mNivIdx && (!best || bIdx > nivOrder.indexOf(best.nivId))) best = b;
      });
      if (!best && candidates.length) best = candidates[0];
      if (best) best.secretMissionId = m.id;
      delete m.secret;
    });
    S.patchVersion = 7;
  }

  if (pv < 8) {
    // Add nombre field to recurrence
    S.catalog.missions.forEach(m => {
      if (!m.recurrence) m.recurrence = { type: 'once' };
      if (m.recurrence.nombre === undefined) m.recurrence.nombre = 0;
    });
    S.patchVersion = 8;
  }

  if (pv < 9) {
    // Clean up corrupted overrides (keys with undefined/null values)
    Object.keys(S.children).forEach(cid => {
      const ovs = S.children[cid]?.missions?.overrides;
      if (!ovs) return;
      Object.keys(ovs).forEach(mid => {
        Object.keys(ovs[mid]).forEach(k => {
          if (ovs[mid][k] === undefined || ovs[mid][k] === null) delete ovs[mid][k];
        });
        if (Object.keys(ovs[mid]).length === 0) delete ovs[mid];
      });
    });
    S.patchVersion = 9;
  }

  if (pv < 10) {
    // Add baseN1 per child, remove CHF overrides (now computed dynamically)
    Object.keys(S.children).forEach(cid => {
      if (S.children[cid].baseN1 === undefined) S.children[cid].baseN1 = 1.0;
      const ovs = S.children[cid]?.missions?.overrides;
      if (ovs) Object.keys(ovs).forEach(mid => {
        delete ovs[mid].chf;
        if (Object.keys(ovs[mid]).length === 0) delete ovs[mid];
      });
    });
    S.patchVersion = 10;
  }

  if (pv < 11) {
    // Add seuilPct per child for auto-computed level thresholds
    Object.keys(S.children).forEach(cid => {
      if (S.children[cid].seuilPct === undefined) S.children[cid].seuilPct = 0.8;
    });
    S.patchVersion = 11;
  }
  if (S.patchVersion < 12) {
    Object.keys(S.children).forEach(cid => {
      if (S.children[cid].secretBonus === undefined) S.children[cid].secretBonus = 1;
    });
    delete S.cfg.secretBonus;
    S.patchVersion = 12;
  }
  if (S.patchVersion < 13) {
    Object.keys(S.children).forEach(cid => {
      if (S.children[cid].state.streakBonusBank === undefined)
        S.children[cid].state.streakBonusBank = 0;
    });
    S.patchVersion = 13;
  }
  if (S.patchVersion < 14) {
    if (S.cfg.streakPct === undefined) S.cfg.streakPct = 0.8;
    S.patchVersion = 14;
  }
}
