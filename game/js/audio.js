// Sounds, made in the browser (no files): short beeps like an old computer would make.
// Browsers only allow sound after the first click or key press, so nothing plays before that.

let ctx = null;
let muted = false;
let lastClick = 0;

export const setMuted = (m) => {
  muted = !!m;
};
export const isMuted = () => muted;

function audio() {
  if (muted) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One note: frequency in Hz, start and length in seconds. */
function note(freq, start, length, { type = "square", volume = 0.05, to = null } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

const SOUNDS = {
  click() {
    // Fast clicking shouldn't turn into one long noise.
    const now = performance.now();
    if (now - lastClick < 45) return;
    lastClick = now;
    note(660 + Math.random() * 120, 0, 0.04, { volume: 0.03 });
  },
  buy() {
    note(440, 0, 0.06);
    note(660, 0.05, 0.08);
  },
  upgrade() {
    note(523, 0, 0.07);
    note(659, 0.07, 0.07);
    note(784, 0.14, 0.12);
  },
  no() {
    note(160, 0, 0.09, { type: "sawtooth", volume: 0.03 });
  },
  alert() {
    for (let i = 0; i < 3; i++) {
      note(880, i * 0.22, 0.1, { volume: 0.06 });
      note(660, i * 0.22 + 0.1, 0.1, { volume: 0.06 });
    }
  },
  chance() {
    note(784, 0, 0.08, { type: "triangle", volume: 0.07 });
    note(1047, 0.09, 0.14, { type: "triangle", volume: 0.07 });
  },
  step() {
    note(520, 0, 0.03, { volume: 0.04 });
  },
  solved() {
    note(523, 0, 0.07, { type: "triangle", volume: 0.07 });
    note(659, 0.07, 0.07, { type: "triangle", volume: 0.07 });
    note(784, 0.14, 0.07, { type: "triangle", volume: 0.07 });
    note(1047, 0.21, 0.16, { type: "triangle", volume: 0.07 });
  },
  failed() {
    note(300, 0, 0.5, { type: "sawtooth", volume: 0.06, to: 60 });
  },
  back() {
    note(220, 0, 0.1, { type: "triangle", volume: 0.06, to: 440 });
  },
  achievement() {
    note(988, 0, 0.08, { type: "triangle", volume: 0.07 });
    note(1319, 0.08, 0.22, { type: "triangle", volume: 0.07 });
  },
  reborn() {
    [262, 330, 392, 523, 659, 784].forEach((hz, i) => note(hz, i * 0.09, 0.2, { type: "triangle", volume: 0.06 }));
  },
};

export function play(name) {
  SOUNDS[name]?.();
}
