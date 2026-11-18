// One small line chart on a canvas: the last five minutes of one number, a limit line when it
// has one, and the value under the pointer.

const MUTED = "#898781";
const GRID = "#2c2c2a";
const SURFACE = "#1a1a19";

/**
 * opts: color, format(v), min, max(dataMax) (the top of the scale), limit { value, label, color },
 * ago(seconds) (the text for "12 s ago"), samples (how many points fill the width).
 */
export function createChart(canvas, tip, opts) {
  const ctx = canvas.getContext("2d");
  let data = [];
  let hover = null;
  let w = 0;
  let h = 0;
  const pad = { l: 4, r: 4, t: 6, b: 4 };

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = r.width;
    h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const scale = () => {
    let top = opts.min ?? 0;
    for (const v of data) if (v > top) top = v;
    const max = opts.max ? opts.max(top) : top * 1.15 || 1;
    const min = opts.min ?? 0;
    return { min, max: max > min ? max : min + 1 };
  };
  // The newest point sits at the right edge; older ones move left.
  const xAt = (i) => w - pad.r - (data.length - 1 - i) * ((w - pad.l - pad.r) / (opts.samples - 1));
  const yAt = (v, s) => h - pad.b - ((Math.min(s.max, Math.max(s.min, v)) - s.min) / (s.max - s.min)) * (h - pad.t - pad.b);

  function draw() {
    if (!w || !h) size();
    ctx.clearRect(0, 0, w, h);
    const s = scale();
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID;
    for (const f of [0, 0.5, 1]) {
      const y = Math.round(pad.t + f * (h - pad.t - pad.b)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }
    ctx.font = "10px system-ui, sans-serif";
    ctx.textBaseline = "top";
    if (opts.limit && opts.limit.value < s.max) {
      const y = Math.round(yAt(opts.limit.value, s)) + 0.5;
      ctx.strokeStyle = opts.limit.color;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MUTED;
      ctx.textAlign = "left";
      ctx.fillText(opts.limit.label(), pad.l + 2, y + 3);
    }
    if (data.length > 1) {
      ctx.beginPath();
      data.forEach((v, i) => (i ? ctx.lineTo(xAt(i), yAt(v, s)) : ctx.moveTo(xAt(i), yAt(v, s))));
      ctx.strokeStyle = opts.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.lineTo(xAt(data.length - 1), h - pad.b);
      ctx.lineTo(xAt(0), h - pad.b);
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = opts.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (hover != null && data.length) {
      const i = hover;
      const x = xAt(i);
      const y = yAt(data[i], s);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, pad.t);
      ctx.lineTo(Math.round(x) + 0.5, h - pad.b);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = opts.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = SURFACE;
      ctx.stroke();
      tip.hidden = false;
      tip.textContent = "";
      const value = document.createElement("strong");
      value.textContent = opts.format(data[i]);
      const when = document.createElement("span");
      when.textContent = opts.ago(data.length - 1 - i);
      tip.append(value, when);
      const half = tip.offsetWidth / 2;
      tip.style.left = `${Math.min(w - half, Math.max(half, x))}px`;
    } else {
      tip.hidden = true;
    }
  }

  function point(e) {
    if (!data.length) return;
    const r = canvas.getBoundingClientRect();
    const step = (w - pad.l - pad.r) / (opts.samples - 1);
    const i = data.length - 1 - Math.round((w - pad.r - (e.clientX - r.left)) / step);
    hover = Math.min(data.length - 1, Math.max(0, i));
    draw();
  }
  canvas.addEventListener("pointermove", point);
  canvas.addEventListener("pointerdown", point);
  canvas.addEventListener("pointerleave", () => {
    hover = null;
    draw();
  });
  new ResizeObserver(() => {
    size();
    draw();
  }).observe(canvas);

  return {
    push(v) {
      data.push(v);
      if (data.length > opts.samples) {
        data.shift();
      } else if (hover != null) hover = Math.min(hover + 1, data.length - 1);
      draw();
    },
    clear() {
      data = [];
      hover = null;
      draw();
    },
    draw,
  };
}
