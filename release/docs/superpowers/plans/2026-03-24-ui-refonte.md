# UI Refonte — Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current interface with the proto.html visual design (per-child themes, round button nav, bottom nav pill, accordion levels, stats bar, landscape sidebar) while preserving all v4 business logic and BO CRUD.

**Architecture:** Take CSS + HTML shell + render patterns from `proto.html`. Adapt our existing render functions to output HTML matching the proto's class names and structure. Add theme system and accordion state. Business logic, data model, BO CRUD are untouched.

**Tech Stack:** Vanilla JS ES6, CSS3, Google Fonts (Share Tech Mono, Josefin Sans, Righteous, Baloo 2, Patrick Hand).

**Reference:** `proto.html` is the visual reference. `README.md` is the functional reference.

---

## Strategy

The proto has its own v3 data/state that we IGNORE. We only take:
1. **CSS** (lines 10-868 of proto) — replace our entire `<style>` block
2. **HTML shell** (lines 873-960 of proto) — replace our `<body>` structure
3. **Render patterns** — adapt our JS render functions to match proto's HTML classes
4. **Theme system** — add `theme` field to children, apply CSS class on switch
5. **Accordion state** — add `ACC` object for level open/close state
6. **Landscape sidebar** — render sidebar content dynamically

We do NOT take the proto's `<script>` section (lines 962+).

## File Map

All changes in `index.html`:

| Section | What changes |
|---------|-------------|
| `<link>` fonts | Add Share Tech Mono, Josefin Sans, Righteous, Baloo 2, Patrick Hand |
| `<style>` | **Replace entirely** with proto CSS + append our BO CRUD CSS |
| `<body>` HTML | **Replace** shell structure with proto's: sidebar + right-col + chrome + bottom-nav |
| Render functions | Rewrite `render()`, `renderTabs()`, `renderProfiles()`, `rMissions()`, `rDaily()`, `rBadges()` |
| New functions | `applyTheme()`, `renderStatsBar()`, `renderBottomNav()`, `renderSidebar()`, `toggleAcc()` |
| State | Add `ACC` object for accordion state |
| Data model | Add `theme` field to children in migration |

---

### Task 1: Replace CSS + fonts + HTML shell

**Files:**
- Modify: `index.html` — `<link>`, `<style>`, `<body>` structure

- [ ] **Step 1: Replace Google Fonts link**

Replace the existing fonts link with:
```html
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Josefin+Sans:wght@300;600&family=Righteous&family=Nunito:wght@400;700;800&family=Baloo+2:wght@400;700&family=Patrick+Hand&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace entire `<style>` block**

Copy lines 10-868 from `proto.html` (everything inside `<style>...</style>`). Then APPEND our existing BO CRUD CSS classes at the end (inside the style block):
- `.bo-tabs`, `.bo-tab`, `.bo-tab-content` (tab navigation)
- `.bo-form`, `.bo-form-title`, `.bo-field`, `.bo-field-row` (form styling)
- `.bo-add-btn`, `.bo-item`, `.bo-item-body`, `.bo-item-title`, `.bo-item-sub` (item cards)
- `.bo-item-actions`, `.bo-icon-btn`, `.bo-child-sel`, `.bo-child-btn` (actions + child selector)

These BO CRUD classes are NOT in the proto — they were added in Plan B. Preserve them by appending after the proto CSS.

- [ ] **Step 3: Replace `<body>` HTML shell**

Replace everything between `<body>` and `<script>` with the proto's HTML structure (lines 872-960 of proto):
- `#app` div with `class="theme-louis"`
- `#sidebar` with `#sidebar-children`, `#sidebar-sections`, `.side-admin`
- `#right-col` > `#chrome` > `#child-tabs` + `#stats-bar` + `#section-nav`
- `#bottom-nav`
- `#content-wrap` > `#main`
- `#backoffice`
- PIN modal (`.overlay#pin-ov`)
- Toast (`.toast#toast`)

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: replace CSS + HTML shell with proto design"
```

---

### Task 2: Add theme system + update data model

**Files:**
- Modify: `index.html` — migration function + child data

- [ ] **Step 1: Add theme field to children in migration**

In `migrateV3toV4()`, update the Louis child creation to include `theme: 'theme-louis'`. Update Emile to `theme: 'theme-emile'` and Marius to `theme: 'theme-marius'`.

Also update the `mkEmptyChild` helper or each child creation to include a default theme.

- [ ] **Step 2: Add theme to existing v4 state**

In the state initialization section (after loading S from localStorage), add a migration patch:
```js
// Patch: add theme field if missing
if (S.children.louis && !S.children.louis.theme) S.children.louis.theme = 'theme-louis';
if (S.children.emile && !S.children.emile.theme) S.children.emile.theme = 'theme-emile';
if (S.children.marius && !S.children.marius.theme) S.children.marius.theme = 'theme-marius';
```

- [ ] **Step 3: Add `applyTheme()` function**

```js
function applyTheme(cid) {
  const theme = S.children[cid]?.theme || 'theme-louis';
  const app = document.getElementById('app');
  app.className = theme;
}
```

Call `applyTheme(AC)` at the end of `selChild()` and at initial render.

- [ ] **Step 4: Add theme field to `boAddChild()` and enfants edit form**

In `boAddChild()`, add `theme: 'theme-louis'` to the new child defaults.
In `renderChildEditForm()`, add a theme selector dropdown with the 3 themes.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add per-child theme system with CSS class switching"
```

---

### Task 3: Rewrite navigation rendering (tabs + stats bar + bottom nav + sidebar)

**Files:**
- Modify: `index.html` — render functions

- [ ] **Step 1: Add accordion state**

```js
const ACC = {}; // { childId: { levelId: true/false } }
function initAcc(cid) {
  if (!ACC[cid]) {
    ACC[cid] = {};
    const lvls = getLevels(cid);
    lvls.forEach((l, i) => ACC[cid][l.id] = i === 0); // N1 open by default
  }
}
function toggleAcc(cid, nid) {
  initAcc(cid);
  ACC[cid][nid] = !ACC[cid][nid];
  render();
}
```

- [ ] **Step 2: Rewrite `renderTabs()` — round buttons**

```js
function renderTabs() {
  const children = getChildList();
  document.getElementById('child-tabs').innerHTML = children.map(ch => `
    <div class="ctab ${ch.id===AC?'active':''}" onclick="selChild('${ch.id}')">
      <span class="ctab-em">${ch.emoji}</span>
      <span class="ctab-nm">${ch.name}</span>
      <span class="ctab-chf">${ch.active?totalE(ch.id).toFixed(2)+' CHF':''}</span>
    </div>
  `).join('') + `
    <div id="admin-round" onclick="openAdmin()">
      <span class="ar-em">⚙️</span>
      <span class="ar-lbl">Admin</span>
    </div>`;
}
```

- [ ] **Step 3: Add `renderStatsBar()`**

```js
function renderStatsBar() {
  const ch = getChild(AC);
  if (!ch || !ch.active) {
    document.getElementById('stats-bar').style.display = 'none';
    return;
  }
  document.getElementById('stats-bar').style.display = '';
  const e = totalE(AC), lvl = curLvl(AC), pr = prog(AC), strk = streak(AC);
  document.getElementById('sb-chf').textContent = e.toFixed(2);
  document.getElementById('sb-lvl').textContent = lvl.emoji + ' ' + lvl.label;
  document.getElementById('sb-bar').style.width = pr.pct + '%';
  document.getElementById('sb-pct').textContent = pr.pct + '%';
  document.getElementById('sb-next').textContent = pr.pct < 100 ? pr.label : '';
  document.getElementById('sb-streak').textContent = strk + '🔥';
}
```

- [ ] **Step 4: Add `renderBottomNav()`**

```js
function renderBottomNav() {
  const ch = getChild(AC);
  if (!ch || !ch.active) {
    document.getElementById('bottom-nav').style.display = 'none';
    return;
  }
  document.getElementById('bottom-nav').style.display = '';
  const tab = ST[AC] || 'missions';
  const sections = [
    { id: 'missions', em: '📋', lbl: 'Missions' },
    { id: 'daily', em: '📅', lbl: 'Journalier' },
    { id: 'badges', em: '🏅', lbl: 'Badges' },
  ];
  document.getElementById('bottom-nav').innerHTML = sections.map(s => `
    <div class="bnav-btn ${tab===s.id?'active':''}" onclick="selSub('${AC}','${s.id}')">
      <span class="bnav-em">${s.em}</span>
      <span class="bnav-lbl">${s.lbl}</span>
    </div>
  `).join('');
}
```

- [ ] **Step 5: Add `renderSidebar()` (landscape)**

```js
function renderSidebar() {
  const children = getChildList();
  const tab = ST[AC] || 'missions';
  document.getElementById('sidebar-children').innerHTML = children.map(ch => `
    <div class="side-child ${ch.id===AC?'active':''}" onclick="selChild('${ch.id}')">
      <span class="side-child-em">${ch.emoji}</span>
      <span class="side-child-nm">${ch.name}</span>
      <span class="side-child-chf">${ch.active?totalE(ch.id).toFixed(2):''}</span>
    </div>
  `).join('');
  const sections = [
    { id: 'missions', em: '📋', lbl: 'Missions' },
    { id: 'daily', em: '📅', lbl: 'Journal' },
    { id: 'badges', em: '🏅', lbl: 'Badges' },
  ];
  document.getElementById('sidebar-sections').innerHTML = sections.map(s => `
    <div class="side-section ${tab===s.id?'active':''}" onclick="selSub('${AC}','${s.id}')">
      <span class="side-section-em">${s.em}</span>
      <span class="side-section-lbl">${s.lbl}</span>
    </div>
  `).join('');
}
```

- [ ] **Step 6: Update `render()` to call all new functions**

```js
function render() {
  applyTheme(AC);
  renderTabs();
  renderStatsBar();
  renderBottomNav();
  renderSidebar();
  renderProfiles();
}
```

- [ ] **Step 7: Update `selChild()` to apply theme**

```js
function selChild(id) { AC = id; render(); }
```
(`render()` now calls `applyTheme(AC)`)

- [ ] **Step 8: Commit**

```bash
git commit -m "feat: round nav, stats bar, bottom pill, landscape sidebar"
```

---

### Task 4: Rewrite `renderProfiles()` + content area

**Files:**
- Modify: `index.html` — renderProfiles

- [ ] **Step 1: Rewrite `renderProfiles()`**

The content area now uses `#main` directly with tab panes. No more per-child profile wrappers — since we have round buttons to switch children, we only render the ACTIVE child's content.

```js
function renderProfiles() {
  const ch = getChild(AC);
  if (!ch) return;
  if (!ch.active) {
    document.getElementById('main').innerHTML = `
      <div class="tab-pane active">
        <div class="soon">
          <div class="soon-em">${ch.emoji}</div>
          <div class="soon-nm">${ch.name.toUpperCase()}</div>
          <div style="font-size:14px;color:var(--text);margin-top:12px">Les missions de ${ch.name} arrivent bientôt !</div>
          <div class="soon-pill">🔜 En préparation</div>
        </div>
      </div>`;
    return;
  }
  if (!ST[AC]) ST[AC] = 'missions';
  const tab = ST[AC];
  document.getElementById('main').innerHTML = `
    <div class="tab-pane ${tab==='missions'?'active':''}" id="pane-missions">${rMissions(AC)}</div>
    <div class="tab-pane ${tab==='daily'?'active':''}" id="pane-daily">${rDaily(AC)}</div>
    <div class="tab-pane ${tab==='badges'?'active':''}" id="pane-badges">${rBadges(AC)}</div>`;
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: single-child content rendering with tab panes"
```

---

### Task 5: Rewrite `rMissions()` with accordion levels

**Files:**
- Modify: `index.html` — rMissions

- [ ] **Step 1: Rewrite `rMissions()` with accordion pattern**

Use the proto's accordion classes: `.acc-level`, `.acc-hdr`, `.acc-dot`, `.acc-title`, `.acc-pill`, `.acc-chevron`, `.acc-body`. Levels are `.open` by default for N1, closed for others. Locked levels have `.locked` class.

```js
function rMissions(cid) {
  initAcc(cid);
  const lvls = getLevels(cid); const ms = getMissions(cid); const st = S.children[cid].state;
  return lvls.map(lvl => {
    const ok = isLvlOk(cid, lvl.id);
    const lms = ms.filter(m => missionNiv(cid, m) === lvl.id);
    const done = lms.filter(m => st.missionStates[m.id] === 'done').length;
    const base = lms.filter(m => !m.secret);
    const secUnlocked = lms.filter(m => m.secret && isSecretOk(cid, m));
    const isOpen = ACC[cid][lvl.id];
    const locked = !ok;
    const pill = ok
      ? `${done}/${base.length} ✓${secUnlocked.length ? ' +' + secUnlocked.length + '🔮' : ''}`
      : `🔒 ${lvl.seuil} CHF`;

    // Gateway banner
    const gwM = lvl.gatewayMission && st.missionStates[lvl.gatewayMission] !== 'done'
      ? ms.find(m => m.id === lvl.gatewayMission) : null;
    const gwHtml = gwM && ok
      ? `<div class="ms-banner">🔑&nbsp;<strong>Gateway :</strong> ${gwM.nom}</div>` : '';

    const cards = lms.map(m => {
      const status = st.missionStates[m.id] || 'none';
      const color = getCatColor(m.cat);
      const isGw = lvl.gatewayMission === m.id;
      const canAccess = isMOk(cid, m);
      let btn;
      if (!canAccess)          btn = `<button class="m-btn btn-lock">🔒</button>`;
      else if (status==='none')    btn = `<button class="m-btn btn-todo" onclick="markPending('${cid}','${m.id}')">✋ Fait !</button>`;
      else if (status==='pending') btn = `<button class="m-btn btn-pend" onclick="openPin('${cid}','${m.id}','validate')">⏳ Valider</button>`;
      else                         btn = `<button class="m-btn btn-done">✅</button>`;
      const msTag = isGw ? '<span class="tag tag-ms">🔑 Gateway</span>' : '';
      const secTag = m.secret ? '<span class="tag tag-sec">🔮 Secret</span>' : '';
      return `<div class="m-card ${status==='done'?'done':''}">
        <div class="cat-pip" style="background:${color};color:${color}"></div>
        <div class="m-body">
          <div class="m-name">${m.nom.replace('[🔮] ','')}</div>
          <div class="m-tags"><span class="tag tag-cat">${getCatLabel(m.cat)}</span><span style="font-size:9px">${'⭐'.repeat(m.diff)}</span>${msTag}${secTag}</div>
        </div>
        <div class="m-right"><div class="m-chf">+${m.chf} CHF</div>${btn}</div>
      </div>`;
    }).join('');

    return `<div class="acc-level ${isOpen?'open':''} ${locked?'locked':''}">
      <div class="acc-hdr" onclick="${locked?'':`toggleAcc('${cid}','${lvl.id}')`}">
        <div class="acc-dot" style="background:${lvl.color}"></div>
        <div class="acc-title" style="color:${lvl.color}">${lvl.emoji} ${lvl.id} · ${lvl.label}</div>
        <div class="acc-pill">${pill}</div>
        <div class="acc-chevron">▼</div>
      </div>
      <div class="acc-body">
        ${gwHtml}
        ${cards}
      </div>
    </div>`;
  }).join('');
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: accordion levels in missions tab"
```

---

### Task 6: Rewrite `rDaily()` with new card styles

**Files:**
- Modify: `index.html` — rDaily

- [ ] **Step 1: Rewrite `rDaily()` with proto styling**

Use proto classes: `.streak-card`, `.streak-big`, `.streak-right`, `.streak-lbl`, `.daily-group`, `.dg-title`, `.daily-cards`, `.d-card`, `.d-check`, `.d-label`. No bonus/malus amounts (already removed).

```js
function rDaily(cid) {
  const dk = todayKey();
  const rec = getDR(cid, dk);
  const strk = streak(cid);
  const nextStreak = (S.cfg.streakDays||7) - (strk % (S.cfg.streakDays||7));
  const tasks = getDailyTasks(cid);
  const taskCards = tasks.map(t => {
    const app = isApplicable(t);
    const ch = rec.tasks[t.id];
    if (t.passive) {
      return `<div class="d-card ${ch?'checked':''}" onclick="toggleD('${cid}','${t.id}','${dk}')" style="border-top:2px dashed var(--brd2)">
        <div class="d-check" style="${ch?'':'border-style:dashed'}">${ch?'💬':''}</div>
        <div class="d-label">${t.em} ${t.lbl} <span style="font-size:9px;color:#b388ff">(libre)</span></div>
      </div>`;
    }
    return `<div class="d-card ${ch?'checked':''} ${!app?'na':''}" onclick="${app?`toggleD('${cid}','${t.id}','${dk}')`:''}" >
      <div class="d-check">${ch?'✓':''}</div>
      <div class="d-label">${t.em} ${t.lbl}</div>
    </div>`;
  }).join('');

  return `
    <div class="streak-card">
      <div>
        <div class="streak-big">${strk}</div>
      </div>
      <div class="streak-right">
        <div class="streak-lbl">jours parfaits consécutifs</div>
        <div style="margin-top:6px">
          <div class="sb-prog-track"><div class="sb-prog-fill" style="width:${(strk%(S.cfg.streakDays||7))/(S.cfg.streakDays||7)*100}%"></div></div>
        </div>
        <div style="font-size:10px;color:var(--hi3);margin-top:4px;font-weight:700">Dans ${nextStreak} jour${nextStreak>1?'s':''} → +${S.cfg.streakBonus} CHF 🔥</div>
      </div>
    </div>
    <div class="daily-group">
      <div class="dg-title">TÂCHES DU JOUR — ${dk}</div>
      <div class="daily-cards">${taskCards}</div>
    </div>
    <div style="font-size:10px;color:var(--muted);padding:8px;text-align:center">${rec.parentValidated?'✅ Validé par parent':'⏳ En attente de validation parent'}</div>`;
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rDaily with proto streak card + daily cards styling"
```

---

### Task 7: Rewrite `rBadges()` with proto styling

**Files:**
- Modify: `index.html` — rBadges

- [ ] **Step 1: Rewrite `rBadges()` with proto classes**

Use `.badge-cat-title`, `.badge-secret-note`, `.badges-grid`, `.badge-card`, `.b-em`, `.b-nm`, `.b-st`.

```js
function rBadges(cid) {
  const eb = earnedBadges(cid);
  const cats = [...new Set(S.catalog.badges.map(b => b.catId))];
  return cats.map(catId => {
    const cb = S.catalog.badges.filter(b => b.catId === catId);
    const cnt = cb.filter(b => eb.includes(b.id)).length;
    const secNote = cnt >= 1
      ? `<span class="badge-secret-note">🔮 Secret débloquée !</span>`
      : `<span style="font-size:9px;color:var(--muted)">(1 badge → secret)</span>`;
    return `<div class="badge-cat-title"><span>${getCatLabel(catId)} · ${cnt}/${cb.length}</span>${secNote}</div>
    <div class="badges-grid">${cb.map(b => {
      const ok = eb.includes(b.id);
      const imgHtml = b.img
        ? `<img src="${b.img}" alt="${b.nm}" style="width:40px;height:40px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="b-em" style="display:none">${b.em}</span>`
        : `<span class="b-em">${b.em}</span>`;
      return `<div class="badge-card ${ok?'earned':''}">${imgHtml}<div class="b-nm">${b.nm}</div><div class="b-st">${ok?'✅ Obtenu':'🔒 À gagner'}</div></div>`;
    }).join('')}</div>`;
  }).join('');
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: rBadges with proto category headers + grid styling"
```

---

### Task 8: Final adjustments + verification

**Files:**
- Modify: `index.html` — minor fixes

- [ ] **Step 1: Ensure BO still opens correctly**

The BO is `#backoffice` overlay — it should work as before. Verify `openAdmin()` and `closeBO()` still function. The `#backoffice` div exists in the new HTML shell.

- [ ] **Step 2: Ensure PIN modal still works**

The PIN overlay `#pin-ov` exists in the new shell. Verify `openPin()`, `closePin()`, `checkPin()` still work.

- [ ] **Step 3: Remove old `#admin-btn` references**

The old admin button was `<button id="admin-btn">`. The proto uses `#admin-round` (round button in child tabs) and `.side-admin` (sidebar). Make sure `openAdmin()` function name matches the onclick handlers.

- [ ] **Step 4: Initialize ST for dynamically added children**

When `selSub()` is called, ensure `ST[cid]` exists:
```js
function selSub(cid, tab) { ST[cid] = tab; render(); }
```

- [ ] **Step 5: Test in browser — portrait mode**

- Round child buttons at top with admin button
- Stats bar with CHF, level, progress, streak
- Bottom nav pill with 3 section buttons
- Missions: accordion levels, N1 open by default
- Daily: streak card + task list
- Badges: grid with category headers
- Theme changes when switching children
- BO opens on admin button + PIN

- [ ] **Step 6: Test in browser — landscape mode**

- Sidebar left with children + sections + admin
- No bottom nav visible (or both visible — proto hides bottom nav in landscape via sidebar)
- Stats bar compact inline
- Content area fills remaining space

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: UI refonte complete — proto design integrated"
```
