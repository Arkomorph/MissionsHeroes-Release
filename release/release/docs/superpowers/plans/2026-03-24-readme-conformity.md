# README Conformity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the code in `index.html` with the README spec (source of truth) — 6 changes in a single file.

**Architecture:** All changes are in `index.html` (single-file app). Data constants, state logic functions, and render functions are modified. No new files created.

**Tech Stack:** Vanilla JS ES6, HTML5, CSS3, localStorage.

---

## File Map

All changes in a single file:

- Modify: `index.html`
  - Data: `MISSIONS[]` (lines 211-288) — move M08, M23, M42
  - Data: `DAILY[]` (lines 323-335) — flag parole as passive
  - Logic: `calcBal()` (line 357) — exclude parole from bonus/malus
  - Logic: `streak()` (line 377) — exclude parole from streak
  - Logic: `isMOk()` (line 374) — add gateway check
  - Logic: `isLvlOk()` (line 367) — adapt milestone to gateway
  - Render: `rDaily()` (line 470) — fix bilan display, parole styling, rattrapage text
  - Render: `rMissions()` (line 428) — gateway banner
  - Logic: `valDay()` (line 571) — exclude parole from validation calc
  - Render: `renderBO()` (line 524) — distinguish passive parole in back office review

---

### Task 1: Move missions M08, M23, M42 to their gateway levels

**Files:**
- Modify: `index.html:220,241,264`

- [ ] **Step 1: Move M08 from N1 to N2**

Change line 220:
```js
// Before:
{id:'M08',niv:'N1',cat:'💰 Budget', nom:'Créer son tableau budget (entrées / dépenses)', diff:1,chf:3, milestone:'N2'},
// After:
{id:'M08',niv:'N2',cat:'💰 Budget', nom:'Créer son tableau budget (entrées / dépenses)', diff:2,chf:3, gateway:true},
```

- [ ] **Step 2: Move M23 from N2 to N3**

Change line 241:
```js
// Before:
{id:'M23',niv:'N2',cat:'💰 Budget', nom:'Faire le bilan du mois (entrées vs dépenses)', diff:2,chf:6, milestone:'N3'},
// After:
{id:'M23',niv:'N3',cat:'💰 Budget', nom:'Faire le bilan du mois (entrées vs dépenses)', diff:3,chf:6, gateway:true},
```

- [ ] **Step 3: Move M42 from N3 to N4**

Change line 264:
```js
// Before:
{id:'M42',niv:'N3',cat:'💰 Budget', nom:'Présenter bilan mensuel à papa / maman (tableau + oral)', diff:3,chf:12, milestone:'N4'},
// After:
{id:'M42',niv:'N4',cat:'💰 Budget', nom:'Présenter bilan mensuel à papa / maman (tableau + oral)', diff:4,chf:12, gateway:true},
```

- [ ] **Step 4: Update comment on line 210**

```js
// Before:
// milestone:'NX' = doit être faite avant déblocage NX | secret:'CAT' = visible seulement après badge cat
// After:
// gateway:true = seule mission active à l'ouverture du niveau | secret:'CAT' = visible seulement après badge cat
```

- [ ] **Step 5: Verify in browser console**

Open `index.html`, run in console:
```js
MISSIONS.filter(m => m.gateway).map(m => `${m.id} ${m.niv}`)
// Expected: ["M08 N2", "M23 N3", "M42 N4"]
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: move gateway missions M08→N2, M23→N3, M42→N4"
```

---

### Task 2: Implement gateway mechanic in logic functions

**Files:**
- Modify: `index.html:367,374`

- [ ] **Step 1: Replace `isLvlOk` — remove milestone check, keep threshold check only**

Change line 367:
```js
// Before:
function isLvlOk(cid,nid){if(nid==='N1')return true;const e=totalE(cid);const t=S.cfg.thresholds;const ok=nid==='N2'?e>=t.N2:nid==='N3'?e>=t.N3:e>=t.N4;if(!ok)return false;return MISSIONS.filter(m=>m.milestone===nid).every(m=>S.ch[cid].m[m.id]==='done');}
// After:
function isLvlOk(cid,nid){if(nid==='N1')return true;const e=totalE(cid);const t=S.cfg.thresholds;return nid==='N2'?e>=t.N2:nid==='N3'?e>=t.N3:e>=t.N4;}
```

- [ ] **Step 2: Add gateway check helper**

Add after `isLvlOk`:
```js
function isGatewayDone(cid,nid){const gw=MISSIONS.find(m=>m.gateway&&m.niv===nid);return !gw||S.ch[cid].m[gw.id]==='done';}
```

- [ ] **Step 3: Update `isMOk` to enforce gateway**

Change line 374:
```js
// Before:
function isMOk(cid,m){if(!mActive(m))return false;if(!isLvlOk(cid,m.niv))return false;if(m.secret)return isSecretOk(cid,m);return true;}
// After:
function isMOk(cid,m){if(!mActive(m))return false;if(!isLvlOk(cid,m.niv))return false;if(m.gateway)return true;if(!isGatewayDone(cid,m.niv))return false;if(m.secret)return isSecretOk(cid,m);return true;}
```

Logic: gateway missions are always accessible once the level is unlocked. All other missions require the gateway to be completed first.

- [ ] **Step 4: Verify in browser console**

```js
// With a fresh state, M08 should be accessible at N2 but other N2 missions locked
// until M08 is done
isGatewayDone('louis','N1') // Expected: true (no gateway on N1)
isGatewayDone('louis','N2') // Expected: false (M08 not done)
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: implement gateway mechanic — sole active mission at level opening"
```

---

### Task 3: Update mission rendering for gateway display

**Files:**
- Modify: `index.html:428-468`

- [ ] **Step 1: Replace milestone banner with gateway banner in `rMissions`**

Find the milestone banner code (around line 437-441) and replace:
```js
// Before:
    const gw=MISSIONS.filter(m=>m.niv===lvl.id&&m.milestone&&S.ch[cid].m[m.id]!=='done');
    const gwHtml=gw.map(m=>`<div class="ms-banner">🔒&nbsp;<span><strong>Milestone → ${m.milestone} :</strong> ${m.nom}</span></div>`).join('');
    // also show if previous level milestones are blocking this level
    const blockMs=MISSIONS.filter(m=>m.milestone===lvl.id&&S.ch[cid].m[m.id]!=='done');
    const blockHtml=!ok&&blockMs.length?`<div class="ms-banner">⚠️&nbsp;<span><strong>Complète d'abord :</strong> ${blockMs.map(m=>m.nom).join(' · ')}</span></div>`:''
// After:
    const gwM=MISSIONS.find(m=>m.gateway&&m.niv===lvl.id&&S.ch[cid].m[m.id]!=='done');
    const gwHtml=gwM&&ok?`<div class="ms-banner">🔑&nbsp;<span><strong>Mission gateway :</strong> ${gwM.nom} — complète-la pour débloquer les autres missions ${lvl.id}</span></div>`:'';
    const blockHtml='';
```

- [ ] **Step 2: Update mission tag rendering — replace milestone tag with gateway tag**

Find the milestone tag (around line 451) and replace:
```js
// Before:
      const msTag=m.milestone?`<span class="tag tag-ms">🏆→${m.milestone}</span>`:'';
// After:
      const msTag=m.gateway?`<span class="tag tag-ms">🔑 Gateway</span>`:'';
```

- [ ] **Step 3: Verify visually in browser**

Open `index.html`, check Louis N2 section:
- M08 should show "🔑 Gateway" tag
- A banner should say "Mission gateway : Créer son tableau budget..."
- Other N2 missions should be locked (🔒 button)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: render gateway banners and tags in missions view"
```

---

### Task 4: Make parole du soir a passive encouragement

**Files:**
- Modify: `index.html:334,357,377,470-507,571-582`

- [ ] **Step 1: Flag parole as passive in DAILY data**

Change line 334:
```js
// Before:
{id:'dt11',em:'💬',lbl:'Moment parole du soir',              always:true,pNote:true},
// After:
{id:'dt11',em:'💬',lbl:'Moment parole du soir',              always:true,passive:true},
```

- [ ] **Step 2: Exclude passive tasks from `calcBal()`**

Change line 357:
```js
// Before:
function calcBal(cid,dk){const rec=S.ch[cid].daily[dk];if(!rec)return{bonus:0,malus:0,net:0,done:0,total:0};const app=DAILY.filter(t=>isApplicableOn(t,dk));const done=app.filter(t=>rec.tasks[t.id]).length;const missed=app.length-done;const allDone=missed===0;return{bonus:allDone?S.cfg.bonus*app.length:0,malus:missed*S.cfg.malus,net:(allDone?S.cfg.bonus*app.length:0)-missed*S.cfg.malus,done,total:app.length};}
// After:
function calcBal(cid,dk){const rec=S.ch[cid].daily[dk];if(!rec)return{bonus:0,malus:0,net:0,done:0,total:0};const app=DAILY.filter(t=>isApplicableOn(t,dk)&&!t.passive);const done=app.filter(t=>rec.tasks[t.id]).length;const missed=app.length-done;const allDone=missed===0;return{bonus:allDone?S.cfg.bonus*app.length:0,malus:missed*S.cfg.malus,net:(allDone?S.cfg.bonus*app.length:0)-missed*S.cfg.malus,done,total:app.length};}
```

- [ ] **Step 3: Exclude passive tasks from `streak()`**

The streak function uses `calcBal` which now excludes passive tasks, so `b.done<b.total` will already ignore parole. No change needed in `streak()` itself.

Verify by reading `streak()`: it calls `calcBal(cid,k)` and checks `b.done<b.total`. Since `calcBal` now filters out passive tasks, streak is automatically correct.

- [ ] **Step 4: Exclude passive tasks from `valDay()`**

Change line 571-576:
```js
// Before (inside valDay):
  const app=DAILY.filter(t=>isApplicableOn(t,dk));
// After:
  const app=DAILY.filter(t=>isApplicableOn(t,dk)&&!t.passive);
```

- [ ] **Step 5: Style parole differently in `rDaily()` render**

In the `rDaily` function (line 478-486), update the task card rendering. Replace:
```js
  const taskCards=DAILY.map(t=>{
    const app=isApplicable(t);
    const ch=rec.tasks[t.id];
    const pn=t.pNote?` <span style="font-size:9px;color:var(--purp)">(note parent)</span>`:'';
    return`<div class="d-card ${ch?'checked':''} ${!app?'na':''}" onclick="${app?`toggleD('${cid}','${t.id}','${dk}')`:''}" >
      <div class="d-check">${ch?'✓':''}</div>
      <div class="d-label">${t.em} ${t.lbl}${pn}</div>
      ${app?`<div class="d-amount">${ch?'+'+S.cfg.bonus.toFixed(2):'-'+S.cfg.malus.toFixed(2)}</div>`:'<div class="d-amount" style="color:var(--muted)">N/A</div>'}
    </div>`;
  }).join('');
```

With:
```js
  const taskCards=DAILY.map(t=>{
    const app=isApplicable(t);
    const ch=rec.tasks[t.id];
    if(t.passive){return`<div class="d-card ${ch?'checked':''}" onclick="toggleD('${cid}','${t.id}','${dk}')" style="border-top:2px solid var(--brd2)">
      <div class="d-check" style="${ch?'':'border-style:dashed'}">${ch?'💬':''}</div>
      <div class="d-label">${t.em} ${t.lbl} <span style="font-size:9px;color:var(--purp)">(encouragement — pas de bonus/malus)</span></div>
      <div class="d-amount" style="color:var(--purp)">—</div>
    </div>`;}
    return`<div class="d-card ${ch?'checked':''} ${!app?'na':''}" onclick="${app?`toggleD('${cid}','${t.id}','${dk}')`:''}" >
      <div class="d-check">${ch?'✓':''}</div>
      <div class="d-label">${t.em} ${t.lbl}</div>
      ${app?`<div class="d-amount">${ch?'+'+S.cfg.bonus.toFixed(2):'-'+S.cfg.malus.toFixed(2)}</div>`:'<div class="d-amount" style="color:var(--muted)">N/A</div>'}
    </div>`;
  }).join('');
```

- [ ] **Step 6: Clean up dead `pNote` code path**

In the `rDaily` render function, the old code had `t.pNote` references. Since we replaced `pNote:true` with `passive:true` and handle passive tasks separately, search for any remaining `pNote` references and remove them. The old line was:
```js
const pn=t.pNote?` <span style="font-size:9px;color:var(--purp)">(note parent)</span>`:'';
```
This is now dead code because the `pNote` property no longer exists. It was already removed in Step 5 above when we replaced the entire taskCards rendering block.

- [ ] **Step 7: Distinguish passive parole in back office review**

In `renderBO()` (around line 530), the review tasks list all DAILY items. Update to show parole as passive:
```js
// In the tasks rendering inside renderBO, find the line that renders review tasks:
// Before:
const tasks=app.map(t=>`<div class="review-task"><input type="checkbox" id="rv_${ch.id}_${t.id}" ${rec.tasks[t.id]?'checked':''} onchange="setDT('${ch.id}','${yk}','${t.id}',this.checked)"><label for="rv_${ch.id}_${t.id}">${t.em} ${t.lbl}</label></div>`).join('');
// After:
const tasks=app.map(t=>`<div class="review-task"><input type="checkbox" id="rv_${ch.id}_${t.id}" ${rec.tasks[t.id]?'checked':''} onchange="setDT('${ch.id}','${yk}','${t.id}',this.checked)"><label for="rv_${ch.id}_${t.id}">${t.em} ${t.lbl}${t.passive?' <span style="font-size:9px;color:var(--purp)">(encouragement)</span>':''}</label></div>`).join('');
```

- [ ] **Step 8: Verify in browser**

- Parole du soir should show with dashed border, "—" instead of amount, purple "(encouragement)" label
- Checking/unchecking parole should NOT change the bilan du jour amounts
- A perfect day (all 10 tasks done) should give bonus even if parole is unchecked
- Back office review should show "(encouragement)" next to parole

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: make parole du soir passive — excluded from bonus/malus/streak"
```

---

### Task 5: Fix daily balance display (bilan du jour)

**Files:**
- Modify: `index.html:498-503`

- [ ] **Step 1: Fix misleading bonus display in bilan**

The current display shows `done * bonus` as if each task individually earns bonus, but the bonus is actually all-or-nothing (only when ALL tasks are done). Replace lines 498-503:

```js
// Before:
      <div class="bal-row"><span>${bal.done}/${bal.total} tâches faites</span><span class="bal-plus">+${(bal.done*S.cfg.bonus).toFixed(2)} CHF</span></div>
      <div class="bal-row"><span>${bal.total-bal.done} tâches manquantes</span><span class="bal-minus">-${((bal.total-bal.done)*S.cfg.malus).toFixed(2)} CHF</span></div>
// After:
      <div class="bal-row"><span>${bal.done}/${bal.total} tâches faites</span><span class="bal-plus">${bal.bonus>0?'+'+bal.bonus.toFixed(2)+' CHF':'—'}</span></div>
      <div class="bal-row"><span>${bal.total-bal.done} tâches manquantes</span><span class="bal-minus">${bal.malus>0?'-'+bal.malus.toFixed(2)+' CHF':'—'}</span></div>
```

- [ ] **Step 2: Add explanation line when bonus is 0 but tasks are done**

After the bonus row, add a conditional hint:
```js
      ${bal.done>0&&bal.done<bal.total?`<div style="font-size:9px;color:var(--muted);margin-top:2px">💡 Bonus uniquement si toutes les tâches sont faites</div>`:''}
```

- [ ] **Step 3: Verify in browser**

- With some tasks done but not all: bonus should show "—", hint should appear
- With all tasks done: bonus should show "+X.XX CHF", no hint
- With no tasks done: both should show "—" for bonus, malus amount for malus

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: display accurate bonus/malus in daily balance (all-or-nothing)"
```

---

### Task 6: Update recovery mission text

**Files:**
- Modify: `index.html:489-491`

- [ ] **Step 1: Update rattrapage description text**

Change lines 489-491:
```js
// Before:
    <div class="rec-desc">Tu as eu <strong style="color:var(--pink)">-${pmal.toFixed(2)} CHF</strong> de malus la semaine passée.<br>Accomplis 3 tâches supplémentaires aujourd'hui pour les récupérer !</div>
// After:
    <div class="rec-desc">Tu as eu <strong style="color:var(--pink)">-${pmal.toFixed(2)} CHF</strong> de malus la semaine passée.<br>Accomplis une tâche ménagère choisie par ton parent pour récupérer tes malus !</div>
```

- [ ] **Step 2: Verify in browser**

Need a state with previous week malus. In console:
```js
const s=JSON.parse(localStorage.getItem('mh_v3'));
const d=new Date();d.setDate(d.getDate()-7);
const dk=d.toISOString().slice(0,10);
s.ch.louis.daily[dk]={tasks:{dt1:true,dt2:false,dt3:true,dt4:true,dt5:true,dt6:true,dt7:true,dt8:true,dt10:true},parentValidated:true,bonus:0,malus:0.1};
localStorage.setItem('mh_v3',JSON.stringify(s));location.reload();
```
Then check the recovery box text in the Journalier tab.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: update recovery mission text — chore chosen by parent"
```

---

### Task 7: Final verification and cleanup

- [ ] **Step 1: Full manual test in browser**

Open `index.html` and verify:
1. N1 has 19 missions (M08 is gone from N1)
2. N2 shows M08 as gateway with 🔑 tag and banner
3. Other N2 missions are locked until M08 is completed
4. Parole du soir has distinct styling, no CHF amount, "(encouragement)" label
5. Checking all 10 tasks (without parole) shows bonus in bilan
6. Unchecking 1 task shows accurate malus, no bonus, hint message
7. Recovery text mentions "tâche ménagère choisie par ton parent"

- [ ] **Step 2: Console verification**

```js
// Gateway missions
MISSIONS.filter(m=>m.gateway).map(m=>`${m.id} ${m.niv}`)
// Expected: ["M08 N2", "M23 N3", "M42 N4"]

// Mission counts per level
LEVELS.map(l=>l.id+': '+MISSIONS.filter(m=>m.niv===l.id&&!m.secret).length)
// Expected: ["N1: 19", "N2: 20", "N3: 13", "N4: 9"]
// (Note: secrets are counted separately)

// Passive daily tasks
DAILY.filter(t=>t.passive).map(t=>t.lbl)
// Expected: ["Moment parole du soir"]
```

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add index.html
git commit -m "chore: final verification and cleanup"
```
