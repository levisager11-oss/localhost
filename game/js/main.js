// The screen: draws the dashboard, takes clicks, saves the game, and talks to Toki.
import { ACHIEVEMENT_ICONS, ACHIEVEMENTS, COOLING, POWER, STAFF, TIERS, UPGRADES } from "./data.js";
import {
  applyOffline, buy, buyUpgrade, canExit, click, costFor, derive, deserialize, exit, exitNeeds, exitShares, incidentAction, incidentDef,
  maxAffordable, milestoneMult, newState, nextMilestone, score, serialize, SHARE_BONUS, slaTier, TEMP_HOT, TEMP_OK, tick,
} from "./sim.js";
import { browserLang, FLAVOR, getLang, setLang, t } from "./i18n.js";
import { degrees, duration, money, num, percent, price, uptime, watts } from "./format.js";
import { createChart } from "./chart.js";

const KEY = "localhost.save";
const LISTS = { hw: TIERS, pw: POWER, cl: COOLING, st: STAFF };
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
/** Inside Toki the game runs in a frame, and Toki shows achievements itself. */
const inToki = window.parent !== window;

let state;
let d;
let tab = "hw";
let paused = false;
let last = performance.now();
/** What the last alert ended with, shown for a few seconds */
let outcome = null;
let lastStage = null;

// ----- Saving -----

function load() {
  let text = null;
  try {
    text = localStorage.getItem(KEY);
  } catch {
    /* storage is blocked: the game still runs, it just can't save */
  }
  state = text ? deserialize(text) : newState();
  return !!text;
}
function save() {
  try {
    localStorage.setItem(KEY, serialize(state));
  } catch {
    /* full or blocked */
  }
}

// ----- Toki: high scores and achievements (outside Toki these do nothing) -----

const sent = { score: -1, streak: 0, speedrun: 0, at: 0 };
function report(force = false) {
  const toki = window.toki;
  if (!toki?.score) return;
  const now = Date.now();
  if (!force && now - sent.at < 30_000) return;
  sent.at = now;
  const points = score(state);
  if (points > sent.score) {
    sent.score = points;
    toki.score(points);
  }
  const streak = Math.floor(state.stats.bestStreak) * 1000;
  if (streak > sent.streak && (force || streak >= sent.streak + 10_000)) {
    sent.streak = streak;
    toki.score(streak, "streak");
  }
  if (state.stats.speedrun && state.stats.speedrun !== sent.speedrun) {
    sent.speedrun = state.stats.speedrun;
    toki.score(state.stats.speedrun, "speedrun");
  }
}
const achieved = (id) => window.toki?.achievement?.(id);

// ----- Small things: log, toasts -----

function log(level, text) {
  const list = $("log");
  const li = el("li", level);
  const time = new Date().toLocaleTimeString(getLang() === "de" ? "de-CH" : "en-GB", { hour12: false });
  li.append(el("time", null, time), el("b", null, { info: "INFO", ok: "OK", warn: "WARN", crit: "CRIT" }[level]), el("span", null, text));
  list.prepend(li);
  while (list.children.length > 80) list.lastChild.remove();
}

function toast(text, icon) {
  const box = el("div", "toast");
  if (icon) box.append(el("span", "icon", icon));
  box.append(el("span", null, text));
  $("toasts").append(box);
  setTimeout(() => box.remove(), 5000);
}

function status(node, level, text) {
  // Nothing changed: leave the page alone (this runs four times a second).
  if (node.dataset.now === `${level}|${text}`) return;
  node.dataset.now = `${level}|${text}`;
  const icons = { good: "✓", warn: "!", serious: "▲", crit: "✕" };
  node.className = `sub status ${level}`;
  node.textContent = "";
  node.append(el("i", "dot", icons[level]), el("span", null, text));
}

// ----- Events from the rules -----

function handle(events) {
  for (const e of events) {
    const title = e.id && e.type !== "achievement" ? t(`inc.${e.id}.title`) : "";
    if (e.type === "incident") {
      outcome = null;
      log(e.good ? "info" : "warn", t(e.good ? "log.chance" : "log.alert", { title }));
    } else if (e.type === "resolved") {
      if (e.how === "auto") {
        log("ok", t("log.auto", { title }));
        outcome = { kind: "good", title, text: t("log.auto", { title }), until: Date.now() + 6000 };
      } else {
        const text = t(`inc.${e.id}.${e.how === "lucky" ? "lucky" : "ok"}`);
        log("ok", t("log.resolved", { text, v: money(e.reward) }));
        outcome = { kind: "good", title, text, extra: e.reward ? `+${money(e.reward)}` : "", until: Date.now() + 7000 };
      }
      save();
    } else if (e.type === "failed") {
      const text = t(`inc.${e.id}.fail`);
      const more = [e.outage ? t("log.outage", { t: duration(e.outage) }) : "", e.lost ? t("log.lost", { v: money(e.lost) }) : ""].filter(Boolean).join(" ");
      log("crit", `${t("log.failed", { text })} ${more}`.trim());
      outcome = { kind: "crit", title, text, extra: e.lost ? `−${money(e.lost)}` : "", until: Date.now() + 8000 };
      save();
    } else if (e.type === "missed") {
      log("info", t("log.missed", { title }));
    } else if (e.type === "recovered") {
      log("ok", t("log.recovered"));
    } else if (e.type === "achievement") {
      achieved(e.id);
      const name = t(`ach.${e.id}.name`);
      if (!inToki) toast(t("toast.ach", { name }), ACHIEVEMENT_ICONS[e.id]);
    }
  }
}

// ----- Drawing -----

function texts() {
  document.documentElement.lang = getLang();
  for (const n of document.querySelectorAll("[data-t]")) n.textContent = t(n.dataset.t);
  $("c-rev").setAttribute("aria-label", t("chart.revenue"));
  $("c-power").setAttribute("aria-label", t("chart.power"));
  $("c-temp").setAttribute("aria-label", t("chart.temp"));
  shopKey = "";
  alertKey = "";
  rackKey = "";
}

function drawTop() {
  $("money").textContent = money(state.money);
  $("rate").textContent = `+${t("unit.persec", { v: money(d.rate) })}`;
  $("stage").textContent = t(`stage.${d.stage}`);
  $("btn-exit").classList.toggle("ready", canExit(state));
  if (lastStage && lastStage !== d.stage && d.stageIndex > 0) {
    const stage = t(`stage.${d.stage}`);
    log("info", t("log.stage", { stage }));
    toast(t("log.stage", { stage }), "📦");
  }
  lastStage = d.stage;
}

function drawTiles() {
  $("rev-value").textContent = t("unit.persec", { v: money(d.rate) });
  $("rev-sub").textContent = t("sla.mult", { m: num(d.sla, true) });

  $("power-value").textContent = percent(d.load);
  $("power-sub").textContent = t("power.of", { a: watts(d.draw), b: watts(d.powerCap) });
  if (d.load > 1) status($("power-status"), "crit", t("power.over"));
  else if (d.load > 0.85) status($("power-status"), "warn", t("power.tight"));
  else status($("power-status"), "good", t("power.ok"));

  $("temp-value").textContent = degrees(state.temp);
  $("temp-sub").textContent = t("temp.cooling", { p: percent(d.coolLoad) });
  $("temp-sub").title = t("power.of", { a: watts(Math.min(d.draw, d.powerCap)), b: watts(d.coolCap) });
  if (state.temp >= TEMP_HOT - 5) status($("temp-status"), "crit", t("temp.crit"));
  else if (state.temp > TEMP_OK) status($("temp-status"), "serious", t("temp.hot"));
  else if (state.temp > TEMP_OK - 4) status($("temp-status"), "warn", t("temp.warm"));
  else status($("temp-status"), "good", t("temp.ok"));

  $("uptime-value").textContent = uptime(state.uptime);
  const tier = slaTier(state.uptime);
  status($("uptime-status"), tier === 0 ? "serious" : "good", t(`sla.${tier}`));
  $("uptime-streak").textContent = t("uptime.streak", { t: duration(state.stats.streak) });
  $("ops-label").textContent = t("uptime.ops", { p: percent(d.coverage) });
  $("ops").title = t("uptime.ops.hint");
  $("ops-bar").style.width = `${Math.round(d.coverage * 100)}%`;
}

let alertKey = "";
let flip = false;
function drawAlerts() {
  const box = $("alerts");
  const inc = state.incident;
  if (outcome && Date.now() > outcome.until) outcome = null;
  const key = state.outage > 0 ? "outage" : inc ? `inc:${inc.id}:${inc.total}` : outcome ? `out:${outcome.until}` : "none";
  if (key !== alertKey) {
    alertKey = key;
    box.textContent = "";
    if (state.outage > 0) {
      const card = el("div", "alert crit");
      card.append(el("span", "badge", `✕ ${t("alerts.outage")}`), el("h3", null, outcome?.title ?? t("alerts.outage")));
      if (outcome) card.append(el("p", null, [outcome.text, outcome.extra].filter(Boolean).join(" ")));
      card.append(el("p", "count"));
      box.append(card);
    } else if (inc) {
      const def = incidentDef(inc.id);
      flip = def.kind === "choice" && Math.random() < 0.5;
      const card = el("div", `alert ${def.good ? "chance" : "firing"}`);
      card.append(el("span", "badge", def.good ? `★ ${t("alerts.chance")}` : `▲ ${t("alerts.firing")}`));
      card.append(el("h3", null, t(`inc.${inc.id}.title`)), el("p", null, t(`inc.${inc.id}.desc`)));
      const bar = el("div", "timer");
      bar.append(el("i"));
      card.append(bar, el("p", "count"));
      const actions = el("div", "actions start");
      const options = def.kind === "choice" ? (flip ? [1, 0] : [0, 1]) : [0];
      options.forEach((opt, n) => {
        const b = el("button", `btn ${def.kind === "choice" ? "" : "primary"}`);
        b.type = "button";
        b.dataset.option = opt;
        b.append(el("kbd", null, String(n + 1)), el("span", "what", def.kind === "choice" ? t(`inc.${inc.id}.opt${opt}`) : t(`inc.${inc.id}.btn`)));
        if (def.kind === "mash") b.append(el("span", "progress"));
        actions.append(b);
      });
      card.append(actions);
      box.append(card);
    } else if (outcome) {
      const card = el("div", `alert done ${outcome.kind}`);
      card.append(el("span", "badge", outcome.kind === "good" ? "✓" : "✕"), el("h3", null, outcome.title), el("p", null, [outcome.text, outcome.extra].filter(Boolean).join(" ")));
      box.append(card);
    } else {
      const p = el("p", "quiet");
      p.append(el("i", "dot", "✓"), el("span", null, `${t("alerts.none")} ${t("alerts.none2")}`));
      box.append(p);
    }
  }
  if (state.outage > 0) {
    box.querySelector(".count").textContent = t("alerts.outage.desc", { t: duration(Math.ceil(state.outage)) });
  } else if (inc) {
    box.querySelector(".timer i").style.width = `${Math.max(0, (inc.left / inc.total) * 100)}%`;
    box.querySelector(".count").textContent = t("alerts.left", { t: duration(Math.ceil(inc.left)) });
    const progress = box.querySelector(".progress");
    if (progress) progress.textContent = t("alerts.clicks", { a: inc.clicks, b: inc.need });
  }
  $("p-alerts").classList.toggle("urgent", state.outage > 0 || (!!inc && !incidentDef(inc.id).good));
  $("p-alerts").classList.toggle("lucky", !!inc && !!incidentDef(inc.id).good);

  const fx = [];
  if (state.boost) fx.push(t("alerts.boost", { m: num(state.boost.rev), t: duration(Math.ceil(state.boost.left)) }));
  if (state.debuff) fx.push(t("alerts.debuff", { t: duration(Math.ceil(state.debuff.left)) }));
  const text = fx.join(" · ");
  if ($("effects").textContent !== text) $("effects").textContent = text;
}

let rackKey = "";
function drawRack() {
  const mode = state.outage > 0 ? "down" : d.powerFactor < 1 || d.thermalFactor < 1 ? "slow" : "up";
  const key = `${getLang()}|${mode}|${TIERS.map((x) => state.hw[x.id]).join(",")}`;
  if (key === rackKey) return;
  rackKey = key;
  const box = $("rack");
  box.textContent = "";
  box.className = `scroll ${mode}`;
  for (const tier of TIERS) {
    const n = state.hw[tier.id];
    if (!n) continue;
    const row = el("div", "machines");
    const head = el("div", "mhead");
    head.append(el("span", null, t(`hw.${tier.id}.name`)), el("b", null, `×${num(n)}`));
    const leds = el("div", "leds");
    for (let i = 0; i < Math.min(n, 32); i++) leds.append(el("i"));
    row.append(head, leds);
    box.append(row);
  }
}

// ----- The shop -----

let shopKey = "";
let rows = [];

function visible(kind) {
  const list = LISTS[kind];
  const seen = state.runEarned;
  const shown = list.filter((item, i) => {
    if (state[kind][item.id] > 0) return true;
    if (kind === "hw") return i === 0 || state.hw[list[i - 1].id] > 0;
    return i === 0 ? kind !== "st" || seen >= item.cost * 0.2 : seen >= item.cost * 0.2;
  });
  return { shown, more: shown.length < list.length };
}
const visibleUpgrades = () => UPGRADES.filter((u) => !state.up.includes(u.id) && state.runEarned >= u.cost * 0.2);

function effectText(kind, item) {
  if (kind === "hw") {
    // What one of them earns right now, with every bonus you have.
    const each = item.rev * milestoneMult(state.hw[item.id]) * (d.nominal / (d.baseRev || 1));
    return t("shop.fx.hw", { rev: t("unit.persec", { v: money(each) }), power: watts(item.power * d.fx.draw) });
  }
  if (kind === "pw") return t("shop.fx.pw", { cap: watts(item.cap) });
  if (kind === "cl") return t("shop.fx.cl", { cap: watts(item.cap * d.fx.cool) });
  return t("shop.fx.st", { ops: num(item.ops) });
}

function buildShop() {
  const box = $("shop");
  box.textContent = "";
  rows = [];
  for (const b of $("tabs").children) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
  for (const b of $("amount").querySelectorAll("button")) b.setAttribute("aria-pressed", String(String(state.buyMode ?? 1) === b.dataset.n));
  $("amount").hidden = tab === "up";
  const note = $("shop-note");
  note.hidden = tab !== "st";

  if (tab === "up") {
    const open = visibleUpgrades();
    if (!open.length) box.append(el("p", "quiet", t("shop.up.none")));
    for (const u of open) {
      const b = el("button", "item");
      b.type = "button";
      b.dataset.up = u.id;
      const main = el("div", "main");
      main.append(el("strong", null, t(`up.${u.id}.name`)), el("span", "desc", t(`up.${u.id}.desc`)), el("span", "fx", t(`up.${u.id}.fx`)));
      const cost = el("span", "cost", price(u.cost));
      b.append(main, cost);
      box.append(b);
      rows.push({ b, up: u, cost });
    }
    const have = UPGRADES.filter((u) => state.up.includes(u.id));
    if (have.length) {
      box.append(el("h3", "installed", t("shop.installed")));
      for (const u of have) {
        const row = el("div", "item owned");
        const main = el("div", "main");
        main.append(el("strong", null, t(`up.${u.id}.name`)), el("span", "fx", t(`up.${u.id}.fx`)));
        row.append(main, el("span", "cost", "✓"));
        box.append(row);
      }
    }
    return;
  }

  const { shown, more } = visible(tab);
  for (const item of shown) {
    const b = el("button", "item");
    b.type = "button";
    b.dataset.id = item.id;
    const main = el("div", "main");
    const head = el("div", "head");
    const count = el("b", "count");
    head.append(el("strong", null, t(`${tab}.${item.id}.name`)), count);
    const fx = el("span", "fx");
    const warn = el("span", "warn");
    main.append(head, el("span", "desc", t(`${tab}.${item.id}.desc`)), fx, warn);
    const cost = el("span", "cost");
    b.append(main, cost);
    box.append(b);
    rows.push({ b, item, count, fx, warn, cost });
  }
  if (!shown.length || more) {
    const row = el("div", "item locked");
    const main = el("div", "main");
    main.append(el("strong", null, t("shop.locked")), el("span", "desc", t("shop.locked.desc")));
    row.append(main, el("span", "cost", "?"));
    box.append(row);
  }
}

function drawShop() {
  const ids = tab === "up" ? `${visibleUpgrades().map((u) => u.id)}|${state.up.length}` : visible(tab).shown.map((x) => x.id).join();
  const key = `${getLang()}|${tab}|${state.buyMode}|${ids}`;
  if (key !== shopKey) {
    shopKey = key;
    buildShop();
  }
  if (tab === "st") $("shop-note").textContent = `${t("uptime.ops", { p: percent(d.coverage) })} · ${t("shop.need.ops", { n: num(Math.ceil(d.opsNeeded)) })} · ${t("uptime.ops.hint")}`;
  const mode = state.buyMode ?? 1;
  for (const r of rows) {
    if (r.up) {
      r.b.disabled = state.money < r.up.cost;
      continue;
    }
    const owned = state[tab][r.item.id];
    const can = maxAffordable(tab, r.item.id, owned, state.money);
    const n = mode === "max" ? Math.max(1, can) : mode;
    const cost = costFor(tab, r.item.id, owned, n);
    r.b.disabled = can < n;
    r.count.textContent = owned ? `×${num(owned)}` : "";
    r.cost.textContent = n > 1 ? `×${n} · ${price(cost)}` : price(cost);
    r.b.setAttribute("aria-label", `${t("shop.buy", { name: t(`${tab}.${r.item.id}.name`), cost: r.cost.textContent })}. ${t("shop.owned", { n: owned })}`);
    let fx = effectText(tab, r.item);
    let warn = "";
    if (tab === "hw") {
      const next = nextMilestone(owned);
      if (next) fx += ` · ${t("shop.milestone", { n: next })}`;
      const draw = d.draw + n * r.item.power * d.fx.draw;
      if (draw > d.powerCap) warn = t("shop.warn.power");
      else if (draw > d.coolCap) warn = t("shop.warn.cool");
    }
    if (r.fx.textContent !== fx) r.fx.textContent = fx;
    if (r.warn.textContent !== (warn ? `! ${warn}` : "")) r.warn.textContent = warn ? `! ${warn}` : "";
  }
}

// ----- Dialogs -----

function openExit() {
  const gain = exitShares(state);
  const ok = canExit(state);
  let text = ok ? t("exit.gain", { n: num(gain), p: num(gain * SHARE_BONUS * 100) }) : t("exit.locked", { v: money(exitNeeds(state)) });
  if (state.shares) text += ` ${t("exit.have", { n: num(state.shares) })}`;
  $("exit-gain").textContent = text;
  $("btn-exit-go").disabled = !ok;
  $("dlg-exit").showModal();
}

function openStats() {
  const s = state.stats;
  const none = t("stats.none");
  const list = [
    ["stats.score", num(score(state)), t("stats.score.hint")],
    ["stats.total", money(state.totalEarned)],
    ["stats.run", money(state.runEarned)],
    ["stats.shares", `${num(state.shares)} (+${num(state.shares * SHARE_BONUS * 100)}%)`],
    ["stats.exits", num(s.exits)],
    ["stats.clicks", num(s.clicks)],
    ["stats.resolved", num(s.resolved)],
    ["stats.auto", num(s.auto)],
    ["stats.failed", num(s.failed)],
    ["stats.best", duration(s.bestStreak)],
    ["stats.speedrun", s.speedrun ? duration(s.speedrun / 1000) : none],
    ["stats.played", duration(s.played)],
  ];
  const dl = $("stats");
  dl.textContent = "";
  for (const [key, value, hint] of list) {
    const dt = el("dt", null, t(key));
    if (hint) dt.append(el("small", null, hint));
    dl.append(dt, el("dd", null, value));
  }
  $("ach-count").textContent = t("ach.count", { a: state.ach.length, b: ACHIEVEMENTS.length });
  const ul = $("achievements");
  ul.textContent = "";
  for (const id of ACHIEVEMENTS) {
    const done = state.ach.includes(id);
    const li = el("li", done ? "done" : "");
    const body = el("div");
    body.append(el("strong", null, t(`ach.${id}.name`)), el("span", null, t(`ach.${id}.desc`)), el("small", null, t(done ? "ach.done" : "ach.open")));
    li.append(el("span", "icon", ACHIEVEMENT_ICONS[id]), body);
    ul.append(li);
  }
  const reset = $("btn-reset");
  reset.dataset.sure = "";
  reset.textContent = t("settings.reset");
  $("dlg-stats").showModal();
  // The browser jumps to the first button, far down: start reading at the top instead.
  $("h-stats").focus();
  $("dlg-stats").scrollTop = 0;
}

function welcomeBack(out) {
  if (!out.long || out.earned <= 0) return;
  $("offline-body").textContent = t("offline.body", { t: duration(out.seconds), v: money(out.earned) });
  $("offline-eff").textContent = t(out.efficiency > 0.26 ? "offline.eff.some" : "offline.eff.none", { p: percent(out.efficiency) });
  $("offline-capped").hidden = !out.capped;
  if (!$("dlg-offline").open) $("dlg-offline").showModal();
}

// ----- Charts -----

const ago = (n) => (n === 0 ? t("chart.now") : t("chart.ago", { t: duration(n) }));
const charts = {};
function makeCharts() {
  const tipOf = (id) => $(id).parentElement.querySelector(".tip");
  charts.rev = createChart($("c-rev"), tipOf("c-rev"), { color: "#3987e5", samples: 300, ago, format: (v) => t("unit.persec", { v: money(v) }) });
  charts.power = createChart($("c-power"), tipOf("c-power"), {
    color: "#199e70", samples: 300, ago, format: percent, max: (top) => Math.max(1.25, top * 1.1),
    limit: { value: 1, color: "#d03b3b", label: () => `100% · ${t("chart.limit")}` },
  });
  charts.temp = createChart($("c-temp"), tipOf("c-temp"), {
    color: "#9085e9", samples: 300, ago, format: degrees, min: 15, max: (top) => Math.max(45, top + 5),
    limit: { value: TEMP_OK, color: "#ec835a", label: () => `${TEMP_OK} °C · ${t("chart.throttle")}` },
  });
}
function sample() {
  charts.rev.push(d.rate);
  charts.power.push(d.load);
  charts.temp.push(state.temp);
}

// ----- The loop -----

function draw() {
  d = derive(state);
  drawTop();
  drawTiles();
  drawAlerts();
  drawRack();
  drawShop();
  $("work-hint").textContent = t("work.hint", { v: money(d.clickValue) });
}

let sampled = 0;
let nextFlavor = 20;
function frame() {
  if (paused) return;
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt <= 0) return;
  const events = [];
  // A browser that slept for a while (without telling us): treat it like time away.
  if (dt > 30) {
    state.lastSeen = Date.now() - dt * 1000;
    welcomeBack(applyOffline(state));
  } else {
    while (dt > 0) {
      const step = Math.min(dt, 1);
      tick(state, step, Math.random, events);
      dt -= step;
    }
  }
  handle(events);
  draw();
  if (now - sampled >= 1000) {
    sampled = now;
    sample();
    report();
    if ((nextFlavor -= 1) <= 0) {
      nextFlavor = 15 + Math.random() * 30;
      log("info", FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);
    }
  }
}

function act(option) {
  if (!state.incident) return;
  handle(incidentAction(state, option, Math.random, []));
  draw();
}

function wire() {
  $("btn-work").addEventListener("click", (e) => {
    const v = click(state);
    const pop = el("span", "pop", `+${money(v)}`);
    const r = e.currentTarget.getBoundingClientRect();
    // A keyboard "click" has no position: show it in the middle.
    pop.style.left = `${e.clientX ? e.clientX - r.left : r.width / 2}px`;
    pop.style.top = `${e.clientY ? e.clientY - r.top : r.height / 2}px`;
    e.currentTarget.append(pop);
    setTimeout(() => pop.remove(), 700);
    drawTop();
  });

  $("alerts").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-option]");
    if (b) act(Number(b.dataset.option));
    // Read it? A click puts the result away.
    else if (e.target.closest(".alert.done")) {
      outcome = null;
      drawAlerts();
    }
  });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    drawShop();
    $("shop").scrollTop = 0;
  });
  $("amount").addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    state.buyMode = b.dataset.n === "max" ? "max" : Number(b.dataset.n);
    drawShop();
  });
  $("shop").addEventListener("click", (e) => {
    const b = e.target.closest("button.item");
    if (!b || b.disabled) return;
    if (b.dataset.up) {
      if (buyUpgrade(state, b.dataset.up)) {
        log("info", t("log.upgrade", { name: t(`up.${b.dataset.up}.name`) }));
        save();
      }
    } else if (buy(state, tab, b.dataset.id, state.buyMode ?? 1)) {
      save();
    }
    draw();
    // The list was rebuilt when something new appeared: keep the keyboard on the same thing.
    if (!b.isConnected) $("shop").querySelector(`[data-id="${b.dataset.id}"]`)?.focus();
  });

  $("btn-exit").addEventListener("click", openExit);
  $("btn-stats").addEventListener("click", openStats);
  $("btn-lang").addEventListener("click", () => {
    state.lang = getLang() === "de" ? "en" : "de";
    setLang(state.lang);
    texts();
    draw();
    save();
  });
  $("btn-exit-go").addEventListener("click", () => {
    const next = exit(state);
    if (!next) return;
    report(true);
    state = next;
    for (const c of Object.values(charts)) c.clear();
    outcome = null;
    lastStage = null;
    $("dlg-exit").close();
    log("ok", t("log.exit", { n: num(state.shares) }));
    save();
    draw();
  });
  $("btn-reset").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (!b.dataset.sure) {
      b.dataset.sure = "1";
      b.textContent = t("settings.reset.sure");
      return;
    }
    const lang = getLang();
    state = newState();
    state.lang = lang;
    for (const c of Object.values(charts)) c.clear();
    $("log").textContent = "";
    outcome = null;
    lastStage = null;
    save();
    $("dlg-stats").close();
    log("info", t("log.boot"));
    draw();
  });
  for (const b of document.querySelectorAll("[data-close]")) b.addEventListener("click", () => b.closest("dialog").close());
  // A click on the dark area around a dialog closes it.
  for (const dlg of document.querySelectorAll("dialog")) dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
    if (e.key === "1" || e.key === "2") {
      const b = $("alerts").querySelectorAll("button[data-option]")[Number(e.key) - 1];
      if (b) {
        e.preventDefault();
        b.click();
      }
    } else if (e.key === " " && !e.repeat && !e.target.closest("button, a, input, [role=tab]")) {
      e.preventDefault();
      $("btn-work").click();
    }
  });

  // Hidden (another tab, the phone locked): the machines keep earning like when you are away,
  // but no alert fires while you can't see it.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      paused = true;
      state.lastSeen = Date.now();
      report(true);
      save();
    } else if (paused) {
      paused = false;
      last = performance.now();
      welcomeBack(applyOffline(state));
      draw();
    }
  });
  window.addEventListener("pagehide", () => {
    report(true);
    save();
  });
}

function start() {
  const had = load();
  setLang(state.lang ?? browserLang());
  texts();
  makeCharts();
  wire();
  const out = had ? applyOffline(state) : null;
  d = derive(state);
  lastStage = d.stage;
  log("info", t(had ? "log.back" : "log.boot"));
  draw();
  if (out) welcomeBack(out);
  // Achievements earned before Toki was listening (or outside Toki) count there too.
  setTimeout(() => state.ach.forEach(achieved), 2000);
  last = performance.now();
  setInterval(frame, 250);
  setInterval(save, 10_000);
}

start();
