// ══════════════════════════════════════════════
// ACTIONS — user interactions, PIN modal, admin, config
// Globals from state.js: S, save, getMissions, getDailyTasks, getDR, getChild,
//   getChildList, getLevels, missionNiv, streak, earnM, earnD
// Globals from helpers.js: todayKey, calcBal
// Globals from render.js: render, renderBO, AC, ST
// ══════════════════════════════════════════════

// ── Navigation ──────────────────────────────

function selChild(id) { AC = id; track('Changement enfant', { enfant: getChild(id)?.name }); render(); }
function selSub(cid, tab) { ST[cid] = tab; track('Changement onglet', { enfant: getChild(cid)?.name, onglet: tab }); render(); }

// ── Daily actions ───────────────────────────

function dailyAction(cid, tid, dk) {
  const rec = getDR(cid, dk);
  if (rec.parentValidated) return;
  const status = rec.tasks[tid] || 'none';
  if (status === 'done') return;
  if (status === 'pending') {
    openPin(cid, 'DAILY_' + tid + '_' + dk, 'daily');
    return;
  }
  // Skip pending state when PIN is disabled — validate directly
  if (S.cfg.skipPin) {
    openPin(cid, 'DAILY_' + tid + '_' + dk, 'daily');
    return;
  }
  rec.tasks[tid] = 'pending';
  track('Tâche journalière demandée', { enfant: getChild(cid)?.name, tache: tid });
  save(); render();
  toast('⏳ En attente de validation parent');
}

function togglePassive(cid, tid, dk) {
  const rec = getDR(cid, dk);
  const cur = rec.tasks[tid];
  rec.tasks[tid] = (cur === true || cur === 'done') ? 'none' : 'done';
  track('Moment parole', { enfant: getChild(cid)?.name, tache: tid });
  save(); render();
}

function setDT(cid, dk, tid, val) {
  getDR(cid, dk).tasks[tid] = val ? 'done' : 'none';
  save();
}

function valDay(cid, dk) {
  const rec = getDR(cid, dk);
  const appTasks = getDailyTasks(cid).filter(t => isApplicableOn(t, dk) && !t.passive);
  const pendingTasks = appTasks.filter(t => rec.tasks[t.id] === 'pending');
  if (pendingTasks.length > 0) {
    const names = pendingTasks.map(t => t.em + ' ' + t.lbl).join('\n• ');
    if (!confirm(`⚠️ ${pendingTasks.length} tâche(s) encore en attente :\n• ${names}\n\nValider quand même ?`)) return;
  }
  rec.parentValidated = true;
  const strk = streak(cid);
  if (strk > 0 && strk % (S.cfg.streakDays || 7) === 0) {
    if (!rec.streakBonus) {
      rec.streakBonus = S.cfg.streakBonus;
      track('Bonus streak', { enfant: getChild(cid)?.name, streak: strk, chf: S.cfg.streakBonus });
      toast(`🔥 STREAK x${S.cfg.streakDays || 7} ! +${chf(S.cfg.streakBonus)} CHF pour ${getChild(cid).name} !`);
    }
  }
  const bal = calcBal(cid, dk);
  track('Journée validée', { enfant: getChild(cid)?.name, date: dk, parfait: bal.done === bal.total, streak: strk });
  save(); renderBO(); render();
  toast(`✅ Journée de ${getChild(cid).name} validée`);
}

function markPending(cid, mid) {
  const m = getMissions(cid).find(x => x.id === mid);
  if (m && recurrenceSlotsFull(m)) { toast('✗ Places prises pour cette période', true); return; }
  track('Mission demandée', { enfant: getChild(cid)?.name, mission: m?.nom, niveau: missionNiv(cid, m) });
  // Skip pending state when PIN is disabled — go straight to validate/redo choice
  if (S.cfg.skipPin) {
    S.children[cid].state.missionStates[mid] = 'pending';
    save();
    openPin(cid, mid, 'validate');
    return;
  }
  S.children[cid].state.missionStates[mid] = 'pending';
  save(); render();
  toast('⏳ Mission notée — demande la validation !');
}

// ── PIN modal ───────────────────────────────

let PX = null;
let PV = '';

function openPin(cid, mid, action) {
  PX = { cid, mid, action };

  // Skip PIN for non-admin actions when skipPin is enabled
  if (S.cfg.skipPin && action !== 'admin') {
    // Show validate/redo choice directly for pending items
    if (action === 'redo_mission' || action === 'redo_daily') {
      pinAction('redo');
      return;
    }
    // Show validate/redo choice
    PV = ''; updateDots();
    document.getElementById('pin-lbl').textContent = action === 'daily' || action === 'redo_daily'
      ? (getDailyTasks(cid).find(x => x.id === mid.split('_')[1])?.lbl || 'Tâche')
      : (getMissions(cid).find(x => x.id === mid)?.nom || '—');
    document.getElementById('pin-err').textContent = '';
    document.getElementById('pin-ov').classList.add('open');
    document.getElementById('pin-actions').style.display = 'block';
    document.querySelector('.keypad').style.display = 'none';
    document.querySelector('.pin-dots').style.display = 'none';
    document.getElementById('pin-err').style.display = 'none';
    return;
  }

  PV = ''; updateDots();
  let label = '—';
  if (action === 'daily' || action === 'redo_daily') {
    const tid = mid.split('_')[1];
    const t = getDailyTasks(cid).find(x => x.id === tid);
    label = t ? t.em + ' ' + t.lbl : 'Tâche';
  } else {
    const m = getMissions(cid).find(x => x.id === mid);
    label = m ? m.nom : '—';
  }
  document.getElementById('pin-lbl').textContent = label;
  document.getElementById('pin-err').textContent = '';
  document.getElementById('pin-ov').classList.add('open');
}

function closePin() {
  PX = null; PV = '';
  document.getElementById('pin-ov').classList.remove('open');
  document.getElementById('pin-actions').style.display = 'none';
  document.querySelector('.keypad').style.display = '';
  document.querySelector('.pin-dots').style.display = '';
  document.getElementById('pin-err').style.display = '';
}

function kp(d) {
  if (PV.length >= 4) return;
  PV += d;
  updateDots();
  if (PV.length === 4) setTimeout(checkPin, 180);
}

function kpDel() {
  PV = PV.slice(0, -1);
  updateDots();
  document.getElementById('pin-err').textContent = '';
}

function updateDots() {
  [0, 1, 2, 3].forEach(i => document.getElementById('d' + i).classList.toggle('on', i < PV.length));
}

function checkPin() {
  if (PV !== (S.pin || '1234')) {
    document.getElementById('pin-err').textContent = '❌ Code incorrect';
    PV = ''; updateDots(); return;
  }
  if (PX.action === 'admin') {
    const ctx = PX; closePin();
    renderBO();
    document.getElementById('backoffice').classList.add('open');
    return;
  }
  // Redo-only mode: skip choice, go straight to redo
  if (PX.action === 'redo_mission' || PX.action === 'redo_daily') {
    pinAction('redo'); return;
  }
  // Show validate/redo choice
  document.getElementById('pin-actions').style.display = 'block';
  document.querySelector('.keypad').style.display = 'none';
  document.querySelector('.pin-dots').style.display = 'none';
  document.getElementById('pin-err').style.display = 'none';
}

function pinAction(choice) {
  const ctx = PX; closePin();
  if (choice === 'redo') {
    // Reset to none
    if (ctx.action === 'validate' || ctx.action === 'redo_mission') {
      const m = getMissions(ctx.cid).find(x => x.id === ctx.mid);
      track('Mission à refaire', { enfant: getChild(ctx.cid)?.name, mission: m?.nom });
      S.children[ctx.cid].state.missionStates[ctx.mid] = 'none';
      save(); render();
      toast('↩️ Mission à refaire');
    }
    if (ctx.action === 'daily' || ctx.action === 'redo_daily') {
      const parts = ctx.mid.split('_');
      const tid = parts[1]; const dk = parts.slice(2).join('_');
      getDR(ctx.cid, dk).tasks[tid] = 'none';
      save(); render();
      toast('↩️ Tâche à refaire');
    }
    return;
  }
  // Validate
  if (ctx.action === 'validate') {
    const lvlBefore = curLvl(ctx.cid);
    const badgesBefore = earnedBadges(ctx.cid).length;
    S.children[ctx.cid].state.missionStates[ctx.mid] = 'done';
    if (!S.children[ctx.cid].state.missionDates) S.children[ctx.cid].state.missionDates = {};
    S.children[ctx.cid].state.missionDates[ctx.mid] = new Date().toISOString().slice(0, 10);
    save(); render();
    const ms = getMissions(ctx.cid); const m = ms.find(x => x.id === ctx.mid);
    track('Mission validée', { enfant: getChild(ctx.cid)?.name, mission: m?.nom, chf: missionChf(ctx.cid, m) });
    const lvlAfter = curLvl(ctx.cid);
    if (lvlAfter !== lvlBefore) track('Niveau supérieur', { enfant: getChild(ctx.cid)?.name, niveau: lvlAfter });
    const badgesAfter = earnedBadges(ctx.cid);
    if (badgesAfter.length > badgesBefore) track('Badge obtenu', { enfant: getChild(ctx.cid)?.name, badge: badgesAfter[badgesAfter.length - 1] });
    toast(`✅ +${chf(missionChf(ctx.cid, m))} CHF — Bravo ${getChild(ctx.cid).name} ! 🎉`);
  }
  if (ctx.action === 'daily') {
    const parts = ctx.mid.split('_');
    const tid = parts[1]; const dk = parts.slice(2).join('_');
    getDR(ctx.cid, dk).tasks[tid] = 'done';
    save(); render();
    toast(`✅ Tâche validée !`);
  }
}

// ── Admin ───────────────────────────────────

function openAdmin() {
  track('Accès back office', { enfant: getChild(AC)?.name });
  PX = { action: 'admin' };
  PV = '';
  updateDots();
  document.getElementById('pin-lbl').textContent = 'Accès Back Office';
  document.getElementById('pin-err').textContent = '';
  document.getElementById('pin-ov').classList.add('open');
}

function closeBO() {
  document.getElementById('backoffice').classList.remove('open');
  render();
}

// ── Config / Reset ──────────────────────────

function setLevelThreshold(cid, nid, val) {
  const lvl = S.children[cid].levels.find(l => l.id === nid);
  if (lvl) { lvl.seuil = val; save(); }
}

function setMissionOv(cid, mid, field, val) {
  if (!S.children[cid].missions.overrides[mid]) S.children[cid].missions.overrides[mid] = {};
  if (val === undefined || val === null || val === '') {
    delete S.children[cid].missions.overrides[mid][field];
  } else {
    S.children[cid].missions.overrides[mid][field] = val;
  }
  if (Object.keys(S.children[cid].missions.overrides[mid]).length === 0) {
    delete S.children[cid].missions.overrides[mid];
  }
  save(); renderBO();
}

function toggleMissionExclude(cid, mid) {
  const exc = S.children[cid].missions.exclude;
  const idx = exc.indexOf(mid);
  if (idx >= 0) { exc.splice(idx, 1); }
  else { exc.push(mid); }
  save();
}

function boUnlockGateway(cid, mid) {
  S.children[cid].state.missionStates[mid] = 'done';
  if (!S.children[cid].state.missionDates) S.children[cid].state.missionDates = {};
  S.children[cid].state.missionDates[mid] = new Date().toISOString().slice(0, 10);
  save(); renderBO();
  toast('🔓 Gateway débloquée manuellement');
}

function boCycleMissionLevel(cid, mid) {
  const lvls = getLevels(cid).map(l => l.id);
  const exc = S.children[cid].missions.exclude;
  const isExc = exc.includes(mid);
  const curNiv = isExc ? null : missionNiv(cid, S.catalog.missions.find(m => m.id === mid));

  // Build cycle: null -> N1 -> N2 -> ... -> null
  const cycle = [null, ...lvls];
  const curIdx = curNiv ? cycle.indexOf(curNiv) : 0;
  const nextIdx = (curIdx + 1) % cycle.length;
  const nextNiv = cycle[nextIdx];

  // Apply
  if (nextNiv === null) {
    // Exclude
    if (!exc.includes(mid)) exc.push(mid);
    // Clear niv override
    const ov = S.children[cid].missions.overrides[mid];
    if (ov) { delete ov.niv; if (!Object.keys(ov).length) delete S.children[cid].missions.overrides[mid]; }
  } else {
    // Un-exclude
    const i = exc.indexOf(mid); if (i >= 0) exc.splice(i, 1);
    // Set or clear niv override
    const catalogNiv = S.catalog.missions.find(m => m.id === mid)?.niv;
    if (nextNiv === catalogNiv) {
      const ov = S.children[cid].missions.overrides[mid];
      if (ov) { delete ov.niv; if (!Object.keys(ov).length) delete S.children[cid].missions.overrides[mid]; }
    } else {
      if (!S.children[cid].missions.overrides[mid]) S.children[cid].missions.overrides[mid] = {};
      S.children[cid].missions.overrides[mid].niv = nextNiv;
    }
  }
  save(); renderBO();
}

function resetChild(cid) {
  if (!confirm(`Tout réinitialiser pour ${getChild(cid).name} ?`)) return;
  const ms = getMissions(cid);
  S.children[cid].state = { missionStates: {}, missionDates: {}, daily: {}, weeklyRec: {}, streakBonusBank: 0 };
  ms.forEach(m => S.children[cid].state.missionStates[m.id] = 'none');
  save(); renderBO(); render();
  toast('♻️ Réinitialisé', true);
}

function resetMs(cid) {
  if (!confirm('Réinitialiser les missions ?')) return;
  const ms = getMissions(cid);
  ms.forEach(m => S.children[cid].state.missionStates[m.id] = 'none');
  save(); renderBO(); render();
  toast('↩️ Missions réinitialisées', true);
}

// ── Toast ───────────────────────────────────

// ── Tooltip system — tap to reveal ──
document.addEventListener('click', e => {
  const btn = e.target.closest('.tip-btn');
  document.querySelectorAll('.tip-bubble').forEach(b => b.remove());
  document.querySelectorAll('.tip-btn.open').forEach(b => b.classList.remove('open'));
  if (!btn) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const tip = btn.getAttribute('data-tip');
  if (!tip) return;
  btn.classList.add('open');
  const bubble = document.createElement('div');
  bubble.className = 'tip-bubble';
  bubble.textContent = tip;
  document.body.appendChild(bubble);
  // Position fixed near the button
  const r = btn.getBoundingClientRect();
  const bw = bubble.offsetWidth;
  let left = r.left + r.width / 2 - bw / 2;
  if (left < 8) left = 8;
  if (left + bw > window.innerWidth - 8) left = window.innerWidth - 8 - bw;
  bubble.style.left = left + 'px';
  bubble.style.top = (r.top - bubble.offsetHeight - 8) + 'px';
}, true);

function toast(msg, warn = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (warn ? ' warn' : '');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3400);
}
