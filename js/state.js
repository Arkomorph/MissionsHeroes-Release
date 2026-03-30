// ══════════════════════════════════════════════
// STATE MANAGEMENT — cache, lookup maps, resolution
// ══════════════════════════════════════════════

// ── Cache system ──
const _cache = {};
function clearCache() { Object.keys(_cache).forEach(k => delete _cache[k]); }

// ── Lookup maps for categories (O(1) instead of .find()) ──
let _catColorMap = null;
let _catLabelMap = null;
let _catEmojiMap = null;
function buildCatMaps() {
  _catColorMap = {};
  _catLabelMap = {};
  _catEmojiMap = {};
  S.catalog.categories.forEach(c => {
    _catColorMap[c.id] = c.color;
    _catEmojiMap[c.id] = c.em || '';
    _catLabelMap[c.id] = (c.em ? c.em + ' ' : '') + c.label;
  });
}

// ══════════════════════════════════════════════
// STATE INIT (async — called from app.js)
// ══════════════════════════════════════════════
const KEY_V4 = 'mh_v4';
let S;

async function initState() {
  try {
    S = await storage.load();
    if (!S) {
      S = migrateV3toV4();
      storage.save(S);
      localStorage.removeItem('mh_v3');
    }
  } catch (e) {
    S = migrateV3toV4();
  }
  applyPatches(S);
}

// ══════════════════════════════════════════════
// RELOAD FROM REMOTE (SSE-triggered)
// ══════════════════════════════════════════════
async function reloadFromRemote() {
  const fresh = await storage.load();
  if (!fresh) return;
  S = fresh;
  clearCache();
  _catColorMap = null;
  _catLabelMap = null;
  _catEmojiMap = null;
}

// ══════════════════════════════════════════════
// SAVE (with cache invalidation)
// ══════════════════════════════════════════════
function save() {
  clearCache();
  _catColorMap = null;
  _catLabelMap = null;
  _catEmojiMap = null;
  storage.save(S);
}

// ══════════════════════════════════════════════
// RESOLUTION FUNCTIONS
// ══════════════════════════════════════════════

// Generic resolver — factorizes getMissions/getDailyTasks
function resolveItems(cid, type, catalog, whitelist) {
  const cfg = S.children[cid][type];
  const inc = cfg.include;
  return catalog
    .filter(item => inc === '*' || inc.includes(item.id))
    .filter(item => !cfg.exclude.includes(item.id))
    .map(item => {
      const ov = cfg.overrides[item.id];
      if (!ov) return item;
      const safe = {};
      whitelist.forEach(k => { if (ov[k] !== undefined) safe[k] = ov[k]; });
      return { ...item, ...safe };
    })
    .concat(cfg.extra);
}

function getMissions(cid) {
  const key = 'missions_' + cid;
  if (_cache[key]) return _cache[key];
  const result = resolveItems(cid, 'missions', S.catalog.missions, ['chf','niv','nom','description']);
  _cache[key] = result;
  return result;
}

function getDailyTasks(cid) {
  const key = 'daily_' + cid;
  if (_cache[key]) return _cache[key];
  const result = resolveItems(cid, 'dailyTasks', S.catalog.dailyTasks, ['lbl','days','passive','description']);
  _cache[key] = result;
  return result;
}

function getLevels(cid) { return S.children[cid].levels; }
function getChild(cid) { return S.children[cid]; }
function getChildList() {
  return Object.entries(S.children).map(([id, c]) => ({ id, ...c }));
}

function getCatColor(catId) {
  if (!_catColorMap) buildCatMaps();
  return _catColorMap[catId] || '#888';
}

function getCatLabel(catId) {
  if (!_catLabelMap) buildCatMaps();
  return _catLabelMap[catId] || catId;
}

function getCatEmoji(catId) {
  if (!_catEmojiMap) buildCatMaps();
  return _catEmojiMap[catId] || '🏷️';
}

function missionNiv(cid, m) {
  const ov = S.children[cid].missions.overrides[m.id];
  return (ov && ov.niv) || m.niv;
}
function missionDiff(cid, m) {
  const ov = S.children[cid]?.missions?.overrides[m.id];
  return (ov?.diff != null) ? ov.diff : (m.diff || 1);
}
