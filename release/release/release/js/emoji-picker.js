// ══════════════════════════════════════════════
// EMOJI PICKER — lightweight, zero-dependency
// Usage: openEmojiPicker(anchorEl, callback)
//   callback receives the selected emoji string
// ══════════════════════════════════════════════

const EMOJI_SETS = {
  'Maison':     ['🏠','🛏️','🪑','🚿','🛁','🧹','🧺','🧽','🪣','🗑️','📦','🔑','🪴','💡','🕯️','🖼️'],
  'Cuisine':    ['🍳','🥄','🍽️','🥘','🍲','🥗','🍕','🧁','☕','🥛','🍎','🥕','🧈','🧂','🫕','🍴'],
  'Jardin':     ['🌿','🌱','🌻','🌳','🍀','🌾','🥬','🍅','🌷','🏡','🪻','🪴','🍂','🌸','🌼','🪨'],
  'Animaux':    ['🐱','🐶','🐾','🐟','🐦','🐰','🐹','🦎','🐢','🦜','🐴','🐮','🦁','🐻','🐸','🐝'],
  'Travail':    ['💻','📋','📁','📂','📊','📈','💾','🖨️','📝','✏️','📌','📎','🗂️','📑','🔧','🔨'],
  'Argent':     ['💰','💵','💳','🏦','📊','🧾','💎','🪙','📉','📈','🏧','💹','🤑','💲','🛒','🎁'],
  'Education':  ['📚','📖','🎓','✍️','🧮','🔬','🔭','🎨','🎵','🎯','🧩','🏆','📐','📏','🌍','💬'],
  'Famille':    ['👨‍👩‍👧‍👦','👶','🤗','💝','🤝','👋','✋','🫶','❤️','💕','🎉','🎂','🎈','📸','🏛️','⚖️'],
  'Hygiene':    ['🦷','🧴','🧼','🪥','💈','🧻','🩹','💊','🌡️','😴','🛌','👔','👕','👟','🧤','🧣'],
  'Transport':  ['🚗','🚲','🚌','✈️','🚀','⛵','🛴','🚶','📬','📮','📫','📭','📪','🗳️','📤','📥'],
  'Mains':      ['👋','✋','🤚','🖐️','👆','👇','👈','👉','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🫶','🫡','🫳','🫴','🤌','🤏'],
  'Symboles':   ['⭐','🔥','⚡','💎','🎯','🏅','🎖️','👑','🔮','🌟','✨','💫','🌈','🦸','🛡️','⚙️','🧨'],
};

let _pickerEl = null;
let _pickerCb = null;

function openEmojiPicker(anchorEl, callback) {
  closeEmojiPicker();
  _pickerCb = callback;

  const picker = document.createElement('div');
  picker.id = 'emoji-picker';
  picker.style.cssText = `
    position:fixed;z-index:150;background:var(--card,#0d1422);border:1px solid var(--brd,#0a2040);
    border-radius:14px;padding:10px;width:min(340px,90vw);max-height:60vh;overflow-y:auto;
    box-shadow:0 8px 32px rgba(0,0,0,.6);
  `;

  let html = '';
  Object.entries(EMOJI_SETS).forEach(([group, emojis]) => {
    html += `<div style="font-size:var(--fs-xs);color:var(--muted,#2a5070);padding:6px 2px 3px;font-weight:700;letter-spacing:.5px">${group.toUpperCase()}</div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">`;
    emojis.forEach(em => {
      html += `<div style="font-size:var(--fs-xxl);text-align:center;padding:6px 0;cursor:pointer;border-radius:8px;transition:background .1s"
        onmouseenter="this.style.background='var(--dim,#0a1828)'"
        onmouseleave="this.style.background=''"
        onclick="pickEmoji('${em}')">${em}</div>`;
    });
    html += `</div>`;
  });

  picker.innerHTML = html;
  document.body.appendChild(picker);
  _pickerEl = picker;

  // Position near anchor
  const rect = anchorEl.getBoundingClientRect();
  const pickerH = Math.min(picker.offsetHeight, window.innerHeight * 0.6);
  let top = rect.bottom + 4;
  if (top + pickerH > window.innerHeight) top = rect.top - pickerH - 4;
  let left = rect.left;
  if (left + 340 > window.innerWidth) left = window.innerWidth - 350;
  picker.style.top = Math.max(4, top) + 'px';
  picker.style.left = Math.max(4, left) + 'px';

  // Close on outside click (delayed to avoid immediate close)
  setTimeout(() => document.addEventListener('click', _pickerOutsideClick), 10);
}

function _pickerOutsideClick(e) {
  if (_pickerEl && !_pickerEl.contains(e.target)) closeEmojiPicker();
}

function pickEmoji(em) {
  if (_pickerCb) _pickerCb(em);
  closeEmojiPicker();
}

function closeEmojiPicker() {
  document.removeEventListener('click', _pickerOutsideClick);
  if (_pickerEl) { _pickerEl.remove(); _pickerEl = null; }
  _pickerCb = null;
}
