# Plan A: Data Model + Migration + Rewire

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-coded JS constants with a localStorage-driven data model (mh_v4) while preserving all existing behavior.

**Architecture:** Add migration + resolution layer alongside existing code, then rewire all functions one section at a time, then remove old constants. The app keeps working at every step.

**Tech Stack:** Vanilla JS ES6, localStorage, single file (index.html).

**Spec:** `docs/superpowers/specs/2026-03-24-data-model-design.md`

---

## File Map

All changes in `index.html`. Sections of the `<script>` block:

| Section | Lines | Changes |
|---------|-------|---------|
| DATA (constants) | 191-335 | **Delete entirely** at the end |
| STATE | 337-344 | **Rewrite** — load mh_v4, migration, new save() |
| HELPERS | 346-382 | **Rewrite** — use per-child resolution |
| RENDER | 384-519 | **Rewire** — use per-child data |
| BACK OFFICE | 521-562 | **Rewire** — read/write mh_v4 structure |
| ACTIONS | 564-613 | **Rewire** — use new state paths |

Strategy: insert new code **above** old code, switch over function by function, remove old code last.

---

### Task 1: Add migration function and v4 bootstrap

**Files:**
- Modify: `index.html` — add new section between DATA and STATE

This task adds the migration function and v4 loading logic **alongside** the existing code. Nothing is removed yet.

- [ ] **Step 1: Add category ID mapping helper**

Insert after line 335 (end of BADGES), before STATE section:

```js
// ══════════════════════════════════════════════
// V4 DATA LAYER
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
```

- [ ] **Step 2: Add the migration function**

```js
function migrateV3toV4() {
  const raw = localStorage.getItem('mh_v3');
  const v3 = raw ? JSON.parse(raw) : null;

  // Build catalog.categories from CAT constant
  const categories = Object.entries(CAT).map(([label, color]) => ({
    id: CAT_ID_MAP[label], label, color
  }));

  // Build catalog.missions from MISSIONS constant
  const missions = MISSIONS.map(m => {
    const o = {
      id: m.id, cat: CAT_ID_MAP[m.cat], nom: m.nom, niv: m.niv,
      diff: m.diff, chf: m.chf, secret: m.secret ? CAT_ID_MAP[m.secret] : null,
      description: '', recurrence: { type: 'once' }
    };
    return o;
  });

  // Build catalog.dailyTasks from DAILY constant
  const dailyTasks = DAILY.map(t => ({
    id: t.id, em: t.em, lbl: t.lbl,
    days: t.always ? null : (t.days || null),
    passive: !!t.passive,
    description: ''
  }));

  // Build catalog.badges from BADGES constant
  const badges = BADGES.map(b => ({
    id: b.id, nm: b.nm, em: b.em, img: null,
    catId: CAT_ID_MAP[b.cat], nivId: b.niv
  }));

  // Build Louis levels from LEVELS + gateway missions + v3 thresholds
  const v3cfg = v3 ? v3.cfg : {};
  const v3thresholds = v3cfg.thresholds || {};
  const gatewayByNiv = {};
  MISSIONS.forEach(m => { if (m.gateway) gatewayByNiv[m.niv] = m.id; });
  const levels = LEVELS.map(l => ({
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

  const mkEmptyChild = (name, age, emoji) => ({
    name, age, emoji, active: false,
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
        name: 'Louis', age: 10, emoji: '⚡', active: true,
        levels,
        missions: { include: '*', exclude, overrides, extra: [] },
        dailyTasks: { include: '*', exclude: [], overrides: {}, extra: [] },
        state: louisState
      },
      emile: mkEmptyChild('Émile', 8, '🌟'),
      marius: mkEmptyChild('Marius', 4, '🦁')
    },
    cfg: {
      malus: v3cfg.malus ?? 0.10,
      bonus: v3cfg.bonus ?? 0.20,
      streakBonus: v3cfg.streakBonus ?? 1,
      streakDays: 7
    }
  };
}
```

- [ ] **Step 3: Add resolution functions**

```js
// ── Resolution functions ──
function getMissions(cid) {
  const child = S.children[cid];
  const inc = child.missions.include;
  const wl = ['chf','diff','niv','nom','description'];
  return S.catalog.missions
    .filter(m => inc === '*' || inc.includes(m.id))
    .filter(m => !child.missions.exclude.includes(m.id))
    .map(m => {
      const ov = child.missions.overrides[m.id];
      if (!ov) return m;
      const safe = {};
      wl.forEach(k => { if (ov[k] !== undefined) safe[k] = ov[k]; });
      return { ...m, ...safe };
    })
    .concat(child.missions.extra);
}

function getDailyTasks(cid) {
  const child = S.children[cid];
  const inc = child.dailyTasks.include;
  const wl = ['lbl','days','passive','description'];
  return S.catalog.dailyTasks
    .filter(t => inc === '*' || inc.includes(t.id))
    .filter(t => !child.dailyTasks.exclude.includes(t.id))
    .map(t => {
      const ov = child.dailyTasks.overrides[t.id];
      if (!ov) return t;
      const safe = {};
      wl.forEach(k => { if (ov[k] !== undefined) safe[k] = ov[k]; });
      return { ...t, ...safe };
    })
    .concat(child.dailyTasks.extra);
}

function getLevels(cid) { return S.children[cid].levels; }
function getChild(cid) { return S.children[cid]; }
function getChildList() {
  return Object.entries(S.children).map(([id, c]) => ({ id, ...c }));
}
function getCatColor(catId) {
  const cat = S.catalog.categories.find(c => c.id === catId);
  return cat ? cat.color : '#888';
}
function getCatLabel(catId) {
  const cat = S.catalog.categories.find(c => c.id === catId);
  return cat ? cat.label : catId;
}
function missionNiv(cid, m) {
  const ov = S.children[cid].missions.overrides[m.id];
  return (ov && ov.niv) || m.niv;
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add v4 migration function and resolution layer"
```

---

### Task 2: Switch state loading to mh_v4

**Files:**
- Modify: `index.html` — STATE section (lines 337-344)

Replace the entire STATE section. The old `S` loaded from `mh_v3` is replaced by `S` loaded from `mh_v4`.

- [ ] **Step 1: Replace STATE section**

Replace lines 340-344:
```js
const KEY='mh_v3';
function mkChild(){const m={};MISSIONS.forEach(x=>m[x.id]='none');return{m,daily:{},streak:0,weeklyRec:{}};}
function defState(){return{pin:'1234',cfg:{malus:.10,bonus:.20,streakBonus:1,thresholds:{N2:20,N3:45,N4:90},mCHF:{},mActive:{}},ch:{louis:mkChild(),emile:mkChild(),marius:mkChild()}};}
let S=(()=>{try{const r=localStorage.getItem(KEY);if(!r)return defState();const s=JSON.parse(r);['louis','emile','marius'].forEach(id=>{if(!s.ch[id])s.ch[id]=mkChild();MISSIONS.forEach(x=>{if(s.ch[id].m[x.id]===undefined)s.ch[id].m[x.id]='none';});if(!s.ch[id].weeklyRec)s.ch[id].weeklyRec={};});if(!s.cfg.mCHF)s.cfg.mCHF={};if(!s.cfg.mActive)s.cfg.mActive={};return s;}catch(e){return defState();}})();
function save(){localStorage.setItem(KEY,JSON.stringify(S));}
```

With:
```js
const KEY_V4 = 'mh_v4';
let S = (()=>{
  try {
    const raw = localStorage.getItem(KEY_V4);
    if (raw) return JSON.parse(raw);
    // Migrate from v3 or create fresh
    const v4 = migrateV3toV4();
    localStorage.setItem(KEY_V4, JSON.stringify(v4));
    localStorage.removeItem('mh_v3');
    return v4;
  } catch(e) {
    return migrateV3toV4();
  }
})();

// Ensure new missions/tasks in catalog get initialized in state
Object.keys(S.children).forEach(cid => {
  const ms = getMissions(cid);
  ms.forEach(m => {
    if (S.children[cid].state.missionStates[m.id] === undefined)
      S.children[cid].state.missionStates[m.id] = 'none';
  });
});

function save() { localStorage.setItem(KEY_V4, JSON.stringify(S)); }
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Console:
```js
JSON.parse(localStorage.getItem('mh_v4')).version // Expected: 4
JSON.parse(localStorage.getItem('mh_v4')).catalog.missions.length // Expected: 61
JSON.parse(localStorage.getItem('mh_v3')) // Expected: null (deleted)
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: switch state loading to mh_v4 with auto-migration"
```

---

### Task 3: Rewire helper functions to use resolution layer

**Files:**
- Modify: `index.html` — HELPERS section (lines 346-382)

Replace functions that reference old constants/structure with ones that use the v4 resolution layer.

- [ ] **Step 1: Replace mCHF and mActive**

```js
// Before:
function mCHF(m){return S.cfg.mCHF[m.id]??m.chf;}
function mActive(m){const v=S.cfg.mActive[m.id];return v===undefined?true:v;}
// After:
// mCHF and mActive are no longer needed — resolved missions already have correct chf
// and excluded missions are already filtered out by getMissions()
```

Delete these two functions entirely. They're replaced by the resolution layer.

- [ ] **Step 2: Replace isApplicable functions**

```js
// Before:
function isApplicable(t){if(t.always)return true;return t.days&&t.days.includes(new Date().getDay());}
function isApplicableOn(t,dk){if(t.always)return true;const d=new Date(dk+'T12:00:00');return t.days&&t.days.includes(d.getDay());}
// After (v4 uses days:null for always):
function isApplicable(t){return t.days===null||t.days===undefined||t.days.includes(new Date().getDay());}
function isApplicableOn(t,dk){if(t.days===null||t.days===undefined)return true;const d=new Date(dk+'T12:00:00');return t.days.includes(d.getDay());}
```

- [ ] **Step 3: Replace getDR to use per-child daily tasks**

```js
// Before:
function getDR(cid,dk){if(!S.ch[cid].daily[dk]){const r={tasks:{},parentValidated:false,bonus:0,malus:0};DAILY.forEach(t=>r.tasks[t.id]=false);S.ch[cid].daily[dk]=r;}return S.ch[cid].daily[dk];}
// After:
function getDR(cid,dk){
  const st=S.children[cid].state;
  if(!st.daily[dk]){
    const r={tasks:{},parentValidated:false,bonus:0,malus:0};
    getDailyTasks(cid).forEach(t=>r.tasks[t.id]=false);
    st.daily[dk]=r;
  }
  return st.daily[dk];
}
```

- [ ] **Step 4: Replace calcBal to use per-child daily tasks**

```js
// Before:
function calcBal(cid,dk){const rec=S.ch[cid].daily[dk];if(!rec)return{bonus:0,malus:0,net:0,done:0,total:0};const app=DAILY.filter(t=>isApplicableOn(t,dk)&&!t.passive);...}
// After:
function calcBal(cid,dk){
  const rec=S.children[cid].state.daily[dk];
  if(!rec)return{bonus:0,malus:0,net:0,done:0,total:0};
  const app=getDailyTasks(cid).filter(t=>isApplicableOn(t,dk)&&!t.passive);
  const done=app.filter(t=>rec.tasks[t.id]).length;
  const missed=app.length-done;
  const allDone=missed===0;
  return{bonus:allDone?S.cfg.bonus*app.length:0,malus:missed*S.cfg.malus,net:(allDone?S.cfg.bonus*app.length:0)-missed*S.cfg.malus,done,total:app.length};
}
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: rewire helper functions to v4 resolution layer"
```

---

### Task 4: Rewire financial + level + badge functions

**Files:**
- Modify: `index.html` — financial, level, badge, streak, recovery sections

- [ ] **Step 1: Replace financial functions**

```js
// earnM — use resolved missions + state path
function earnM(cid){
  return getMissions(cid).filter(m=>S.children[cid].state.missionStates[m.id]==='done')
    .reduce((a,m)=>a+m.chf,0);
}
// earnD — state path change
function earnD(cid){let t=0;Object.entries(S.children[cid].state.daily).forEach(([dk,rec])=>{if(rec.parentValidated)t+=rec.bonus-rec.malus;});return t;}
// earnRec — state path change
function earnRec(cid){let t=0;Object.entries(S.children[cid].state.weeklyRec).forEach(([wk,st])=>{if(st==='done'){let mal=0;Object.entries(S.children[cid].state.daily).forEach(([dk,rec])=>{if(weekKey(dk)===wk&&rec.parentValidated)mal+=rec.malus;});t+=mal;}});return t;}
// totalE — no change needed
```

- [ ] **Step 2: Replace level functions**

```js
// curLvl — use per-child levels
function curLvl(cid){
  const e=totalE(cid);const lvls=getLevels(cid);
  for(let i=lvls.length-1;i>=0;i--){if(e>=lvls[i].seuil)return lvls[i];}
  return lvls[0];
}
// isLvlOk — use per-child levels
function isLvlOk(cid,nid){
  const lvl=getLevels(cid).find(l=>l.id===nid);
  if(!lvl)return false;
  return totalE(cid)>=lvl.seuil;
}
// isGatewayDone — use per-child levels
function isGatewayDone(cid,nid){
  const lvl=getLevels(cid).find(l=>l.id===nid);
  if(!lvl||!lvl.gatewayMission)return true;
  return S.children[cid].state.missionStates[lvl.gatewayMission]==='done';
}
// isMOk — use resolved missions, per-child level for niv
function isMOk(cid,m){
  const niv=missionNiv(cid,m);
  if(!isLvlOk(cid,niv))return false;
  const lvl=getLevels(cid).find(l=>l.id===niv);
  if(lvl&&lvl.gatewayMission===m.id)return true;
  if(!isGatewayDone(cid,niv))return false;
  if(m.secret)return isSecretOk(cid,m);
  return true;
}
// prog — use per-child levels
function prog(cid){
  const e=totalE(cid);const lvls=getLevels(cid);const lvl=curLvl(cid);
  const idx=lvls.indexOf(lvl);
  if(idx===lvls.length-1)return{pct:100,label:'🏆 NIVEAU MAXIMUM !'};
  const next=lvls[idx+1];
  const pct=Math.round(((e-lvl.seuil)/(next.seuil-lvl.seuil))*100);
  return{pct:Math.min(Math.max(pct,0),100),label:`${next.emoji} ${next.label} — encore ${Math.max(0,next.seuil-e).toFixed(0)} CHF`};
}
```

- [ ] **Step 3: Replace badge functions**

```js
// earnedBadges — use catalog badges + resolved missions + per-child niv
function earnedBadges(cid){
  const ms=getMissions(cid);
  return S.catalog.badges.filter(b=>{
    const bms=ms.filter(m=>m.cat===b.catId&&missionNiv(cid,m)===b.nivId&&!m.secret);
    return bms.length>0&&bms.some(m=>S.children[cid].state.missionStates[m.id]==='done');
  }).map(b=>b.id);
}
// catBadgeCnt — use catId
function catBadgeCnt(cid,catId){
  return S.catalog.badges.filter(b=>b.catId===catId&&earnedBadges(cid).includes(b.id)).length;
}
// isSecretOk — unchanged (catId now)
function isSecretOk(cid,m){return catBadgeCnt(cid,m.secret)>=1;}
```

- [ ] **Step 4: Replace streak + recovery (state path change)**

```js
function streak(cid){let s=0;const d=new Date();d.setHours(0,0,0,0);for(let i=0;i<60;i++){const k=d.toISOString().slice(0,10);const rec=S.children[cid].state.daily[k];if(!rec||!rec.parentValidated){if(i===0){d.setDate(d.getDate()-1);continue;}break;}const b=calcBal(cid,k);if(b.done<b.total)break;s++;d.setDate(d.getDate()-1);}return s;}
function prevMalus(cid){const wk=prevWeekKey();let m=0;Object.entries(S.children[cid].state.daily).forEach(([dk,rec])=>{if(weekKey(dk)===wk&&rec.parentValidated)m+=rec.malus;});return m;}
function recStatus(cid){return S.children[cid].state.weeklyRec[prevWeekKey()]||'none';}
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: rewire financial, level, badge functions to v4"
```

---

### Task 5: Rewire render functions

**Files:**
- Modify: `index.html` — RENDER section

- [ ] **Step 1: Replace renderTabs**

```js
function renderTabs(){
  document.getElementById('child-tabs').innerHTML=getChildList().map(ch=>`
    <div class="ctab ${ch.id===AC?'active':''}" onclick="selChild('${ch.id}')">
      <div class="ctab-em">${ch.emoji}</div>
      <div class="ctab-nm">${ch.name.toUpperCase()}</div>
      <div class="ctab-chf">${totalE(ch.id).toFixed(2)} CHF</div>
    </div>`).join('');
}
```

- [ ] **Step 2: Replace renderProfiles**

Replace `CHILDREN.map(ch=>{` with `getChildList().map(ch=>{`.
Replace `ch.soon` with `!ch.active`.
Replace `LEVELS` references with `getLevels(ch.id)`.
All `MISSIONS.filter(...)` become `getMissions(ch.id).filter(...)`.

```js
function renderProfiles(){
  document.getElementById('main').innerHTML=getChildList().map(ch=>{
    if(!ch.active)return`<div class="child-profile ${ch.id===AC?'active':''}" id="p-${ch.id}"><div class="soon"><div class="soon-em">${ch.emoji}</div><div class="soon-nm">${ch.name.toUpperCase()}</div><div style="font-size:12px;color:var(--muted);margin-top:4px">${ch.age} ans</div><div style="font-size:14px;color:var(--text);margin-top:12px;line-height:1.6">Les missions de ${ch.name} arrivent bientôt !</div><div class="soon-pill">🔜 En préparation</div></div></div>`;
    const e=totalE(ch.id),lvl=curLvl(ch.id),pr=prog(ch.id),st=ST[ch.id];
    const strk=streak(ch.id);
    const ms=getMissions(ch.id);
    return`<div class="child-profile ${ch.id===AC?'active':''}" id="p-${ch.id}">
      <div class="stats-hdr">
        <div class="stats-row">
          <div class="stat-box"><div class="stat-val" style="color:var(--gold)">${e.toFixed(2)}</div><div class="stat-lbl">CHF gagnés</div></div>
          <div class="stat-box"><div class="stat-val" style="color:var(--cyan)">${ms.filter(m=>S.children[ch.id].state.missionStates[m.id]==='done').length}</div><div class="stat-lbl">Missions</div></div>
          <div class="stat-box"><div class="stat-val" style="color:var(--amber)">${strk}🔥</div><div class="stat-lbl">Streak</div></div>
          <div class="lvl-box" style="border-left:3px solid ${lvl.color}"><div class="lvl-title" style="color:${lvl.color}">${lvl.emoji} ${lvl.label}</div><div class="lvl-sub">Niveau actuel</div></div>
        </div>
        <div class="prog-row"><span>${pr.label}</span><span style="color:var(--green)">${pr.pct}%</span></div>
        <div class="prog-track"><div class="prog-fill" style="width:${pr.pct}%"></div></div>
      </div>
      <div class="sub-tabs">
        <button class="stab ${st==='missions'?'active':''}" onclick="selSub('${ch.id}','missions')">📋 Missions</button>
        <button class="stab ${st==='daily'?'active':''}" onclick="selSub('${ch.id}','daily')">📅 Journalier</button>
        <button class="stab ${st==='badges'?'active':''}" onclick="selSub('${ch.id}','badges')">🏅 Badges</button>
      </div>
      <div class="tab-content ${st==='missions'?'active':''}">${rMissions(ch.id)}</div>
      <div class="tab-content ${st==='daily'?'active':''}">${rDaily(ch.id)}</div>
      <div class="tab-content ${st==='badges'?'active':''}">${rBadges(ch.id)}</div>
    </div>`;
  }).join('');
}
```

- [ ] **Step 3: Replace rMissions**

Key changes: use `getLevels(cid)`, `getMissions(cid)`, `missionNiv(cid,m)`, `getCatColor(m.cat)`, `getCatLabel(m.cat)`, `S.children[cid].state.missionStates[m.id]`.

```js
function rMissions(cid){
  const lvls=getLevels(cid);const ms=getMissions(cid);const st=S.children[cid].state;
  return lvls.map(lvl=>{
    const ok=isLvlOk(cid,lvl.id);
    const lms=ms.filter(m=>missionNiv(cid,m)===lvl.id);
    const done=lms.filter(m=>st.missionStates[m.id]==='done').length;
    const base=lms.filter(m=>!m.secret);
    const secUnlocked=lms.filter(m=>m.secret&&isSecretOk(cid,m));
    const pill=ok?`${done}/${base.length} ✓${secUnlocked.length?` +${secUnlocked.length}🔮`:''}`:`🔒 ${lvl.seuil} CHF requis`;
    // gateway banners
    const gwM=lvl.gatewayMission&&st.missionStates[lvl.gatewayMission]!=='done'?ms.find(m=>m.id===lvl.gatewayMission):null;
    const gwHtml=gwM&&ok?`<div class="ms-banner">🔑&nbsp;<span><strong>Mission gateway :</strong> ${gwM.nom} — complète-la pour débloquer les autres missions ${lvl.id}</span></div>`:'';
    const cards=lms.map(m=>{
      const status=st.missionStates[m.id]||'none';
      const color=getCatColor(m.cat);
      const isGw=lvl.gatewayMission===m.id;
      const canAccess=isMOk(cid,m);
      let btn;
      if(!canAccess)         btn=`<button class="m-btn btn-lock">🔒</button>`;
      else if(status==='none')   btn=`<button class="m-btn btn-todo" onclick="markPending('${cid}','${m.id}')">✋ Fait !</button>`;
      else if(status==='pending')btn=`<button class="m-btn btn-pend" onclick="openPin('${cid}','${m.id}','validate')">⏳ Valider</button>`;
      else                       btn=`<button class="m-btn btn-done">✅</button>`;
      const msTag=isGw?`<span class="tag tag-ms">🔑 Gateway</span>`:'';
      const secTag=m.secret?`<span class="tag tag-sec">🔮 Secret</span>`:'';
      return`<div class="m-card ${status==='done'?'done':''}">
        <div class="cat-pip" style="background:${color};color:${color}"></div>
        <div class="m-body">
          <div class="m-name">${m.nom.replace('[🔮] ','')}</div>
          <div class="m-tags"><span class="tag tag-cat">${getCatLabel(m.cat)}</span><span style="font-size:9px">${'⭐'.repeat(m.diff)}</span>${msTag}${secTag}</div>
        </div>
        <div class="m-right"><div class="m-chf">+${m.chf} CHF</div>${btn}</div>
      </div>`;
    }).join('');
    return`<div class="lvl-sec ${!ok?'lvl-locked':''}">
      <div class="lvl-sep" style="background:${lvl.color}"><span>${lvl.emoji} ${lvl.id.replace('N','N')} · ${lvl.label}</span><span class="lvl-pill">${pill}</span></div>
      ${gwHtml}
      <div class="m-cards">${cards}</div>
    </div>`;
  }).join('');
}
```

- [ ] **Step 4: Replace rDaily**

Key changes: use `getDailyTasks(cid)` instead of `DAILY`, state path `S.children[cid].state.daily`.

Replace all `DAILY.map(...)` with `getDailyTasks(cid).map(...)`. Replace `S.ch[cid]` with `S.children[cid].state`. Keep the passive rendering logic intact.

- [ ] **Step 5: Replace rBadges**

Key changes: use `S.catalog.badges`, `getCatLabel()`.

```js
function rBadges(cid){
  const eb=earnedBadges(cid);
  const cats=[...new Set(S.catalog.badges.map(b=>b.catId))];
  return cats.map(catId=>{
    const cb=S.catalog.badges.filter(b=>b.catId===catId);
    const cnt=cb.filter(b=>eb.includes(b.id)).length;
    const secNote=cnt>=1?` <span style="font-size:9px;color:var(--purp)">🔮 Mission secrète débloquée !</span>`:` <span style="font-size:9px;color:var(--muted)">(1 badge → secret)</span>`;
    return`<div class="badge-sec-title">${getCatLabel(catId)} · ${cnt}/${cb.length}${secNote}</div>
    <div class="badges-grid" style="margin-bottom:16px">${cb.map(b=>{
      const ok=eb.includes(b.id);
      const imgHtml=b.img?`<img src="${b.img}" alt="${b.nm}" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="b-em" style="display:none">${b.em}</span>`:`<span class="b-em">${b.em}</span>`;
      return`<div class="badge-card ${ok?'earned':''}">${imgHtml}<div class="b-nm">${b.nm}</div><div class="b-st">${ok?'✅ Obtenu !':'🔒 À gagner'}</div></div>`;
    }).join('')}</div>`;
  }).join('');
}
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "refactor: rewire all render functions to v4 data model"
```

---

### Task 6: Rewire action functions + back office

**Files:**
- Modify: `index.html` — ACTIONS + BACK OFFICE sections

- [ ] **Step 1: Replace action functions**

Key change: `S.ch[cid]` → `S.children[cid].state` everywhere.

```js
function selChild(id){AC=id;render();}
function selSub(cid,tab){ST[cid]=tab;render();}
function toggleD(cid,tid,dk){const rec=getDR(cid,dk);if(rec.parentValidated)return;rec.tasks[tid]=!rec.tasks[tid];save();render();}
function setDT(cid,dk,tid,val){getDR(cid,dk).tasks[tid]=val;save();}
function valDay(cid,dk){
  const rec=getDR(cid,dk);
  const app=getDailyTasks(cid).filter(t=>isApplicableOn(t,dk)&&!t.passive);
  const done=app.filter(t=>rec.tasks[t.id]).length;
  const missed=app.length-done;
  rec.bonus=(missed===0?S.cfg.bonus*app.length:0);
  rec.malus=missed*S.cfg.malus;
  rec.parentValidated=true;
  const strk=streak(cid);
  if(strk>0&&strk%S.cfg.streakDays===0){rec.bonus+=S.cfg.streakBonus;toast(`🔥 STREAK x${S.cfg.streakDays} ! +${S.cfg.streakBonus} CHF pour ${getChild(cid).name} !`);}
  save();renderBO();render();
  toast(`✅ ${getChild(cid).name} validé — net ${(rec.bonus-rec.malus).toFixed(2)} CHF`);
}
function markPending(cid,mid){
  if(mid==='REC'){S.children[cid].state.weeklyRec[prevWeekKey()]='pending';save();render();toast('⏳ Rattrapage demandé — fais valider par parent !');return;}
  S.children[cid].state.missionStates[mid]='pending';save();render();toast('⏳ Mission notée — demande la validation !');
}
```

- [ ] **Step 2: Replace PIN + validation functions**

```js
function openPin(cid,mid,action){const ms=getMissions(cid);const m=ms.find(x=>x.id===mid);PX={cid,mid,action};PV='';updateDots();document.getElementById('pin-lbl').textContent=m?m.nom:'—';document.getElementById('pin-err').textContent='';document.getElementById('pin-ov').classList.add('open');}
function checkPin(){
  if(PV!==(S.pin||'1234')){document.getElementById('pin-err').textContent='❌ Code incorrect';PV='';updateDots();return;}
  const ctx=PX;closePin();
  if(ctx.action==='admin'){renderBO();document.getElementById('backoffice').classList.add('open');return;}
  if(ctx.action==='validate'){
    const{cid,mid}=ctx;
    if(mid==='REC'){S.children[cid].state.weeklyRec[prevWeekKey()]='done';const m=prevMalus(cid);save();render();toast(`✅ Rattrapage validé — +${m.toFixed(2)} CHF récupérés ! 💪`);return;}
    S.children[cid].state.missionStates[mid]='done';save();render();
    const ms=getMissions(cid);const m=ms.find(x=>x.id===mid);
    toast(`✅ +${m.chf} CHF — Bravo ${getChild(cid).name} ! 🎉`);
  }
}
```

- [ ] **Step 3: Replace renderBO**

Rewire to use v4 paths. Key changes:
- `CHILDREN.filter(c=>!c.soon)` → `getChildList().filter(c=>c.active)`
- `S.ch[ch.id].daily` → `S.children[ch.id].state.daily`
- `DAILY.filter(...)` → `getDailyTasks(ch.id).filter(...)`
- Mission list: `getMissions('louis')` instead of `MISSIONS`
- Remove `mCHF()` / `mActive()` calls — use direct v4 overrides
- CHF input: `onchange="setMissionOv('${m.id}','chf',+this.value)"`
- Toggle: `onclick="toggleMissionExclude('${m.id}',this)"`
- Thresholds: read/write from `S.children.louis.levels[].seuil`
- PIN: read/write `S.pin`

Add new helper functions for BO:
```js
function setMissionOv(mid,field,val){
  // Apply to active child (or all children — UX decision for Plan B)
  if(!S.children.louis.missions.overrides[mid])S.children.louis.missions.overrides[mid]={};
  S.children.louis.missions.overrides[mid][field]=val;save();
}
function toggleMissionExclude(mid,btn){
  const exc=S.children.louis.missions.exclude;
  const idx=exc.indexOf(mid);
  if(idx>=0){exc.splice(idx,1);btn.classList.add('on');}
  else{exc.push(mid);btn.classList.remove('on');}
  save();
}
function resetChild(cid){
  if(!confirm(`Tout réinitialiser pour ${cid} ?`))return;
  const ms=getMissions(cid);
  S.children[cid].state={missionStates:{},daily:{},weeklyRec:{}};
  ms.forEach(m=>S.children[cid].state.missionStates[m.id]='none');
  save();renderBO();render();toast('♻️ Réinitialisé',true);
}
function resetMs(cid){
  if(!confirm('Réinitialiser les missions ?'))return;
  const ms=getMissions(cid);
  ms.forEach(m=>S.children[cid].state.missionStates[m.id]='none');
  save();renderBO();render();toast('↩️ Missions réinitialisées',true);
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: rewire actions and back office to v4 data model"
```

---

### Task 7: Remove old constants + final cleanup

**Files:**
- Modify: `index.html` — delete DATA section

- [ ] **Step 1: Move seed data into migration function (MUST be done before deleting globals)**

Move the old `CHILDREN`, `LEVELS`, `CAT`, `MISSIONS`, `BADGES`, `DAILY` declarations **inside** `migrateV3toV4()` as local `const` variables. Keep variable names identical so the migration code still works. This encapsulates all seed data — once mh_v4 exists in localStorage, the migration is never called again.

- [ ] **Step 2: Delete the old DATA section (lines 191-335)**

Now safe to remove the global constants:
- `const CHILDREN = [...]`
- `const LEVELS = [...]`
- `const CAT = {...}`
- `const MISSIONS = [...]`
- `const BADGES = [...]`
- `const DAILY = [...]`

Keep `CAT_ID_MAP`, `CSS_TO_HEX`, and the V4 DATA LAYER section.

- [ ] **Step 3: Delete old helper functions `setCHF` and `toggleMA`**

These reference `S.cfg.mCHF` and `S.cfg.mActive` which no longer exist in v4. They are replaced by `setMissionOv` and `toggleMissionExclude` (added in Task 6).

- [ ] **Step 4: Verify no references to old constants remain**

Search for: `MISSIONS[^_]`, `LEVELS[^_]`, `DAILY[^_]`, `CHILDREN`, `BADGES[^_]`, `CAT[`, `S\.ch[^i]`, `S\.cfg\.mCHF`, `S\.cfg\.mActive`, `S\.cfg\.thresholds`, `mCHF(`, `mActive(`, `setCHF`, `toggleMA`.

Only allowed: inside `migrateV3toV4()` local scope.

- [ ] **Step 4: Verify in browser**

Clear localStorage, reload. Everything should work (fresh migration).
Then verify with existing data:
```js
// Check resolved missions for Louis
getMissions('louis').length // Expected: 61 (or less if some excluded)
getLevels('louis').length // Expected: 4
getDailyTasks('louis').length // Expected: 11
getChildList().length // Expected: 3
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: remove old constants — app is fully data-driven"
```

---

### Task 8: Final verification

- [ ] **Step 1: Fresh install test**

Clear all localStorage, reload `index.html`:
- Louis profile should appear with all 61 missions, 4 levels, 11 daily tasks
- Emile and Marius show "bientot" placeholders
- Back office accessible via PIN 1234
- Mission CHF overrides work
- Mission exclusion toggles work
- Daily tasks, streak, recovery all functional

- [ ] **Step 2: Migration test**

Set up a v3 state with custom data, then reload:
```js
// Inject v3 state with customizations
localStorage.removeItem('mh_v4');
localStorage.setItem('mh_v3', JSON.stringify({
  pin:'9999',
  cfg:{malus:0.15,bonus:0.25,streakBonus:2,thresholds:{N2:25,N3:50,N4:100},mCHF:{M01:5},mActive:{M02:false}},
  ch:{louis:{m:{M01:'done',M03:'pending'},daily:{'2026-03-23':{tasks:{dt1:true},parentValidated:true,bonus:0.5,malus:0}},streak:3,weeklyRec:{}},emile:{m:{},daily:{},streak:0,weeklyRec:{}},marius:{m:{},daily:{},streak:0,weeklyRec:{}}}
}));
location.reload();
```
Then verify:
```js
const s=JSON.parse(localStorage.getItem('mh_v4'));
s.pin // '9999'
s.cfg.malus // 0.15
s.children.louis.levels[1].seuil // 25 (was customized)
s.children.louis.missions.overrides.M01 // {chf:5}
s.children.louis.missions.exclude // ['M02']
s.children.louis.state.missionStates.M01 // 'done'
s.children.louis.state.daily['2026-03-23'].parentValidated // true
```

- [ ] **Step 3: Console verification**

```js
getMissions('louis').find(m=>m.id==='M01').chf // 5 (overridden)
getMissions('louis').find(m=>m.id==='M02') // undefined (excluded)
getLevels('louis').map(l=>l.id+':'+l.seuil) // ["N1:0","N2:25","N3:50","N4:100"]
getDailyTasks('louis').filter(t=>t.passive).map(t=>t.lbl) // ["Moment parole du soir"]
```

- [ ] **Step 4: Final commit**

```bash
git add index.html
git commit -m "chore: final verification — v4 data model fully operational"
```
