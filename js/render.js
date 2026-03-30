// ══════════════════════════════════════════════
// RENDER — UI rendering functions
// Depends on: state.js (S, getChildList, getChild, getLevels, getMissions,
//             getDailyTasks, missionNiv, getCatColor, getCatLabel, totalE,
//             curLvl, prog, streak, isLvlOk, isGatewayDone, isMOk, isSecretOk,
//             earnedBadges, isSecret, calcBal, getDR, isApplicable)
//             helpers.js (todayKey, escHtml)
// ══════════════════════════════════════════════

// ── Global render state ──
let AC = 'louis';
const ST = {};
function initRenderState() {
  getChildList().forEach(ch => { if (!ST[ch.id]) ST[ch.id] = 'daily'; });
}

// ── Detail expand state (child view) ──
let EXPANDED_MISSION = null;
let EXPANDED_DAILY = null;
function toggleDetail(type, id) {
  if (type === 'mission') EXPANDED_MISSION = (EXPANDED_MISSION === id) ? null : id;
  else if (type === 'daily') EXPANDED_DAILY = (EXPANDED_DAILY === id) ? null : id;
  render();
}

// ── Accordion state ──
const ACC = {};

function initAcc(cid) {
  if (!ACC[cid]) {
    ACC[cid] = {};
    const lvls = getLevels(cid);
    lvls.forEach((l, i) => ACC[cid][l.id] = i === 0);
  }
}

function toggleAcc(cid, nid) {
  initAcc(cid);
  ACC[cid][nid] = !ACC[cid][nid];
  render();
}

// ── Theme palettes ──
const THEME_PALETTE = {
  'theme-louis':  { hi: '#00cfff', card: '#0d1422', brd: '#0a2040', dim: '#0a1828', muted: '#2a5070' },
  'theme-emile':  { hi: '#ff9a40', card: '#331608', brd: '#4a2010', dim: '#1e0e06', muted: '#6a3a20' },
  'theme-marius': { hi: '#8de84a', card: '#182610', brd: '#2a5018', dim: '#0e1a08', muted: '#3a6020' },
};

function childPalette(cid) {
  return THEME_PALETTE[S.children[cid]?.theme] || THEME_PALETTE['theme-louis'];
}

function childColor(cid) { return childPalette(cid).hi; }

function levelBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 0.08;
  return '#' + [Math.round(r * f), Math.round(g * f), Math.round(b * f)]
    .map(v => v.toString(16).padStart(2, '0')).join('');
}

// ── Color derivation ──
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0, s = 0, l = (max+min)/2;
  if (d > 0) {
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) h = ((g-b)/d + (g<b?6:0))/6;
    else if (max===g) h = ((b-r)/d+2)/6;
    else h = ((r-g)/d+4)/6;
  }
  return [h*360, s*100, l*100];
}
function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k=(n+h*12)%12; return l - a*Math.max(Math.min(k-3, 9-k, 1), -1); };
  return '#' + [f(0),f(8),f(4)].map(v => Math.round(v*255).toString(16).padStart(2,'0')).join('');
}

function deriveThemeColors(principal, accent) {
  const [h, s] = hexToHsl(principal);
  return {
    hi:   principal,
    hi2:  hslToHex(h, Math.min(s, 80), 50),
    hi3:  hslToHex(h, Math.min(s, 60), 75),
    acc:  accent,
    gold: principal,
    bg:   hslToHex(h, Math.min(s, 30), 3),
    surf: hslToHex(h, Math.min(s, 30), 5),
    card: hslToHex(h, Math.min(s, 25), 8),
    brd:  hslToHex(h, Math.min(s, 30), 13),
    brd2: hslToHex(h, Math.min(s, 35), 22),
    dim:  hslToHex(h, Math.min(s, 25), 5),
    text: hslToHex(h, Math.min(s, 40), 85),
    muted:hslToHex(h, Math.min(s, 30), 33),
  };
}

function deriveBar(principal) {
  const [h, s] = hexToHsl(principal);
  const dark = hslToHex(h, Math.min(s, 70), 28);
  const mid  = hslToHex(h, Math.min(s, 85), 50);
  return `linear-gradient(90deg,${dark},${mid},${principal})`;
}

function applyTheme(cid) {
  const themeId = S.children[cid]?.theme || 'theme-louis';
  const theme = (S.catalog.themes || []).find(t => t.id === themeId);
  const root = document.documentElement;
  const app = document.getElementById('app');
  app.className = themeId;
  if (!theme) return;

  // All vars on :root so they cascade to #app, #backoffice, modals, toasts
  const colors = deriveThemeColors(theme.principal, theme.accent);
  Object.entries(colors).forEach(([k, v]) => root.style.setProperty('--' + k, v));

  const gc = S.cfg.statusColors || {};
  root.style.setProperty('--success', gc.success || '#00e676');
  root.style.setProperty('--danger',  gc.danger  || '#ff3d7f');
  root.style.setProperty('--warning', gc.warning || '#ffb300');

  root.style.setProperty('--font-title', theme.fontTitle);
  root.style.setProperty('--font-body', theme.fontBody);
  root.style.setProperty('--bar', deriveBar(theme.principal));

  const mult = S.cfg.fontSize || 1.0;
  const sizes = { 'fs-hero':40, 'fs-xxl':24, 'fs-xl':18, 'fs-lg':15, 'fs-base':13, 'fs-sm':11, 'fs-xs':10 };
  Object.entries(sizes).forEach(([k, v]) => {
    root.style.setProperty('--' + k, Math.round(v * mult) + 'px');
  });
  root.style.setProperty('font-size', Math.round(19 * mult) + 'px');
}

// ── Main render ──
function render() {
  applyTheme(AC);
  renderTabs();
  renderStatsBar();
  renderBottomNav();
  renderSidebar();
  renderProfiles();
}

// ── Child tabs (top bar) ──
function renderTabs() {
  const children = getChildList();
  document.getElementById('child-tabs').innerHTML = children.map(ch => {
    const p = childPalette(ch.id);
    const isAct = ch.id === AC;
    const chf = ch.active ? totalE(ch.id).toFixed(2) + ' CHF' : '';
    return `<div class="ctab-wrap" onclick="selChild('${ch.id}')">
      <span class="ctab-nm" style="color:${isAct ? p.hi : p.muted}">${escHtml(ch.name)}</span>
      <div class="ctab ${isAct ? 'active' : ''}" style="background:${isAct ? p.dim : p.card};border-color:${isAct ? p.hi : p.brd};${isAct ? 'box-shadow:0 0 14px ' + p.hi + '40,0 0 0 3px ' + p.hi + '18' : ''}">
        <span class="ctab-em">${ch.emoji}</span>
      </div>
      <span class="ctab-chf" style="color:${p.hi}">${chf || '&nbsp;'}</span>
    </div>`;
  }).join('') + (() => {
    const boThemeId = S.cfg.boTheme || 'theme-louis';
    const boTh = (S.catalog.themes || []).find(t => t.id === boThemeId);
    const bp = boTh ? deriveThemeColors(boTh.principal, boTh.accent) : { hi: '#ffb300', card: '#1a1408', brd: '#3a2a10', dim: '#120e06', muted: '#6a5030' };
    return `<div class="ctab-wrap" onclick="openAdmin()">
      <span class="ctab-nm" style="color:${bp.hi}">Admin</span>
      <div id="admin-round" style="background:${bp.dim};border-color:${bp.brd}">
        <span class="ar-em">⚙️</span>
      </div>
      <span class="ctab-chf">&nbsp;</span>
    </div>`;
  })();
}

// ── Stats bar ──
function renderStatsBar() {
  const ch = getChild(AC);
  if (!ch || !ch.active || !getLevels(AC).length) {
    document.getElementById('stats-bar').style.display = 'none';
    return;
  }
  document.getElementById('stats-bar').style.display = '';
  const e = totalE(AC), lvl = curLvl(AC), pr = prog(AC), strk = streak(AC);
  document.getElementById('sb-chf').textContent = e.toFixed(2);
  const lvlEl = document.getElementById('sb-lvl');
  lvlEl.textContent = lvl.label;
  lvlEl.style.color = lvl.color;
  document.getElementById('sb-bar').style.width = pr.pct + '%';
  document.getElementById('sb-pct').textContent = pr.pct + '%';
  const nextEl = document.getElementById('sb-next');
  if (pr.next) {
    nextEl.textContent = pr.label;
    nextEl.style.color = pr.next.color;
  } else {
    nextEl.textContent = pr.label;
    nextEl.style.color = lvl.color;
  }
  document.getElementById('sb-streak').textContent = strk + '🔥';
}

// ── Bottom navigation (mobile) ──
function renderBottomNav() {
  const ch = getChild(AC);
  if (!ch || !ch.active) {
    document.getElementById('bottom-nav').style.display = 'none';
    return;
  }
  document.getElementById('bottom-nav').style.display = '';
  const tab = ST[AC] || 'missions';
  const sections = [
    { id: 'daily', em: '📅', lbl: 'Tâches' },
    { id: 'missions', em: '📋', lbl: 'Missions' },
    { id: 'badges', em: '🏅', lbl: 'Badges' },
  ];
  document.getElementById('bottom-nav').innerHTML = sections.map(s => `
    <div class="bnav-wrap" onclick="selSub('${AC}','${s.id}')">
      <span class="bnav-lbl ${tab === s.id ? 'active' : ''}">${s.lbl}</span>
      <div class="bnav-btn ${tab === s.id ? 'active' : ''}">
        <span class="bnav-em">${s.em}</span>
      </div>
    </div>
  `).join('');
}

// ── Sidebar (desktop) ──
function renderSidebar() {
  const children = getChildList();
  const tab = ST[AC] || 'missions';
  document.getElementById('sidebar-children').innerHTML = children.map(ch => {
    const p = childPalette(ch.id);
    const isAct = ch.id === AC;
    return `<div class="side-child ${isAct ? 'active' : ''}" onclick="selChild('${ch.id}')" style="background:${isAct ? p.dim : 'transparent'};border-left-color:${isAct ? p.hi : 'transparent'}">
      <span class="side-child-em">${ch.emoji}</span>
      <span class="side-child-nm" style="color:${isAct ? p.hi : p.muted}">${escHtml(ch.name)}</span>
      <span class="side-child-chf" style="color:${p.hi}">${ch.active ? totalE(ch.id).toFixed(2) : ''}</span>
    </div>`;
  }).join('');
  const sections = [
    { id: 'daily', em: '📅', lbl: 'Tâches' },
    { id: 'missions', em: '📋', lbl: 'Missions' },
    { id: 'badges', em: '🏅', lbl: 'Badges' },
  ];
  document.getElementById('sidebar-sections').innerHTML = sections.map(s => `
    <div class="side-section ${tab === s.id ? 'active' : ''}" onclick="selSub('${AC}','${s.id}')">
      <span class="side-section-em">${s.em}</span>
      <span class="side-section-lbl">${s.lbl}</span>
    </div>
  `).join('');
}

// ── Profile panes (OPTIMIZED: only render active tab) ──
function renderProfiles() {
  const ch = getChild(AC);
  if (!ch) return;
  if (!ch.active) {
    document.getElementById('main').innerHTML = `
      <div class="tab-pane active">
        <div class="soon">
          <div class="soon-em">${ch.emoji}</div>
          <div class="soon-nm">${escHtml(ch.name).toUpperCase()}</div>
          <div style="font-size:var(--fs-lg);color:var(--text);margin-top:12px">Les missions de ${escHtml(ch.name)} arrivent bientôt !</div>
          <div class="soon-pill">🔜 En préparation</div>
        </div>
      </div>`;
    return;
  }
  if (!ST[AC]) ST[AC] = 'missions';
  const tab = ST[AC];
  let paneHtml = '';
  if (tab === 'missions') paneHtml = rMissions(AC);
  else if (tab === 'daily') paneHtml = rDaily(AC);
  else if (tab === 'badges') paneHtml = rBadges(AC);
  document.getElementById('main').innerHTML = '<div class="tab-pane active">' + paneHtml + '</div>';
}

// ── Missions pane ──
function rMissions(cid) {
  initAcc(cid);
  const lvls = getLevels(cid);
  const ms = getMissions(cid);
  const st = S.children[cid].state;
  return lvls.map(lvl => {
    const ok = isLvlOk(cid, lvl.id);
    const lms = ms.filter(m => missionNiv(cid, m) === lvl.id);
    const done = lms.filter(m => st.missionStates[m.id] === 'done').length;
    const base = lms.filter(m => !isSecret(m));
    const secUnlocked = lms.filter(m => isSecret(m) && isSecretOk(cid, m));
    const isOpen = ACC[cid][lvl.id];
    const gwDone = !lvl.gatewayMission || st.missionStates[lvl.gatewayMission] === 'done';
    const locked = !ok;
    let pill;
    if (!ok) {
      pill = `🔒 ${chf(lvl.seuil)} CHF requis ${tipBtn('Ce niveau est verrouillé — gagne encore des CHF pour l\'ouvrir')}`;
    } else if (!gwDone) {
      pill = `💰 Seuil atteint · 🔑 Mission clé requise`;
    } else {
      pill = `${done}/${base.length} ✓${secUnlocked.length ? ' +' + secUnlocked.length + '🔮' : ''}`;
    }

    const gwM = lvl.gatewayMission && st.missionStates[lvl.gatewayMission] !== 'done'
      ? ms.find(m => m.id === lvl.gatewayMission) : null;
    const gwHtml = gwM && ok
      ? `<div class="ms-banner">🔑&nbsp;<strong>Clé du niveau :</strong> ${escHtml(gwM.nom)} ${tipBtn('Mission clé : à compléter avant d\'accéder aux autres missions de ce niveau')}</div>` : '';

    // Group visible missions by category (hide secrets without badge)
    const visibleMs = [...base, ...secUnlocked];
    const catGroups = {};
    visibleMs.forEach(m => {
      if (!catGroups[m.cat]) catGroups[m.cat] = [];
      catGroups[m.cat].push(m);
    });

    function mCard(m) {
      const status = st.missionStates[m.id] || 'none';
      const canAccess = isMOk(cid, m);
      const isDone = status === 'done';
      const isPend = status === 'pending';
      const isLock = !canAccess;
      const isExpanded = EXPANDED_MISSION === m.id;
      const isFull = !isDone && !isPend && !isLock && recurrenceSlotsFull(m);
      let check = '', actionClick = '';
      if (isLock)       { check = '🔒'; }
      else if (isDone)  { check = '✓'; actionClick = `onclick="event.stopPropagation();openPin('${cid}','${m.id}','redo_mission')"`; }
      else if (isPend)  { check = '⏳'; actionClick = `onclick="event.stopPropagation();openPin('${cid}','${m.id}','validate')"`; }
      else if (isFull)  { check = '✗'; }
      else              { check = ''; actionClick = `onclick="event.stopPropagation();markPending('${cid}','${m.id}')"`; }

      const msTag = lvl.gatewayMission === m.id ? '<span class="tag tag-ms">🔑 Gateway</span>' : '';
      const secTag = isSecret(m) ? '<span class="tag tag-sec">🔮 Secrète</span>' : '';
      const stars = '<span class="m-stars">' + '⭐'.repeat(missionDiff(cid, m)) + '</span>';
      const metaItems = [stars, secTag, msTag].filter(Boolean);
      let mTip = '';
      if (isLock) mTip = tipBtn('Mission verrouillée — niveau ou mission clé requis');
      else if (isDone) mTip = tipBtn('Mission validée et payée !');
      else if (isPend) mTip = tipBtn('En attente de validation par un parent (code PIN)');
      else if (isFull) mTip = tipBtn('Limite de récurrence atteinte pour cette période');
      else mTip = tipBtn('Appuie sur la case pour signaler que c\'est fait');
      const desc = m.description ? escHtml(m.description) : '';
      const detailHtml = isExpanded && desc ? `<div style="width:100%;padding:8px 0 4px;border-top:1px solid var(--brd);margin-top:6px;font-size:var(--fs-base);font-style:italic;line-height:1.5;color:var(--text)">${desc}</div>` : '';

      return `<div class="d-card ${isDone ? 'checked' : ''} ${isPend ? 'pend' : ''} ${isLock || isFull ? 'na' : ''}" onclick="toggleDetail('mission','${m.id}')" style="border-radius:10px;margin-bottom:4px;cursor:pointer;flex-wrap:wrap">
        <div class="d-check" ${actionClick}>${check}</div>
        ${mTip}
        <div style="flex:1;min-width:0">
          <div class="m-name">${escHtml(m.nom).replace('[🔮] ', '')}</div>
          <div class="m-meta">${metaItems.join('')}</div>
        </div>
        <div class="m-chf" ${actionClick}>+${chf(missionChf(cid, m))}</div>
        ${detailHtml}
      </div>`;
    }

    const cards = Object.entries(catGroups).map(([catId, catMissions]) => {
      const color = getCatColor(catId);
      return `<div style="margin-bottom:8px">
        <div style="font-size:var(--fs-sm);font-weight:700;color:${color};padding:6px 4px 4px;display:flex;align-items:center;gap:5px">
          <span style="width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 4px ${color}"></span>
          ${getCatLabel(catId)}
        </div>
        ${catMissions.map(m => mCard(m)).join('')}
      </div>`;
    }).join('');

    return `<div class="acc-level ${isOpen ? 'open' : ''} ${locked ? 'locked' : ''}" style="border-color:${lvl.color}30">
      <div class="acc-hdr" onclick="toggleAcc('${cid}','${lvl.id}')" style="background:${lvl.color}12;border-left:3px solid ${lvl.color}">
        <div class="acc-dot" style="background:${lvl.color}"></div>
        <div class="acc-title" style="color:${lvl.color}">${lvl.emoji} ${lvl.id} · ${lvl.label}</div>
        <div class="acc-pill">${pill}</div>
        <div class="acc-chevron">▼</div>
      </div>
      <div class="acc-body" style="background:${lvl.color}08">
        ${gwHtml}
        ${cards}
      </div>
    </div>`;
  }).join('');
}

// ── Daily tasks pane ──
function rDailyCard(cid, t, dk, rec) {
  const app = isApplicable(t);
  const raw = rec.tasks[t.id];
  if (t.passive) {
    const ch = raw === true || raw === 'done';
    return `<div class="d-card ${ch ? 'checked' : ''}" onclick="togglePassive('${cid}','${t.id}','${dk}')" style="border-top:2px dashed var(--brd2)">
      <div class="d-check" style="${ch ? '' : 'border-style:dashed'}">${ch ? '💬' : ''}</div>
      ${tipBtn(ch ? 'Parole partagée aujourd\'hui !' : 'Moment libre — coche si tu as partagé ta journée. Ça ne change pas ton argent.')}
      <div class="d-label">${t.em} ${escHtml(t.lbl)} <span style="font-size:var(--fs-xs);color:#b388ff">(libre)</span></div>
    </div>`;
  }
  const status = app ? (typeof raw === 'boolean' ? (raw ? 'done' : 'none') : (raw || 'none')) : 'na';
  const isDone = status === 'done';
  const isPend = status === 'pending';
  const isNa = !app;
  const isExpanded = EXPANDED_DAILY === t.id;
  let check = '', actionClick = '';
  if (isDone)      { check = '✓'; actionClick = `onclick="event.stopPropagation();openPin('${cid}','DAILY_${t.id}_${dk}','redo_daily')"`; }
  else if (isPend) { check = '⏳'; actionClick = `onclick="event.stopPropagation();openPin('${cid}','DAILY_${t.id}_${dk}','daily')"`; }
  else if (!isNa)  { actionClick = `onclick="event.stopPropagation();dailyAction('${cid}','${t.id}','${dk}')"`; }

  const desc = t.description ? escHtml(t.description) : '';
  const detailHtml = isExpanded && desc ? `<div style="width:100%;padding:8px 0 4px;border-top:1px solid var(--brd);margin-top:6px;font-size:var(--fs-base);font-style:italic;line-height:1.5;color:var(--text)">${desc}</div>` : '';

  let dTip = '';
  if (isNa) dTip = tipBtn('Tâche non applicable aujourd\'hui');
  else if (isDone) dTip = tipBtn('Tâche validée par un parent');
  else if (isPend) dTip = tipBtn('En attente de validation parent (code PIN)');
  else dTip = tipBtn('Appuie sur la case quand c\'est fait — un parent validera');

  return `<div class="d-card ${isDone ? 'checked' : ''} ${isPend ? 'pend' : ''} ${isNa ? 'na' : ''}" onclick="toggleDetail('daily','${t.id}')" style="cursor:pointer;flex-wrap:wrap">
    <div class="d-check" ${actionClick}>${check}</div>
    ${dTip}
    <div class="d-label">${t.em} ${escHtml(t.lbl)}</div>
    ${detailHtml}
  </div>`;
}

function rDaily(cid) {
  const dk = todayKey();
  const rec = getDR(cid, dk);
  const strk = streak(cid);
  const nextStreak = (S.cfg.streakDays || 7) - (strk % (S.cfg.streakDays || 7));
  const tasks = getDailyTasks(cid);
  const sections = S.catalog.dailySections || [];

  // Group tasks by section
  const grouped = {};
  sections.forEach(s => grouped[s.id] = []);
  grouped['__other'] = [];
  tasks.forEach(t => {
    const sid = t.section || '__other';
    if (grouped[sid]) grouped[sid].push(t);
    else grouped['__other'].push(t);
  });

  // Render sections (skip empty ones)
  let sectionsHtml = '';
  sections.forEach(s => {
    const sectionTasks = grouped[s.id];
    if (!sectionTasks || !sectionTasks.length) return;
    // Check if all tasks in section are non-applicable today
    const anyApplicable = sectionTasks.some(t => isApplicable(t) || t.passive);
    if (!anyApplicable) return;
    const cards = sectionTasks.map(t => rDailyCard(cid, t, dk, rec)).join('');
    sectionsHtml += `
      <div class="daily-group">
        <div class="dg-title">${s.em} ${escHtml(s.label).toUpperCase()}</div>
        <div class="daily-cards">${cards}</div>
      </div>`;
  });
  // Ungrouped tasks
  if (grouped['__other'].length) {
    const cards = grouped['__other'].map(t => rDailyCard(cid, t, dk, rec)).join('');
    sectionsHtml += `
      <div class="daily-group">
        <div class="dg-title">📌 AUTRES</div>
        <div class="daily-cards">${cards}</div>
      </div>`;
  }

  return `
    <div class="streak-card">
      <div>
        <div class="streak-big">${strk}</div>
      </div>
      <div class="streak-right">
        <div class="streak-lbl">jours parfaits consécutifs ${tipBtn(`${S.cfg.streakDays || 7} jours = +${chf(S.cfg.streakBonus)} CHF bonus`)}</div>
        <div style="margin-top:6px">
          <div class="sb-prog-track"><div class="sb-prog-fill" style="width:${(strk % (S.cfg.streakDays || 7)) / (S.cfg.streakDays || 7) * 100}%"></div></div>
        </div>
        <div style="font-size:var(--fs-sm);color:var(--hi3);margin-top:4px;font-weight:700">Dans ${nextStreak} jour${nextStreak > 1 ? 's' : ''} → +${chf(S.cfg.streakBonus)} CHF 🔥</div>
      </div>
    </div>
    ${sectionsHtml}
    <div style="font-size:var(--fs-sm);color:var(--muted);padding:8px;text-align:center">${rec.parentValidated ? '✅ Validé par parent' : '⏳ En attente de validation parent'} ${tipBtn(rec.parentValidated ? 'Un parent a confirmé les tâches de cette journée' : 'Cette journée attend encore la validation d\'un parent')}</div>`;
}

// ── Badges pane ──
function rBadges(cid) {
  const eb = earnedBadges(cid);
  const cats = [...new Set(S.catalog.badges.map(b => b.catId))];
  return cats.map(catId => {
    const cb = S.catalog.badges.filter(b => b.catId === catId);
    const cnt = cb.filter(b => eb.includes(b.id)).length;
    return `<div class="badge-cat-title"><span>${getCatLabel(catId)} · ${cnt}/${cb.length}</span></div>
    <div class="badges-grid">${cb.map(b => {
      const ok = eb.includes(b.id);
      const imgHtml = b.img
        ? `<img src="${b.img}" alt="${escHtml(b.nm)}" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="b-em" style="display:none">${b.em}</span>`
        : `<span class="b-em">${b.em}</span>`;
      const nivTag = `<div style="font-size:var(--fs-xs);color:var(--muted)">${escHtml(b.nivId)}</div>`;
      let secInfo = '';
      if (b.secretMissionId) {
        const sm = S.catalog.missions.find(m => m.id === b.secretMissionId);
        secInfo = ok
          ? `<div style="font-size:var(--fs-xs);color:var(--acc)">🔮 ${sm ? escHtml(sm.nom).replace('[🔮] ','') : 'Secret'}</div>`
          : `<div style="font-size:var(--fs-xs);color:var(--muted)">🔮 Secret à découvrir</div>`;
      }
      const badgeTip = ok
        ? tipBtn('Badge gagné ! Il débloque la mission secrète de cette catégorie.')
        : tipBtn('Pour gagner ce badge, complète toutes les missions de cette catégorie à ce niveau');
      return `<div class="badge-card ${ok ? 'earned' : ''}">${imgHtml}<div class="b-nm">${escHtml(b.nm)}</div>${nivTag}<div class="b-st">${ok ? '✅ Obtenu' : '🔒 À gagner'} ${badgeTip}</div>${secInfo}</div>`;
    }).join('')}</div>`;
  }).join('');
}
