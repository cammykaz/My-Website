// Pocket Piano — Web Audio API synth, 8-key C major scale
// Keys: A S D F G H J K  (by physical key code, layout-independent)

const NOTES = [
  { name: 'C',  freq: 261.63, code: 'KeyA', label: 'A' },
  { name: 'D',  freq: 293.66, code: 'KeyS', label: 'S' },
  { name: 'E',  freq: 329.63, code: 'KeyD', label: 'D' },
  { name: 'F',  freq: 349.23, code: 'KeyF', label: 'F' },
  { name: 'G',  freq: 392.00, code: 'KeyG', label: 'G' },
  { name: 'A',  freq: 440.00, code: 'KeyH', label: 'H' },
  { name: 'B',  freq: 493.88, code: 'KeyJ', label: 'J' },
  { name: 'C',  freq: 523.25, code: 'KeyK', label: 'K' },
];

let audioCtx    = null;
let compressor  = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    compressor = audioCtx.createDynamicsCompressor();
    compressor.connect(audioCtx.destination);
  }
  return audioCtx;
}

function playNote(freq) {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type          = 'triangle';
  osc.frequency.value = freq;

  // Pluck envelope: fast attack, natural exponential decay
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.55, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  osc.connect(gain);
  gain.connect(compressor);

  osc.start(now);
  osc.stop(now + 1.4);
}

function flashKey(el) {
  el.classList.remove('piano-key--pressed');
  void el.offsetWidth; // force reflow so animation restarts on rapid tapping
  el.classList.add('piano-key--pressed');
}

export function initPocketPiano() {
  const section = document.getElementById('pocket-piano');
  if (!section) return;

  const keyEls = section.querySelectorAll('.piano-key');
  const codeMap = {};

  keyEls.forEach(el => {
    const freq = parseFloat(el.dataset.freq);
    const code = el.dataset.code;
    codeMap[code] = { el, freq };

    el.addEventListener('mousedown', () => {
      playNote(freq);
      flashKey(el);
    });

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      playNote(freq);
      flashKey(el);
    }, { passive: false });
  });

  const held = new Set();

  document.addEventListener('keydown', (e) => {
    // Don't fire inside text inputs / todo editing
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (held.has(e.code)) return;
    const note = codeMap[e.code];
    if (!note) return;
    held.add(e.code);
    playNote(note.freq);
    flashKey(note.el);
  });

  document.addEventListener('keyup', (e) => {
    held.delete(e.code);
  });
}
