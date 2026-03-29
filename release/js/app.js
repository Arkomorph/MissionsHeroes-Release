// ══════════════════════════════════════════════
// APP BOOTSTRAP (async — waits for storage layer)
// Depends on: config.js, storage.js, data.js, migration.js, state.js, helpers.js, render.js, backoffice.js, actions.js
// ══════════════════════════════════════════════

(async () => {
  try {
    // 1. Load state from storage layer
    await initState();
    initRenderState();

    // 2. Ensure new missions/tasks in catalog get initialized in state
    Object.keys(S.children).forEach(cid => {
      const st = S.children[cid].state;
      if (!st.missionDates) st.missionDates = {};
      const ms = getMissions(cid);
      ms.forEach(m => {
        if (st.missionStates[m.id] === undefined)
          st.missionStates[m.id] = 'none';
      });
    });

    // 3. Reset recurring missions outside current window
    Object.keys(S.children).forEach(cid => {
      const st = S.children[cid].state;
      getMissions(cid).forEach(m => {
        if (!m.recurrence || m.recurrence.type === 'once') return;
        const state = st.missionStates[m.id];
        if (state !== 'done' && state !== 'pending') return;
        const dt = st.missionDates?.[m.id];
        if (!dt || !isInCurrentWindow(dt, m.recurrence.type)) {
          st.missionStates[m.id] = 'none';
        }
      });
    });
    save();

    // 4. Recompute auto level thresholds
    Object.keys(S.children).forEach(cid => computeLevelThresholds(cid));
    save();

    // 5. Purge daily records older than 90 days
    purgeDailyRecords();

    // 6. Show offline badge if needed
    if (storage.isOffline()) {
      const badge = document.getElementById('offline-badge');
      if (badge) badge.style.display = 'inline';
    }

    // 7. Hide loader, render
    document.getElementById('loader').style.display = 'none';
    render();

  } catch (e) {
    console.error('[app] Bootstrap failed:', e);
    const loader = document.getElementById('loader');
    if (loader) {
      loader.querySelector('.loader-text').textContent = 'Erreur de chargement';
      loader.querySelector('.loader-emoji').textContent = '💥';
    }
  }
})();
