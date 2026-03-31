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
    if (resetExpiredRecurrences()) save();

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

    // 8. Connect SSE for real-time sync across devices
    storage.onRemoteChange = async () => {
      await reloadFromRemote();
      if (resetExpiredRecurrences()) save();
      render();
    };
    storage.onMergedState = (merged) => {
      S = merged;
      clearCache();
      _catColorMap = null; _catLabelMap = null; _catEmojiMap = null;
      render();
    };
    storage.connectSSE();

    // 9. Periodic midnight check — reset recurrences when day changes
    let _lastDay = new Date().toISOString().slice(0, 10);
    setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== _lastDay) {
        _lastDay = today;
        if (resetExpiredRecurrences()) { save(); render(); }
      }
    }, 60000);

    // 10. Debug tools (console)
    window._MH_OrigDate = Date;
    window.MH_DEBUG = {
      state() { return JSON.parse(JSON.stringify(S)); },
      timestamps(cid) {
        cid = cid || Object.keys(S.children)[0];
        return {
          missionStateTs: S.children[cid].state.missionStateTs || {},
          dailyTs: S.children[cid].state.dailyTs || {}
        };
      },
      mission(mid) {
        const results = {};
        Object.keys(S.children).forEach(cid => {
          const st = S.children[cid].state;
          const m = getMissions(cid).find(x => x.id === mid);
          results[cid] = {
            state: st.missionStates[mid],
            date: st.missionDates?.[mid],
            ts: st.missionStateTs?.[mid],
            recurrence: m?.recurrence,
            inWindow: m?.recurrence ? isInCurrentWindow(st.missionDates?.[mid] || '', m.recurrence.type) : 'N/A'
          };
        });
        return results;
      },
      resetRecurrences() { const c = resetExpiredRecurrences(); if (c) save(); render(); return c; },
      reload() { return reloadFromRemote().then(() => { render(); return 'OK'; }); },
      advanceDays(n) {
        const offset = n * 86400000;
        const OrigDate = window._MH_OrigDate;
        const origNow = OrigDate.now.bind(OrigDate);
        const proxy = function(...args) {
          if (args.length === 0) return new OrigDate(origNow() + offset);
          return new OrigDate(...args);
        };
        proxy.now = () => origNow() + offset;
        proxy.parse = OrigDate.parse.bind(OrigDate);
        proxy.UTC = OrigDate.UTC.bind(OrigDate);
        proxy.prototype = OrigDate.prototype;
        window.Date = proxy;
        console.log(`[MH_DEBUG] Time shifted +${n} days. new Date() = ${new Date().toISOString()}`);
        return `Shifted +${n} days → ${new Date().toISOString().slice(0, 10)}`;
      },
      resetTime() {
        if (window._MH_OrigDate) window.Date = window._MH_OrigDate;
        console.log('[MH_DEBUG] Time reset to real time');
      }
    };

  } catch (e) {
    console.error('[app] Bootstrap failed:', e);
    const loader = document.getElementById('loader');
    if (loader) {
      loader.querySelector('.loader-text').textContent = 'Erreur de chargement';
      loader.querySelector('.loader-emoji').textContent = '💥';
    }
  }
})();
