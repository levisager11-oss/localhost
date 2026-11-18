// The picture of where your machines stand: a small pixel scene that grows with you, from the
// bedroom to the end of time, and back to the bedroom. Lights blink, fans turn, and it shows when things go wrong.

const H = 72;
const GREEN = "#3ddc55";
const DIM = "#1c5a28";
const AMBER = "#fab219";
const RED = "#d03b3b";

/** A number between 0 and 1 that is always the same for the same i and j. */
const hash = (i, j = 0) => {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** How many to draw for a count: grows fast at first, then slowly. */
const some = (count, max, k = 1) => (count > 0 ? Math.min(max, Math.max(1, Math.ceil(Math.sqrt(count) * k))) : 0);

export function createScene(canvas) {
  const ctx = canvas.getContext("2d");
  let W = 160;
  let view = { stage: "bedroom", hw: {}, mode: "up", alert: false, chance: false, boost: false, hot: 0 };
  let f = 0;
  let sparks = [];
  let timer = null;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const px = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  function disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      px(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  }
  /** One status light: blinking green, amber when the machines are slow, red when all is down. */
  function led(x, y, id) {
    if (view.mode === "down") return px(x, y, 1, 1, RED);
    const on = hash(id, Math.floor(f / (2 + Math.floor(hash(id) * 5)))) > 0.35;
    px(x, y, 1, 1, view.mode === "slow" ? (on ? AMBER : "#6b4b08") : on ? GREEN : DIM);
  }
  /** A circle's outline, one pixel thick. */
  function ring(cx, cy, r, c, from = 0, to = Math.PI * 2) {
    const steps = Math.max(12, Math.round(r * 7));
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, c);
    }
  }
  const stars = (n, seed, maxY = H) => {
    for (let i = 0; i < n; i++) {
      const tw = hash(i + seed, Math.floor(f / 6)) > 0.85;
      px(hash(i, seed) * W, hash(seed, i) * maxY, 1, 1, tw ? "#ffffff" : "#8d93ad");
    }
  };

  // ----- The machines -----
  const pi = (x, y, id) => {
    px(x, y - 2, 5, 2, "#2e8b57");
    px(x + 3, y - 2, 2, 1, "#c0c0c0");
    led(x + 1, y - 2, id);
  };
  const laptop = (x, y, id) => {
    px(x, y - 6, 8, 5, "#3a3a3f");
    px(x + 1, y - 5, 6, 3, "#11131a");
    px(x + 2, y - 5, 1, 1, "#5d6a7d");
    px(x + 3, y - 4, 1, 2, "#5d6a7d"); // the crack in the screen
    px(x - 1, y - 1, 10, 1, "#6a6a70");
    led(x + 7, y - 1, id);
  };
  const tower = (x, y, id) => {
    px(x, y - 10, 6, 10, "#26262b");
    px(x + 1, y - 9, 4, 1, "#3d3d44");
    // RGB lighting, obviously
    px(x + 1, y - 6, 1, 5, `hsl(${(f * 12 + id * 60) % 360} 90% 60%)`);
    led(x + 4, y - 8, id);
    led(x + 4, y - 3, id + 0.5);
  };
  const server = (x, y, id) => {
    px(x, y - 3, 13, 3, "#3b3d45");
    px(x + 1, y - 2, 5, 1, "#22242a");
    for (let i = 0; i < 3; i++) led(x + 8 + i * 2, y - 2, id * 3 + i);
  };
  const rack = (x, y, id, h = 20) => {
    px(x, y - h, 9, h, "#17181c");
    px(x, y - h, 9, 1, "#4a4d57");
    px(x, y - h, 1, h, "#33353d");
    px(x + 8, y - h, 1, h, "#33353d");
    for (let r = 2; r < h - 1; r += 2) {
      px(x + 2, y - h + r, 3, 1, "#2b2d34");
      led(x + 6, y - h + r, id * 31 + r);
      if (hash(id, r) > 0.5) led(x + 5, y - h + r, id * 17 + r);
    }
  };
  const hall = (x, y, w, h, id) => {
    px(x, y - h, w, h, "#3a3f4a");
    px(x, y - h, w, 1, "#596070");
    for (let i = 2; i < w - 2; i += 3) led(x + i, y - Math.floor(h / 2), id * 13 + i);
    // a cooler on the roof, with a fan that turns
    px(x + 2, y - h - 3, 5, 3, "#555b68");
    px(x + 3 + (f % 2), y - h - 2, 2, 1, "#aab2c2");
  };

  // ----- The places -----
  const places = {
    bedroom() {
      const floor = H - 10;
      px(0, 0, W, H, "#2b2f3d");
      px(0, floor, W, 10, "#4a3b2f");
      const wx = Math.round(W * 0.6);
      px(wx, 8, 24, 20, "#6b7280");
      px(wx + 1, 9, 22, 18, "#0b1030");
      px(wx + 12, 9, 1, 18, "#6b7280");
      disc(wx + 18, 14, 2, "#f0efec");
      px(wx + 4, 13, 1, 1, "#fff");
      px(wx + 8, 20, 1, 1, "#aab");
      px(8, 10, 12, 15, "#7a3b3b");
      px(10, 13, 8, 2, "#f0c674");
      px(10, 17, 6, 1, "#f0efec");
      px(2, floor - 6, 30, 6, "#6b5b95");
      px(2, floor - 9, 8, 3, "#e8e6e1");
      px(2, floor - 12, 2, 12, "#3d2f26");
      const dx = Math.round(W * 0.34);
      const dw = Math.round(W * 0.62);
      px(dx, floor - 14, dw, 2, "#7a5538");
      px(dx + 1, floor - 12, 2, 12, "#5c3f29");
      px(dx + dw - 3, floor - 12, 2, 12, "#5c3f29");
      px(dx, floor - 30, dw, 1, "#7a5538");
      const pis = Math.min(view.hw.pi ?? 0, Math.floor((dw - 4) / 7));
      for (let i = 0; i < pis; i++) pi(dx + 2 + i * 7, floor - 14, i);
      const laptops = Math.min(view.hw.laptop ?? 0, Math.floor((dw - 4) / 12));
      for (let i = 0; i < laptops; i++) laptop(dx + 3 + i * 12, floor - 30, 50 + i);
    },
    basement() {
      const floor = H - 8;
      px(0, 0, W, H, "#3a2c2c");
      for (let y = 4; y < floor; y += 6) {
        px(0, y, W, 1, "#2c2020");
        for (let x = (y % 12 ? 0 : 6); x < W; x += 12) px(x, y - 5, 1, 5, "#2c2020");
      }
      px(0, floor, W, 8, "#242426");
      px(0, 6, W, 2, "#5b5f66");
      px(Math.round(W * 0.2), 6, 2, 10, "#5b5f66");
      const bx = Math.round(W * 0.5);
      px(bx, 8, 1, 6, "#888");
      const glow = hash(3, Math.floor(f / 3)) > 0.08;
      px(bx - 1, 14, 3, 3, glow ? "#ffe9a8" : "#8a7a4a");
      if (glow) px(bx - 6, 18, 13, 1, "rgba(255,233,168,0.15)");
      px(4, floor - 14, 12, 14, "#d9d9d9"); // the washing machine
      disc(10, floor - 7, 4, "#5d6a7d");
      px(9 + (f % 3), floor - 8, 2, 2, "#8fa3bf");
      const towers = some(view.hw.tower ?? 0, Math.floor((W * 0.45 - 20) / 8));
      for (let i = 0; i < towers; i++) tower(22 + i * 8, floor, 100 + i);
      const sx = Math.round(W * 0.62);
      px(sx - 1, floor - 40, 1, 40, "#6a6f78");
      px(sx + 14, floor - 40, 1, 40, "#6a6f78");
      const servers = some(view.hw.server ?? 0, 9);
      for (let i = 0; i < servers; i++) server(sx, floor - 1 - i * 4, 200 + i);
    },
    closet() {
      const floor = H - 8;
      px(0, 0, W, H, "#25272c");
      px(0, floor, W, 8, "#3b3d42");
      for (let x = 0; x < W; x += 10) px(x, floor, 1, 8, "#2f3136");
      px(6, 8, 30, 2, "#5c4a3a");
      for (let i = 0; i < 4; i++) disc(10 + i * 6, 5, 2, "#eeeeea"); // the toilet paper shelf
      px(10, 16, 1, floor - 16, "#8a6d4b");
      px(7, floor - 6, 7, 2, "#c9c2a8");
      px(18, floor - 7, 8, 7, "#3f6fb5");
      px(18, floor - 8, 8, 1, "#9a9a9a");
      const room = Math.floor((W - 44) / 11);
      const racks = some(view.hw.rack ?? 0, room);
      for (let i = 0; i < racks; i++) rack(36 + i * 11, floor, 300 + i, 34);
      for (let i = 0; i < racks; i++) px(36 + i * 11 + 4, floor - 40, 1, 6, hash(i) > 0.5 ? "#3f6fb5" : "#c9a227"); // "temporary" cables
      px(34, floor - 41, racks * 11, 1, "#c9a227");
    },
    colo() {
      const floor = H - 10;
      px(0, 0, W, H, "#171b22");
      px(0, floor, W, 10, "#2a313b");
      for (let x = 0; x < W; x += 12) px(x, floor, 1, 10, "#222830");
      px(0, 6, W, 2, "#c9a227");
      for (let x = 4; x < W; x += 28) px(x, 10, 16, 1, "#dfe7ff");
      const n = some((view.hw.cage ?? 0) * 2, Math.floor((W - 8) / 12), 1.4);
      for (let i = 0; i < n; i++) rack(6 + i * 12, floor, 400 + i, 30);
      // the cage: a fence in front of everything
      ctx.globalAlpha = 0.22;
      for (let x = 0; x < W; x += 6) px(x, 14, 1, floor - 14, "#8794a8");
      for (let y = 14; y < floor; y += 6) px(0, y, W, 1, "#8794a8");
      ctx.globalAlpha = 1;
      for (let x = 0; x < W; x += 48) px(x, 12, 2, floor - 12, "#8794a8");
    },
    datacenter() {
      const floor = H - 8;
      px(0, 0, W, H, "#141821");
      px(0, floor, W, 8, "#232a36");
      for (let x = 2; x < W; x += 20) px(x, 3, 12, 1, "#dfe7ff");
      px(0, 7, W, 1, "#39414f");
      const back = some(view.hw.room ?? 0, Math.floor(W / 8), 1.5);
      for (let i = 0; i < back; i++) rack(3 + i * 8, floor - 16, 500 + i, 16);
      px(0, floor - 15, W, 1, "#1b202a");
      const front = some((view.hw.hall ?? 0) * 3 + (view.hw.room ?? 0) / 4, Math.floor(W / 11), 1);
      for (let i = 0; i < front; i++) rack(2 + i * 11, floor, 600 + i, 26);
      if (view.hw.hall) {
        // a technician on a scooter
        const x = (f * 2) % (W + 20) - 10;
        px(x + 1, floor + 1, 3, 4, "#ec835a");
        px(x + 1, floor, 2, 1, "#f0c9a8");
        px(x - 1, floor + 5, 7, 1, "#9aa3b2");
        px(x + 5, floor + 2, 1, 3, "#9aa3b2");
      }
    },
    campus() {
      const ground = H - 14;
      for (let y = 0; y < ground; y++) px(0, y, W, 1, `rgb(${22 + y / 2},${32 + y},${70 + y})`);
      disc(Math.round(W * 0.82), 12, 5, "#ffd98a");
      px(0, ground, W, 14, "#22301f");
      px(0, H - 6, W, 4, "#2b2b2e");
      for (let x = (f * 3) % 12 - 12; x < W; x += 12) px(x, H - 4, 5, 1, "#d9d9d9");
      px((f * 4) % (W + 30) - 15, H - 6, 4, 2, "#d03b3b"); // traffic at your own motorway exit
      px(W - ((f * 3) % (W + 40)) + 10, H - 3, 4, 2, "#3987e5");
      const n = some(view.hw.campus ?? 0, Math.floor(W / 26), 1.2);
      for (let i = 0; i < n; i++) {
        const x = 4 + i * 26;
        hall(x, ground, 22, 14 + Math.round(hash(i) * 5), 700 + i);
        for (let s = 0; s < 3; s++) {
          const up = (f + s * 5 + i * 3) % 15;
          ctx.globalAlpha = 0.5 - up / 30;
          disc(x + 4 + Math.round(Math.sin((f + s) / 3) * 1.5), ground - 22 - up, 1 + Math.floor(up / 6), "#dfe3ea");
        }
        ctx.globalAlpha = 1;
      }
    },
    hyperscale() {
      const ground = H - 8;
      px(0, 0, W, H, "#0c1020");
      stars(18, 7, 30);
      for (let c = 0; c < 3; c++) {
        const x = ((f / 2 + c * 70) % (W + 40)) - 30;
        ctx.globalAlpha = 0.3;
        disc(x, 10 + c * 6, 4, "#dfe3ea");
        disc(x + 6, 11 + c * 6, 5, "#dfe3ea");
        disc(x + 13, 10 + c * 6, 3, "#dfe3ea");
        ctx.globalAlpha = 1;
      }
      px(0, ground, W, 8, "#161a22");
      const n = some(view.hw.region ?? 0, Math.floor(W / 30), 1.2);
      for (let i = 0; i < n; i++) {
        const x = 3 + i * 30;
        const h = 30 + Math.round(hash(i, 2) * 14);
        px(x, ground - h, 26, h, "#2d3340");
        px(x, ground - h, 26, 1, "#596070");
        for (let y = 3; y < h - 2; y += 3) for (let c = 2; c < 25; c += 2) led(x + c, ground - h + y, 800 + i * 97 + y * 7 + c);
        px(x + 12, ground - h - 6, 1, 6, "#8794a8");
        px(x + 12, ground - h - 7, 1, 1, f % 8 < 4 ? RED : "#4a1515");
      }
    },
    ocean() {
      const bed = H - 9;
      for (let y = 0; y < H; y++) px(0, y, W, 1, `rgb(${8 + y / 8},${40 + y / 2},${95 - y / 2})`);
      ctx.globalAlpha = 0.08;
      for (let r = 0; r < 4; r++) for (let y = 0; y < bed; y += 2) px(W * (0.15 + r * 0.22) + y / 3, y, 6, 2, "#dff4ff");
      ctx.globalAlpha = 1;
      px(0, bed, W, 9, "#1d2b33");
      for (let i = 0; i < W / 9; i++) px(i * 9 + hash(i) * 5, bed - 1, 3, 1, "#26383f");
      for (let i = 0; i < 3; i++) {
        const dir = i % 2 ? 1 : -1;
        const x = dir > 0 ? ((f * (1 + i) + i * 60) % (W + 20)) - 10 : W + 10 - ((f * (1 + i) + i * 60) % (W + 20));
        const y = 12 + i * 13 + Math.round(Math.sin(f / 4 + i) * 2);
        px(x, y, 5, 2, i === 1 ? "#f0a35e" : "#9fc5d8");
        px(x - dir * 2, y - 1, 2, 4, i === 1 ? "#f0a35e" : "#9fc5d8");
      }
      const n = some(view.hw.subsea ?? 0, Math.floor(W / 20), 1.2);
      for (let i = 0; i < n; i++) {
        const x = 4 + i * 20;
        px(x + 1, bed - 7, 14, 7, "#c7ccd4");
        px(x, bed - 6, 16, 5, "#c7ccd4");
        px(x + 2, bed - 5, 12, 1, "#8b93a1");
        for (let c = 0; c < 4; c++) led(x + 3 + c * 3, bed - 3, 900 + i * 7 + c);
        px(x + 7, bed, 2, 2, "#11161a"); // the cable, sharks welcome
        for (let b = 0; b < 3; b++) {
          const up = (f * 2 + b * 9 + i * 5) % 40;
          px(x + 8 + Math.round(Math.sin((f + b * 4) / 3) * 2), bed - 9 - up, 1, 1, "rgba(223,244,255,0.7)");
        }
      }
    },
    orbit() {
      px(0, 0, W, H, "#05060d");
      stars(40, 11);
      const cx = Math.round(W / 2);
      disc(cx, H + W * 0.9, Math.round(W * 0.98), "#1f4f9c");
      for (let i = 0; i < 9; i++) px(hash(i, 5) * W, H - 3 - hash(5, i) * 9, 8 + hash(i) * 14, 2, i % 3 ? "#2f8f5b" : "#e8eef5");
      ctx.globalAlpha = 0.25;
      disc(cx, H + W * 0.9, Math.round(W * 0.98) + 2, "#7fb4ff");
      ctx.globalAlpha = 1;
      disc(cx, H + W * 0.9, Math.round(W * 0.98) - 1, "#1f4f9c");
      for (let i = 0; i < 7; i++) px(hash(i, 6) * W, H - 2 - hash(6, i) * 7, 8 + hash(i) * 14, 2, i % 3 ? "#2f8f5b" : "#e8eef5");
      const n = some(view.hw.orbit ?? 0, Math.max(3, Math.floor(W / 20)), 1.2);
      for (let i = 0; i < n; i++) {
        const x = ((f / 2) * (0.6 + hash(i) * 0.8) + hash(i, 3) * W) % (W + 24) - 12;
        const y = 8 + Math.round(hash(3, i) * (H - 34));
        px(x - 6, y, 5, 3, "#2a5fb0");
        px(x + 5, y, 5, 3, "#2a5fb0");
        px(x - 6, y + 1, 5, 1, "#5d93e0");
        px(x + 5, y + 1, 5, 1, "#5d93e0");
        px(x, y - 1, 4, 5, "#c7ccd4");
        led(x + 1, y + 1, 1000 + i);
      }
    },
    moon() {
      const ground = H - 16;
      px(0, 0, W, H, "#04050a");
      stars(36, 13, ground);
      const ex = Math.round(W * 0.8);
      disc(ex, 13, 6, "#2d6fd2");
      px(ex - 3, 11, 4, 2, "#3aa66b");
      px(ex + 1, 15, 3, 1, "#3aa66b");
      px(ex - 2, 9, 5, 1, "#e8eef5");
      px(0, ground, W, 16, "#85878c");
      for (let i = 0; i < W / 14; i++) {
        const x = hash(i, 8) * W;
        const y = ground + 4 + hash(8, i) * 9;
        px(x, y, 5 + hash(i) * 4, 1, "#63656a");
        px(x + 1, y + 1, 4 + hash(i) * 3, 1, "#9fa1a6");
      }
      const n = some(view.hw.moon ?? 0, Math.floor(W / 22), 1.2);
      for (let i = 0; i < n; i++) {
        const x = 12 + i * 22;
        disc(x, ground, 8, "#dfe3ea");
        px(x - 9, ground, 19, 9, "#85878c");
        px(x - 8, ground, 17, 1, "#63656a");
        for (let c = -5; c <= 5; c += 2) led(x + c, ground - 3, 1100 + i * 11 + c);
        px(x + 5, ground - 14, 1, 7, "#aab2c2");
        px(x + 4, ground - 15, 3, 1, f % 10 < 5 ? RED : "#aab2c2");
      }
      const rx = ((f / 2) % (W + 20)) - 10;
      px(rx, ground + 9, 7, 2, "#d9d9d9");
      px(rx + 1, ground + 11, 2, 1, "#33353d");
      px(rx + 4, ground + 11, 2, 1, "#33353d");
    },
    star() {
      px(0, 0, W, H, "#06040a");
      stars(44, 17);
      const cx = Math.round(W / 2);
      const cy = Math.round(H / 2);
      ctx.globalAlpha = 0.18;
      disc(cx, cy, 15 + (f % 4 < 2 ? 1 : 0), "#ffb347");
      ctx.globalAlpha = 1;
      const rings = some(view.hw.brain ?? 0, 3);
      const swarm = some(view.hw.dyson ?? 0, 48, 2.5);
      const orbit = (i, front) => {
        const a = f / 14 + (i / Math.max(1, swarm)) * Math.PI * 2;
        if (Math.sin(a) > 0 !== front) return;
        const r = Math.min(W / 2 - 4, 22 + (i % 3) * 7);
        px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.36, 2, 2, front ? "#9fd0ff" : "#4c6f96");
      };
      for (let i = 0; i < swarm; i++) orbit(i, false);
      disc(cx, cy, 11, "#ffcf5a");
      disc(cx - 2, cy - 2, 6, "#ffe9a8");
      for (let i = 0; i < rings; i++) {
        const r = 14 + i * 4;
        for (let a = 0; a < 40; a++) {
          const t = (a / 40) * Math.PI * 2 + f / 30;
          if (Math.sin(t) < -0.1) continue;
          px(cx + Math.cos(t) * r * 1.6, cy + Math.sin(t) * r * 0.5, 2, 1, a % 2 ? "#8794a8" : "#c7ccd4");
        }
      }
      for (let i = 0; i < swarm; i++) orbit(i, true);
    },
    universe() {
      px(0, 0, W, H, "#0d0618");
      stars(50, 19);
      for (let g = 0; g < 5; g++) {
        const gx = hash(g, 21) * W;
        const gy = hash(21, g) * H;
        for (let i = 0; i < 16; i++) {
          const a = i / 2.2 + f / 40 + g;
          px(gx + Math.cos(a) * i * 0.6, gy + Math.sin(a) * i * 0.35, 1, 1, i % 3 ? "#b79cff" : "#ffd0f0");
        }
      }
      const n = some(view.hw.simulation ?? 0, Math.max(2, Math.floor(W / 44)), 1);
      for (let i = 0; i < n; i++) {
        // a universe in a box: inside, a bedroom, a desk and one Raspberry Pi
        const x = Math.round(W / 2 - (n * 44) / 2 + i * 44 + 4);
        const y = 20 + Math.round(Math.sin(f / 10 + i) * 2);
        px(x - 1, y - 1, 38, 28, "#b79cff");
        px(x, y, 36, 26, "#2b2f3d");
        px(x, y + 21, 36, 5, "#4a3b2f");
        px(x + 22, y + 3, 9, 8, "#0b1030");
        px(x + 28, y + 5, 1, 1, "#fff");
        px(x + 3, y + 17, 12, 4, "#6b5b95");
        px(x + 17, y + 15, 16, 1, "#7a5538");
        px(x + 18, y + 16, 1, 5, "#5c3f29");
        px(x + 31, y + 16, 1, 5, "#5c3f29");
        px(x + 22, y + 13, 5, 2, "#2e8b57");
        led(x + 23, y + 13, 1300 + i);
      }
    },
    multiverse() {
      px(0, 0, W, H, "#0a0716");
      stars(30, 23);
      // the history of everything, as a git graph: one main line, and a branch for every universe
      const y0 = H - 7;
      px(0, y0, W, 1, "#5b4b8a");
      for (let x = (-f % 10) + 10; x < W; x += 10) disc(x, y0, 1, "#b79cff");
      const forks = some(view.hw.fork ?? 0, Math.max(2, Math.floor(W / 30)), 1.2);
      const spots = [];
      for (let i = 0; i < forks; i++) {
        const x = Math.round(((i + 0.5) * W) / forks);
        const y = 14 + Math.round(hash(i, 24) * 22) + Math.round(Math.sin(f / 9 + i) * 1.5);
        const r = 6 + Math.round(hash(24, i) * 4);
        spots.push({ x, y, r });
        // the branch, from the main line up to its universe
        const from = x + (i % 2 ? 8 : -8);
        for (let k = 0; k <= 16; k++) px(from + ((x - from) * k) / 16, y0 + ((y + r - y0) * k) / 16, 1, 1, "#5b4b8a");
      }
      const mesh = some(view.hw.mesh ?? 0, 12, 1.5);
      for (let i = 0; i < mesh && spots.length > 1; i++) {
        const a = spots[i % spots.length];
        const b = spots[(i * 2 + 1) % spots.length];
        if (a === b) continue;
        const t = ((f + i * 7) % 24) / 24;
        ctx.globalAlpha = 0.35;
        for (let k = 0; k <= 20; k++) px(a.x + ((b.x - a.x) * k) / 20, a.y + ((b.y - a.y) * k) / 20, 1, 1, "#7fe0ff");
        ctx.globalAlpha = 1;
        px(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2, 1, "#dff8ff");
      }
      for (let i = 0; i < spots.length; i++) {
        const { x, y, r } = spots[i];
        disc(x, y, r, "#140c2a");
        for (let k = 0; k < 5; k++) px(x - r / 2 + hash(i, k) * r, y - r / 2 + hash(k, i) * r, 1, 1, k % 2 ? "#ffd0f0" : "#b79cff");
        ring(x, y, r, i % 3 ? "#b79cff" : "#ffd0f0");
        led(x, y + r - 2, 1400 + i);
      }
    },
    time() {
      for (let y = 0; y < H; y++) px(0, y, W, 1, `rgb(${Math.round(24 - y / 4)},${Math.round(8 - y / 12)},${Math.round(12 - y / 8)})`);
      // the last stars, going out one after another
      for (let i = 0; i < 22; i++) {
        if (hash(i, Math.floor(f / 40)) < 0.25) continue;
        px(hash(i, 25) * W, hash(25, i) * (H - 20), 1, 1, i % 4 ? "#7a3b3b" : "#d08a5a");
      }
      const clocks = some(view.hw.loop ?? 0, Math.max(2, Math.floor(W / 26)), 1.2);
      for (let i = 0; i < clocks; i++) {
        const x = Math.round(((i + 0.5) * W) / clocks);
        const y = 18 + Math.round(hash(i, 26) * 8);
        const r = 7;
        disc(x, y, r, "#1d1418");
        ring(x, y, r, "#c9a227");
        for (let h = 0; h < 12; h += 3) px(x + Math.cos((h / 12) * Math.PI * 2) * (r - 2), y + Math.sin((h / 12) * Math.PI * 2) * (r - 2), 1, 1, "#8a6d3b");
        // every other clock runs backwards
        const a = ((i % 2 ? -1 : 1) * f) / 6 + i;
        for (let k = 1; k < r - 1; k++) px(x + Math.cos(a) * k, y + Math.sin(a) * k, 1, 1, "#f0c674");
        for (let k = 1; k < r - 3; k++) px(x + Math.cos(a / 12) * k, y + Math.sin(a / 12) * k, 1, 1, "#c9a227");
      }
      // at the very end: a few racks, lit by one candle
      const ground = H - 6;
      px(0, ground, W, 6, "#120c0e");
      const racks = some(view.hw.heatdeath ?? 0, Math.floor((W - 30) / 11), 1);
      if (racks) {
        const cx = 10;
        const flick = hash(7, Math.floor(f / 2)) > 0.5 ? 1 : 0;
        // its light on the floor
        ctx.globalAlpha = 0.35;
        px(cx - 6 - flick, ground, 13 + flick * 2, 1, "#ffcf5a");
        ctx.globalAlpha = 0.15;
        px(cx - 10, ground + 1, 21, 1, "#ffcf5a");
        ctx.globalAlpha = 1;
        px(cx - 1, ground - 6, 3, 6, "#e8e6e1");
        px(cx, ground - 8 - flick, 1, 2, "#ffd98a");
        px(cx, ground - 7, 1, 1, "#ff8a3a");
      }
      for (let i = 0; i < racks; i++) rack(22 + i * 11, ground, 1500 + i, 18);
    },
    source() {
      px(0, 0, W, H, "#070d0a");
      // the source code of reality, scrolling past: mostly comments
      const cols = some(view.hw.kernel ?? 0, Math.max(1, Math.floor(W / 52)), 1);
      const colors = ["#3ddc55", "#5d6a7d", "#5d6a7d", "#c9a227", "#7fe0ff", "#b79cff"];
      for (let c = 0; c < cols; c++) {
        const x0 = 4 + c * Math.floor(W / cols);
        const cw = Math.floor(W / cols) - 8;
        for (let row = 0; row < 18; row++) {
          const line = row + Math.floor(f / 4) + c * 31;
          const y = row * 4 - ((f % 4) * 1) + 2;
          let x = x0 + (hash(line, 2) > 0.6 ? 4 : 0) + (hash(line, 3) > 0.85 ? 4 : 0);
          for (let w = 0; w < 4 && x < x0 + cw; w++) {
            const len = 2 + Math.floor(hash(line, w) * 9);
            px(x, y, Math.min(len, x0 + cw - x), 2, colors[Math.floor(hash(w, line) * colors.length)]);
            x += len + 2;
          }
        }
        if (f % 8 < 4) px(x0, 34, 1, 3, "#dfe7ff");
      }
      const dreamers = some(view.hw.dreamer ?? 0, 3, 1);
      for (let i = 0; i < dreamers; i++) {
        // a giant closed eye, asleep. An alert makes it stir.
        const x = Math.round(((i + 0.5) * W) / dreamers);
        const y = H - 18;
        const open = view.alert ? 2 + (f % 6 < 3 ? 1 : 0) : 0;
        ctx.globalAlpha = 0.85;
        disc(x, y, 10, "#070d0a");
        ctx.globalAlpha = 1;
        ring(x, y - 6, 12, "#dfe3ea", Math.PI * 0.2, Math.PI * 0.8);
        if (open) {
          ring(x, y + 12, 12, "#dfe3ea", -Math.PI * 0.8, -Math.PI * 0.2);
          disc(x, y + 2, open, "#7fe0ff");
        }
        for (let k = 0; k < 5; k++) px(x - 8 + k * 4, y + 5, 1, 2, "#8794a8"); // lashes
        const z = (f + i * 9) % 30;
        ctx.globalAlpha = 1 - z / 30;
        px(x + 10 + z / 4, y - 6 - z, 3, 1, "#dfe3ea");
        px(x + 11 + z / 4, y - 5 - z, 1, 1, "#dfe3ea");
        px(x + 10 + z / 4, y - 4 - z, 3, 1, "#dfe3ea");
        ctx.globalAlpha = 1;
      }
    },
    home() {
      // Back where it started: the bedroom, one Raspberry Pi. Through the window, everything else.
      const saved = view;
      view = { ...view, hw: { pi: 1 } };
      places.bedroom();
      view = saved;
      const wx = Math.round(W * 0.6);
      px(wx + 1, 9, 22, 18, "#0d0618");
      px(wx + 12, 9, 1, 18, "#6b7280");
      for (let g = 0; g < 2; g++) {
        const gx = wx + 6 + g * 11;
        for (let i = 0; i < 12; i++) {
          const a = i / 2 + f / 30 + g * 2;
          px(gx + Math.cos(a) * i * 0.35, 18 + Math.sin(a) * i * 0.3, 1, 1, i % 3 ? "#b79cff" : "#ffd0f0");
        }
      }
      // the Pi
      const floor = H - 10;
      const x = Math.round(W * 0.34) + 2;
      const y = floor - 16;
      // a little sparkle around it: it has earned it
      for (let i = 0; i < 3; i++) {
        const a = f / 5 + (i * Math.PI * 2) / 3;
        px(x + 2 + Math.cos(a) * 5, y - 1 + Math.sin(a) * 3, 1, 1, i % 2 ? "#ffe9a8" : "#fff");
      }
      const beams = some(view.hw.home ?? 0, 8, 1);
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < beams; i++) {
        const tx = wx + 3 + (i * 19) / Math.max(1, beams - 1 || 1);
        const t = ((f + i * 5) % 20) / 20;
        px(x + 2 + (tx - x - 2) * t, y + (16 - y) * t, 1, 1, "#ffe9a8");
      }
      ctx.globalAlpha = 1;
    },
  };

  function draw() {
    f++;
    ctx.globalAlpha = 1;
    (places[view.stage] ?? places.bedroom)();
    if (view.hot > 0) {
      px(0, 0, W, H, `rgba(236,131,90,${Math.min(0.3, view.hot * 0.3)})`);
      for (let i = 0; i < 6 + view.hot * 10; i++) {
        const up = (f * 2 + i * 13) % H;
        px(hash(i, 31) * W + Math.sin((f + i * 5) / 3) * 2, H - up, 1, 2, "rgba(255,190,150,0.55)");
      }
    }
    if (view.boost) for (let i = 0; i < 10; i++) px(((f * (3 + (i % 3)) + i * 37) % (W + 10)) - 5, 2 + (i % 5) * 2, 3, 1, "#3987e5");
    if (view.mode === "down") px(0, 0, W, H, "rgba(0,0,0,0.5)");
    if (view.alert || view.mode === "down") {
      const on = f % 4 < 2;
      px(W - 8, 2, 6, 4, on ? "#ff5a5a" : "#5a1c1c");
      px(W - 9, 6, 8, 1, "#8794a8");
      if (on) {
        ctx.globalAlpha = 0.18;
        px(0, 0, W, H, RED);
        ctx.globalAlpha = 1;
      }
    } else if (view.chance) {
      const on = f % 6 < 3;
      px(W - 6, 2, 1, 5, on ? "#9fd0ff" : "#3987e5");
      px(W - 8, 4, 5, 1, on ? "#9fd0ff" : "#3987e5");
    }
    sparks = sparks.filter((s) => s.age++ < 5);
    for (const s of sparks) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        px(s.x + Math.cos(a) * s.age * 1.6, s.y + Math.sin(a) * s.age * 1.6, 1, 1, "#ffe9a8");
      }
    }
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.min(360, Math.max(96, Math.round((H * r.width) / r.height)));
    canvas.width = W;
    canvas.height = H;
    draw();
  }
  new ResizeObserver(size).observe(canvas);

  return {
    set(v) {
      view = v;
    },
    /** A click at this spot of the picture (0 to 1 each way): a little spark. */
    poke(x, y) {
      sparks.push({ x: x * W, y: y * H, age: 0 });
      if (sparks.length > 12) sparks.shift();
    },
    start() {
      if (timer) return;
      timer = setInterval(draw, still ? 1000 : 125);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
    draw,
  };
}
