// The small graph at the bottom of a stat panel: the last five minutes of one number as a
// filled line, and the value under the pointer.

/**
 * opts: color() (the colour of the line right now), format(v), ago(seconds) (the text for
 * "12 s ago"), samples (how many points fill the width).
 */
export function createChart(canvas, tip, opts) {
  const ctx = canvas.getContext("2d");
  let data = [];
  let hover = null;
  let w = 0;
  let h = 0;
  const top = 6;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = r.width;
    h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const max = () => {
    let m = 0;
    for (const v of data) if (v > m) m = v;
    return m * 1.1 || 1;
  };
  // The newest point sits at the right edge; older ones move left.
  const xAt = (i) => w - (data.length - 1 - i) * (w / (opts.samples - 1));
  const yAt = (v, m) => h - (Math.max(0, v) / m) * (h - top);

  function draw() {
    if (!w || !h) size();
    ctx.clearRect(0, 0, w, h);
    const color = opts.color();
    const m = max();
    if (data.length > 1) {
      ctx.beginPath();
      data.forEach((v, i) => (i ? ctx.lineTo(xAt(i), yAt(v, m)) : ctx.moveTo(xAt(i), yAt(v, m))));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.lineTo(xAt(data.length - 1), h);
      ctx.lineTo(xAt(0), h);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, top, 0, h);
      fill.addColorStop(0, `${color}66`);
      fill.addColorStop(1, `${color}0d`);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (hover != null && data.length) {
      const x = xAt(hover);
      const y = yAt(data[hover], m);
      ctx.strokeStyle = "rgba(204, 204, 220, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#181b1f";
      ctx.stroke();
      tip.hidden = false;
      tip.textContent = "";
      const value = document.createElement("strong");
      value.textContent = opts.format(data[hover]);
      const when = document.createElement("span");
      when.textContent = opts.ago(data.length - 1 - hover);
      tip.append(value, when);
      const half = tip.offsetWidth / 2;
      tip.style.left = `${Math.min(w - half - 4, Math.max(half + 4, x))}px`;
    } else {
      tip.hidden = true;
    }
  }

  function point(e) {
    if (!data.length) return;
    const r = canvas.getBoundingClientRect();
    const i = data.length - 1 - Math.round((w - (e.clientX - r.left)) / (w / (opts.samples - 1)));
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
      if (data.length > opts.samples) data.shift();
      else if (hover != null) hover = Math.min(hover + 1, data.length - 1);
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

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

/**
 * A gauge: an arc that fills up, a thin band outside it that shows where the colours change,
 * and the value in the middle. bands: [{ to: 0..1, color }], in rising order.
 */
export function createGauge(box, bands) {
  // The arc runs from lower left over the top to lower right.
  const arc = (r) => {
    const a0 = (160 * Math.PI) / 180;
    const a1 = (380 * Math.PI) / 180;
    const p = (a) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(54 + r * Math.sin(a)).toFixed(2)}`;
    return `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
  };
  const root = svg("svg", { viewBox: "0 0 120 74", role: "img" });
  root.append(svg("path", { d: arc(42), class: "track", pathLength: 100 }));
  let from = 0;
  for (const b of bands) {
    root.append(svg("path", { d: arc(50.5), class: "band", pathLength: 100, stroke: b.color, "stroke-dasharray": `${(b.to - from) * 100} 100`, "stroke-dashoffset": -from * 100 }));
    from = b.to;
  }
  const value = svg("path", { d: arc(42), class: "value", pathLength: 100 });
  const text = svg("text", { x: 60, y: 56, "text-anchor": "middle" });
  root.append(value, text);
  box.append(root);
  let shown = "";
  return {
    /** fraction: 0..1 of the scale; label: the text in the middle. */
    set(fraction, label) {
      const f = Math.min(1, Math.max(0, fraction));
      const color = (bands.find((b) => f <= b.to) ?? bands[bands.length - 1]).color;
      const key = `${f.toFixed(3)}|${label}`;
      if (key === shown) return color;
      shown = key;
      value.setAttribute("stroke", color);
      value.setAttribute("stroke-dasharray", `${f * 100} 100`);
      text.setAttribute("fill", color);
      text.textContent = label;
      root.setAttribute("aria-label", label);
      return color;
    },
  };
}
