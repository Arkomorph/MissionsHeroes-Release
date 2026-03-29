// ══════════════════════════════════════════════
// TRIAL SYSTEM — 30-day trial for public version
// Injected only in release builds via deploy workflow
// ══════════════════════════════════════════════
(function () {
  const TRIAL_KEY = 'mh_trial';
  const STATE_KEY = 'mh_v4';
  const TRIAL_DAYS = 30;
  const WARNING_START = 15;
  const DEFAULT_NAMES = ['Louis', 'Émile', 'Marius', 'Nouveau'];

  function getTrialData() {
    try { return JSON.parse(localStorage.getItem(TRIAL_KEY)) || {}; }
    catch { return {}; }
  }

  function setTrialData(data) {
    localStorage.setItem(TRIAL_KEY, JSON.stringify(data));
  }

  function checkActivation() {
    const trial = getTrialData();
    if (trial.activatedAt) return;
    try {
      const state = JSON.parse(localStorage.getItem(STATE_KEY));
      if (!state || !state.children) return;
      const names = Object.values(state.children).map(c => c.name);
      if (names.some(n => !DEFAULT_NAMES.includes(n))) {
        setTrialData({ activatedAt: new Date().toISOString() });
      }
    } catch { /* no state yet */ }
  }

  function getDaysRemaining() {
    const trial = getTrialData();
    if (!trial.activatedAt) return null;
    const start = new Date(trial.activatedAt);
    const now = new Date();
    const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRIAL_DAYS - elapsed);
  }

  function isAppPage() {
    return location.pathname.includes('app.html');
  }

  function isIndexPage() {
    return location.pathname.endsWith('/') || location.pathname.includes('index.html');
  }

  // ── Warning banner (days 15–29) ──
  function injectWarning(daysLeft) {
    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    Object.assign(banner.style, {
      position: 'fixed', top: '0', left: '0', right: '0',
      zIndex: '10000', padding: '8px 16px',
      background: 'linear-gradient(90deg, #1a1200, #2a1f00, #1a1200)',
      borderBottom: '1px solid #f5a623',
      color: '#f5a623', textAlign: 'center',
      fontFamily: "'Nunito', sans-serif", fontSize: '13px', fontWeight: '700',
      letterSpacing: '0.5px'
    });
    const plural = daysLeft > 1 ? 's' : '';
    banner.textContent = `\u23F3 P\u00e9riode d\u2019essai : ${daysLeft} jour${plural} restant${plural}`;
    document.body.prepend(banner);
    // Push page content down so banner doesn't overlap
    document.body.style.paddingTop = (banner.offsetHeight) + 'px';
  }

  // ── Expired overlay on app.html ──
  function injectExpiredOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'trial-expired';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      background: 'rgba(3, 8, 16, 0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif", color: '#fff',
      textAlign: 'center', padding: '24px'
    });
    overlay.innerHTML = `
      <div style="font-size:64px;margin-bottom:16px">\u23F0</div>
      <div style="font-size:22px;font-weight:800;margin-bottom:8px;color:#f5a623">
        P\u00e9riode d\u2019essai termin\u00e9e
      </div>
      <div style="font-size:14px;color:#8a9ab5;max-width:360px;margin-bottom:24px">
        Les 30 jours d\u2019essai gratuit sont \u00e9coul\u00e9s.<br>
        Merci d\u2019avoir test\u00e9 Missions Heroes\u00a0!
      </div>
      <a href="index.html" style="
        display:inline-block;padding:10px 28px;border-radius:8px;
        background:linear-gradient(135deg,#00cfff,#0088cc);
        color:#fff;text-decoration:none;font-weight:700;font-size:14px;
        transition:transform .15s
      ">Retour \u00e0 l\u2019accueil</a>
    `;
    document.body.appendChild(overlay);
  }

  // ── Disable app card on index.html ──
  function disableAppCard() {
    const card = document.querySelector('.card--app');
    if (!card) return;
    card.removeAttribute('href');
    card.setAttribute('onclick', 'return false');
    Object.assign(card.style, {
      opacity: '0.4', pointerEvents: 'none', cursor: 'default',
      filter: 'grayscale(1)'
    });
    // Add expired message after the card
    const msg = document.createElement('div');
    Object.assign(msg.style, {
      textAlign: 'center', color: '#f5a623',
      fontFamily: "'Nunito', sans-serif", fontSize: '13px',
      fontWeight: '700', marginTop: '-8px', marginBottom: '16px',
      padding: '8px'
    });
    msg.textContent = '\u23F0 P\u00e9riode d\u2019essai de 30 jours termin\u00e9e';
    card.parentNode.insertBefore(msg, card.nextSibling);
  }

  // ── Main ──
  document.addEventListener('DOMContentLoaded', function () {
    checkActivation();
    const remaining = getDaysRemaining();
    if (remaining === null) return; // not activated yet

    if (remaining <= 0) {
      if (isAppPage()) injectExpiredOverlay();
      if (isIndexPage()) disableAppCard();
    } else if (remaining <= (TRIAL_DAYS - WARNING_START)) {
      injectWarning(remaining);
    }
  });
})();
