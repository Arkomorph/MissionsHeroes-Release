# Plan B: Back Office CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the back office from a monolithic scrollable page into a tabbed admin panel with full CRUD on all entities (enfants, missions, taches, badges, parametres).

**Architecture:** Replace `renderBO()` with a tab-based system. Each tab has its own render function. CRUD operations modify `S.catalog` or `S.children` and call `save()`. All in `index.html`.

**Tech Stack:** Vanilla JS ES6, localStorage, single file.

**Spec:** `docs/superpowers/specs/2026-03-24-data-model-design.md` — Back Office section.

---

## File Map

All changes in `index.html`:

| Section | Changes |
|---------|---------|
| CSS (lines 117-157) | Add tab navigation styles, form styles, modal styles for CRUD |
| BACK OFFICE section (lines 762-816) | **Rewrite entirely** — tab system + per-tab render functions |
| ACTIONS section | Add CRUD helper functions |

---

### Task 1: Add back office CSS + tab navigation skeleton

**Files:**
- Modify: `index.html` — CSS section + renderBO()

- [ ] **Step 1: Add CSS for BO tabs and forms**

Add before the closing `</style>` tag:

```css
.bo-tabs{display:flex;gap:4px;padding:8px 12px;background:var(--bg);border-bottom:1px solid var(--brd);overflow-x:auto;-webkit-overflow-scrolling:touch}
.bo-tab{padding:8px 12px;border-radius:var(--rs);cursor:pointer;font-size:11px;font-weight:800;color:var(--muted);background:transparent;border:1px solid transparent;transition:all .2s;white-space:nowrap;flex-shrink:0}
.bo-tab.active{background:var(--cyan);color:#000;border-color:var(--cyan)}
.bo-tab-content{display:none;padding:12px}.bo-tab-content.active{display:block}
.bo-form{background:var(--card);border:1px solid var(--brd);border-radius:var(--r);padding:14px;margin-bottom:10px}
.bo-form-title{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:700;color:var(--cyan);margin-bottom:10px;letter-spacing:1px}
.bo-field{margin-bottom:8px}
.bo-field label{display:block;font-size:10px;color:var(--muted);margin-bottom:3px;text-transform:uppercase;letter-spacing:.3px}
.bo-field input,.bo-field select,.bo-field textarea{width:100%;background:var(--surf);border:1px solid var(--brd2);color:var(--text);border-radius:6px;padding:7px 10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700}
.bo-field input:focus,.bo-field select:focus,.bo-field textarea:focus{outline:none;border-color:var(--cyan)}
.bo-field textarea{resize:vertical;min-height:50px}
.bo-field-row{display:flex;gap:8px}.bo-field-row .bo-field{flex:1}
.bo-add-btn{width:100%;padding:10px;background:transparent;border:2px dashed var(--brd2);border-radius:var(--r);color:var(--muted);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:10px;transition:all .2s}
.bo-add-btn:hover{border-color:var(--cyan);color:var(--cyan)}
.bo-item{background:var(--card);border:1px solid var(--brd);border-radius:var(--rs);padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.bo-item-body{flex:1;min-width:0}
.bo-item-title{font-size:12px;font-weight:700}.bo-item-sub{font-size:9px;color:var(--muted)}
.bo-item-actions{display:flex;gap:4px;flex-shrink:0}
.bo-icon-btn{width:30px;height:30px;border-radius:6px;border:1px solid var(--brd);background:var(--surf);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .15s}
.bo-icon-btn:hover{border-color:var(--cyan);color:var(--cyan)}
.bo-icon-btn.danger:hover{border-color:var(--pink);color:var(--pink)}
.bo-child-sel{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap}
.bo-child-btn{padding:6px 12px;border-radius:20px;border:1px solid var(--brd);background:var(--card);color:var(--muted);cursor:pointer;font-size:11px;font-weight:700;transition:all .15s}
.bo-child-btn.active{background:var(--cyan);color:#000;border-color:var(--cyan)}
```

- [ ] **Step 2: Replace renderBO() with tab system skeleton**

Replace the entire `renderBO()` function with:

```js
let BO_TAB = 'validation';
let BO_CHILD = null; // selected child for per-child tabs

function renderBO() {
  if (!BO_CHILD) BO_CHILD = (getChildList().find(c=>c.active)||getChildList()[0]).id;
  const tabs = [
    {id:'validation', label:'📅 Validation', icon:'📅'},
    {id:'enfants', label:'👨‍👧‍👦 Enfants', icon:'👨‍👧‍👦'},
    {id:'missions', label:'📋 Missions', icon:'📋'},
    {id:'taches', label:'✅ Tâches', icon:'✅'},
    {id:'badges', label:'🏅 Badges', icon:'🏅'},
    {id:'params', label:'⚙️ Paramètres', icon:'⚙️'},
  ];
  const tabHtml = tabs.map(t =>
    `<div class="bo-tab ${BO_TAB===t.id?'active':''}" onclick="boTab('${t.id}')">${t.label}</div>`
  ).join('');
  const contentHtml = {
    validation: renderBOValidation(),
    enfants: renderBOEnfants(),
    missions: renderBOMissions(),
    taches: renderBOTaches(),
    badges: renderBOBadges(),
    params: renderBOParams(),
  };
  document.getElementById('backoffice').innerHTML = `
    <div class="bo-hdr">
      <div class="bo-title">⚙️ BACK OFFICE PARENT</div>
      <button class="bo-close" onclick="closeBO()">← Retour</button>
    </div>
    <div class="bo-tabs">${tabHtml}</div>
    <div style="overflow-y:auto;flex:1">
      ${Object.entries(contentHtml).map(([id,html]) =>
        `<div class="bo-tab-content ${BO_TAB===id?'active':''}">${html}</div>`
      ).join('')}
    </div>`;
}

function boTab(id) { BO_TAB = id; renderBO(); }
function boChild(cid) { BO_CHILD = cid; renderBO(); }
```

- [ ] **Step 3: Add child selector helper (reused across tabs)**

```js
function renderChildSelector() {
  return `<div class="bo-child-sel">${getChildList().map(ch =>
    `<div class="bo-child-btn ${BO_CHILD===ch.id?'active':''}" onclick="boChild('${ch.id}')">${ch.emoji} ${ch.name}</div>`
  ).join('')}</div>`;
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: back office tab navigation skeleton + CSS"
```

---

### Task 2: Validation tab (migrate existing)

**Files:**
- Modify: `index.html` — add `renderBOValidation()`

- [ ] **Step 1: Extract existing validation logic into its own function**

Move the existing validation/review HTML generation into `renderBOValidation()`. This is mostly copying existing code from the old `renderBO()`:

```js
function renderBOValidation() {
  const yk = (()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);})();
  const reviewHtml = getChildList().filter(c=>c.active).map(ch => {
    const rec = S.children[ch.id].state.daily[yk];
    if(!rec) return `<div class="bo-row"><div><div class="bo-lbl">${ch.emoji} ${ch.name}</div><div class="bo-sub">Aucune donnée pour hier (${yk})</div></div></div>`;
    const app = getDailyTasks(ch.id).filter(t=>isApplicableOn(t,yk));
    const tasks = app.map(t=>`<div class="review-task"><input type="checkbox" id="rv_${ch.id}_${t.id}" ${rec.tasks[t.id]?'checked':''} onchange="setDT('${ch.id}','${yk}','${t.id}',this.checked)"><label for="rv_${ch.id}_${t.id}">${t.em} ${t.lbl}${t.passive?' <span style="font-size:9px;color:var(--purp)">(encouragement)</span>':''}</label></div>`).join('');
    return `<div class="review-day">
      <div class="review-hd"><span>${ch.emoji} ${ch.name} — ${yk}</span><span style="color:var(--muted)">${rec.parentValidated?'✅ Validé':'⏳ À valider'}</span></div>
      ${tasks}
      ${rec.parentValidated?`<div class="btn-val-day validated">✅ Journée validée</div>`:`<button class="btn-val-day" onclick="valDay('${ch.id}','${yk}')">✅ Valider la journée de ${ch.name}</button>`}
    </div>`;
  }).join('');
  return `<div class="bo-sec"><div class="bo-sec-title">📅 VALIDATION JOURNALIER — HIER (${yk})</div>${reviewHtml}</div>`;
}
```

- [ ] **Step 2: Verify — open BO, validation tab shows same content as before**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: BO validation tab extracted"
```

---

### Task 3: Enfants tab — profile CRUD + levels editor

**Files:**
- Modify: `index.html` — add `renderBOEnfants()` + CRUD actions

- [ ] **Step 1: Implement renderBOEnfants()**

```js
function renderBOEnfants() {
  const children = getChildList();
  const childCards = children.map(ch => `
    <div class="bo-item" style="border-left:3px solid ${ch.active?'var(--green)':'var(--dim)'}">
      <div style="font-size:24px">${ch.emoji}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${ch.name} <span style="font-size:10px;color:var(--muted)">${ch.age} ans</span></div>
        <div class="bo-item-sub">${ch.active?'✅ Actif':'🔜 Inactif'} · ${(ch.levels||[]).length} niveaux · ${getMissions(ch.id).length} missions</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="boEditChild('${ch.id}')">✏️</button>
      </div>
    </div>
  `).join('');

  // Edit form for selected child
  const editHtml = BO_EDIT_CHILD ? renderChildEditForm(BO_EDIT_CHILD) : '';

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">👨‍👧‍👦 ENFANTS</div>
      ${childCards}
      <button class="bo-add-btn" onclick="boAddChild()">+ Ajouter un enfant</button>
      ${editHtml}
    </div>`;
}
```

- [ ] **Step 2: Add child edit form with levels editor**

```js
let BO_EDIT_CHILD = null;

function boEditChild(cid) { BO_EDIT_CHILD = cid; renderBO(); }

function renderChildEditForm(cid) {
  const ch = S.children[cid];
  if (!ch) return '';
  const levelsHtml = (ch.levels||[]).map((l,i) => `
    <div class="bo-item">
      <div style="font-size:16px">${l.emoji}</div>
      <div class="bo-item-body">
        <div class="bo-field-row">
          <div class="bo-field"><label>ID</label><input value="${l.id}" onchange="boSetLevel('${cid}',${i},'id',this.value)" style="width:50px"></div>
          <div class="bo-field"><label>Nom</label><input value="${l.label}" onchange="boSetLevel('${cid}',${i},'label',this.value)"></div>
          <div class="bo-field"><label>Emoji</label><input value="${l.emoji}" onchange="boSetLevel('${cid}',${i},'emoji',this.value)" style="width:50px"></div>
          <div class="bo-field"><label>Seuil CHF</label><input type="number" value="${l.seuil}" min="0" max="999" onchange="boSetLevel('${cid}',${i},'seuil',+this.value)" style="width:70px"></div>
        </div>
        <div class="bo-field-row">
          <div class="bo-field"><label>Couleur</label><input type="color" value="${l.color}" onchange="boSetLevel('${cid}',${i},'color',this.value)" style="width:50px;height:30px;padding:2px"></div>
          <div class="bo-field"><label>Fond</label><input type="color" value="${l.bg}" onchange="boSetLevel('${cid}',${i},'bg',this.value)" style="width:50px;height:30px;padding:2px"></div>
          <div class="bo-field"><label>Gateway mission</label><input value="${l.gatewayMission||''}" placeholder="ex: M08" onchange="boSetLevel('${cid}',${i},'gatewayMission',this.value||null)"></div>
        </div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn danger" onclick="boDelLevel('${cid}',${i})">🗑️</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="bo-form" style="margin-top:12px">
      <div class="bo-form-title">✏️ ÉDITER — ${ch.emoji} ${ch.name}</div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Nom</label><input value="${ch.name}" onchange="boSetChild('${cid}','name',this.value)"></div>
        <div class="bo-field"><label>Âge</label><input type="number" value="${ch.age}" min="1" max="18" onchange="boSetChild('${cid}','age',+this.value)"></div>
        <div class="bo-field"><label>Emoji</label><input value="${ch.emoji}" onchange="boSetChild('${cid}','emoji',this.value)" style="width:60px"></div>
        <div class="bo-field"><label>Actif</label><select onchange="boSetChild('${cid}','active',this.value==='true')"><option value="true" ${ch.active?'selected':''}>Oui</option><option value="false" ${!ch.active?'selected':''}>Non</option></select></div>
      </div>
      <div class="bo-sec-title" style="margin-top:12px">🗺️ NIVEAUX</div>
      ${levelsHtml}
      <button class="bo-add-btn" onclick="boAddLevel('${cid}')">+ Ajouter un niveau</button>
      <button class="bo-btn bo-btn-save" onclick="BO_EDIT_CHILD=null;renderBO()">✅ Fermer</button>
    </div>`;
}
```

- [ ] **Step 3: Add CRUD actions for children and levels**

```js
function boSetChild(cid, field, val) {
  S.children[cid][field] = val;
  save(); renderBO();
}
function boAddChild() {
  const id = 'child_' + Date.now();
  S.children[id] = {
    name: 'Nouveau', age: 6, emoji: '🌈', active: false,
    levels: [],
    missions: { include: '*', exclude: [], overrides: {}, extra: [] },
    dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
    state: { missionStates: {}, daily: {}, weeklyRec: {} }
  };
  // Init mission states
  getMissions(id).forEach(m => S.children[id].state.missionStates[m.id] = 'none');
  save(); BO_EDIT_CHILD = id; renderBO(); render();
}
function boSetLevel(cid, idx, field, val) {
  S.children[cid].levels[idx][field] = val;
  save(); renderBO();
}
function boAddLevel(cid) {
  const lvls = S.children[cid].levels;
  const n = lvls.length + 1;
  lvls.push({ id:'N'+n, label:'NIVEAU '+n, emoji:'⭐', color:'#888888', bg:'#111111', seuil: n*20, gatewayMission: null });
  save(); renderBO();
}
function boDelLevel(cid, idx) {
  if (!confirm('Supprimer ce niveau ?')) return;
  S.children[cid].levels.splice(idx, 1);
  save(); renderBO();
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: BO enfants tab — profile CRUD + levels editor"
```

---

### Task 4: Missions tab — catalogue CRUD + per-child overrides

**Files:**
- Modify: `index.html` — add `renderBOMissions()` + CRUD actions

- [ ] **Step 1: Implement renderBOMissions()**

```js
function renderBOMissions() {
  const cats = S.catalog.categories;
  const childSel = renderChildSelector();

  // Catalogue missions grouped by category
  const catSections = cats.map(cat => {
    const ms = S.catalog.missions.filter(m => m.cat === cat.id);
    if (!ms.length) return '';
    const mCards = ms.map(m => {
      const ov = S.children[BO_CHILD]?.missions.overrides[m.id] || {};
      const exc = S.children[BO_CHILD]?.missions.exclude || [];
      const isExc = exc.includes(m.id);
      return `<div class="bo-item" style="opacity:${isExc?'.4':'1'}">
        <div style="font-size:9px;color:var(--muted);width:30px">${m.id}</div>
        <div class="bo-item-body">
          <div class="bo-item-title">${m.nom}</div>
          <div class="bo-item-sub">${m.niv} · ⭐×${m.diff} · ${m.chf} CHF${ov.chf?' → <span style="color:var(--amber)">'+ov.chf+' CHF</span>':''}${isExc?' · <span style="color:var(--pink)">exclu</span>':''}</div>
        </div>
        <div class="bo-item-actions">
          <button class="bo-icon-btn" onclick="boEditMission('${m.id}')">✏️</button>
          <button class="bo-icon-btn ${isExc?'':'danger'}" onclick="toggleMissionExclude('${BO_CHILD}','${m.id}',this);renderBO()" title="${isExc?'Réactiver':'Exclure'}">${isExc?'✅':'❌'}</button>
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:${cat.color};margin-bottom:6px">${cat.label} (${ms.length})</div>
      ${mCards}
    </div>`;
  }).join('');

  // Extra missions for selected child
  const extras = S.children[BO_CHILD]?.missions.extra || [];
  const extraHtml = extras.length ? extras.map((m,i) => `
    <div class="bo-item">
      <div style="font-size:9px;color:var(--purp);width:30px">${m.id}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${m.nom}</div>
        <div class="bo-item-sub">${m.niv} · ⭐×${m.diff} · ${m.chf} CHF · extra</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn danger" onclick="boDelExtra('${BO_CHILD}','missions',${i})">🗑️</button>
      </div>
    </div>
  `).join('') : '<div style="font-size:11px;color:var(--muted);padding:8px">Aucune mission extra</div>';

  const editHtml = BO_EDIT_MISSION ? renderMissionEditForm(BO_EDIT_MISSION) : '';

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">📋 MISSIONS — CATALOGUE</div>
      <button class="bo-add-btn" onclick="boAddCatalogMission()">+ Nouvelle mission au catalogue</button>
      ${catSections}
      ${editHtml}
      <div class="bo-sec-title" style="margin-top:16px">🎯 SURCHARGES & EXTRAS — ${S.children[BO_CHILD]?.emoji||''} ${S.children[BO_CHILD]?.name||''}</div>
      ${childSel}
      ${extraHtml}
      <button class="bo-add-btn" onclick="boAddExtra('${BO_CHILD}','missions')">+ Mission extra pour ${S.children[BO_CHILD]?.name||'enfant'}</button>
    </div>`;
}
```

- [ ] **Step 2: Add mission edit form**

```js
let BO_EDIT_MISSION = null;

function boEditMission(mid) { BO_EDIT_MISSION = mid; renderBO(); }

function renderMissionEditForm(mid) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (!m) return '';
  const cats = S.catalog.categories;
  const ov = S.children[BO_CHILD]?.missions.overrides[mid] || {};
  return `
    <div class="bo-form" style="margin:10px 0">
      <div class="bo-form-title">✏️ ÉDITER MISSION — ${m.id}</div>
      <div class="bo-field"><label>Nom</label><input value="${m.nom}" onchange="boSetCatalogMission('${mid}','nom',this.value)"></div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Catégorie</label><select onchange="boSetCatalogMission('${mid}','cat',this.value)">${cats.map(c=>`<option value="${c.id}" ${m.cat===c.id?'selected':''}>${c.label}</option>`).join('')}</select></div>
        <div class="bo-field"><label>Niveau</label><input value="${m.niv}" onchange="boSetCatalogMission('${mid}','niv',this.value)" style="width:50px"></div>
        <div class="bo-field"><label>Difficulté</label><input type="number" value="${m.diff}" min="1" max="4" onchange="boSetCatalogMission('${mid}','diff',+this.value)" style="width:50px"></div>
        <div class="bo-field"><label>CHF</label><input type="number" value="${m.chf}" min="1" max="99" step=".5" onchange="boSetCatalogMission('${mid}','chf',+this.value)" style="width:60px"></div>
      </div>
      <div class="bo-field"><label>Description</label><textarea onchange="boSetCatalogMission('${mid}','description',this.value)">${m.description||''}</textarea></div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Secret (catégorie)</label><input value="${m.secret||''}" placeholder="ex: courrier" onchange="boSetCatalogMission('${mid}','secret',this.value||null)"></div>
        <div class="bo-field"><label>Récurrence</label><select onchange="boSetCatalogMission('${mid}','recurrence',{type:this.value})"><option value="once" ${m.recurrence?.type==='once'?'selected':''}>Une fois</option><option value="weekly" ${m.recurrence?.type==='weekly'?'selected':''}>Hebdo</option><option value="monthly" ${m.recurrence?.type==='monthly'?'selected':''}>Mensuel</option></select></div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--brd)">
        <div style="font-size:10px;color:var(--amber);margin-bottom:6px">Surcharge pour ${S.children[BO_CHILD]?.emoji} ${S.children[BO_CHILD]?.name}:</div>
        <div class="bo-field-row">
          <div class="bo-field"><label>CHF override</label><input type="number" value="${ov.chf||''}" placeholder="catalogue: ${m.chf}" step=".5" onchange="setMissionOv('${BO_CHILD}','${mid}','chf',+this.value||undefined)"></div>
          <div class="bo-field"><label>Niveau override</label><input value="${ov.niv||''}" placeholder="catalogue: ${m.niv}" onchange="setMissionOv('${BO_CHILD}','${mid}','niv',this.value||undefined)"></div>
        </div>
      </div>
      <button class="bo-btn bo-btn-save" onclick="BO_EDIT_MISSION=null;renderBO()">✅ Fermer</button>
      <button class="bo-btn bo-btn-danger" onclick="boDelCatalogMission('${mid}')">🗑️ Supprimer du catalogue</button>
    </div>`;
}
```

- [ ] **Step 3: Add catalogue mission CRUD actions**

```js
function boSetCatalogMission(mid, field, val) {
  const m = S.catalog.missions.find(x=>x.id===mid);
  if (m) { m[field] = val; save(); renderBO(); }
}
function boAddCatalogMission() {
  const id = 'M' + (S.catalog.missions.length + 1).toString().padStart(2,'0') + '_' + Date.now().toString(36);
  S.catalog.missions.push({
    id, cat: S.catalog.categories[0]?.id || 'courrier', nom: 'Nouvelle mission',
    niv: 'N1', diff: 1, chf: 2, secret: null, description: '', recurrence: { type: 'once' }
  });
  // Init in all children states
  Object.keys(S.children).forEach(cid => {
    S.children[cid].state.missionStates[id] = 'none';
  });
  save(); BO_EDIT_MISSION = id; renderBO();
}
function boDelCatalogMission(mid) {
  if (!confirm('Supprimer cette mission du catalogue ? Les données de progression seront conservées.')) return;
  // Check referential integrity
  const catMissions = S.catalog.missions.filter(m=>m.id!==mid);
  S.catalog.missions = catMissions;
  // Clean overrides/exclude refs
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
      niv: S.children[cid].levels[0]?.id || 'N1', diff: 1, chf: 2, secret: null,
      description: '', recurrence: { type: 'once' }
    });
    S.children[cid].state.missionStates[id] = 'none';
  } else {
    S.children[cid].dailyTasks.extra.push({
      id, em: '📝', lbl: 'Nouvelle tâche', days: null, passive: false, description: ''
    });
  }
  save(); renderBO();
}
function boDelExtra(cid, type, idx) {
  if (!confirm('Supprimer ?')) return;
  S.children[cid][type].extra.splice(idx, 1);
  save(); renderBO();
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: BO missions tab — catalogue CRUD + per-child overrides"
```

---

### Task 5: Tâches journalières tab

**Files:**
- Modify: `index.html` — add `renderBOTaches()`

- [ ] **Step 1: Implement renderBOTaches()**

```js
function renderBOTaches() {
  const childSel = renderChildSelector();
  const tasks = S.catalog.dailyTasks;
  const taskCards = tasks.map((t,i) => {
    const ov = S.children[BO_CHILD]?.dailyTasks.overrides[t.id] || {};
    const exc = S.children[BO_CHILD]?.dailyTasks.exclude || [];
    const isExc = exc.includes(t.id);
    return `<div class="bo-item" style="opacity:${isExc?'.4':'1'}">
      <div style="font-size:18px">${t.em}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${t.lbl}</div>
        <div class="bo-item-sub">${t.days===null?'Tous les jours':'Jours: '+t.days.join(',')}${t.passive?' · 💬 Passif':''}${isExc?' · <span style="color:var(--pink)">exclu</span>':''}</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="boEditDailyTask(${i})">✏️</button>
        <button class="bo-icon-btn ${isExc?'':'danger'}" onclick="boToggleDailyExclude('${BO_CHILD}','${t.id}');renderBO()">${isExc?'✅':'❌'}</button>
      </div>
    </div>`;
  }).join('');

  const extras = S.children[BO_CHILD]?.dailyTasks.extra || [];
  const extraHtml = extras.map((t,i) => `
    <div class="bo-item">
      <div style="font-size:18px">${t.em}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${t.lbl}</div>
        <div class="bo-item-sub">${t.days===null?'Tous les jours':'Jours: '+t.days.join(',')}${t.passive?' · 💬 Passif':''} · extra</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn danger" onclick="boDelExtra('${BO_CHILD}','dailyTasks',${i})">🗑️</button>
      </div>
    </div>
  `).join('');

  const editHtml = BO_EDIT_DAILY !== null ? renderDailyEditForm(BO_EDIT_DAILY) : '';

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">✅ TÂCHES JOURNALIÈRES — CATALOGUE</div>
      <button class="bo-add-btn" onclick="boAddDailyTask()">+ Nouvelle tâche</button>
      ${taskCards}
      ${editHtml}
      <div class="bo-sec-title" style="margin-top:16px">🎯 EXCLUSIONS & EXTRAS — ${S.children[BO_CHILD]?.emoji||''} ${S.children[BO_CHILD]?.name||''}</div>
      ${childSel}
      ${extraHtml}
      <button class="bo-add-btn" onclick="boAddExtra('${BO_CHILD}','dailyTasks')">+ Tâche extra pour ${S.children[BO_CHILD]?.name||'enfant'}</button>
    </div>`;
}
```

- [ ] **Step 2: Add daily task edit form + CRUD actions**

```js
let BO_EDIT_DAILY = null;

function boEditDailyTask(idx) { BO_EDIT_DAILY = idx; renderBO(); }

function renderDailyEditForm(idx) {
  const t = S.catalog.dailyTasks[idx];
  if (!t) return '';
  const daysVal = t.days === null ? '' : t.days.join(',');
  return `
    <div class="bo-form" style="margin:10px 0">
      <div class="bo-form-title">✏️ ÉDITER TÂCHE — ${t.id}</div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Emoji</label><input value="${t.em}" onchange="boSetDailyTask(${idx},'em',this.value)" style="width:60px"></div>
        <div class="bo-field"><label>Libellé</label><input value="${t.lbl}" onchange="boSetDailyTask(${idx},'lbl',this.value)"></div>
      </div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Jours (vide=tous, 0=dim..6=sam)</label><input value="${daysVal}" placeholder="ex: 0,3" onchange="boSetDailyTask(${idx},'days',this.value?this.value.split(',').map(Number):null)"></div>
        <div class="bo-field"><label>Passif</label><select onchange="boSetDailyTask(${idx},'passive',this.value==='true')"><option value="false" ${!t.passive?'selected':''}>Non</option><option value="true" ${t.passive?'selected':''}>Oui</option></select></div>
      </div>
      <div class="bo-field"><label>Description</label><textarea onchange="boSetDailyTask(${idx},'description',this.value)">${t.description||''}</textarea></div>
      <button class="bo-btn bo-btn-save" onclick="BO_EDIT_DAILY=null;renderBO()">✅ Fermer</button>
      <button class="bo-btn bo-btn-danger" onclick="boDelDailyTask(${idx})">🗑️ Supprimer</button>
    </div>`;
}

function boSetDailyTask(idx, field, val) {
  S.catalog.dailyTasks[idx][field] = val;
  save(); renderBO();
}
function boAddDailyTask() {
  const id = 'dt' + (S.catalog.dailyTasks.length + 1);
  S.catalog.dailyTasks.push({ id, em: '📝', lbl: 'Nouvelle tâche', days: null, passive: false, description: '' });
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
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: BO daily tasks tab — catalogue CRUD + per-child exclusions"
```

---

### Task 6: Badges tab

**Files:**
- Modify: `index.html` — add `renderBOBadges()`

- [ ] **Step 1: Implement renderBOBadges() + CRUD**

```js
let BO_EDIT_BADGE = null;

function renderBOBadges() {
  const badges = S.catalog.badges;
  const badgeCards = badges.map((b,i) => `
    <div class="bo-item">
      <div style="font-size:22px">${b.img?`<img src="${b.img}" style="width:28px;height:28px;object-fit:contain" onerror="this.outerHTML='${b.em}'">`:b.em}</div>
      <div class="bo-item-body">
        <div class="bo-item-title">${b.nm}</div>
        <div class="bo-item-sub">${getCatLabel(b.catId)} · ${b.nivId}${b.img?' · 🖼️':''}</div>
      </div>
      <div class="bo-item-actions">
        <button class="bo-icon-btn" onclick="boEditBadge(${i})">✏️</button>
        <button class="bo-icon-btn danger" onclick="boDelBadge(${i})">🗑️</button>
      </div>
    </div>
  `).join('');

  const editHtml = BO_EDIT_BADGE !== null ? renderBadgeEditForm(BO_EDIT_BADGE) : '';

  return `
    <div class="bo-sec">
      <div class="bo-sec-title">🏅 BADGES — CATALOGUE</div>
      <button class="bo-add-btn" onclick="boAddBadge()">+ Nouveau badge</button>
      ${badgeCards}
      ${editHtml}
    </div>`;
}

function boEditBadge(idx) { BO_EDIT_BADGE = idx; renderBO(); }

function renderBadgeEditForm(idx) {
  const b = S.catalog.badges[idx];
  if (!b) return '';
  const cats = S.catalog.categories;
  return `
    <div class="bo-form" style="margin:10px 0">
      <div class="bo-form-title">✏️ ÉDITER BADGE — ${b.id}</div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Nom</label><input value="${b.nm}" onchange="boSetBadge(${idx},'nm',this.value)"></div>
        <div class="bo-field"><label>Emoji</label><input value="${b.em}" onchange="boSetBadge(${idx},'em',this.value)" style="width:60px"></div>
      </div>
      <div class="bo-field-row">
        <div class="bo-field"><label>Catégorie</label><select onchange="boSetBadge(${idx},'catId',this.value)">${cats.map(c=>`<option value="${c.id}" ${b.catId===c.id?'selected':''}>${c.label}</option>`).join('')}</select></div>
        <div class="bo-field"><label>Niveau</label><input value="${b.nivId}" onchange="boSetBadge(${idx},'nivId',this.value)" style="width:50px"></div>
      </div>
      <div class="bo-field"><label>Image URL (Synology)</label><input value="${b.img||''}" placeholder="https://mon-syno.com/badges/image.png" onchange="boSetBadge(${idx},'img',this.value||null)"></div>
      ${b.img?`<div style="margin:6px 0"><img src="${b.img}" style="width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid var(--brd)" onerror="this.alt='⚠️ Image inaccessible'"></div>`:''}
      <button class="bo-btn bo-btn-save" onclick="BO_EDIT_BADGE=null;renderBO()">✅ Fermer</button>
    </div>`;
}

function boSetBadge(idx, field, val) {
  S.catalog.badges[idx][field] = val;
  save(); renderBO();
}
function boAddBadge() {
  const id = 'B_' + Date.now().toString(36);
  S.catalog.badges.push({ id, nm: 'Nouveau badge', em: '🏅', img: null, catId: S.catalog.categories[0]?.id || 'courrier', nivId: 'N1' });
  save(); BO_EDIT_BADGE = S.catalog.badges.length - 1; renderBO();
}
function boDelBadge(idx) {
  if (!confirm('Supprimer ce badge ?')) return;
  S.catalog.badges.splice(idx, 1);
  save(); BO_EDIT_BADGE = null; renderBO();
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: BO badges tab — CRUD + image URL support"
```

---

### Task 7: Paramètres tab — config + import/export

**Files:**
- Modify: `index.html` — add `renderBOParams()`

- [ ] **Step 1: Implement renderBOParams()**

```js
function renderBOParams() {
  const activeChildren = getChildList().filter(c=>c.active);
  return `
    <div class="bo-sec">
      <div class="bo-sec-title">💸 BONUS / MALUS</div>
      <div class="bo-row"><div><div class="bo-lbl">Malus / tâche manquée</div><div class="bo-sub">CHF déduit</div></div><input type="number" class="bo-input" value="${S.cfg.malus}" min="0" max="1" step=".05" onchange="S.cfg.malus=+this.value;save()"></div>
      <div class="bo-row"><div><div class="bo-lbl">Bonus / tâche accomplie</div><div class="bo-sub">CHF ajouté (journée parfaite)</div></div><input type="number" class="bo-input" value="${S.cfg.bonus}" min="0" max="2" step=".05" onchange="S.cfg.bonus=+this.value;save()"></div>
      <div class="bo-row"><div><div class="bo-lbl">Bonus streak</div><div class="bo-sub">CHF bonus</div></div><input type="number" class="bo-input" value="${S.cfg.streakBonus}" min="0" max="5" step=".5" onchange="S.cfg.streakBonus=+this.value;save()"></div>
      <div class="bo-row"><div><div class="bo-lbl">Jours pour streak</div></div><input type="number" class="bo-input" value="${S.cfg.streakDays||7}" min="3" max="30" onchange="S.cfg.streakDays=+this.value;save()"></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🔑 CODE PIN</div>
      <div class="bo-row"><div><div class="bo-lbl">PIN actuel</div><div class="bo-sub">4 chiffres</div></div><input type="password" class="bo-input" value="${S.pin}" maxlength="4" onchange="S.pin=this.value;save()" style="width:80px;letter-spacing:4px"></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">💾 IMPORT / EXPORT</div>
      <button class="bo-btn bo-btn-save" onclick="boExport()">📤 Exporter JSON</button>
      <div class="bo-field" style="margin-top:8px"><label>Importer JSON</label><input type="file" accept=".json" onchange="boImport(event)" style="padding:8px"></div>
    </div>
    <div class="bo-sec" style="padding-top:0">
      <div class="bo-sec-title">🗑️ RÉINITIALISATIONS</div>
      ${activeChildren.map(ch=>`<button class="bo-btn bo-btn-danger" onclick="resetChild('${ch.id}')">♻️ Tout réinitialiser — ${ch.emoji} ${ch.name}</button>`).join('')}
      ${activeChildren.map(ch=>`<button class="bo-btn bo-btn-warn" onclick="resetMs('${ch.id}')">↩️ Missions seulement — ${ch.emoji} ${ch.name}</button>`).join('')}
    </div>`;
}
```

- [ ] **Step 2: Add import/export functions**

```js
function boExport() {
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
      save(); renderBO(); render();
      toast('📥 Import réussi !');
    } catch(err) {
      toast('⚠️ Fichier invalide', true);
    }
  };
  reader.readAsText(file);
}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: BO params tab — config, PIN, import/export, resets"
```

---

### Task 8: Cleanup + adjust backoffice CSS layout

**Files:**
- Modify: `index.html` — adjust backoffice container CSS for tab layout

- [ ] **Step 1: Update #backoffice CSS for flex layout**

Find the `#backoffice` CSS rule and update:
```css
#backoffice{display:none;position:fixed;inset:0;z-index:90;background:var(--bg);overflow:hidden;flex-direction:column}
#backoffice.open{display:flex}
```

(Change `overflow-y:auto` to `overflow:hidden` + `flex-direction:column` since the scrollable area is now inside the tab content)

- [ ] **Step 2: Remove any leftover references to old renderBO sections**

Verify no old inline BO sections remain. The new `renderBO()` now calls `renderBOValidation()`, `renderBOEnfants()`, `renderBOMissions()`, `renderBOTaches()`, `renderBOBadges()`, `renderBOParams()`.

Remove old helper functions if still present: `setLevelThreshold` (replaced by `boSetLevel`).

- [ ] **Step 3: Verify all tabs work in browser**

Open index.html → BO → check each tab:
1. 📅 Validation — shows yesterday's tasks for active children
2. 👨‍👧‍👦 Enfants — list children, edit, add levels
3. 📋 Missions — browse catalogue, edit, add/exclude per child
4. ✅ Tâches — browse daily tasks, edit, exclude per child
5. 🏅 Badges — browse, edit, set image URLs
6. ⚙️ Paramètres — bonus/malus, PIN, import/export, resets

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: BO complete — tabbed interface with full CRUD"
```
