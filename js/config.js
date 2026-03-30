// ══════════════════════════════════════════════
// CONFIGURATION — change only this file to switch storage mode
// ══════════════════════════════════════════════
const MH_CONFIG = {
  STORAGE_BACKEND: 'local',  // 'local' = localStorage only | 'remote' = API + localStorage fallback
  API_BASE: '/api',            // base URL for remote API (e.g. '/api' or 'https://host/api')
  CLIENT_ID: Math.random().toString(36).slice(2, 10)  // unique per-session, used for SSE origin filtering
};
