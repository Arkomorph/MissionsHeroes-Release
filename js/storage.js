// ══════════════════════════════════════════════
// STORAGE LAYER — dual backend (localStorage / remote API)
// ══════════════════════════════════════════════
const storage = (() => {
  const KEY = 'mh_v4';
  let _offline = false;

  function _localLoad() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function _localSave(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  async function load() {
    if (MH_CONFIG.STORAGE_BACKEND === 'local') return _localLoad();

    try {
      const res = await fetch(MH_CONFIG.API_BASE + '/state');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        _localSave(data);
        _offline = false;
        return data;
      }
      // Empty object from server — use local data or null
      _offline = false;
      return _localLoad();
    } catch (e) {
      console.warn('[storage] Remote load failed, falling back to localStorage:', e.message);
      _offline = true;
      _updateBadge();
      return _localLoad();
    }
  }

  function save(state) {
    _localSave(state);

    if (MH_CONFIG.STORAGE_BACKEND !== 'remote') return;

    fetch(MH_CONFIG.API_BASE + '/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).then(() => {
      if (_offline) {
        _offline = false;
        _updateBadge();
      }
    }).catch(e => {
      console.error('[storage] Remote save failed:', e.message);
      if (!_offline) {
        _offline = true;
        _updateBadge();
      }
    });
  }

  function isOffline() { return _offline; }

  function _updateBadge() {
    const el = document.getElementById('offline-badge');
    if (el) el.style.display = _offline ? 'inline' : 'none';
  }

  return { load, save, isOffline };
})();
