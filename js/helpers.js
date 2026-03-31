// ══════════════════════════════════════════════
// HELPERS — utility & computation functions
// Depends on: S, KEY_V4, getMissions(), getDailyTasks(), getLevels(),
//             missionNiv(), getCatColor(), getCatLabel() from state.js
// ══════════════════════════════════════════════

// _cache is defined in state.js and shared across files

// ── Analytics ──
function track(name, data) { typeof umami !== 'undefined' && umami.track(name, data); }

// ── Formatting ──
function chf(n) { return Number(n).toFixed(2); }

// ── XSS protection ──
function escHtml(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Time / status helpers ──

function todayKey() { return new Date().toISOString().slice(0, 10); }

function isApplicable(t) {
  return t.days === null
    || t.days === undefined
    || t.days.includes(new Date().getDay());
}

function isApplicableOn(t, dk) {
  if (t.days === null || t.days === undefined) return true;
  const d = new Date(dk + 'T12:00:00');
  return t.days.includes(d.getDay());
}

function getDR(cid, dk) {
  const st = S.children[cid].state;
  if (!st.daily[dk]) {
    const r = { tasks: {}, parentValidated: false };
    getDailyTasks(cid).forEach(t => r.tasks[t.id] = 'none');
    st.daily[dk] = r;
  }
  return st.daily[dk];
}

function calcBal(cid, dk) {
  const rec = S.children[cid].state.daily[dk];
  if (!rec) return { done: 0, total: 0, perfect: false };
  const app = getDailyTasks(cid).filter(t => isApplicableOn(t, dk) && !t.passive);
  const done = app.filter(t => rec.tasks[t.id] === 'done' || rec.tasks[t.id] === true).length;
  return { done, total: app.length, perfect: app.length > 0 && (done / app.length) >= (S.cfg.streakPct || 0.8) };
}

// ── Financial helpers ──

const CHF_COEFFS = { N1: 1.0, N2: 2.0, N3: 4.5, N4: 8.5, N5: 14.0 };

function missionChf(cid, m) {
  const ov = S.children[cid]?.missions?.overrides[m.id];
  if (ov?.chf != null) return ov.chf;
  const base = S.children[cid]?.baseN1 || 1.0;
  const niv = missionNiv(cid, m);
  const coeff = CHF_COEFFS[niv] || 1.0;
  const diff = missionDiff(cid, m);
  const key = '_diffMoy_' + cid + '_' + niv;
  if (!_cache[key]) {
    const ms = getMissions(cid).filter(x => missionNiv(cid, x) === niv && !isSecret(x));
    _cache[key] = ms.length ? ms.reduce((a,x) => a + missionDiff(cid, x), 0) / ms.length : 2;
  }
  const chfBase = Math.max(0.1, Math.round(base * coeff * (diff / _cache[key]) * 10) / 10);
  if (isSecret(m)) return Math.round((chfBase + (S.children[cid]?.secretBonus ?? 1)) * 10) / 10;
  return chfBase;
}

function earnM(cid) {
  return getMissions(cid)
    .filter(m => S.children[cid].state.missionStates[m.id] === 'done')
    .reduce((a, m) => a + missionChf(cid, m), 0);
}

function earnD(cid) {
  let total = S.children[cid].state.streakBonusBank || 0;
  Object.values(S.children[cid].state.daily).forEach(rec => {
    if (rec.parentValidated && rec.streakBonus) {
      total += rec.streakBonus;
    }
  });
  return total;
}

function totalE(cid) { return Math.max(0, earnM(cid) + earnD(cid)); }

// ── Level helpers ──

function computeLevelThresholds(cid) {
  const lvls = getLevels(cid);
  const ms = getMissions(cid).filter(m => !isSecret(m));
  const pct = S.children[cid]?.seuilPct || 0.8;
  let cumul = 0;
  lvls.forEach((l, i) => {
    if (i === 0) { if (!l.seuilOverride) l.seuil = 0; return; }
    const prevNiv = lvls[i - 1].id;
    const sumPrev = ms.filter(m => missionNiv(cid, m) === prevNiv)
      .reduce((a, m) => a + missionChf(cid, m), 0);
    cumul += sumPrev * pct;
    if (!l.seuilOverride) l.seuil = Math.round(cumul);
  });
}

function curLvl(cid) {
  const e = totalE(cid); const lvls = getLevels(cid);
  if (!lvls.length) return { id: '?', label: 'Aucun niveau', color: '#888', bg: '#111', seuil: 0 };
  for (let i = lvls.length - 1; i >= 0; i--) { if (e >= lvls[i].seuil) return lvls[i]; }
  return lvls[0];
}

function isLvlOk(cid, nid) {
  const lvl = getLevels(cid).find(l => l.id === nid);
  if (!lvl) return false;
  return totalE(cid) >= lvl.seuil;
}

function isGatewayDone(cid, nid) {
  const lvl = getLevels(cid).find(l => l.id === nid);
  if (!lvl || !lvl.gatewayMission) return true;
  return S.children[cid].state.missionStates[lvl.gatewayMission] === 'done';
}

function isMOk(cid, m) {
  const niv = missionNiv(cid, m);
  if (!isLvlOk(cid, niv)) return false;
  const lvl = getLevels(cid).find(l => l.id === niv);
  if (lvl && lvl.gatewayMission === m.id) return true;
  if (!isGatewayDone(cid, niv)) return false;
  if (isSecret(m)) return isSecretOk(cid, m);
  return true;
}

function prog(cid) {
  const e = totalE(cid); const lvls = getLevels(cid); const lvl = curLvl(cid);
  if (!lvls.length) return { pct: 0, label: 'Aucun niveau configuré', next: null };
  const idx = lvls.indexOf(lvl);
  if (idx === lvls.length - 1) return { pct: 100, label: 'NIVEAU MAX', next: null };
  const next = lvls[idx + 1];
  const pct = Math.round(((e - lvl.seuil) / (next.seuil - lvl.seuil)) * 100);
  return { pct: Math.min(Math.max(pct, 0), 100), label: `${next.label} — encore ${chf(Math.max(0, next.seuil - e))} CHF`, next };
}

// ── Badge helpers ──

function isSecret(m) {
  return S.catalog.badges.some(b => b.secretMissionId === m.id);
}

function earnedBadges(cid) {
  const key = 'badges_' + cid;
  if (_cache[key]) return _cache[key];
  const ms = getMissions(cid);
  const result = S.catalog.badges.filter(b => {
    const bms = ms.filter(m => m.cat === b.catId && missionNiv(cid, m) === b.nivId && !isSecret(m));
    return bms.length > 0 && bms.every(m => S.children[cid].state.missionStates[m.id] === 'done');
  }).map(b => b.id);
  _cache[key] = result;
  return result;
}

function isSecretOk(cid, m) {
  const badge = S.catalog.badges.find(b => b.secretMissionId === m.id);
  if (!badge) return false;
  return earnedBadges(cid).includes(badge.id);
}

// ── Sync timestamps ──

function touchMissionState(cid, mid) {
  if (!S.children[cid].state.missionStateTs) S.children[cid].state.missionStateTs = {};
  S.children[cid].state.missionStateTs[mid] = Date.now();
}

function touchDaily(cid, dk) {
  if (!S.children[cid].state.dailyTs) S.children[cid].state.dailyTs = {};
  S.children[cid].state.dailyTs[dk] = Date.now();
}

// ── Recurrence ──

function currentWindowStart(type) {
  const d = new Date(); d.setHours(0,0,0,0);
  if (type === 'daily') return d.toISOString().slice(0,10);
  if (type === 'weekly') { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return d.toISOString().slice(0,10); }
  if (type === 'monthly') return d.toISOString().slice(0,7) + '-01';
  if (type === 'yearly') return d.getFullYear() + '-01-01';
  return null;
}

function isInCurrentWindow(dateStr, type) {
  const start = currentWindowStart(type);
  return start && dateStr >= start;
}

function recurrenceSlotsFull(m) {
  if (!m.recurrence || m.recurrence.type === 'once') return false;
  const nombre = m.recurrence.nombre || 0;
  if (nombre === 0) return false;
  let count = 0;
  Object.keys(S.children).forEach(cid => {
    if (!S.children[cid].active) return;
    const st = S.children[cid].state;
    const ms = st.missionStates[m.id];
    if (ms === 'done' || ms === 'pending') {
      if (ms === 'done') {
        const dt = st.missionDates?.[m.id];
        if (dt && isInCurrentWindow(dt, m.recurrence.type)) count++;
      } else { count++; }
    }
  });
  return count >= nombre;
}

// ── Recurrence reset (extracted for reuse after SSE + periodic check) ──

function resetExpiredRecurrences() {
  let changed = false;
  Object.keys(S.children).forEach(cid => {
    const st = S.children[cid].state;
    getMissions(cid).forEach(m => {
      if (!m.recurrence || m.recurrence.type === 'once') return;
      const state = st.missionStates[m.id];
      if (state !== 'done' && state !== 'pending') return;
      const dt = st.missionDates?.[m.id];
      if (!dt || !isInCurrentWindow(dt, m.recurrence.type)) {
        st.missionStates[m.id] = 'none';
        touchMissionState(cid, m.id);
        changed = true;
      }
    });
  });
  return changed;
}

// ── Streak ──

function streak(cid) {
  let count = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const k = d.toISOString().slice(0, 10);
    const rec = S.children[cid].state.daily[k];
    if (!rec || !rec.parentValidated) {
      if (i === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    const b = calcBal(cid, k);
    if (!b.perfect) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// ── Daily record purge (90-day retention) ──

function purgeDailyRecords() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  let purged = false;
  Object.keys(S.children).forEach(cid => {
    const daily = S.children[cid].state.daily;
    Object.keys(daily).forEach(dk => {
      if (dk < cutoffKey) {
        if (daily[dk].streakBonus) {
          S.children[cid].state.streakBonusBank =
            (S.children[cid].state.streakBonusBank || 0) + daily[dk].streakBonus;
        }
        delete daily[dk];
        purged = true;
      }
    });
  });
  if (purged) storage.save(S);
}

// ── Tooltip helper ──
function tipBtn(text) {
  return `<button class="tip-btn" data-tip="${escHtml(text)}">?</button>`;
}
