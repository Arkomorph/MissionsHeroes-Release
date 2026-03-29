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
  const TRIAL_API = 'https://PLACEHOLDER/api/mh-trial';

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

  // ── Shared styles ──
  const inputStyle = `
    display:block;width:100%;padding:10px 14px;margin-bottom:10px;
    border-radius:8px;border:1px solid #2a3a5a;background:#0a1628;
    color:#fff;font-family:'Nunito',sans-serif;font-size:14px;
    outline:none;box-sizing:border-box
  `.replace(/\n\s*/g, '');

  const btnPrimaryStyle = `
    display:inline-block;padding:10px 28px;border-radius:8px;border:none;
    background:linear-gradient(135deg,#00cfff,#0088cc);
    color:#fff;font-weight:700;font-size:14px;cursor:pointer;
    font-family:'Nunito',sans-serif;transition:transform .15s
  `.replace(/\n\s*/g, '');

  const btnSecondaryStyle = `
    display:inline-block;padding:8px 20px;border-radius:8px;
    border:1px solid #2a3a5a;background:transparent;
    color:#8a9ab5;font-weight:600;font-size:13px;cursor:pointer;
    font-family:'Nunito',sans-serif;margin-top:8px
  `.replace(/\n\s*/g, '');

  // ── Toast ──
  function showTrialToast(msg) {
    let t = document.getElementById('trial-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'trial-toast';
      Object.assign(t.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 20px', borderRadius: '8px', background: '#1a1a2e',
        border: '1px solid #f5a623', color: '#f5a623',
        fontFamily: "'Nunito',sans-serif", fontSize: '13px', fontWeight: '700',
        zIndex: '100000', transition: 'opacity .3s', opacity: '0',
        pointerEvents: 'none'
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }

  // ── Warning banner (days 15–29) ──
  function injectWarning(daysLeft) {
    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    Object.assign(banner.style, {
      padding: '8px 16px',
      background: 'linear-gradient(90deg, #1a1200, #2a1f00, #1a1200)',
      borderBottom: '1px solid #f5a623',
      color: '#f5a623', textAlign: 'center',
      fontFamily: "'Nunito', sans-serif", fontSize: '13px', fontWeight: '700',
      letterSpacing: '0.5px'
    });
    const plural = daysLeft > 1 ? 's' : '';
    banner.textContent = `\u23F3 P\u00e9riode d\u2019essai : ${daysLeft} jour${plural} restant${plural}`;
    document.body.prepend(banner);
  }

  // ── Overlay base ──
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'trial-expired';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      background: 'rgba(3, 8, 16, 0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif", color: '#fff',
      textAlign: 'center', padding: '24px', overflowY: 'auto'
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  // ── State 1: Registration form ──
  function injectExpiredOverlay() {
    const overlay = createOverlay();
    overlay.innerHTML = `
      <div style="max-width:400px;width:100%">
        <div style="font-size:48px;margin-bottom:12px">\u23F0</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px;color:#f5a623">
          P\u00e9riode d\u2019essai termin\u00e9e
        </div>
        <div style="font-size:13px;color:#8a9ab5;margin-bottom:20px">
          Les 30 jours d\u2019essai gratuit sont \u00e9coul\u00e9s.<br>
          Inscrivez-vous pour continuer \u00e0 utiliser Missions Heroes.
        </div>

        <button onclick="boExport()" style="${btnSecondaryStyle};margin-bottom:20px">
          \uD83D\uDCE4 T\u00e9l\u00e9charger mes donn\u00e9es
        </button>

        <div style="border-top:1px solid #1a2a4a;padding-top:20px;margin-top:4px">
          <div style="font-size:15px;font-weight:700;margin-bottom:14px;color:#fff">
            S\u2019inscrire
          </div>
          <form id="trial-form" onsubmit="window.__submitRegistration(event)">
            <input name="firstName" placeholder="Pr\u00e9nom" required style="${inputStyle}" />
            <input name="lastName" placeholder="Nom" required style="${inputStyle}" />
            <input name="email" type="email" placeholder="Email" required style="${inputStyle}" />
            <textarea name="message" placeholder="Message (optionnel)" rows="3"
              style="${inputStyle};resize:vertical"></textarea>
            <button type="submit" id="trial-submit-btn" style="${btnPrimaryStyle};width:100%;margin-top:4px">
              S\u2019inscrire \u2192
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // ── State 2: Payment modal (Twint QR) ──
  function showPaymentScreen() {
    const overlay = document.getElementById('trial-expired');
    if (!overlay) return;
    overlay.innerHTML = `
      <div style="max-width:400px;width:100%">
        <div style="font-size:48px;margin-bottom:12px">\uD83D\uDE4F</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px;color:#00cfff">
          Merci pour votre inscription\u00a0!
        </div>
        <div style="font-size:13px;color:#8a9ab5;margin-bottom:20px">
          Scannez le QR code ci-dessous pour effectuer le paiement via Twint.
        </div>
        <img src="img/twint-qr.png" alt="QR Twint"
          style="max-width:240px;width:100%;border-radius:12px;margin-bottom:16px" />
        <div style="font-size:15px;font-weight:700;color:#f5a623;margin-bottom:8px">
          Montant : 5 CHF / mois
        </div>
        <div style="font-size:13px;color:#8a9ab5;margin-bottom:24px">
          Votre acc\u00e8s sera activ\u00e9 apr\u00e8s v\u00e9rification du paiement.
        </div>
        <button onclick="location.reload()" style="${btnPrimaryStyle}">Fermer</button>
      </div>
    `;
  }

  // ── State 3: Pending activation ──
  function injectPendingOverlay() {
    const overlay = createOverlay();
    overlay.innerHTML = `
      <div style="max-width:400px;width:100%">
        <div style="font-size:48px;margin-bottom:12px">\u23F3</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px;color:#f5a623">
          Inscription en cours de validation
        </div>
        <div style="font-size:13px;color:#8a9ab5;margin-bottom:24px">
          Votre demande a \u00e9t\u00e9 envoy\u00e9e. L\u2019acc\u00e8s sera activ\u00e9 d\u00e8s que
          l\u2019administrateur aura v\u00e9rifi\u00e9 votre paiement.
        </div>
        <button onclick="window.__checkActivation()" style="${btnPrimaryStyle};margin-bottom:12px">
          \uD83D\uDD04 V\u00e9rifier mon acc\u00e8s
        </button>
        <br>
        <button onclick="boExport()" style="${btnSecondaryStyle}">
          \uD83D\uDCE4 T\u00e9l\u00e9charger mes donn\u00e9es
        </button>
      </div>
    `;
  }

  // ── Registration submit ──
  async function submitRegistration(event) {
    event.preventDefault();
    const btn = document.getElementById('trial-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours\u2026'; }

    const form = new FormData(event.target);
    let stateJson = '';
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) stateJson = raw;
    } catch { /* empty */ }

    const payload = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      email: form.get('email'),
      message: form.get('message') || '',
      stateJson
    };

    try {
      const res = await fetch(TRIAL_API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.uuid) {
        const trial = getTrialData();
        trial.registeredUuid = data.uuid;
        setTrialData(trial);
        showPaymentScreen();
      } else {
        showTrialToast('\u26A0\uFE0F Erreur lors de l\u2019inscription');
        if (btn) { btn.disabled = false; btn.textContent = 'S\u2019inscrire \u2192'; }
      }
    } catch (e) {
      showTrialToast('\u26A0\uFE0F Erreur de connexion');
      if (btn) { btn.disabled = false; btn.textContent = 'S\u2019inscrire \u2192'; }
    }
  }
  window.__submitRegistration = submitRegistration;

  // ── Manual activation check ──
  async function manualCheckActivation() {
    const trial = getTrialData();
    if (!trial.registeredUuid) return;
    try {
      const res = await fetch(TRIAL_API + '/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trial.registeredUuid })
      });
      const data = await res.json();
      if (data.valid) {
        trial.trialActive = true;
        setTrialData(trial);
        location.reload();
      } else {
        showTrialToast('\u23F3 Pas encore activ\u00e9 \u2014 en attente de validation');
      }
    } catch (e) {
      showTrialToast('\u26A0\uFE0F Erreur de connexion');
    }
  }
  window.__checkActivation = manualCheckActivation;

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
  document.addEventListener('DOMContentLoaded', async function () {
    checkActivation();
    const trial = getTrialData();

    // Already fully activated via Notion
    if (trial.trialActive) return;

    // Has registered UUID → check with Notion on startup
    if (trial.registeredUuid) {
      try {
        const res = await fetch(TRIAL_API + '/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: trial.registeredUuid })
        });
        const data = await res.json();
        if (data.valid) {
          trial.trialActive = true;
          setTrialData(trial);
          return; // app loads normally
        }
      } catch { /* silent — show pending state below */ }
    }

    const remaining = getDaysRemaining();
    if (remaining === null) return; // not activated yet

    if (remaining <= 0) {
      if (isAppPage()) {
        if (trial.registeredUuid) injectPendingOverlay();
        else injectExpiredOverlay();
      }
      if (isIndexPage()) disableAppCard();
    } else if (remaining <= (TRIAL_DAYS - WARNING_START)) {
      injectWarning(remaining);
    }
  });
})();
