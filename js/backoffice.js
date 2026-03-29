// ══════════════════════════════════════════════
// BACK OFFICE
// ══════════════════════════════════════════════
let BO_TAB = 'validation';
let BO_CHILD = null;
let BO_MISSION_GROUP = 'cat';
let BO_EDIT_CHILD = null;
let BO_EDIT_MISSION = null;
let BO_EDIT_CAT = null;
let BO_CATS_OPEN = false;
let BO_EDIT_DAILY = null;
let BO_EDIT_EXTRA = null;
let BO_EDIT_THEME = null;
let BO_EXPANDED_DAY = null;
let CALIB_PREVIEW = null;
let CALIB_PARAMS = { obj: '', sem: '', bud: '', ap: 5, mps: 4 };

function getAllNivs() {
  const seen = new Map();
  getChildList().forEach(ch => (ch.levels||[]).forEach(l => { if (!seen.has(l.id)) seen.set(l.id, l.color); }));
  // Also include niv values from catalog missions not covered by any child
  S.catalog.missions.forEach(m => { if (!seen.has(m.niv)) seen.set(m.niv, '#888'); });
  return [...seen.entries()].map(([id, color]) => ({ id, color }));
}

function getNivColor(nid) {
  const all = getAllNivs();
  const found = all.find(n => n.id === nid);
  return found ? found.color : '#888';
}

function applyBOTheme() {
  // Always apply BO default theme to :root
  const boThemeId = S.cfg.boTheme || 'theme-louis';
  const th = (S.catalog.themes || []).find(t => t.id === boThemeId);
  if (th) {
    const colors = deriveThemeColors(th.principal, th.accent);
    const root = document.documentElement;
    Object.entries(colors).forEach(([k, v]) => root.style.setProperty('--' + k, v));
    root.style.setProperty('--font-title', th.fontTitle);
    root.style.setProperty('--font-body', th.fontBody);
    root.style.setProperty('--bar', deriveBar(th.principal));
  }
}

function childThemeVars(cid) {
  if (!cid || cid === '__catalog' || !S.children[cid]) return '';
  const thId = S.children[cid].theme;
  const th = (S.catalog.themes || []).find(t => t.id === thId);
  if (!th) return '';
  const c = deriveThemeColors(th.principal, th.accent);
  return Object.entries(c).map(([k,v]) => `--${k}:${v}`).join(';') + `;--font-title:${th.fontTitle};--font-body:${th.fontBody}`;
}

function renderBO() {
  if (!BO_CHILD) BO_CHILD = (getChildList().find(c=>c.active)||getChildList()[0]).id;
  // Save scroll position before DOM rebuild
  const boEl = document.getElementById('backoffice');
  const scrollEl = boEl?.querySelector('[style*="overflow-y:auto"]');
  const scrollTop = scrollEl ? scrollEl.scrollTop : 0;

  const tabs = [
    {id:'validation', label:'📅 Validation', icon:'📅'},
    {id:'enfants', label:'👨‍👧‍👦 Enfants', icon:'👨‍👧‍👦'},
    {id:'taches', label:'✅ Tâches', icon:'✅'},
    {id:'missions', label:'📋 Missions', icon:'📋'},
    {id:'badges', label:'🏅 Badges', icon:'🏅'},
    {id:'economie', label:'💰 Économie', icon:'💰'},
    {id:'themes', label:'🎨 Thèmes', icon:'🎨'},
    {id:'params', label:'⚙️ Paramètres', icon:'⚙️'},
  ];
  const tabTips = {
    validation: 'Vérifier et corriger les tâches d\'hier',
    enfants: 'Profils, niveaux, seuils et calibration',
    missions: 'Catalogue de missions, montants, activer/désactiver',
    taches: 'Tâches journalières par enfant',
    badges: 'Badges du catalogue',
    economie: 'Calibration, streak, seuils',
    themes: 'Couleurs et polices par enfant',
    params: 'PIN, sauvegarde, réinitialisations',
  };
  const tabHtml = tabs.map(t =>
    `<div class="bo-tab ${BO_TAB===t.id?'active':''}" onclick="boTab('${t.id}')">${t.label} ${tipBtn(tabTips[t.id]||'')}</div>`
  ).join('');
  const renderFn = {
    validation: renderBOValidation,
    enfants: renderBOEnfants,
    missions: renderBOMissions,
    taches: renderBOTaches,
    badges: renderBOBadges,
    economie: renderBOEconomie,
    themes: renderBOThemes,
    params: renderBOParams,
  }[BO_TAB];
  const activeContent = renderFn();
  const childThemedTabs = ['missions','taches','badges'];
  const hasChildTheme = childThemedTabs.includes(BO_TAB) && BO_CHILD && BO_CHILD !== '__catalog';
  const econTheme = BO_TAB === 'economie' && CALIB_CHILD;
  const themeStyle = hasChildTheme ? childThemeVars(BO_CHILD) : econTheme ? childThemeVars(CALIB_CHILD) : '';
  boEl.innerHTML = `
    <div class="bo-hdr">
      <div class="bo-title">⚙️ BACK OFFICE PARENT</div>
      <button class="bo-close" onclick="closeBO()">← Retour</button>
      <div class="bo-qnav">
        <a href="index.html" title="Accueil"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></a>
        <a href="site/approche_pedagogique.html" title="Pédagogie"><svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z"/></svg></a>
        <a href="site/manuel-parents.html" title="Manuel parents"><svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></a>
      </div>
    </div>
    <div class="bo-tabs-wrap"><div class="bo-tabs">${tabHtml}</div></div>
    <div style="overflow-y:auto;flex:1${themeStyle ? ';' + themeStyle : ''}">
      <div class="bo-tab-content active">${activeContent}</div>
    </div>`;

  // Restore scroll position after DOM rebuild
  const newScrollEl = boEl.querySelector('[style*="overflow-y:auto"]');
  if (newScrollEl) newScrollEl.scrollTop = scrollTop;

  // Tabs scroll indicators
  const tabsWrap = boEl.querySelector('.bo-tabs-wrap');
  const tabsEl = boEl.querySelector('.bo-tabs');
  if (tabsWrap && tabsEl) {
    const updateScrollHints = () => {
      tabsWrap.classList.toggle('can-scroll-left', tabsEl.scrollLeft > 4);
      tabsWrap.classList.toggle('can-scroll-right', tabsEl.scrollLeft < tabsEl.scrollWidth - tabsEl.clientWidth - 4);
    };
    tabsEl.addEventListener('scroll', updateScrollHints, {passive:true});
    updateScrollHints();
    // Scroll active tab into view
    const activeTab = tabsEl.querySelector('.bo-tab.active');
    if (activeTab) activeTab.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
  }

  // Apply contextual theme
  applyBOTheme();
}

function boTab(id) {
  if (id === 'missions' && BO_TAB !== 'missions') BO_CHILD = '__catalog';
  BO_TAB = id; renderBO();
}
function boChild(cid) { BO_CHILD = cid; renderBO(); }

function renderChildSelector(withCatalog) {
  const childBtns = getChildList().map(ch =>
    `<div class="bo-child-btn ${BO_CHILD===ch.id?'active':''}" onclick="boChild('${ch.id}')">${escHtml(ch.emoji)} ${escHtml(ch.name)}</div>`
  ).join('');
  const catBtn = withCatalog
    ? `<div class="bo-child-btn ${BO_CHILD==='__catalog'?'active':''}" onclick="boChild('__catalog')" style="${BO_CHILD==='__catalog'?'background:rgba(255,179,0,.12);color:var(--warning);border-color:var(--warning)':''}">📋 Catalogue</div>`
    : '';
  return `<div class="bo-child-sel">${catBtn}${childBtns}</div>`;
}

function weekKey(dk) {
  const d = new Date(dk + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - jan1) / 86400000);
  const wk = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
}

function checkDegression(cid) {
  const dates = Object.entries(S.children[cid].state.missionDates || {})
    .map(([, dk]) => dk).sort();
  if (dates.length === 0) return null;
  const byWeek = {};
  dates.forEach(dk => {
    const wk = weekKey(dk);
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  });
  const weeks = Object.entries(byWeek).sort(([a],[b]) => a < b ? -1 : 1);
  if (weeks.length < 4) return null;
  const ref = (weeks[0][1] + weeks[1][1]) / 2;
  const obs = (weeks[weeks.length-2][1] + weeks[weeks.length-1][1]) / 2;
  if (obs >= ref * 0.6) return null;
  const allMissions = getMissions(cid);
  const recurrentes = ['Jardin','Cuisine','Courrier','Soigneur'];
  const recDone = allMissions.filter(m =>
    recurrentes.some(c => getCatLabel(m.cat).includes(c)) &&
    S.children[cid].state.missionStates[m.id] === 'done'
  ).length;
  const recTotal = allMissions.filter(m =>
    recurrentes.some(c => getCatLabel(m.cat).includes(c))
  ).length;
  if (recTotal > 0 && recDone / recTotal > 0.7 && obs < ref * 0.4)
    return { type: 'ponctuelles', msg: 'Les missions restantes sont peut-être peu adaptées.', action: 'missions' };
  if (obs < ref * 0.4)
    return { type: 'global', msg: "Le revenu est peut-être insuffisant pour maintenir l'effort.", action: 'params' };
  return { type: 'horizon', msg: "L'objectif semble encore loin.", action: 'params' };
}

// ── Validation tab ──────────────────────────

function boToggleDay(key) { BO_EXPANDED_DAY = (BO_EXPANDED_DAY === key) ? null : key; renderBO(); }

function boDailyValidate(cid, dk, tid) {
  getDR(cid, dk).tasks[tid] = 'done';
  save(); renderBO();
  toast('✅ Tâche validée !');
}

function formatDayLabel(dk) {
  const d = new Date(dk + 'T12:00:00');
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function renderBOValidation() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  let alertHtml = '';
  getChildList().filter(c => c.active).forEach(ch => {
    const deg = checkDegression(ch.id);
    if (deg) {
      const actionLabel = deg.action === 'missions' ? '→ Voir les missions' : '→ Calibrage';
      alertHtml += `<div class="bo-alerte-deg">
        ⚠️ ${escHtml(ch.name)} a complété moins de missions ces 2 dernières semaines.
        <div class="bo-alerte-msg">${deg.msg}</div>
        <button class="bo-btn bo-btn-warn" onclick="boTab('${deg.action}')" style="margin-top:6px">${actionLabel}</button>
        <div class="bo-alerte-conseil">💬 C'est peut-être le moment d'organiser un Conseil de famille.</div>
      </div>`;
    }
  });

  // Auto-expand first unvalidated day if nothing is expanded
  let autoExpanded = false;

  const reviewHtml = getChildList().filter(c => c.active).map(ch => {
    const cid = ch.id;
    const dayCards = days.map(dk => {
      const rec = S.children[cid].state.daily[dk];
      if (!rec && dk !== days[0]) return '';
      const key = cid + '_' + dk;
      const validated = rec ? rec.parentValidated : false;
      const app = getDailyTasks(cid).filter(t => isApplicableOn(t, dk));

      // Auto-expand first unvalidated day
      let isOpen = BO_EXPANDED_DAY === key;
      if (!autoExpanded && !validated && BO_EXPANDED_DAY === null && rec) {
        isOpen = true;
        autoExpanded = true;
      }

      // Balance for badge
      const bal = rec ? calcBal(cid, dk) : null;
      const balLabel = bal ? `${bal.done}/${bal.total}` : '—';

      // Header
      const valBtn = validated
        ? `<span class="btn-val-inline validated">✅</span> ${tipBtn('Journée validée — CHF calculés et crédités')}`
        : `<button class="btn-val-inline" onclick="event.stopPropagation();valDay('${cid}','${dk}')">Valider</button> ${tipBtn('Valider la journée : calcule le streak si journée parfaite')}`;

      const headerHtml = `
        <div class="review-hd" onclick="boToggleDay('${key}')" style="cursor:pointer">
          <span>${escHtml(ch.emoji)} ${escHtml(ch.name)} — ${formatDayLabel(dk)}</span>
          <span style="display:flex;align-items:center;gap:8px">
            <span style="font-size:var(--fs-xs);color:var(--muted)">${balLabel}</span>
            ${valBtn}
            <span class="review-chevron${isOpen ? ' open' : ''}">▼</span>
          </span>
        </div>`;

      // Body (tasks)
      if (!isOpen || !rec) return `<div class="review-day" style="${childThemeVars(cid)}">${headerHtml}</div>`;

      const tasksHtml = app.map(t => {
        const raw = rec.tasks[t.id];
        const isDone = raw === 'done' || raw === true;
        const isPending = raw === 'pending';
        const passiveLabel = t.passive ? ' <span style="font-size:var(--fs-xs);color:var(--purp)">(encouragement)</span>' : '';

        if (isPending) {
          return `<div class="review-task review-task-pending">
            <span style="font-size:var(--fs-base)">⏳</span>
            <label style="flex:1">${escHtml(t.em)} ${escHtml(t.lbl)}${passiveLabel}</label>
            <button class="btn-val-inline" onclick="boDailyValidate('${cid}','${dk}','${t.id}')" style="font-size:var(--fs-xs)">Valider</button>
          </div>`;
        }
        return `<div class="review-task">
          <input type="checkbox" id="rv_${cid}_${dk}_${t.id}" ${isDone ? 'checked' : ''} onchange="setDT('${cid}','${dk}','${t.id}',this.checked)">
          <label for="rv_${cid}_${dk}_${t.id}">${escHtml(t.em)} ${escHtml(t.lbl)}${passiveLabel}</label>
        </div>`;
      }).join('');

      return `<div class="review-day" style="${childThemeVars(cid)}">
        ${headerHtml}
        <div class="review-body">${tasksHtml}</div>
      </div>`;
    }).filter(Boolean).join('');

    return dayCards;
  }).join('');

  return `${alertHtml}<div class="bo-sec"><div class="bo-sec-title">📅 VALIDATION JOURNALIER — 7 DERNIERS JOURS</div>${reviewHtml}</div>`;
}

// ── Enfants tab ─────────────────────────────
function renderBOEnfants() {
  const children = getChildList();
  const childCards = children.map(ch => {
    const isEditing = BO_EDIT_CHILD === ch.id;
    const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px">${renderChildEditForm(ch.id)}</div>` : '';
    return `
    <div class="bo-item${isEditing?' has-override':''}" onclick="boEditChild('${ch.id}')" style="cursor:pointer;flex-wrap:wrap;border-left:3px solid ${ch.active?'var(--green)':'var(--dim)'};${childThemeVars(ch.id)}">
      <div style="font-size:var(--fs-xxl)">${escHtml(ch.emoji)}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${escHtml(ch.name)} <span style="font-size:var(--fs-sm);color:var(--muted)">${ch.age} ans</span></div>
        <div class="bo-item-sub">${ch.active?'✅ Actif':'🔜 Inactif'} · ${(ch.levels||[]).length} niveaux · ${getMissions(ch.id).length} missions</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupChild('${ch.id}')" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelChild('${ch.id}')" title="Supprimer">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }).join('');

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">👨‍👧‍👦 ENFANTS</div>
      ${childCards}
      <button class="bo-add-btn" onclick="boAddChild()">+ Ajouter un enfant</button>
    </div>`;
}

function boEditChild(cid) { BO_EDIT_CHILD = (BO_EDIT_CHILD === cid) ? null : cid; renderBO(); }

function renderChildEditForm(cid) {
  const ch = S.children[cid];
  if (!ch) return '';
  const levelsHtml = (ch.levels||[]).map((l,i) => {
    const nivMs = getMissions(cid).filter(m => missionNiv(cid, m) === l.id && !isSecret(m));
    const gwOpts = i === 0 ? '' : (() => {
      const byCat = {};
      nivMs.forEach(m => { const c = m.cat || '?'; if (!byCat[c]) byCat[c] = []; byCat[c].push(m); });
      return `<option value=""${!l.gatewayMission?' selected':''}>— Aucune —</option>` +
        Object.entries(byCat).map(([cat, ms]) =>
          `<optgroup label="${escHtml(getCatLabel(cat))}">` +
          ms.map(m => `<option value="${m.id}"${l.gatewayMission===m.id?' selected':''}>${escHtml(m.nom)}</option>`).join('') +
          `</optgroup>`
        ).join('');
    })();
    return `
    <div class="bo-item" style="gap:6px;flex-wrap:wrap;align-items:flex-end">
      <input type="color" value="${l.color}" onchange="boSetLevel('${cid}',${i},'color',this.value)" style="width:28px;height:28px;padding:1px;border:1px solid #0a2040;border-radius:4px;cursor:pointer;flex-shrink:0" onclick="event.stopPropagation()">
      <span style="font-size:var(--fs-xs);color:${l.color};font-weight:800;min-width:24px;height:28px;display:flex;align-items:center">${escHtml(l.id)}</span>
      <div class="bo-field" style="margin:0;flex:1;min-width:60px"><label>Nom</label><input value="${escHtml(l.label)}" onchange="boSetLevel('${cid}',${i},'label',this.value)" class="bo-input" style="width:100%" onclick="event.stopPropagation()"></div>
      ${i === 0 ? '' : `<div class="bo-field" style="margin:0;flex:1;min-width:80px"><label>Gateway ${tipBtn('Mission clé : seule mission accessible à l\'ouverture du niveau')}</label><select onchange="boSetLevel('${cid}',${i},'gatewayMission',this.value||null)" onclick="event.stopPropagation()" class="bo-input" style="width:100%">${gwOpts}</select></div>`}
      <button class="bo-icon-btn" onclick="event.stopPropagation();boDupLevel('${cid}',${i})" title="Dupliquer" style="width:26px;height:26px;font-size:var(--fs-sm)">📋</button>
      <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelLevel('${cid}',${i})" title="Supprimer" style="width:26px;height:26px;font-size:var(--fs-sm)">🗑️</button>
    </div>`;
  }).join('');

  return `
      <div class="bo-form-title">✏️ ÉDITER — ${escHtml(ch.emoji)} ${escHtml(ch.name)}</div>
      <div class="bo-field-row" onclick="event.stopPropagation()" style="align-items:flex-end">
        <div style="font-size:var(--fs-xxl);text-align:center;cursor:pointer;background:var(--dim);border:1px solid var(--brd);border-radius:6px;width:48px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0" onclick="event.stopPropagation();openEmojiPicker(this,em=>{boSetChild('${cid}','emoji',em)})">${escHtml(ch.emoji)}</div>
        <div class="bo-field"><label>Nom</label><input value="${escHtml(ch.name)}" onchange="boSetChild('${cid}','name',this.value)"></div>
        <div class="bo-field" style="width:60px;flex:none"><label>Âge</label><input type="number" value="${ch.age}" min="1" max="18" onchange="boSetChild('${cid}','age',+this.value)"></div>
        <div class="bo-field"><label>Thème</label><select onchange="boSetChild('${cid}','theme',this.value)" onclick="event.stopPropagation()">${(S.catalog.themes||[]).map(t=>`<option value="${t.id}"${ch.theme===t.id?' selected':''}>${escHtml(t.label)}</option>`).join('')}</select></div>
        <div style="flex-shrink:0;align-self:flex-end"><button class="bo-toggle ${ch.active?'on':''}" onclick="event.stopPropagation();boSetChild('${cid}','active',${!ch.active})" title="Actif"></button></div>
      </div>
      <div class="bo-sec-title" style="margin-top:12px" onclick="event.stopPropagation()">🗺️ NIVEAUX</div>
      <div onclick="event.stopPropagation()">${levelsHtml}</div>
      <button class="bo-add-btn" onclick="event.stopPropagation();boAddLevel('${cid}')">+ Ajouter un niveau</button>`;
}

// ── Missions tab ────────────────────────────
function boEditMission(mid) { BO_EDIT_MISSION = (BO_EDIT_MISSION === mid) ? null : mid; renderBO(); }

function renderBOMissions() {
  const cats = S.catalog.categories;
  const isCatalog = BO_CHILD === '__catalog';
  const childSel = renderChildSelector(true);
  const exc = isCatalog ? [] : (S.children[BO_CHILD]?.missions.exclude || []);

  // Catalog-pure card: no overrides, no cycle button, no gateway unlock
  function mCardCatalog(m) {
    const isEditing = BO_EDIT_MISSION === m.id;
    const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">${renderMissionEditForm(m.id)}</div>` : '';
    return `<div class="bo-item${isEditing?' is-editing':''}" style="flex-wrap:wrap">
      <div style="min-width:32px;font-size:var(--fs-sm);font-weight:800;color:var(--muted);text-align:center">${escHtml(m.niv)}</div>
      <div class="bo-item-body" onclick="boEditMission('${m.id}')" style="cursor:pointer">
        ${isEditing
          ? `<input class="bo-item-title" value="${escHtml(m.nom)}" onclick="event.stopPropagation()" onchange="boSetCatalogMission('${m.id}','nom',this.value)" style="background:var(--dim);border:1px solid var(--brd);border-radius:4px;color:var(--text);font-weight:700;padding:2px 6px;width:100%;font-family:inherit;font-size:inherit">`
          : `<div class="bo-item-title">${escHtml(m.nom)}</div>`}
        <div class="bo-item-sub">${escHtml(getCatLabel(m.cat))} · ${'⭐'.repeat(m.diff||1)}</div>
        ${isSecret(m)?'<div class="bo-item-tags"><span class="tag tag-sec">🔮 Secrète</span></div>':''}
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupCatalogMission('${m.id}')" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelCatalogMission('${m.id}')" title="Supprimer">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }

  // Per-child card: with overrides, cycle, gateway
  function mCard(m) {
    const isExc = exc.includes(m.id);
    const effNiv = isExc ? null : missionNiv(BO_CHILD, m);
    const lvl = effNiv ? getLevels(BO_CHILD).find(l=>l.id===effNiv) : null;
    const hasOv = Object.keys(S.children[BO_CHILD]?.missions.overrides[m.id]||{}).length > 0;
    const btnLabel = lvl ? lvl.id : '\u2014';
    const btnColor = lvl ? lvl.color : '#2a5070';
    const btnClass = isExc ? 'excluded' : (hasOv ? 'overridden' : '');
    const ov = S.children[BO_CHILD]?.missions.overrides[m.id] || {};
    const gwLvl = getLevels(BO_CHILD).find(l => l.gatewayMission === m.id);
    const gwTag = gwLvl ? `<span class="tag tag-ms">🔑 Gateway → ${escHtml(gwLvl.id)}</span> ` : '';
    const mState = S.children[BO_CHILD]?.state.missionStates[m.id];
    const gwUnlockBtn = gwLvl && mState !== 'done'
      ? `<button class="bo-icon-btn" onclick="event.stopPropagation();boUnlockGateway('${BO_CHILD}','${m.id}')" title="Débloquer manuellement" style="color:#ffd700">🔓</button>` : '';
    const isEditing = BO_EDIT_MISSION === m.id;
    const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">${renderMissionEditForm(m.id)}</div>` : '';
    return `<div class="bo-item${hasOv?' has-override':''}${isEditing?' is-editing':''}" style="opacity:${isExc?'.4':'1'};flex-wrap:wrap">
      <div class="bo-cycle-btn ${btnClass}" onclick="event.stopPropagation();boCycleMissionLevel('${BO_CHILD}','${m.id}')" style="color:${btnColor};border-color:${isExc?'#14305a':btnColor}">${btnLabel}</div>
      <div class="bo-item-body" onclick="boEditMission('${m.id}')" style="cursor:pointer">
        ${isEditing
          ? `<input class="bo-item-title" value="${escHtml(m.nom)}" onclick="event.stopPropagation()" onchange="boSetCatalogMission('${m.id}','nom',this.value)" style="background:var(--dim);border:1px solid var(--brd);border-radius:4px;color:var(--text);font-weight:700;padding:2px 6px;width:100%;font-family:inherit;font-size:inherit">`
          : `<div class="bo-item-title">${escHtml(m.nom)}</div>`}
        <div class="bo-item-sub">${escHtml(m.niv)} · ${'⭐'.repeat(missionDiff(BO_CHILD, m))} · ${chf(missionChf(BO_CHILD, m))} CHF${ov.chf!=null?' <span style="color:var(--warning)">(override)</span>':''}${isExc?' · <span style="color:var(--danger)">exclu</span>':''}</div>
        <div class="bo-item-tags">${gwTag}${isSecret(m)?'<span class="tag tag-sec">🔮 Secrète</span>':''}</div>
      </div>
      <div class="bo-item-actions">
        ${gwUnlockBtn}
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupCatalogMission('${m.id}')" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelCatalogMission('${m.id}')" title="Supprimer">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }

  const cardFn = isCatalog ? mCardCatalog : mCard;

  // Group toggle (catalog mode forces 'cat' or 'niv' based on catalog levels)
  const groupToggle = `<div class="bo-group-toggle">
    <div class="bo-group-btn ${BO_MISSION_GROUP==='cat'?'active':''}" onclick="BO_MISSION_GROUP='cat';renderBO()">Cat\u00e9gorie</div>
    <div class="bo-group-btn ${BO_MISSION_GROUP==='niv'?'active':''}" onclick="BO_MISSION_GROUP='niv';renderBO()">Niveau</div>
  </div>`;

  let catalogSections = '';
  const allNivsList = getAllNivs();
  const nivs = allNivsList.map(n => n.id);
  const getNiv = m => isCatalog ? m.niv : (exc.includes(m.id) ? null : missionNiv(BO_CHILD, m));

  if (BO_MISSION_GROUP === 'cat') {
    // Group by category, sub-group by level
    catalogSections = cats.map(cat => {
      const ms = S.catalog.missions.filter(m => m.cat === cat.id);
      if (!ms.length) return '';
      const byNiv = {};
      ms.forEach(m => { const n = getNiv(m) || '__none'; if (!byNiv[n]) byNiv[n] = []; byNiv[n].push(m); });
      const inner = nivs.map(nid => {
        if (!byNiv[nid]?.length) return '';
        return `<div style="margin-left:8px;margin-bottom:6px">
          <div style="font-size:var(--fs-xs);font-weight:700;color:${getNivColor(nid)};margin-bottom:3px;opacity:.7">${nid} (${byNiv[nid].length})</div>
          ${byNiv[nid].map(m => cardFn(m)).join('')}</div>`;
      }).join('');
      const noneCards = byNiv['__none']?.length ? `<div style="margin-left:8px;margin-bottom:6px">
        <div style="font-size:var(--fs-xs);font-weight:700;color:#2a5070;margin-bottom:3px">Non attribu\u00e9 (${byNiv['__none'].length})</div>
        ${byNiv['__none'].map(m => cardFn(m)).join('')}</div>` : '';
      return `<div style="margin-bottom:12px">
        <div style="font-size:var(--fs-sm);font-weight:700;color:${cat.color};margin-bottom:6px">${escHtml(cat.label)} (${ms.length})</div>
        ${inner}${noneCards}</div>`;
    }).join('');
  } else {
    // Group by level, sub-group by category
    const lvlList = isCatalog ? allNivsList : getLevels(BO_CHILD);
    const groups = {};
    lvlList.forEach(l => groups[l.id] = []);
    groups['__none'] = [];
    S.catalog.missions.forEach(m => {
      const niv = getNiv(m);
      if (niv && groups[niv]) groups[niv].push(m); else groups['__none'].push(m);
    });
    catalogSections = lvlList.map(l => {
      if (!groups[l.id]?.length) return '';
      const byCat = {};
      groups[l.id].forEach(m => { if (!byCat[m.cat]) byCat[m.cat] = []; byCat[m.cat].push(m); });
      const inner = cats.map(cat => {
        if (!byCat[cat.id]?.length) return '';
        return `<div style="margin-left:8px;margin-bottom:6px">
          <div style="font-size:var(--fs-xs);font-weight:700;color:${cat.color};margin-bottom:3px;opacity:.7">${escHtml(cat.label)} (${byCat[cat.id].length})</div>
          ${byCat[cat.id].map(m => cardFn(m)).join('')}</div>`;
      }).join('');
      return `<div style="margin-bottom:12px">
        <div style="font-size:var(--fs-sm);font-weight:700;color:${l.color};margin-bottom:6px">${escHtml(l.id)} (${groups[l.id].length})</div>
        ${inner}</div>`;
    }).join('');
    if (groups['__none'].length) {
      catalogSections += `<div style="margin-bottom:12px">
        <div style="font-size:var(--fs-sm);font-weight:700;color:#2a5070;margin-bottom:6px">Non attribu\u00e9 (${groups['__none'].length})</div>
        ${groups['__none'].map(m => cardFn(m)).join('')}</div>`;
    }
  }

  // Extras section — only for child mode
  let extrasSection = '';
  if (!isCatalog) {
    const extras = S.children[BO_CHILD]?.missions.extra || [];
    const extraHtml = extras.length ? extras.map((m,i) => {
      const isEditing = BO_EDIT_EXTRA === 'M:' + i;
      const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">${renderExtraMissionEditForm(BO_CHILD, i)}</div>` : '';
      return `<div class="bo-item${isEditing?' is-editing':''}" style="flex-wrap:wrap">
        <div style="font-size:var(--fs-xs);color:var(--purp);width:30px">${escHtml(m.id)}</div>
        <div class="bo-item-body" onclick="boEditExtra('M',${i})" style="cursor:pointer">
          ${isEditing
            ? `<input class="bo-item-title" value="${escHtml(m.nom)}" onclick="event.stopPropagation()" onchange="boSetExtra('${BO_CHILD}','missions',${i},'nom',this.value)" style="background:var(--dim);border:1px solid var(--brd);border-radius:4px;color:var(--text);font-weight:700;padding:2px 6px;width:100%;font-family:inherit;font-size:inherit">`
            : `<div class="bo-item-title">${escHtml(m.nom)}</div>`}
          <div class="bo-item-sub">${escHtml(m.niv)} · ${chf(missionChf(BO_CHILD, m))} CHF · extra</div>
        </div>
        <div class="bo-item-actions">
          <button class="bo-icon-btn" onclick="event.stopPropagation();boDupExtra('${BO_CHILD}','missions',${i})" title="Dupliquer">📋</button>
          <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelExtra('${BO_CHILD}','missions',${i})" title="Supprimer">🗑️</button>
        </div>
        ${editForm}
      </div>`;
    }).join('') : '<div style="font-size:var(--fs-sm);color:var(--muted);padding:8px">Aucune mission extra</div>';
    extrasSection = `
      <div class="bo-sec-title" style="margin-top:16px">🎯 EXTRAS — ${escHtml(S.children[BO_CHILD]?.emoji||'')} ${escHtml(S.children[BO_CHILD]?.name||'')}</div>
      ${extraHtml}
      <button class="bo-add-btn" onclick="boAddExtra('${BO_CHILD}','missions')">+ Mission extra pour ${escHtml(S.children[BO_CHILD]?.name||'enfant')}</button>`;
  }

  const totalMissions = S.catalog.missions.length;
  const secretCount = S.catalog.missions.filter(m => isSecret(m)).length;
  const statsLine = isCatalog
    ? `<div style="font-size:var(--fs-sm);color:var(--muted);margin-bottom:8px">${totalMissions} missions · ${totalMissions - secretCount} standards + ${secretCount} secrètes</div>`
    : '';

  return `
    <div class="bo-sec" style="padding-bottom:0">
      <div style="position:sticky;top:0;z-index:3;background:var(--bg,#030810);padding-bottom:8px">
        ${childSel}
        ${groupToggle}
      </div>
      <div class="bo-sec-title">${isCatalog ? '📋 CATALOGUE — Vue d\'ensemble' : '📋 MISSIONS — CATALOGUE'}</div>
      ${statsLine}
      ${isCatalog ? renderCatSection() : ''}
      <button class="bo-add-btn" onclick="boAddCatalogMission()">+ Nouvelle mission au catalogue</button>
      ${catalogSections}
      ${extrasSection}
    </div>`;
}

// ── Categories CRUD (catalog mode) ──────────
function renderCatSection() {
  const cats = S.catalog.categories;
  const catCards = cats.map((cat, i) => {
    const count = S.catalog.missions.filter(m => m.cat === cat.id).length;
    const em = cat.em || '🏷️';
    const isEditing = BO_EDIT_CAT === i;
    if (isEditing) {
      return `<div class="bo-item has-override" onclick="BO_EDIT_CAT=null;renderBO()" style="cursor:pointer;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;width:100%" onclick="event.stopPropagation()">
          <div class="bo-field" style="margin:0;width:48px;flex:0"><label>Emoji</label>
            <div id="cat-em-btn-${i}" style="font-size:var(--fs-xxl);text-align:center;cursor:pointer;background:var(--dim);border:1px solid var(--brd);border-radius:6px;padding:3px 0"
              onclick="event.stopPropagation();openEmojiPicker(this,em=>{boSetCat(${i},'em',em)})">${em}</div>
          </div>
          <div class="bo-field" style="margin:0;flex:1"><label>Label</label><input value="${escHtml(cat.label)}" onchange="boSetCat(${i},'label',this.value)" onclick="event.stopPropagation()"></div>
          <div class="bo-field" style="margin:0;width:40px;flex:0"><label>Couleur</label><input type="color" value="${cat.color}" onchange="boSetCat(${i},'color',this.value)" style="width:32px;height:28px;padding:1px;border:1px solid var(--brd);border-radius:4px;cursor:pointer" onclick="event.stopPropagation()"></div>
          <button class="bo-icon-btn" onclick="event.stopPropagation();boDupCat(${i})" title="Dupliquer">📋</button>
          <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelCat(${i})" title="Supprimer">🗑️</button>
        </div>
      </div>`;
    }
    return `<div class="bo-item" onclick="BO_EDIT_CAT=${i};renderBO()" style="cursor:pointer">
      <div style="font-size:var(--fs-xl);flex-shrink:0;width:28px;text-align:center">${em}</div>
      <div style="width:12px;height:12px;border-radius:50%;background:${cat.color};flex-shrink:0;box-shadow:0 0 6px ${cat.color}60"></div>
      <div class="bo-item-body">
        <div class="bo-item-title">${escHtml(cat.label)}</div>
        <div class="bo-item-sub">${count} mission${count !== 1 ? 's' : ''}</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupCat(${i})" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelCat(${i})" title="Supprimer">🗑️</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="acc-level ${BO_CATS_OPEN?'open':''}" style="margin-bottom:12px">
    <div class="acc-hdr" onclick="BO_CATS_OPEN=!BO_CATS_OPEN;renderBO()" style="background:var(--card,#0d1422);min-height:40px;padding:8px 12px">
      <div class="acc-title" style="color:var(--hi,#00cfff)">🏷️ CATÉGORIES (${cats.length})</div>
      <div class="acc-chevron">▼</div>
    </div>
    <div class="acc-body" style="background:var(--surf,#080d1a);padding:6px 8px 8px">
      ${catCards}
      <button class="bo-add-btn" onclick="boAddCat()">+ Nouvelle catégorie</button>
    </div>
  </div>`;
}

function boSetCat(idx, field, val) {
  const cat = S.catalog.categories[idx];
  if (!cat) return;
  const oldId = cat.id;
  cat[field] = val;
  // If ID changed, update all missions referencing this category
  if (field === 'id' && val !== oldId) {
    S.catalog.missions.forEach(m => {
      if (m.cat === oldId) m.cat = val;
    });
    S.catalog.badges.forEach(b => {
      if (b.catId === oldId) b.catId = val;
    });
  }
  save(); renderBO();
}

function boAddCat() {
  const id = 'cat-' + Date.now().toString(36);
  S.catalog.categories.push({ id, label: '🆕 Nouvelle catégorie', color: '#888888' });
  save();
  BO_EDIT_CAT = S.catalog.categories.length - 1;
  BO_CATS_OPEN = true;
  renderBO();
}

function boDelCat(idx) {
  const cat = S.catalog.categories[idx];
  if (!cat) return;
  const count = S.catalog.missions.filter(m => m.cat === cat.id).length;
  if (count > 0) {
    toast(`⚠️ ${count} mission(s) utilisent cette catégorie`, true);
    return;
  }
  if (!confirm(`Supprimer la catégorie "${cat.label}" ?`)) return;
  S.catalog.categories.splice(idx, 1);
  if (BO_EDIT_CAT === idx) BO_EDIT_CAT = null;
  save(); renderBO();
}

function ovLabel(label, field, mid) {
  const isCat = BO_CHILD === '__catalog';
  const ov = isCat ? {} : (S.children[BO_CHILD]?.missions.overrides[mid] || {});
  if (isCat || ov[field] == null) return label;
  return `${label} <span style="color:var(--warning);cursor:pointer" onclick="setMissionOv('${BO_CHILD}','${mid}','${field}',undefined);clearCache()" title="Reset au catalogue">↩</span>`;
}

function renderMissionEditForm(mid) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (!m) return '';
  const cats = S.catalog.categories;
  const isCatalog = BO_CHILD === '__catalog';
  const ov = isCatalog ? {} : (S.children[BO_CHILD]?.missions.overrides[mid] || {});

  const isGw = Object.values(S.children).some(ch=>ch.levels?.some(l=>l.gatewayMission===mid));
  const secretHtml = (()=>{ const b = S.catalog.badges.find(b => b.secretMissionId === mid); return b ? '🔮 ' + escHtml(b.nivId) + ' · ' + escHtml(getCatLabel(b.catId)) + ' (' + escHtml(b.nm) + ')' : '—'; })();

  const nivValue = isCatalog ? m.niv : (ov.niv || m.niv);
  const nivOnchange = isCatalog
    ? `boSetCatalogMission('${mid}','niv',this.value)`
    : `setMissionOv('${BO_CHILD}','${mid}','niv',this.value||undefined)`;

  const chfValue = isCatalog ? '' : (ov.chf != null ? ov.chf : '');
  const chfPlaceholder = isCatalog ? '' : 'auto: ' + chf(missionChf(BO_CHILD, m));

  return `
      <div style="display:flex;gap:8px;align-items:stretch">
        <div style="flex:2;display:flex;flex-direction:column;gap:6px">
          <div class="bo-field" style="margin:0"><label>Catégorie</label><select onchange="boSetCatalogMission('${mid}','cat',this.value)">${cats.map(c=>`<option value="${c.id}" ${m.cat===c.id?'selected':''}>${escHtml(c.label)}</option>`).join('')}</select></div>
          <div class="bo-field" style="margin:0"><label>${ovLabel('Niveau','niv',mid)}</label><input value="${escHtml(nivValue)}" onchange="${nivOnchange}"></div>
          <div class="bo-field" style="margin:0"><label>${ovLabel('Difficulté','diff',mid)}</label><div class="bo-star-picker">${[1,2,3,4].map(d=>{
            const active = isCatalog ? (m.diff||1) : missionDiff(BO_CHILD, m);
            const catDiff = m.diff || 1;
            const onclick = isCatalog
              ? `boSetCatalogMission('${mid}','diff',${d})`
              : `setMissionOv('${BO_CHILD}','${mid}','diff',${d});clearCache()`;
            const arrow = !isCatalog && d === catDiff ? '<div style="font-size:8px;color:var(--muted);line-height:1;text-align:center">▲</div>' : '';
            return `<span style="cursor:pointer;display:inline-flex;flex-direction:column;align-items:center" onclick="${onclick}"><span style="font-size:var(--fs-xl);opacity:${d<=active?1:.25}">⭐</span>${arrow}</span>`;
          }).join('')}</div></div>
          <div class="bo-field" style="margin:0"><label>${ovLabel('CHF','chf',mid)}</label>${isCatalog
            ? `<div style="font-size:var(--fs-sm);padding:6px 8px;background:var(--dim);border:1px solid var(--brd);border-radius:6px;color:var(--hi)">—</div>`
            : `<input type="number" value="${chfValue}" placeholder="${chfPlaceholder}" step=".1" onchange="setMissionOv('${BO_CHILD}','${mid}','chf',this.value===''?undefined:+this.value)">`
          }</div>
        </div>
        <div class="bo-field" style="flex:3;margin:0;display:flex;flex-direction:column"><label>Description</label><textarea style="flex:1;resize:none;font-style:italic" onchange="boSetCatalogMission('${mid}','description',this.value)">${escHtml(m.description||'')}</textarea></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px;align-items:stretch">
        <div class="bo-field" style="flex:2;margin:0;display:flex;flex-direction:column"><label>Secret</label><div style="flex:1;display:flex;align-items:center;font-size:var(--fs-sm);padding:6px 8px;background:var(--dim);border:1px solid var(--brd);border-radius:6px;color:${isSecret(m)?'var(--acc)':'var(--muted)'}">${secretHtml}</div></div>
        <div class="bo-field" style="flex:2;margin:0"><label>Récurrence</label><select onchange="boSetRecurrence('${mid}',this.value)"${isGw?' disabled title="Gateway : récurrence interdite"':''}><option value="once" ${m.recurrence?.type==='once'?'selected':''}>Une fois</option><option value="daily" ${m.recurrence?.type==='daily'?'selected':''}>Quotidienne</option><option value="weekly" ${m.recurrence?.type==='weekly'?'selected':''}>Hebdomadaire</option><option value="monthly" ${m.recurrence?.type==='monthly'?'selected':''}>Mensuelle</option><option value="yearly" ${m.recurrence?.type==='yearly'?'selected':''}>Annuelle</option></select></div>
        <div class="bo-field" style="flex:1;margin:0"><label>Nombre</label><input type="number" value="${m.recurrence?.type==='once'?1:(m.recurrence?.nombre||0)}" min="0" max="10" ${m.recurrence?.type==='once'?'disabled':''} onchange="boSetRecurrenceNombre('${mid}',+this.value)"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="bo-btn bo-btn-danger" onclick="boDelCatalogMission('${mid}')" style="flex:1;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(255,61,127,.1);border:1px solid var(--danger);border-radius:8px;color:var(--danger);cursor:pointer;font-weight:700">🗑️ Supprimer</button>
        <button class="bo-btn bo-btn-warn" onclick="boClearOverrides('${mid}')" style="flex:1;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;cursor:pointer;font-weight:700${isCatalog?';opacity:.3;pointer-events:none':''}"${isCatalog?' disabled':''}>↩️ Reset surcharges</button>
      </div>`;
}

// ── Taches tab ──────────────────────────────
let BO_SECTIONS_OPEN = false;
let BO_EDIT_SECTION = null;

function renderBOTaches() {
  const totalTasks = S.catalog.dailyTasks.length;
  const childSelPills = `<div class="bo-child-sel">${getChildList().map(ch => {
    const chExc = S.children[ch.id]?.dailyTasks.exclude || [];
    const active = totalTasks - chExc.length;
    return `<div class="bo-child-btn ${BO_CHILD===ch.id?'active':''}" onclick="boChild('${ch.id}')">${escHtml(ch.emoji)} ${escHtml(ch.name)} ${active}/${totalTasks}</div>`;
  }).join('')}</div>`;

  const sections = S.catalog.dailySections || [];
  const tasks = S.catalog.dailyTasks;
  const exc = S.children[BO_CHILD]?.dailyTasks.exclude || [];

  function taskCard(t, i) {
    const isExc = exc.includes(t.id);
    const isEditing = BO_EDIT_DAILY === i;
    const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">${renderDailyEditForm(i)}</div>` : '';
    const secLabel = sections.find(s => s.id === t.section);
    return `<div class="bo-item${isEditing?' has-override':''}" style="opacity:${isExc?'.4':'1'};flex-wrap:wrap">
      <div class="bo-cycle-btn ${isExc?'excluded':''}" onclick="event.stopPropagation();boToggleDailyExclude('${BO_CHILD}','${t.id}');renderBO()" style="color:${isExc?'#2a5070':'#00cfff'};border-color:${isExc?'#14305a':'#00cfff'}">${isExc?'\u2014':'\u2714'}</div>
      ${isEditing
        ? `<div style="font-size:var(--fs-xxl);text-align:center;cursor:pointer;background:var(--dim);border:1px solid var(--brd);border-radius:6px;padding:3px 0;width:48px;flex-shrink:0" onclick="event.stopPropagation();openEmojiPicker(this,em=>{boSetDailyTask(${i},'em',em)})">${escHtml(t.em)}</div>`
        : `<div style="font-size:var(--fs-xl)">${escHtml(t.em)}</div>`}
      <div class="bo-item-body" onclick="boEditDailyTask(${i})" style="cursor:pointer">
        ${isEditing
          ? `<input class="bo-item-title" value="${escHtml(t.lbl)}" onclick="event.stopPropagation()" onchange="boSetDailyTask(${i},'lbl',this.value)" style="background:var(--dim);border:1px solid var(--brd);border-radius:4px;color:var(--text);font-weight:700;padding:2px 6px;width:100%;font-family:inherit;font-size:inherit">`
          : `<div class="bo-item-title">${escHtml(t.lbl)}</div>`}
        <div class="bo-item-sub">${t.days===null?'Tous les jours':'Jours: '+t.days.join(',')}${t.passive?' · 💬 Passif':''}${isExc?' · <span style="color:var(--danger)">exclu</span>':''}</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupDailyTask(${i})" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelDailyTask(${i})" title="Supprimer">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }

  // Group tasks by section
  const grouped = {};
  sections.forEach(s => grouped[s.id] = []);
  grouped['__other'] = [];
  tasks.forEach((t, i) => {
    const sid = t.section || '__other';
    if (grouped[sid]) grouped[sid].push({ t, i });
    else grouped['__other'].push({ t, i });
  });

  let taskSections = '';
  // "Sans section" first so new tasks are visible at top
  if (grouped['__other'].length) {
    taskSections += `<div style="margin-bottom:12px">
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--muted);margin-bottom:6px">📌 Sans section (${grouped['__other'].length})</div>
      ${grouped['__other'].map(({ t, i }) => taskCard(t, i)).join('')}
    </div>`;
  }
  sections.forEach(s => {
    const items = grouped[s.id];
    if (!items || !items.length) return;
    taskSections += `<div style="margin-bottom:12px">
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--hi);margin-bottom:6px">${s.em} ${escHtml(s.label)} (${items.length})</div>
      ${items.map(({ t, i }) => taskCard(t, i)).join('')}
    </div>`;
  });

  const extras = S.children[BO_CHILD]?.dailyTasks.extra || [];
  const extraHtml = extras.map((t,i) => {
    const isEditing = BO_EDIT_EXTRA === 'D:' + i;
    const editForm = isEditing ? `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">${renderExtraDailyEditForm(BO_CHILD, i)}</div>` : '';
    return `<div class="bo-item${isEditing?' is-editing':''}" style="flex-wrap:wrap">
      ${isEditing
        ? `<div style="font-size:var(--fs-xxl);text-align:center;cursor:pointer;background:var(--dim);border:1px solid var(--brd);border-radius:6px;padding:3px 0;width:48px;flex-shrink:0" onclick="event.stopPropagation();openEmojiPicker(this,em=>{boSetExtra('${BO_CHILD}','dailyTasks',${i},'em',em)})">${escHtml(t.em)}</div>`
        : `<div style="font-size:var(--fs-xl)">${escHtml(t.em)}</div>`}
      <div class="bo-item-body" onclick="boEditExtra('D',${i})" style="cursor:pointer">
        ${isEditing
          ? `<input class="bo-item-title" value="${escHtml(t.lbl)}" onclick="event.stopPropagation()" onchange="boSetExtra('${BO_CHILD}','dailyTasks',${i},'lbl',this.value)" style="background:var(--dim);border:1px solid var(--brd);border-radius:4px;color:var(--text);font-weight:700;padding:2px 6px;width:100%;font-family:inherit;font-size:inherit">`
          : `<div class="bo-item-title">${escHtml(t.lbl)}</div>`}
        <div class="bo-item-sub">${t.days===null?'Tous les jours':'Jours: '+t.days.join(',')}${t.passive?' · 💬 Passif':''} · extra</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupExtra('${BO_CHILD}','dailyTasks',${i})" title="Dupliquer">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelExtra('${BO_CHILD}','dailyTasks',${i})" title="Supprimer">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }).join('');

  return `
    <div class="bo-sec" style="padding-bottom:0">
      <div style="position:sticky;top:0;z-index:3;background:var(--bg,#030810);padding-bottom:8px">
        ${childSelPills}
      </div>
      <div class="bo-sec-title">✅ TÂCHES JOURNALIÈRES — CATALOGUE</div>
      ${renderDailySectionsPanel()}
      <button class="bo-add-btn" onclick="boAddDailyTask()">+ Nouvelle tâche</button>
      ${taskSections}
      <div class="bo-sec-title" style="margin-top:16px">🎯 EXTRAS — ${escHtml(S.children[BO_CHILD]?.emoji||'')} ${escHtml(S.children[BO_CHILD]?.name||'')}</div>
      ${extraHtml}
      <button class="bo-add-btn" onclick="boAddExtra('${BO_CHILD}','dailyTasks')">+ Tâche extra pour ${escHtml(S.children[BO_CHILD]?.name||'enfant')}</button>
    </div>`;
}

function boEditDailyTask(idx) { BO_EDIT_DAILY = (BO_EDIT_DAILY === idx) ? null : idx; renderBO(); }

// ── Daily sections CRUD ──
function renderDailySectionsPanel() {
  const sections = S.catalog.dailySections || [];
  const secCards = sections.map((s, i) => {
    const taskCount = S.catalog.dailyTasks.filter(t => t.section === s.id).length;
    return `<div class="bo-item" style="gap:6px">
      <div style="font-size:var(--fs-xxl);cursor:pointer;flex-shrink:0" onclick="event.stopPropagation();openEmojiPicker(this,em=>{boSetSection(${i},'em',em)})">${s.em}</div>
      <input value="${escHtml(s.label)}" onchange="boSetSection(${i},'label',this.value)" onclick="event.stopPropagation()" style="flex:1;background:var(--surf);border:1px solid var(--brd);color:var(--text);border-radius:4px;padding:4px 8px;font-size:var(--fs-base);font-weight:700;min-width:0">
      <span style="font-size:var(--fs-xs);color:var(--muted);white-space:nowrap">${taskCount}</span>
      <button class="bo-icon-btn" onclick="event.stopPropagation();boDupSection(${i})" title="Dupliquer" style="flex-shrink:0">📋</button>
      <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelSection(${i})" title="Supprimer" style="flex-shrink:0">🗑️</button>
    </div>`;
  }).join('');

  return `<div class="acc-level ${BO_SECTIONS_OPEN ? 'open' : ''}" style="margin-bottom:12px">
    <div class="acc-hdr" onclick="BO_SECTIONS_OPEN=!BO_SECTIONS_OPEN;renderBO()" style="background:var(--card);min-height:40px;padding:8px 12px">
      <div class="acc-title" style="color:var(--hi)">🕐 SECTIONS JOURNÉE (${sections.length})</div>
      <div class="acc-chevron">▼</div>
    </div>
    <div class="acc-body" style="background:var(--surf);padding:6px 8px 8px">
      ${secCards}
      <button class="bo-add-btn" onclick="boAddSection()">+ Nouvelle section</button>
    </div>
  </div>`;
}

function boSetSection(idx, field, val) {
  const sec = (S.catalog.dailySections || [])[idx];
  if (!sec) return;
  sec[field] = val;
  save(); renderBO();
}

function boAddSection() {
  if (!S.catalog.dailySections) S.catalog.dailySections = [];
  const id = 'sec-' + Date.now().toString(36);
  S.catalog.dailySections.push({ id, label: 'Nouvelle section', em: '🕐' });
  save();
  BO_EDIT_SECTION = S.catalog.dailySections.length - 1;
  BO_SECTIONS_OPEN = true;
  renderBO();
}

function boDelSection(idx) {
  const sec = (S.catalog.dailySections || [])[idx];
  if (!sec) return;
  const taskCount = S.catalog.dailyTasks.filter(t => t.section === sec.id).length;
  if (taskCount > 0) {
    if (!confirm(`${taskCount} tâche(s) sont dans cette section. Elles seront déplacées dans "Sans section". Continuer ?`)) return;
    S.catalog.dailyTasks.forEach(t => { if (t.section === sec.id) t.section = null; });
  }
  S.catalog.dailySections.splice(idx, 1);
  if (BO_EDIT_SECTION === idx) BO_EDIT_SECTION = null;
  save(); renderBO();
}

function renderDailyEditForm(idx) {
  const t = S.catalog.dailyTasks[idx];
  if (!t) return '';
  const daysVal = t.days === null ? '' : t.days.join(',');
  const sections = S.catalog.dailySections || [];
  const sectionOpts = `<option value=""${!t.section?' selected':''}>— Aucune —</option>` +
    sections.map(s => `<option value="${s.id}"${t.section===s.id?' selected':''}>${s.em} ${escHtml(s.label)}</option>`).join('');
  return `
      <div class="bo-field"><label>Description</label><textarea style="font-style:italic" onchange="boSetDailyTask(${idx},'description',this.value)" onclick="event.stopPropagation()">${escHtml(t.description||'')}</textarea></div>
      <div class="bo-field-row bo-field-row-eq">
        <div class="bo-field"><label>Section</label><select onchange="boSetDailyTask(${idx},'section',this.value||null)" onclick="event.stopPropagation()">${sectionOpts}</select></div>
        <div class="bo-field"><label>Jours</label><input value="${daysVal}" placeholder="0=dim..6=sam" onchange="boSetDailyTask(${idx},'days',this.value?this.value.split(',').map(Number):null)" onclick="event.stopPropagation()"></div>
        <div class="bo-field"><label>Passif</label><select onchange="boSetDailyTask(${idx},'passive',this.value==='true')" onclick="event.stopPropagation()"><option value="false" ${!t.passive?'selected':''}>Non</option><option value="true" ${t.passive?'selected':''}>Oui</option></select></div>
      </div>
      <button class="bo-btn bo-btn-danger" onclick="event.stopPropagation();boDelDailyTask(${idx})" style="margin-top:6px">🗑️ Supprimer</button>`;
}

function boSetDailyTask(idx, field, val) {
  S.catalog.dailyTasks[idx][field] = val;
  save(); renderBO();
}
function boAddDailyTask() {
  const id = 'dt_' + Date.now().toString(36);
  S.catalog.dailyTasks.push({ id, em: '📝', lbl: 'Nouvelle tâche', days: null, passive: false, description: '', section: null });
  save(); BO_EDIT_DAILY = S.catalog.dailyTasks.length - 1; renderBO();
}
function boDelDailyTask(idx) {
  if (!confirm('Supprimer cette tâche ?')) return;
  S.catalog.dailyTasks.splice(idx, 1);
  save(); BO_EDIT_DAILY = null; renderBO();
}
function boToggleDailyExclude(cid, tid) {
  const exc = S.children[cid].dailyTasks.exclude;
  const i = exc.indexOf(tid);
  if (i >= 0) exc.splice(i, 1); else exc.push(tid);
  save();
}

// ── Badges tab ──────────────────────────────
function renderBOBadges() {
  const cats = S.catalog.categories;
  const allNivsList = getAllNivs();
  const nivs = allNivsList.map(n => n.id);
  const isCatalog = BO_CHILD === '__catalog';
  const eb = isCatalog ? [] : earnedBadges(BO_CHILD);

  const childSel = renderChildSelector(true);

  // Build lookup: badgeMap[catId][nivId] = badge
  const badgeMap = {};
  cats.forEach(c => { badgeMap[c.id] = {}; });
  S.catalog.badges.forEach(b => {
    if (!badgeMap[b.catId]) badgeMap[b.catId] = {};
    badgeMap[b.catId][b.nivId] = b;
  });

  const headerCells = nivs.map(n => `<th style="color:${getNivColor(n)}">${n}</th>`).join('');
  const rows = cats.map(cat => {
    const cells = nivs.map(niv => {
      const b = badgeMap[cat.id]?.[niv];
      if (!b) return `<td class="empty" onclick="boAddBadge('${cat.id}','${niv}')"><span style="font-size:var(--fs-lg);color:var(--brd2)">+</span></td>`;
      const earned = !isCatalog && eb.includes(b.id);
      const secLabel = b.secretMissionId ? '🔮' : '';
      const imgHtml = b.img
        ? `<img src="${escHtml(b.img)}" style="width:28px;height:28px;object-fit:contain" onerror="this.outerHTML='${escHtml(b.em)}'"/>`
        : escHtml(b.em);
      return `<td class="${earned?'earned':''}" onclick="openBadgeModal('${b.id}')">
        <div class="bo-badge-cell-em">${imgHtml}</div>
        <div class="bo-badge-cell-nm">${escHtml(b.nm)}</div>
        ${secLabel ? `<div class="bo-badge-cell-sec">${secLabel}</div>` : ''}
        ${!isCatalog ? `<div style="font-size:9px;margin-top:1px;color:${earned?'var(--success)':'var(--muted)'}">${earned?'✅':'🔒'}</div>` : ''}
      </td>`;
    }).join('');
    return `<tr><td style="color:${cat.color}">${cat.em ? escHtml(cat.em)+' ' : ''}${escHtml(cat.label)}</td>${cells}</tr>`;
  }).join('');

  return `
    <div class="bo-sec">
      <div style="position:sticky;top:0;z-index:3;background:var(--bg,#030810);padding-bottom:8px">
        <div class="bo-sec-title">🏅 BADGES</div>
        ${childSel}
      </div>
      <div style="overflow-x:auto">
        <table class="bo-badge-matrix">
          <thead><tr><th></th>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── BO Modal (generic) ──
function openBOModal(title, contentHtml) {
  const ov = document.getElementById('bo-modal-ov');
  ov.innerHTML = `<div class="bo-modal">
    <button class="bo-modal-close" onclick="closeBOModal()">&times;</button>
    <div class="bo-modal-title">${title}</div>
    <div class="bo-modal-body">${contentHtml}</div>
  </div>`;
  ov.classList.add('open');
  ov.onclick = e => { if (e.target === ov) closeBOModal(); };
}
function closeBOModal() {
  const ov = document.getElementById('bo-modal-ov');
  ov.classList.remove('open');
  ov.innerHTML = '';
}

// ── Badge modal ──
function openBadgeModal(badgeId) {
  const b = S.catalog.badges.find(x => x.id === badgeId);
  if (!b) return;
  const catLabel = getCatLabel(b.catId);
  const missions = S.catalog.missions.filter(m => m.cat === b.catId && m.niv === b.nivId);

  const missionOptions = missions.map(m =>
    `<option value="${m.id}" ${b.secretMissionId===m.id?'selected':''}>${escHtml(m.nom)}</option>`
  ).join('');

  const content = `
    <div class="bo-field-row">
      <div class="bo-field"><label>Nom</label><input value="${escHtml(b.nm)}" onchange="boSetBadgeById('${badgeId}','nm',this.value)"></div>
      <div class="bo-field"><label>Emoji</label><div style="font-size:var(--fs-xxl);text-align:center;cursor:pointer;background:var(--dim);border:1px solid var(--brd);border-radius:6px;padding:3px 0;width:48px" onclick="openEmojiPicker(this,em=>{boSetBadgeById('${badgeId}','em',em);openBadgeModal('${badgeId}')})">${escHtml(b.em)}</div></div>
    </div>
    <div class="bo-field-row">
      <div class="bo-field"><label>Catégorie</label><div style="font-size:var(--fs-sm);padding:6px 8px;background:var(--dim);border:1px solid var(--brd);border-radius:6px;color:var(--text)">${escHtml(catLabel)}</div></div>
      <div class="bo-field"><label>Niveau</label><div style="font-size:var(--fs-sm);padding:6px 8px;background:var(--dim);border:1px solid var(--brd);border-radius:6px;color:var(--text)">${escHtml(b.nivId)}</div></div>
    </div>
    <div class="bo-field"><label>Image URL</label><input value="${escHtml(b.img||'')}" placeholder="https://..." onchange="boSetBadgeById('${badgeId}','img',this.value||null);openBadgeModal('${badgeId}')"></div>
    ${b.img?`<div style="margin:6px 0"><img src="${escHtml(b.img)}" style="width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid var(--brd)" onerror="this.alt='Image inaccessible'"></div>`:''}
    <div class="bo-field" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--brd)">
      <label>🔮 Mission secrète liée</label>
      <select onchange="boSetBadgeById('${badgeId}','secretMissionId',this.value||null);openBadgeModal('${badgeId}')">
        <option value="">-- Aucune --</option>
        ${missionOptions}
      </select>
      ${b.secretMissionId ? `<div style="font-size:var(--fs-xs);color:var(--acc);margin-top:4px">Cette mission sera débloquée quand ce badge est gagné</div>` : ''}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="bo-btn bo-btn-warn" onclick="boDupBadge('${badgeId}')" style="flex:1;padding:10px;border-radius:8px;cursor:pointer;font-weight:700">📋 Dupliquer</button>
      <button class="bo-btn bo-btn-danger" onclick="boDelBadgeById('${badgeId}')" style="flex:1;padding:10px;background:rgba(255,61,127,.1);border:1px solid var(--danger);border-radius:8px;color:var(--danger);cursor:pointer;font-weight:700">🗑️ Supprimer</button>
    </div>`;

  openBOModal(`🏅 ${escHtml(b.nm)}`, content);
}

function boSetBadgeById(id, field, val) {
  const b = S.catalog.badges.find(x => x.id === id);
  if (!b) return;
  b[field] = val;
  clearCache();
  save(); renderBO();
}

function boAddBadge(catId, nivId) {
  const id = 'B_' + Date.now().toString(36);
  S.catalog.badges.push({ id, nm: 'Nouveau badge', em: '🏅', img: null, catId, nivId, secretMissionId: null });
  save(); renderBO();
  openBadgeModal(id);
}

function boDelBadgeById(id) {
  if (!confirm('Supprimer ce badge ?')) return;
  const idx = S.catalog.badges.findIndex(x => x.id === id);
  if (idx >= 0) S.catalog.badges.splice(idx, 1);
  save(); closeBOModal(); renderBO();
}

// ── Themes tab ─────────────────────────────
function renderBOThemes() {
  const themes = S.catalog.themes || [];
  const children = getChildList();

  const themeCards = themes.map((th, i) => {
    const isEditing = BO_EDIT_THEME === i;
    const usedBy = children.filter(ch => ch.theme === th.id);
    const usedLabel = usedBy.length ? usedBy.map(ch => ch.emoji).join(' ') : '';
    const editForm = isEditing ? renderThemeEditForm(i) : '';

    const dc = typeof deriveThemeColors === 'function' ? deriveThemeColors(th.principal, th.accent) : {};
    return `<div class="bo-item${isEditing?' has-override':''}" onclick="boEditTheme(${i})" style="cursor:pointer;flex-wrap:wrap;background:${dc.card||'var(--card)'};border-color:${dc.brd||'var(--brd)'};color:${dc.text||'var(--text)'}">
      <div style="display:flex;gap:4px;flex-shrink:0;align-items:center">
        <span style="width:20px;height:20px;border-radius:50%;background:${th.principal};display:inline-block;border:2px solid rgba(255,255,255,.15)"></span>
        <span style="width:14px;height:14px;border-radius:50%;background:${th.accent};display:inline-block;border:1px solid rgba(255,255,255,.1)"></span>
      </div>
      <div class="bo-item-body">
        <div class="bo-item-title" style="color:${dc.hi||th.principal};font-family:${th.fontTitle}">${escHtml(th.label)} ${usedLabel}</div>
        <div class="bo-item-sub" style="color:${dc.muted||'var(--muted)'};font-family:${th.fontBody}">${escHtml(th.fontTitle.split(',')[0].replace(/'/g,''))} · ${escHtml(th.fontBody.split(',')[0].replace(/'/g,''))}</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="event.stopPropagation();boDupTheme(${i})" title="Dupliquer" style="border-color:${dc.brd||'var(--brd)'};background:${dc.surf||'var(--surf)'}">📋</button>
        <button class="bo-icon-btn danger" onclick="event.stopPropagation();boDelTheme(${i})" title="Supprimer" style="border-color:${dc.brd||'var(--brd)'};background:${dc.surf||'var(--surf)'}">🗑️</button>
      </div>
      ${editForm}
    </div>`;
  }).join('');

  // Font size slider
  const mult = S.cfg.fontSize || 1.0;
  const pct = Math.round(mult * 100);

  // Global status colors
  const gc = S.cfg.statusColors || {};
  const statusHtml = [
    { key:'success', label:'Succes', def:'#00e676' },
    { key:'danger',  label:'Danger', def:'#ff3d7f' },
    { key:'warning', label:'Alerte', def:'#ffb300' },
  ].map(c => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
    <input type="color" value="${gc[c.key]||c.def}" onchange="S.cfg.statusColors=S.cfg.statusColors||{};S.cfg.statusColors['${c.key}']=this.value;save();render();renderBO()" style="width:28px;height:24px;padding:0;border:1px solid var(--brd);border-radius:4px;cursor:pointer">
    <span style="font-size:var(--fs-xs);color:var(--text)">${c.label}</span>
  </div>`).join('');

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">🎨 THÈMES</div>
      ${themeCards}
      <button class="bo-add-btn" onclick="boAddTheme()">+ Nouveau thème</button>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🚦 COULEURS GLOBALES</div>
      <div class="bo-sub" style="margin-bottom:8px">Communes à tous les thèmes</div>
      ${statusHtml}
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🔤 TAILLE DES POLICES</div>
      <div class="bo-row">
        <div><div class="bo-lbl">Multiplicateur : ${pct}%</div><div class="bo-sub">Affecte toutes les tailles de texte</div></div>
        <input type="range" min="80" max="150" step="5" value="${pct}" oninput="S.cfg.fontSize=+this.value/100;save();render();renderBO()" style="width:120px;accent-color:var(--hi)">
      </div>
    </div>`;
}

function renderThemeEditForm(idx) {
  const th = (S.catalog.themes || [])[idx];
  if (!th) return '';

  const fonts = ["'Share Tech Mono', monospace", "'Josefin Sans', sans-serif", "'Righteous', sans-serif", "'Nunito', sans-serif", "'Baloo 2', sans-serif", "'Patrick Hand', sans-serif", "'Geist', sans-serif", "'Roboto Condensed', sans-serif", "'Open Sans', sans-serif"];
  const titleOpts = fonts.map(f => `<option value="${f}" ${th.fontTitle===f?'selected':''}>${f.split(',')[0].replace(/'/g,'')}</option>`).join('');
  const bodyOpts = fonts.map(f => `<option value="${f}" ${th.fontBody===f?'selected':''}>${f.split(',')[0].replace(/'/g,'')}</option>`).join('');

  // Derive colors for preview
  const derived = typeof deriveThemeColors === 'function' ? deriveThemeColors(th.principal, th.accent) : {};
  const previewColors = Object.entries(derived).map(([k,v]) =>
    `<span title="${k}" style="width:10px;height:10px;border-radius:2px;background:${v};display:inline-block"></span>`
  ).join('');

  return `<div style="width:100%;padding-top:8px;border-top:1px solid var(--brd);margin-top:8px" onclick="event.stopPropagation()">
    <div class="bo-field"><label>Nom du thème</label><input value="${escHtml(th.label)}" onchange="boSetTheme(${idx},'label',this.value)"></div>
    <div class="bo-field-row">
      <div class="bo-field" style="flex:0;width:80px"><label>Principale</label><input type="color" value="${th.principal}" onchange="boSetTheme(${idx},'principal',this.value)" style="width:48px;height:32px;padding:0;border:1px solid var(--brd);border-radius:6px;cursor:pointer"></div>
      <div class="bo-field" style="flex:0;width:80px"><label>Accent</label><input type="color" value="${th.accent}" onchange="boSetTheme(${idx},'accent',this.value)" style="width:48px;height:32px;padding:0;border:1px solid var(--brd);border-radius:6px;cursor:pointer"></div>
      <div class="bo-field" style="flex:1"><label>Couleurs dérivées</label><div style="display:flex;gap:2px;flex-wrap:wrap;padding:8px 0">${previewColors}</div></div>
    </div>
    <div class="bo-field-row">
      <div class="bo-field"><label>Police titres</label><select onchange="boSetTheme(${idx},'fontTitle',this.value)">${titleOpts}</select></div>
      <div class="bo-field"><label>Police corps</label><select onchange="boSetTheme(${idx},'fontBody',this.value)">${bodyOpts}</select></div>
    </div>
  </div>`;
}

function boEditTheme(idx) { BO_EDIT_THEME = (BO_EDIT_THEME === idx) ? null : idx; renderBO(); }

function boSetTheme(idx, field, val) {
  const th = (S.catalog.themes || [])[idx];
  if (!th) return;
  th[field] = val;
  save(); render(); renderBO();
}

function boAddTheme() {
  if (!S.catalog.themes) S.catalog.themes = [];
  const id = 'theme-' + Date.now().toString(36);
  S.catalog.themes.push({
    id,
    label: 'Nouveau thème',
    principal: '#00cfff',
    accent: '#ff3d7f',
    fontTitle: "'Nunito', sans-serif",
    fontBody: "'Nunito', sans-serif",
  });
  save();
  BO_EDIT_THEME = S.catalog.themes.length - 1;
  renderBO();
}

function boDelTheme(idx) {
  const th = (S.catalog.themes || [])[idx];
  if (!th) return;
  const usedBy = getChildList().filter(ch => ch.theme === th.id);
  if (usedBy.length) {
    toast(`⚠️ Thème utilisé par ${usedBy.map(c => c.name).join(', ')}`, true);
    return;
  }
  if (!confirm(`Supprimer le thème "${th.label}" ?`)) return;
  S.catalog.themes.splice(idx, 1);
  if (BO_EDIT_THEME === idx) BO_EDIT_THEME = null;
  save(); renderBO();
}

// ── Économie tab ──────────────────────────────
let CALIB_CHILD = null;

function renderBOEconomie() {
  const activeChildren = getChildList().filter(c=>c.active);
  if (!CALIB_CHILD && activeChildren.length) CALIB_CHILD = activeChildren[0].id;

  // ── Module A : Simulateur ──
  const cheminHtml = CALIB_PREVIEW ? renderCalibChemins() : '';

  const simulateur = `
    <div class="bo-sec">
      <div class="bo-sec-title">📐 SIMULATEUR DE CALIBRAGE</div>
      <div class="bo-sub" style="margin-bottom:8px">Calcule deux chemins pour atteindre un objectif d'épargne.</div>
      <div class="bo-row"><div><div class="bo-lbl">Objectif d'épargne ${tipBtn('Montant total que l\'enfant devrait pouvoir gagner')}</div><div class="bo-sub">CHF total visé</div></div><input type="number" class="bo-input" id="calib-obj" value="${CALIB_PARAMS.obj}" placeholder="100" min="1"></div>
      <div class="bo-row"><div><div class="bo-lbl">Semaines cibles ${tipBtn('En combien de semaines l\'enfant devrait atteindre N4')}</div><div class="bo-sub">Durée souhaitée</div></div><input type="number" class="bo-input" id="calib-sem" value="${CALIB_PARAMS.sem}" placeholder="20" min="1"></div>
      <div class="bo-row"><div><div class="bo-lbl">Budget parent max / sem ${tipBtn('Budget maximum que vous consacrez aux missions par semaine')}</div><div class="bo-sub">CHF max par semaine</div></div><input type="number" class="bo-input" id="calib-bud" value="${CALIB_PARAMS.bud}" placeholder="15" min="1"></div>
      <div class="bo-row"><div><div class="bo-lbl">Argent de poche / sem</div><div class="bo-sub">CHF hors missions</div></div><input type="number" class="bo-input" id="calib-ap" value="${CALIB_PARAMS.ap}" min="0"></div>
      <div class="bo-row"><div><div class="bo-lbl">Missions / semaine</div><div class="bo-sub">Nombre moyen réalisées</div></div><input type="number" class="bo-input" id="calib-mps" value="${CALIB_PARAMS.mps}" min="1" max="20"></div>
      <button class="bo-btn bo-btn-save" onclick="calibPreview()" style="margin-top:8px">📐 Calculer</button>
      ${cheminHtml}
    </div>`;

  // ── Module B : Configuration par enfant ──
  const childSel = activeChildren.map(ch =>
    `<div class="bo-child-btn ${CALIB_CHILD===ch.id?'active':''}" onclick="CALIB_CHILD='${ch.id}';renderBO()">${escHtml(ch.emoji)} ${escHtml(ch.name)}</div>`
  ).join('');

  let configEnfant = '';
  if (CALIB_CHILD && S.children[CALIB_CHILD]) {
    const niveaux = getLevels(CALIB_CHILD).map(l => l.id);
    const ms = getMissions(CALIB_CHILD).filter(m => !isSecret(m));
    const moyRows = niveaux.map(nid => {
      const nivMs = ms.filter(m => missionNiv(CALIB_CHILD, m) === nid);
      const rawAvg = nivMs.length ? nivMs.reduce((a,m) => a + missionChf(CALIB_CHILD, m), 0) / nivMs.length : 0;
      const avg = nivMs.length ? chf(Math.round(rawAvg * 10) / 10) : '—';
      const nc = getNivColor(nid);
      return `<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;background:${nc}14;border-radius:6px;margin-bottom:4px">
        <span style="color:${nc};font-weight:800;min-width:28px;font-size:var(--fs-base)">${nid}</span>
        <span style="flex:1;font-size:var(--fs-sm);color:var(--muted)">${nivMs.length} missions · coeff ×${CHF_COEFFS[nid]||1}</span>
        <span style="font-weight:700;font-size:var(--fs-base)">~${avg} CHF</span>
      </div>`;
    }).join('');

    const lvls = getLevels(CALIB_CHILD);
    const seuilPct = S.children[CALIB_CHILD].seuilPct || 0.8;
    const seuilRows = lvls.map((l,i) => {
      if (i === 0) return `<div class="bo-row"><div><div class="bo-lbl" style="color:${l.color}">${escHtml(l.id)} — ${escHtml(l.label)}</div></div><span style="font-size:var(--fs-sm);color:var(--muted);width:70px;text-align:right">0.00</span></div>`;
      const isOv = l.seuilOverride;
      return `<div class="bo-row"><div><div class="bo-lbl" style="color:${l.color}">${escHtml(l.id)} — ${escHtml(l.label)} ${isOv?'<span style="font-size:var(--fs-xs);color:var(--warning)">(override)</span>':''}</div></div><input type="number" class="bo-input" value="${l.seuil}" min="0" step="1" onchange="boSetSeuilOverride('${CALIB_CHILD}','${l.id}',+this.value)" style="width:70px"></div>`;
    }).join('');

    configEnfant = `
    <div class="bo-sec">
      <div class="bo-sec-title">💰 CONFIGURATION PAR ENFANT</div>
      <div class="bo-child-sel">${childSel}</div>
      <div class="bo-row"><div><div class="bo-lbl">Base N1 (CHF) ${tipBtn('Montant de base pour les missions N1 — les autres niveaux en découlent via les coefficients')}</div><div class="bo-sub">Valeur de référence — tous les CHF en découlent</div></div><input type="number" class="bo-input" value="${S.children[CALIB_CHILD].baseN1||1}" min="0.1" max="20" step="0.1" onchange="boSetBaseN1('${CALIB_CHILD}',+this.value)" style="width:70px"></div>
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--muted);margin:10px 0 6px">Moyennes CHF par niveau (calculées)</div>
      ${moyRows}
      <div class="bo-row"><div><div class="bo-lbl">Bonus mission secrète (CHF) ${tipBtn('Montant supplémentaire accordé pour les missions secrètes, en plus du montant de base')}</div><div class="bo-sub">Montant bonus ajouté aux missions secrètes</div></div><input type="number" class="bo-input" value="${S.children[CALIB_CHILD].secretBonus??1}" min="0" step="0.5" onchange="S.children['${CALIB_CHILD}'].secretBonus=+this.value;clearCache();save();renderBO()" style="width:70px"></div>
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--muted);margin:14px 0 6px">Seuils de niveaux (auto ${Math.round(seuilPct*100)}%)</div>
      <div class="bo-row"><div><div class="bo-lbl">Rigueur seuils ${tipBtn('Pourcentage de missions à compléter dans un niveau avant de passer au suivant')}</div><div class="bo-sub">% des missions du niveau à compléter</div></div><input type="range" min="50" max="100" step="5" value="${Math.round(seuilPct*100)}" oninput="this.nextElementSibling.textContent=this.value+'%'" onchange="boSetSeuilPct('${CALIB_CHILD}',+this.value/100)" style="flex:1"><span style="min-width:36px;text-align:right;font-weight:700">${Math.round(seuilPct*100)}%</span></div>
      ${seuilRows}
      <button class="bo-btn bo-btn-warn" onclick="boResetSeuils('${CALIB_CHILD}')" style="margin-top:4px;font-size:var(--fs-sm)">↩️ Réinitialiser les overrides de seuils</button>
      <div style="display:flex;align-items:center;gap:10px;padding:6px 10px;background:rgba(255,100,0,.08);border-radius:6px;margin-top:14px">
        <span style="color:#ff6400;font-weight:800;min-width:28px;font-size:var(--fs-base)">🔥</span>
        <span style="flex:1;font-size:var(--fs-sm);color:var(--muted)">Streak ${S.cfg.streakDays||7}j · bonus ${chf(Math.round((S.children[CALIB_CHILD].baseN1||1) * 0.8 * 10) / 10)} CHF · seuil ${Math.round((S.cfg.streakPct||0.8)*100)}%</span>
      </div>
      <div class="bo-row" style="margin-top:4px"><div><div class="bo-lbl">Seuil journée parfaite ${tipBtn('% minimum de tâches cochées pour que la journée compte dans le streak')}</div><div class="bo-sub">% minimum de tâches validées pour compter dans le streak</div></div><div style="display:flex;align-items:center;gap:8px"><input type="range" min="0.5" max="1" step="0.05" value="${S.cfg.streakPct||0.8}" oninput="this.nextElementSibling.textContent=Math.round(this.value*100)+'%'" onchange="S.cfg.streakPct=parseFloat(this.value);save();renderBO()"><span style="font-weight:800;min-width:36px">${Math.round((S.cfg.streakPct||0.8)*100)}%</span></div></div>
    </div>`;
  }

  return `${simulateur}${configEnfant}`;
}

// ── Params tab ──────────────────────────────

function renderBOParams() {
  const activeChildren = getChildList().filter(c=>c.active);
  return `
    <div class="bo-sec">
      <div class="bo-sec-title">🎨 APPARENCE BACK OFFICE</div>
      <div class="bo-row"><div><div class="bo-lbl">Thème du Back Office</div><div class="bo-sub">Couleurs par défaut quand aucun enfant n'est sélectionné</div></div><select class="bo-input" onchange="S.cfg.boTheme=this.value;save();applyBOTheme()" style="width:auto">${(S.catalog.themes||[]).map(t=>`<option value="${t.id}" ${(S.cfg.boTheme||'theme-louis')===t.id?'selected':''}>${escHtml(t.label)}</option>`).join('')}</select></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🔑 CODE PIN</div>
      <div class="bo-row"><div><div class="bo-lbl">PIN actuel ${tipBtn('Code à 4 chiffres pour valider les missions et accéder au BO — ne pas partager avec les enfants')}</div><div class="bo-sub">4 chiffres</div></div><input type="password" class="bo-input" value="${S.pin}" maxlength="4" onchange="S.pin=this.value;save()" style="width:80px;letter-spacing:4px"></div>
      <div class="bo-row"><div><div class="bo-lbl">Désactiver le PIN ${tipBtn('Si activé, les validations ne demandent plus le PIN. Le PIN reste requis pour le back office.')}</div><div class="bo-sub">Validation directe sans code (sauf accès Back Office)</div></div><button class="bo-toggle ${S.cfg.skipPin?'on':''}" onclick="S.cfg.skipPin=!S.cfg.skipPin;save();renderBO()"></button></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">💾 IMPORT / EXPORT</div>
      <button class="bo-btn bo-btn-save" onclick="boExport()">📤 Exporter JSON ${tipBtn('Télécharger une sauvegarde complète de toutes les données')}</button>
      <div class="bo-field" style="margin-top:8px"><label>Importer JSON ${tipBtn('Restaurer une sauvegarde — ATTENTION : remplace toutes les données actuelles')}</label><input type="file" accept=".json" onchange="boImport(event)" style="padding:8px"></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🗑️ RÉINITIALISATIONS</div>
      ${activeChildren.map(ch=>`<button class="bo-btn bo-btn-danger" onclick="resetChild('${ch.id}')">♻️ Tout réinitialiser — ${escHtml(ch.emoji)} ${escHtml(ch.name)} ${tipBtn('DANGER : efface toute la progression (missions, tâches, badges, CHF). Irréversible.')}</button>`).join('')}
      ${activeChildren.map(ch=>`<button class="bo-btn bo-btn-warn" onclick="resetMs('${ch.id}')">↩️ Missions seulement — ${escHtml(ch.emoji)} ${escHtml(ch.name)} ${tipBtn('Remet les missions à zéro sans toucher au journalier ni aux CHF')}</button>`).join('')}
    </div>`;
}

// ── Calibrage engine ────────────────────────
function calibrer(objectif, semaines, budgetMax, argentPoche, missionsParSemaine) {
  // Collect all unique level IDs across active children
  const allNivs = [...new Set(getChildList().filter(c=>c.active).flatMap(c=>(c.levels||[]).map(l=>l.id)))];

  function computeChemin(baseN1, coutSem, sem) {
    const streakB = Math.max(0.1, Math.round(baseN1 * 0.8 * 10) / 10);
    const moyennes = {};
    allNivs.forEach(nid => {
      const coeff = CHF_COEFFS[nid] || 1;
      moyennes[nid] = chf(Math.round(baseN1 * coeff * 10) / 10);
    });
    return { baseN1: Math.round(baseN1 * 10) / 10, streakB, moyennes, niveaux: allNivs, coutParentSem: Math.round(coutSem * 10) / 10, semaines: sem };
  }

  // Chemin A — priorité temporel
  const missionsNecessaires = (objectif / semaines) - argentPoche;
  const baseN1_A = missionsNecessaires / missionsParSemaine;
  const coutParentSem_A = missionsNecessaires + argentPoche;
  const cheminA = { ...computeChemin(baseN1_A, coutParentSem_A, semaines), depasse: coutParentSem_A > budgetMax };

  // Chemin B — priorité budget
  const missionsDispo = budgetMax - argentPoche;
  const baseN1_B = missionsDispo / missionsParSemaine;
  const semainesReelles = Math.ceil(objectif / (missionsDispo + argentPoche));
  const cheminB = { ...computeChemin(baseN1_B, budgetMax, semainesReelles), depasse: false };

  return { cheminA, cheminB };
}

function renderCalibChemins() {
  if (!CALIB_PREVIEW) return '';
  const { cheminA, cheminB } = CALIB_PREVIEW;
  const activeChildren = getChildList().filter(c=>c.active);
  const childOpts = activeChildren.map(ch => `<option value="${ch.id}">${escHtml(ch.emoji)} ${escHtml(ch.name)}</option>`).join('');
  const semainesCibles = CALIB_PARAMS.sem;

  function renderChemin(label, icon, ch, key) {
    let alertHtml = '';
    if (key === 'cheminA' && ch.depasse) {
      alertHtml = `<div style="color:var(--danger);font-weight:700;margin:4px 0">⚠️ Dépasse le budget (${chf(ch.coutParentSem)} CHF/sem)</div>`;
    }
    if (key === 'cheminB' && ch.semaines > semainesCibles) {
      alertHtml = `<div style="color:var(--danger);font-weight:700;margin:4px 0">⚠️ Durée allongée : ${ch.semaines} semaines (cible : ${semainesCibles})</div>`;
    }
    const subtitle = key === 'cheminA'
      ? `Objectif en ${ch.semaines} sem · ${chf(ch.coutParentSem)} CHF/sem`
      : `Budget respecté · ${chf(ch.coutParentSem)} CHF/sem · ${ch.semaines} semaines`;
    return `<div style="flex:1;background:var(--card);border:1px solid ${alertHtml?'var(--danger)':'var(--brd)'};border-radius:10px;padding:12px;min-width:200px">
      <div style="font-weight:800;color:var(--hi);margin-bottom:6px">${icon} ${label}</div>
      <div style="font-size:var(--fs-sm);color:var(--muted);margin-bottom:8px">${subtitle}</div>
      ${alertHtml}
      <div style="font-size:var(--fs-xs);font-weight:800;color:var(--hi);margin-bottom:6px">Base N1 = ${chf(ch.baseN1)} CHF</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;margin-bottom:6px">${(ch.niveaux||getAllNivs().map(n=>n.id)).map(n=>{const nc=getNivColor(n);return`<div style="display:flex;justify-content:space-between;padding:3px 6px;font-size:var(--fs-xs);background:${nc}14;border-radius:4px"><span style="color:${nc};font-weight:800">${n}</span><span style="font-weight:700">~${ch.moyennes[n]||'—'}</span></div>`;}).join('')}</div>
      <div style="display:flex;justify-content:space-between;padding:3px 6px;font-size:var(--fs-xs);background:rgba(255,100,0,.08);border-radius:4px;margin-bottom:8px"><span style="color:#ff6400;font-weight:800">🔥 Streak</span><span style="font-weight:700">${chf(ch.streakB)} CHF</span></div>
      <div style="display:flex;gap:4px;align-items:center">
        <select id="calib-apply-${key}" style="flex:1;padding:6px;background:var(--surf);border:1px solid var(--brd);border-radius:6px;color:var(--text);font-size:var(--fs-sm)">${childOpts}</select>
        <button class="bo-btn bo-btn-save" onclick="calibApply('${key}',document.getElementById('calib-apply-${key}').value)" style="padding:6px 10px;font-size:var(--fs-sm)">Appliquer</button>
      </div>
    </div>`;
  }

  return `<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
    ${renderChemin('CHEMIN A — Priorité durée','⏱️',cheminA,'cheminA')}
    ${renderChemin('CHEMIN B — Priorité budget','💰',cheminB,'cheminB')}
  </div>
  <button class="bo-btn bo-btn-warn" onclick="calibCancel()" style="margin-top:8px;width:100%">❌ Effacer la simulation</button>`;
}

function calibPreview() {
  const obj = +document.getElementById('calib-obj').value;
  const sem = +document.getElementById('calib-sem').value;
  const bud = +document.getElementById('calib-bud').value;
  const ap  = +document.getElementById('calib-ap').value || 5;
  const mps = +document.getElementById('calib-mps').value || 4;
  if (!obj || !sem || !bud) { toast('⚠️ Remplir tous les champs'); return; }
  CALIB_PARAMS = { obj, sem, bud, ap, mps };
  CALIB_PREVIEW = calibrer(obj, sem, bud, ap, mps);
  renderBO();
}

function calibApply(chemin, cid) {
  if (!CALIB_PREVIEW || !cid) return;
  const data = CALIB_PREVIEW[chemin];
  if (!data) return;
  S.children[cid].baseN1 = data.baseN1;
  S.cfg.streakBonus = data.streakB;
  clearCache();
  computeLevelThresholds(cid);
  save(); renderBO();
  toast(`✅ Base N1 = ${chf(data.baseN1)} CHF appliqué à ${getChild(cid).name}`);
}

function calibCancel() { CALIB_PREVIEW = null; renderBO(); }

function boSetBaseN1(cid, val) {
  S.children[cid].baseN1 = val;
  clearCache();
  computeLevelThresholds(cid);
  save(); renderBO();
}

function boSetSeuilPct(cid, val) {
  S.children[cid].seuilPct = val;
  clearCache();
  computeLevelThresholds(cid);
  save(); renderBO();
}

function boSetSeuilOverride(cid, nid, val) {
  const lvl = S.children[cid].levels.find(l => l.id === nid);
  if (lvl) { lvl.seuil = val; lvl.seuilOverride = true; save(); renderBO(); }
}

function boResetSeuils(cid) {
  S.children[cid].levels.forEach(l => { delete l.seuilOverride; });
  clearCache();
  computeLevelThresholds(cid);
  save(); renderBO();
  toast('↩️ Seuils recalculés');
}

// ── Export / Import ─────────────────────────
function boExport() {
  track('Export données');
  const data = JSON.stringify(S, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `missions-heros-backup-${todayKey()}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('📤 Export téléchargé');
}

function boImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.version !== 4) { toast('⚠️ Format non reconnu (version ' + data.version + ')', true); return; }
      if (!confirm('Remplacer toutes les données par le fichier importé ?')) return;
      S = data;
      applyPatches(S);
      save(); renderBO(); render();
      toast('📥 Import réussi !');
    } catch(err) {
      toast('⚠️ Fichier invalide', true);
    }
  };
  reader.readAsText(file);
}

// ── Child / Level setters ───────────────────
function boSetChild(cid, field, val) {
  S.children[cid][field] = val;
  save(); renderBO();
}
function boAddChild() {
  const id = 'child_' + Date.now();
  S.children[id] = {
    name: 'Nouveau', age: 6, emoji: '🌈', active: false, theme: 'theme-louis',
    levels: [],
    missions: { include: '*', exclude: [], overrides: {}, extra: [] },
    dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
    state: { missionStates: {}, daily: {}, weeklyRec: {}, streakBonusBank: 0 }
  };
  getMissions(id).forEach(m => S.children[id].state.missionStates[m.id] = 'none');
  save(); BO_EDIT_CHILD = id; renderBO(); render();
}
function boSetLevel(cid, idx, field, val) {
  S.children[cid].levels[idx][field] = val;
  if(field==='color') S.children[cid].levels[idx].bg = levelBg(val);
  save(); renderBO();
}
function boAddLevel(cid) {
  const lvls = S.children[cid].levels;
  const n = lvls.length + 1;
  const col='#888888';
  lvls.push({ id:'N'+n, label:'NIVEAU '+n, emoji:'⭐', color:col, bg:levelBg(col), seuil: n*20, gatewayMission: null });
  save(); renderBO();
}
function boDelLevel(cid, idx) {
  if (!confirm('Supprimer ce niveau ?')) return;
  S.children[cid].levels.splice(idx, 1);
  save(); renderBO();
}

// ── Mission catalog setters ─────────────────
function boSetCatalogMission(mid, field, val) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (m) { m[field] = val; save(); renderBO(); }
}
function boSetRecurrence(mid, type) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (!m) return;
  const wasOnce = !m.recurrence || m.recurrence.type === 'once';
  const nombre = wasOnce && type !== 'once' ? getChildList().filter(c=>c.active).length : (m.recurrence?.nombre || 0);
  m.recurrence = { type, nombre: type === 'once' ? 0 : nombre };
  save(); renderBO();
}
function boSetRecurrenceNombre(mid, nombre) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (!m || !m.recurrence) return;
  m.recurrence.nombre = Math.max(0, nombre);
  save(); renderBO();
}
function boAddCatalogMission() {
  const id = 'M' + (S.catalog.missions.length + 1).toString().padStart(2,'0') + '_' + Date.now().toString(36);
  S.catalog.missions.push({
    id, cat: S.catalog.categories[0]?.id || 'courrier', nom: 'Nouvelle mission',
    niv: 'N1', chf: 2, diff: 1, description: '', recurrence: { type: 'once', nombre: 0 }
  });
  Object.keys(S.children).forEach(cid => {
    S.children[cid].state.missionStates[id] = 'none';
  });
  save(); BO_EDIT_MISSION = id; renderBO();
}
function boClearOverrides(mid) {
  Object.keys(S.children).forEach(cid => {
    delete S.children[cid].missions.overrides[mid];
  });
  save(); renderBO();
  toast('↩️ Surcharges supprimées');
}
function boDelCatalogMission(mid) {
  if (!confirm('Supprimer cette mission du catalogue ? Les données de progression seront conservées.')) return;
  const catMissions = S.catalog.missions.filter(m=>m.id!==mid);
  S.catalog.missions = catMissions;
  Object.keys(S.children).forEach(cid => {
    delete S.children[cid].missions.overrides[mid];
    const ei = S.children[cid].missions.exclude.indexOf(mid);
    if (ei >= 0) S.children[cid].missions.exclude.splice(ei, 1);
  });
  save(); BO_EDIT_MISSION = null; renderBO();
}
function boAddExtra(cid, type) {
  const seq = (S.children[cid][type].extra.length + 1).toString().padStart(2,'0');
  const id = `X-${cid}-${seq}`;
  if (type === 'missions') {
    S.children[cid].missions.extra.push({
      id, cat: S.catalog.categories[0]?.id || 'courrier', nom: 'Mission extra',
      niv: S.children[cid].levels[0]?.id || 'N1', chf: 2,
      description: '', recurrence: { type: 'once', nombre: 0 }
    });
    S.children[cid].state.missionStates[id] = 'none';
    BO_EDIT_EXTRA = 'M:' + (S.children[cid].missions.extra.length - 1);
  } else {
    S.children[cid].dailyTasks.extra.push({
      id, em: '📝', lbl: 'Nouvelle tâche', days: null, passive: false, description: ''
    });
    BO_EDIT_EXTRA = 'D:' + (S.children[cid].dailyTasks.extra.length - 1);
  }
  save(); renderBO();
}
function boDelExtra(cid, type, idx) {
  if (!confirm('Supprimer ?')) return;
  S.children[cid][type].extra.splice(idx, 1);
  save(); BO_EDIT_EXTRA = null; renderBO();
}
function boEditExtra(prefix, idx) {
  const key = prefix + ':' + idx;
  BO_EDIT_EXTRA = (BO_EDIT_EXTRA === key) ? null : key;
  renderBO();
}
function boSetExtra(cid, type, idx, field, val) {
  S.children[cid][type].extra[idx][field] = val;
  save(); renderBO();
}
function boSetExtraRecurrence(cid, idx, val) {
  const m = S.children[cid].missions.extra[idx];
  m.recurrence = { type: val, nombre: val === 'once' ? 0 : (m.recurrence?.nombre || 1) };
  save(); renderBO();
}
function renderExtraMissionEditForm(cid, idx) {
  const m = S.children[cid].missions.extra[idx];
  if (!m) return '';
  const cats = S.catalog.categories;
  const nivs = S.children[cid].levels || [];
  return `
      <div style="display:flex;gap:8px;align-items:stretch">
        <div style="flex:2;display:flex;flex-direction:column;gap:6px">
          <div class="bo-field" style="margin:0"><label>Catégorie</label><select onchange="boSetExtra('${cid}','missions',${idx},'cat',this.value)">${cats.map(c=>`<option value="${c.id}" ${m.cat===c.id?'selected':''}>${escHtml(c.label)}</option>`).join('')}</select></div>
          <div class="bo-field" style="margin:0"><label>Niveau</label><select onchange="boSetExtra('${cid}','missions',${idx},'niv',this.value)">${nivs.map(l=>`<option value="${l.id}" ${m.niv===l.id?'selected':''}>${escHtml(l.id)}</option>`).join('')}</select></div>
          <div class="bo-field" style="margin:0"><label>CHF</label><input type="number" value="${m.chf}" step=".1" onchange="boSetExtra('${cid}','missions',${idx},'chf',+this.value)"></div>
        </div>
        <div class="bo-field" style="flex:3;margin:0;display:flex;flex-direction:column"><label>Description</label><textarea style="flex:1;resize:none;font-style:italic" onchange="boSetExtra('${cid}','missions',${idx},'description',this.value)">${escHtml(m.description||'')}</textarea></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <div class="bo-field" style="flex:2;margin:0"><label>Récurrence</label><select onchange="boSetExtraRecurrence('${cid}',${idx},this.value)"><option value="once" ${m.recurrence?.type==='once'?'selected':''}>Une fois</option><option value="daily" ${m.recurrence?.type==='daily'?'selected':''}>Quotidienne</option><option value="weekly" ${m.recurrence?.type==='weekly'?'selected':''}>Hebdomadaire</option><option value="monthly" ${m.recurrence?.type==='monthly'?'selected':''}>Mensuelle</option></select></div>
        <div class="bo-field" style="flex:1;margin:0"><label>Nombre</label><input type="number" value="${m.recurrence?.type==='once'?1:(m.recurrence?.nombre||0)}" min="0" max="10" ${m.recurrence?.type==='once'?'disabled':''} onchange="boSetExtra('${cid}','missions',${idx},'recurrence',{type:'${m.recurrence?.type||'once'}',nombre:+this.value})"></div>
      </div>
      <button class="bo-btn bo-btn-danger" onclick="event.stopPropagation();boDelExtra('${cid}','missions',${idx})" style="margin-top:6px">🗑️ Supprimer</button>`;
}
function renderExtraDailyEditForm(cid, idx) {
  const t = S.children[cid].dailyTasks.extra[idx];
  if (!t) return '';
  const daysVal = t.days === null ? '' : t.days.join(',');
  return `
      <div class="bo-field"><label>Description</label><textarea style="font-style:italic" onchange="boSetExtra('${cid}','dailyTasks',${idx},'description',this.value)" onclick="event.stopPropagation()">${escHtml(t.description||'')}</textarea></div>
      <div class="bo-field-row bo-field-row-eq">
        <div class="bo-field"><label>Jours</label><input value="${daysVal}" placeholder="0=dim..6=sam" onchange="boSetExtra('${cid}','dailyTasks',${idx},'days',this.value?this.value.split(',').map(Number):null)" onclick="event.stopPropagation()"></div>
        <div class="bo-field"><label>Passif</label><select onchange="boSetExtra('${cid}','dailyTasks',${idx},'passive',this.value==='true')" onclick="event.stopPropagation()"><option value="false" ${!t.passive?'selected':''}>Non</option><option value="true" ${t.passive?'selected':''}>Oui</option></select></div>
      </div>
      <button class="bo-btn bo-btn-danger" onclick="event.stopPropagation();boDelExtra('${cid}','dailyTasks',${idx})" style="margin-top:6px">🗑️ Supprimer</button>`;
}

// ── Duplicate functions ─────────────────────
function boDupChild(cid) {
  const src = S.children[cid];
  if (!src) return;
  const newId = 'child-' + Date.now().toString(36);
  const copy = JSON.parse(JSON.stringify(src));
  copy.name += ' (copie)';
  copy.active = false;
  // Regenerate IDs for extras to avoid collisions
  (copy.missions.extra || []).forEach((m, i) => { m.id = 'X-' + newId + '-M' + Date.now().toString(36) + i; });
  (copy.dailyTasks.extra || []).forEach((t, i) => { t.id = 'X-' + newId + '-D' + Date.now().toString(36) + i; });
  S.children[newId] = copy;
  save(); BO_EDIT_CHILD = newId; renderBO();
}
function boDelChild(cid) {
  const ch = S.children[cid];
  if (!ch) return;
  if (!confirm(`Supprimer ${ch.name} ? Cette action est irréversible.`)) return;
  delete S.children[cid];
  if (BO_EDIT_CHILD === cid) BO_EDIT_CHILD = null;
  if (BO_CHILD === cid) BO_CHILD = null;
  save(); renderBO();
}
function boDupLevel(cid, idx) {
  const lvls = S.children[cid].levels;
  const src = lvls[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'N' + (lvls.length + 1);
  copy.label += ' (copie)';
  copy.gatewayMission = null;
  lvls.splice(idx + 1, 0, copy);
  save(); BO_EDIT_CHILD = cid; renderBO();
}
function boDupCat(idx) {
  const src = S.catalog.categories[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'cat-' + Date.now().toString(36);
  copy.label += ' (copie)';
  S.catalog.categories.splice(idx + 1, 0, copy);
  save(); BO_EDIT_CAT = idx + 1; BO_CATS_OPEN = true; renderBO();
}
function boDupCatalogMission(mid) {
  const src = S.catalog.missions.find(m => m.id === mid);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'M' + (S.catalog.missions.length + 1).toString().padStart(2, '0') + '_' + Date.now().toString(36);
  copy.nom += ' (copie)';
  const srcIdx = S.catalog.missions.indexOf(src);
  S.catalog.missions.splice(srcIdx + 1, 0, copy);
  Object.keys(S.children).forEach(cid => {
    S.children[cid].state.missionStates[copy.id] = 'none';
  });
  save(); BO_EDIT_MISSION = copy.id; renderBO();
}
function boDupDailyTask(idx) {
  const src = S.catalog.dailyTasks[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'dt_' + Date.now().toString(36);
  copy.lbl += ' (copie)';
  S.catalog.dailyTasks.splice(idx + 1, 0, copy);
  save(); BO_EDIT_DAILY = idx + 1; renderBO();
}
function boDupSection(idx) {
  const sections = S.catalog.dailySections || [];
  const src = sections[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'sec-' + Date.now().toString(36);
  copy.label += ' (copie)';
  sections.splice(idx + 1, 0, copy);
  save(); BO_SECTIONS_OPEN = true; BO_EDIT_SECTION = idx + 1; renderBO();
}
function boDupExtra(cid, type, idx) {
  const arr = S.children[cid][type].extra;
  const src = arr[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'X-' + cid + '-' + Date.now().toString(36);
  if (copy.nom) copy.nom += ' (copie)';
  if (copy.lbl) copy.lbl += ' (copie)';
  arr.splice(idx + 1, 0, copy);
  if (type === 'missions') {
    S.children[cid].state.missionStates[copy.id] = 'none';
    BO_EDIT_EXTRA = 'M:' + (idx + 1);
  } else {
    BO_EDIT_EXTRA = 'D:' + (idx + 1);
  }
  save(); renderBO();
}
function boDupTheme(idx) {
  const themes = S.catalog.themes || [];
  const src = themes[idx];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'theme-' + Date.now().toString(36);
  copy.label += ' (copie)';
  themes.splice(idx + 1, 0, copy);
  save(); BO_EDIT_THEME = idx + 1; renderBO();
}
function boDupBadge(badgeId) {
  const src = S.catalog.badges.find(x => x.id === badgeId);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'B_' + Date.now().toString(36);
  copy.nm += ' (copie)';
  copy.secretMissionId = null;
  S.catalog.badges.push(copy);
  save(); renderBO();
  openBadgeModal(copy.id);
}
