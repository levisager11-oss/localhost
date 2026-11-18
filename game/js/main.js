// The screen: draws the dashboard, takes clicks and saves the game.
import { ACHIEVEMENT_ICONS, ACHIEVEMENTS, COOLING, PERKS, POWER, STAFF, TIERS, UPGRADES } from "./data.js";
import {
  applyOffline, beginRun, buy, buyPerk, buyUpgrade, canExit, click, costFor, derive, deserialize, exit, exitNeeds, exitShares,
  freeShares, incidentAction, incidentDef, maxAffordable, milestoneMult, newState, nextMilestone, perkCost, perkOpen, priceMult,
  score, serialize, shareBonus, slaTier, TEMP_HOT, TEMP_OK, tick, upgradeCost, upgradeOffered,
} from "./sim.js";
import { browserLang, FLAVOR, getLang, setLang, t, upgradeText } from "./i18n.js";
import { degrees, duration, money, num, percent, price, uptime, watts } from "./format.js";
import { createChart, createGauge } from "./chart.js";
import { createScene } from "./scene.js";
import { isMuted, play, setMuted } from "./audio.js";

const KEY = "localhost.save";
const LISTS = { hw: TIERS, pw: POWER, cl: COOLING, st: STAFF };
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
/** Small line icons, drawn like the ones dashboards use. */
const ICONS = {
  check: '<circle cx="8" cy="8" r="6.3"/><path d="M5.3 8.2l1.9 1.9 3.6-3.9"/>',
  warn: '<path d="M8 2.2l6.3 11H1.7z"/><path d="M8 6.6v3.1M8 11.7v.1"/>',
  cross: '<circle cx="8" cy="8" r="6.3"/><path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4"/>',
  bell: '<path d="M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.5H2.8z"/><path d="M6.6 14a1.5 1.5 0 0 0 2.8 0"/>',
  star: '<path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>',
  sound: '<path d="M2.5 6.2h2.3L8 3.5v9L4.8 9.8H2.5z"/><path d="M10.5 6a3 3 0 0 1 0 4M12.3 4.2a5.5 5.5 0 0 1 0 7.6"/>',
  mute: '<path d="M2.5 6.2h2.3L8 3.5v9L4.8 9.8H2.5z"/><path d="M11 6.2l3 3.6M14 6.2l-3 3.6"/>',
  moon: '<path d="M13.2 9.8A5.6 5.6 0 0 1 6.2 2.8a5.6 5.6 0 1 0 7 7z"/>',
};
function icon(name, size = 16) {
  const span = el("span", "ico");
  span.innerHTML = `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  return span;
}

let state;
let d;
let tab = "hw";
let paused = false;
let last = performance.now();
/** What the last alert ended with, shown for a few seconds */
let outcome = null;
let lastStage = null;
let scene;

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
  window.toki?.score(score(state));
  if (state.stats.speedrun > 0) window.toki?.score(state.stats.speedrun, "speedrun");
}

// ----- Small things: log, toasts -----

function log(level, text) {
  const list = $("log");
  const li = el("li", level);
  const time = new Date().toLocaleTimeString(getLang() === "de" ? "de-CH" : "en-GB", { hour12: false });
  li.append(el("time", null, time), el("b", null, { info: "INFO", ok: "OK", warn: "WARN", crit: "CRIT" }[level]), el("span", null, text));
  list.prepend(li);
  while (list.children.length > 80) list.lastChild.remove();
}

function toast(text) {
  const box = el("div", "toast");
  box.append(icon("check"), el("span", null, text));
  $("toasts").append(box);
  // Never a tower of them: the oldest make room.
  while ($("toasts").children.length > 3) $("toasts").firstChild.remove();
  setTimeout(() => box.remove(), 5000);
}

function status(node, level, text) {
  // Nothing changed: leave the page alone (this runs four times a second).
  if (node.dataset.now === `${level}|${text}`) return;
  node.dataset.now = `${level}|${text}`;
  node.className = `sub status ${level}`;
  node.textContent = "";
  node.append(icon({ good: "check", warn: "warn", serious: "warn", crit: "cross" }[level], 14), el("span", null, text));
}
const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

// ----- Events from the rules -----

function handle(events) {
  for (const e of events) {
    const title = e.id && e.type !== "achievement" ? t(`inc.${e.id}.title`) : "";
    if (e.type === "incident") {
      outcome = null;
      play(e.good ? "chance" : "alert");
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
      play("solved");
      save();
    } else if (e.type === "failed") {
      const text = t(`inc.${e.id}.fail`);
      const more = [e.outage ? t("log.outage", { t: duration(e.outage) }) : "", e.lost ? t("log.lost", { v: money(e.lost) }) : ""].filter(Boolean).join(" ");
      log("crit", `${t("log.failed", { text })} ${more}`.trim());
      outcome = { kind: "crit", title, text, extra: e.lost ? `−${money(e.lost)}` : "", until: Date.now() + 8000 };
      play("failed");
      save();
    } else if (e.type === "missed") {
      log("info", t("log.missed", { title }));
    } else if (e.type === "recovered") {
      play("back");
      log("ok", t("log.recovered"));
    } else if (e.type === "achievement") {
      play("achievement");
      window.toki?.achievement(e.id);
      toast(t("toast.ach", { name: t(`ach.${e.id}.name`) }));
    }
  }
}

// ----- Drawing -----

function texts() {
  document.documentElement.lang = getLang();
  for (const n of document.querySelectorAll("[data-t]")) n.textContent = t(n.dataset.t);
  $("c-rev").setAttribute("aria-label", t("chart.revenue"));
  for (const n of document.querySelectorAll("[data-icon]")) n.replaceChildren(...icon(n.dataset.icon).childNodes);
  drawSound();
  shopKey = "";
  alertKey = "";
}

function drawSound() {
  const b = $("btn-sound");
  b.textContent = "";
  b.append(icon(isMuted() ? "mute" : "sound"));
  b.setAttribute("aria-label", t(isMuted() ? "top.sound.off" : "top.sound.on"));
  b.title = b.getAttribute("aria-label");
  b.setAttribute("aria-pressed", String(!isMuted()));
}

function drawTop() {
  $("money").textContent = money(state.money);
  $("rate").textContent = `+${t("unit.persec", { v: money(d.rate) })}`;
  $("stage").textContent = t(`stage.${d.stage}`);
  $("btn-exit").classList.toggle("ready", canExit(state));
  if (lastStage && lastStage !== d.stage && d.stageIndex > 0) {
    const stage = t(`stage.${d.stage}`);
    log("info", t("log.stage", { stage }));
    toast(t("log.stage", { stage }));
    play("upgrade");
  }
  lastStage = d.stage;
}

/** The colour a stat wears: green when all is well. */
const COLOR = { good: "#73bf69", warn: "#fade2a", serious: "#ff9830", crit: "#f2495c" };
let revColor = COLOR.good;
const gauges = {};

function drawTiles() {
  $("rev-value").textContent = t("unit.persec", { v: money(d.rate) });
  revColor = state.outage > 0 ? COLOR.crit : d.rate < d.nominal * 0.999 ? COLOR.serious : COLOR.good;
  $("rev-value").style.color = revColor;
  setText($("rev-sub"), t("sla.mult", { m: num(d.sla, true) }));

  gauges.power.set(d.load / 1.25, percent(d.load));
  gauges.temp.set((state.temp - 15) / 45, degrees(state.temp));
  setText($("power-sub"), t("power.of", { a: watts(d.draw), b: watts(d.powerCap) }));
  if (d.load > 1) status($("power-status"), "crit", t("power.over"));
  else if (d.load > 0.85) status($("power-status"), "warn", t("power.tight"));
  else status($("power-status"), "good", t("power.ok"));

  setText($("temp-sub"), t("temp.cooling", { p: percent(d.coolLoad) }));
  $("temp-sub").title = t("power.of", { a: watts(Math.min(d.draw, d.powerCap)), b: watts(d.coolCap) });
  if (state.temp >= TEMP_HOT - 5) status($("temp-status"), "crit", t("temp.crit"));
  else if (state.temp > TEMP_OK) status($("temp-status"), "serious", t("temp.hot"));
  else if (state.temp > TEMP_OK - 4) status($("temp-status"), "warn", t("temp.warm"));
  else status($("temp-status"), "good", t("temp.ok"));

  $("uptime-value").textContent = uptime(state.uptime);
  const tier = slaTier(state.uptime);
  const level = tier === 0 ? (state.uptime < 0.95 ? "crit" : "serious") : tier === 1 ? "warn" : "good";
  $("uptime-value").style.color = COLOR[level];
  status($("uptime-status"), level, t(`sla.${tier}`));
  $("uptime-streak").textContent = t("uptime.streak", { t: duration(state.stats.streak) });
  setText($("away"), t("uptime.away", { p: percent(d.awayShare), h: d.awayHours }));
  $("away-chip").title = t("uptime.away.hint");
  setText($("ops-label"), t("uptime.ops", { p: percent(d.coverage) }));
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
      const badge = el("span", "badge");
      badge.append(icon("cross", 14), el("span", null, t("alerts.outage")));
      card.append(badge, el("h3", null, outcome?.title ?? t("alerts.outage")));
      if (outcome) card.append(el("p", null, [outcome.text, outcome.extra].filter(Boolean).join(" ")));
      card.append(el("p", "count"));
      box.append(card);
    } else if (inc) {
      const def = incidentDef(inc.id);
      flip = def.kind === "choice" && Math.random() < 0.5;
      const card = el("div", `alert ${def.good ? "chance" : "firing"}`);
      const badge = el("span", "badge");
      badge.append(icon(def.good ? "star" : "bell", 14), el("span", null, t(def.good ? "alerts.chance" : "alerts.firing")));
      card.append(badge, el("h3", null, t(`inc.${inc.id}.title`)), el("p", null, t(`inc.${inc.id}.desc`)));
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
      const badge = el("span", "badge");
      badge.append(icon(outcome.kind === "good" ? "check" : "cross", 14), el("span", null, t(outcome.kind === "good" ? "alerts.resolved" : "alerts.failed")));
      card.append(badge, el("h3", null, outcome.title), el("p", null, [outcome.text, outcome.extra].filter(Boolean).join(" ")));
      box.append(card);
    } else {
      const p = el("p", "quiet");
      p.append(icon("check"), el("span", null, `${t("alerts.none")} ${t("alerts.none2")}`));
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
  setText($("effects"), fx.join(" · "));
}

function drawScene() {
  const inc = state.incident ? incidentDef(state.incident.id) : null;
  scene.set({
    stage: d.stage,
    hw: state.hw,
    mode: state.outage > 0 ? "down" : d.powerFactor < 1 || d.thermalFactor < 1 ? "slow" : "up",
    alert: !!inc && !inc.good,
    chance: !!inc && !!inc.good,
    boost: !!state.boost,
    hot: Math.max(0, Math.min(1, (state.temp - TEMP_OK) / (TEMP_HOT - TEMP_OK))),
  });
  let total = 0;
  for (const tier of TIERS) total += state.hw[tier.id];
  setText($("scene-total"), t("scene.total", { n: num(total) }));
  setText($("work-hint"), t("work.hint", { v: money(d.clickValue) }));
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
const offered = () => UPGRADES.filter((u) => upgradeOffered(state, u));

function effectText(kind, item) {
  if (kind === "hw") {
    // What one of them earns right now, with every bonus you have.
    const each = item.rev * milestoneMult(state.hw[item.id]) * (d.fx.tier[item.id] ?? 1) * (d.nominal / (d.baseRev || 1));
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
  $("shop-note").hidden = tab !== "st";

  if (tab === "up") {
    const open = offered();
    if (!open.length) box.append(el("p", "quiet", t("shop.up.none")));
    for (const u of open) {
      const b = el("button", "item");
      b.type = "button";
      b.dataset.up = u.id;
      const main = el("div", "main");
      main.append(el("strong", null, upgradeText(u, "name")), el("span", "desc", upgradeText(u, "desc")), el("span", "fx", upgradeText(u, "fx")));
      const cost = el("span", "cost", price(upgradeCost(state, u)));
      b.append(main, cost);
      box.append(b);
      rows.push({ b, up: u, cost });
    }
    const have = UPGRADES.filter((u) => state.up.includes(u.id));
    if (have.length) {
      box.append(el("h3", "installed", `${t("shop.installed")} (${have.length})`));
      for (const u of have) {
        const row = el("div", "item owned");
        const main = el("div", "main");
        main.append(el("strong", null, upgradeText(u, "name")), el("span", "fx", upgradeText(u, "fx")));
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
  const ids = tab === "up" ? `${offered().map((u) => u.id)}|${state.up.length}` : visible(tab).shown.map((x) => x.id).join();
  const key = `${getLang()}|${tab}|${state.buyMode}|${ids}`;
  if (key !== shopKey) {
    shopKey = key;
    buildShop();
  }
  // A dot on the Upgrades tab when one can be bought.
  $("tabs").querySelector('[data-tab="up"]').classList.toggle("has", tab !== "up" && offered().some((u) => state.money >= upgradeCost(state, u)));
  if (tab === "st") setText($("shop-note"), `${t("uptime.ops", { p: percent(d.coverage) })} · ${t("shop.need.ops", { n: num(Math.ceil(d.opsNeeded)) })} · ${t("uptime.ops.hint")} ${t("stats.away")}: ${t("stats.away.value", { p: percent(d.awayShare), h: d.awayHours })}.`);
  const mode = state.buyMode ?? 1;
  const mult = priceMult(state, tab);
  for (const r of rows) {
    if (r.up) {
      r.b.disabled = state.money < upgradeCost(state, r.up);
      continue;
    }
    const owned = state[tab][r.item.id];
    const can = maxAffordable(tab, r.item.id, owned, state.money, mult);
    const n = mode === "max" ? Math.max(1, can) : mode;
    const cost = costFor(tab, r.item.id, owned, n, mult);
    r.b.disabled = can < n;
    setText(r.count, owned ? `×${num(owned)}` : "");
    setText(r.cost, n > 1 ? `×${n} · ${price(cost)}` : price(cost));
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
    setText(r.fx, fx);
    setText(r.warn, warn);
  }
}

// ----- Dialogs -----

function openExit() {
  const gain = exitShares(state);
  const ok = canExit(state);
  const each = shareBonus(state) * 100;
  let text = ok ? t("exit.gain", { n: num(gain), p: num(gain * each) }) : t("exit.locked", { v: money(exitNeeds(state)) });
  if (state.shares) text += ` ${t("exit.have", { n: num(state.shares) })}`;
  $("exit-keep").textContent = t("exit.keep", { p: num(each) });
  $("exit-gain").textContent = text;
  $("btn-exit-go").disabled = !ok;
  $("dlg-exit").showModal();
}

/** What a level of a reincarnation upgrade gives, as text. */
function perkValue(p, level) {
  if (p.id === "seed") return money(p.values[level - 1]);
  if (p.id === "starter") return t(`perk.starter.v${level}`);
  if (p.id === "autoclick") return num(p.values[level - 1]);
  if (p.id === "luck") return `${level + 1}×`;
  if (p.id === "dividends") return `${num(2 + level)}%`;
  return p.per ? percent(p.per * level) : "";
}

function drawPerks() {
  const free = freeShares(state);
  $("reborn-intro").textContent = t(state.reborn ? "reborn.intro" : "reborn.intro.view");
  $("reborn-balance").textContent = t("reborn.balance", { n: num(free) });
  $("reborn-bonus").textContent = t("reborn.bonus", { n: num(state.shares), p: num(state.shares * shareBonus(state) * 100) });
  $("btn-reborn-go").textContent = t(state.reborn ? "reborn.start" : "close");
  const ul = $("perks");
  ul.textContent = "";
  for (const p of PERKS) {
    const level = state.perks[p.id] ?? 0;
    const cost = perkCost(state, p.id);
    const open = perkOpen(state, p.id);
    const li = el("li");
    const b = el("button", `item perk${level ? " some" : ""}`);
    b.type = "button";
    b.dataset.perk = p.id;
    b.disabled = !state.reborn || cost == null || !open || free < cost;
    const main = el("div", "main");
    const head = el("div", "head");
    head.append(el("strong", null, t(`perk.${p.id}.name`)), el("b", "count", cost == null ? t("reborn.max") : t("reborn.level", { a: level, b: p.costs.length })));
    // Show what the next level gives; once complete, what you have.
    const fx = t(`perk.${p.id}.fx`, { v: perkValue(p, Math.min(level + 1, p.costs.length)) });
    main.append(head, el("span", "desc", t(`perk.${p.id}.desc`)), el("span", "fx", fx));
    if (!open) main.append(el("span", "warn", t("reborn.needs", { name: t(`perk.${p.needs.id}.name`) })));
    b.append(main, el("span", "cost", cost == null ? "✓" : t("reborn.cost", { n: num(cost) })));
    li.append(b);
    ul.append(li);
  }
}

function openPerks() {
  drawPerks();
  if (!$("dlg-reborn").open) $("dlg-reborn").showModal();
  $("h-reborn").focus();
  $("dlg-reborn").scrollTop = 0;
}

function openStats() {
  const s = state.stats;
  const none = t("stats.none");
  const list = [
    ["stats.score", num(score(state)), t("stats.score.hint")],
    ["stats.total", money(state.totalEarned)],
    ["stats.run", money(state.runEarned)],
    ["stats.shares", `${num(state.shares)} (+${num(state.shares * shareBonus(state) * 100)}%)`],
    ["stats.exits", num(s.exits)],
    ["stats.clicks", num(s.clicks)],
    ["stats.resolved", num(s.resolved)],
    ["stats.auto", num(s.auto)],
    ["stats.failed", num(s.failed)],
    ["stats.best", duration(s.bestStreak)],
    ["stats.speedrun", s.speedrun ? duration(s.speedrun / 1000) : none],
    ["stats.played", duration(s.played)],
    ["stats.away", t("stats.away.value", { p: percent(d.awayShare), h: d.awayHours }), t("uptime.away.hint")],
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
  $("offline-eff").textContent = t(out.staffed ? "offline.eff.some" : "offline.eff.none", { p: percent(out.efficiency) });
  $("offline-capped").hidden = !out.capped;
  $("offline-capped").textContent = t("offline.capped", { h: out.hours });
  if (!$("dlg-offline").open && !$("dlg-reborn").open) $("dlg-offline").showModal();
}

// ----- Charts -----

const ago = (n) => (n === 0 ? t("chart.now") : t("chart.ago", { t: duration(n) }));
const charts = {};
function makeCharts() {
  const tipOf = (id) => $(id).parentElement.querySelector(".tip");
  charts.rev = createChart($("c-rev"), tipOf("c-rev"), { color: () => revColor, samples: 300, ago, format: (v) => t("unit.persec", { v: money(v) }) });
  // Power: up to 125% of what the supply can take. Temperature: 15 to 60 °C.
  gauges.power = createGauge($("g-power"), [{ to: 0.85 / 1.25, color: COLOR.good }, { to: 1 / 1.25, color: COLOR.serious }, { to: 1, color: COLOR.crit }]);
  gauges.temp = createGauge($("g-temp"), [
    { to: (TEMP_OK - 4 - 15) / 45, color: COLOR.good }, { to: (TEMP_OK - 15) / 45, color: COLOR.warn },
    { to: (TEMP_HOT - 5 - 15) / 45, color: COLOR.serious }, { to: 1, color: COLOR.crit },
  ]);
}
function sample() {
  charts.rev.push(d.rate);
}

// ----- The loop -----

function draw() {
  d = derive(state);
  drawTop();
  drawTiles();
  drawAlerts();
  drawScene();
  drawShop();
}

let sampled = 0;
let nextFlavor = 20;
function frame() {
  // Between two lives nothing runs: the reincarnation screen is open.
  if (paused || state.reborn) {
    last = performance.now();
    return;
  }
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt <= 0) return;
  const events = [];
  // A browser that slept for a while (without telling us): treat it like time away.
  if (dt > 30) {
    state.lastSeen = Date.now() - dt * 1000;
    welcomeBack(applyOffline(state, Date.now(), events));
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
    if ((nextFlavor -= 1) <= 0) {
      nextFlavor = 15 + Math.random() * 30;
      log("info", FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);
    }
  }
}

function act(option) {
  if (!state.incident) return;
  const events = incidentAction(state, option, Math.random, []);
  if (!events.length) play("step");
  handle(events);
  draw();
}

/** A new, empty picture of the game after a reset or a new life. */
function fresh() {
  for (const c of Object.values(charts)) c.clear();
  outcome = null;
  lastStage = null;
  shopKey = "";
  alertKey = "";
}

function wire() {
  $("btn-work").addEventListener("click", (e) => {
    const v = click(state);
    play("click");
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    // A keyboard "click" has no position: show it in the middle.
    const x = e.clientX ? e.clientX - r.left : r.width / 2;
    const y = e.clientY ? e.clientY - r.top : r.height / 2;
    const pop = el("span", "pop", `+${money(v)}`);
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    b.append(pop);
    setTimeout(() => pop.remove(), 700);
    scene.poke(x / r.width, y / r.height);
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
      const u = UPGRADES.find((x) => x.id === b.dataset.up);
      if (buyUpgrade(state, u.id)) {
        play("upgrade");
        log("info", t("log.upgrade", { name: upgradeText(u, "name") }));
        save();
      }
    } else if (buy(state, tab, b.dataset.id, state.buyMode ?? 1)) {
      play("buy");
      save();
    }
    draw();
    // The list was rebuilt when something new appeared: keep the keyboard on the same thing.
    if (!b.isConnected && b.dataset.id) $("shop").querySelector(`[data-id="${b.dataset.id}"]`)?.focus();
  });

  $("btn-exit").addEventListener("click", openExit);
  $("btn-stats").addEventListener("click", openStats);
  $("btn-perks").addEventListener("click", () => {
    $("dlg-exit").close();
    openPerks();
  });
  $("btn-lang").addEventListener("click", () => {
    state.lang = getLang() === "de" ? "en" : "de";
    setLang(state.lang);
    texts();
    draw();
    save();
  });
  $("btn-sound").addEventListener("click", () => {
    state.muted = !isMuted();
    setMuted(state.muted);
    drawSound();
    play("buy");
    save();
  });
  $("btn-exit-go").addEventListener("click", () => {
    const next = exit(state);
    if (!next) return;
    state = next;
    fresh();
    $("dlg-exit").close();
    play("reborn");
    log("ok", t("log.exit", { n: num(state.shares) }));
    save();
    draw();
    openPerks();
  });
  $("perks").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-perk]");
    if (!b || b.disabled) return;
    if (buyPerk(state, b.dataset.perk)) {
      play("upgrade");
      log("info", t("log.perk", { name: t(`perk.${b.dataset.perk}.name`) }));
      save();
      drawPerks();
      $("perks").querySelector(`[data-perk="${b.dataset.perk}"]`)?.focus();
      draw();
    }
  });
  $("btn-reborn-go").addEventListener("click", () => {
    if (state.reborn) {
      beginRun(state);
      fresh();
      log("ok", t("log.reborn"));
      save();
      last = performance.now();
      draw();
    }
    $("dlg-reborn").close();
  });
  // Between two lives the screen stays until the new life is started.
  $("dlg-reborn").addEventListener("cancel", (e) => state.reborn && e.preventDefault());
  $("btn-reset").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (!b.dataset.sure) {
      b.dataset.sure = "1";
      b.textContent = t("settings.reset.sure");
      return;
    }
    const keep = { lang: getLang(), muted: isMuted() || undefined };
    state = newState();
    Object.assign(state, keep);
    fresh();
    $("log").textContent = "";
    save();
    $("dlg-stats").close();
    log("info", t("log.boot"));
    draw();
  });
  for (const b of document.querySelectorAll("[data-close]")) b.addEventListener("click", () => b.closest("dialog").close());
  // A click on the dark area around a dialog closes it.
  for (const dlg of document.querySelectorAll("dialog")) {
    dlg.addEventListener("click", (e) => e.target === dlg && !(dlg.id === "dlg-reborn" && state.reborn) && dlg.close());
  }

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
      scene.stop();
      state.lastSeen = Date.now();
      save();
    } else if (paused) {
      paused = false;
      scene.start();
      last = performance.now();
      const events = [];
      if (!state.reborn) welcomeBack(applyOffline(state, Date.now(), events));
      handle(events);
      draw();
    }
  });
  window.addEventListener("pagehide", save);
}

function start() {
  const had = load();
  setLang(state.lang ?? browserLang());
  setMuted(state.muted);
  scene = createScene($("c-scene"));
  texts();
  makeCharts();
  wire();
  const events = [];
  const out = had && !state.reborn ? applyOffline(state, Date.now(), events) : null;
  d = derive(state);
  lastStage = d.stage;
  log("info", t(had ? "log.back" : "log.boot"));
  handle(events);
  draw();
  scene.start();
  for (const id of state.ach) window.toki?.achievement(id);
  if (state.reborn) openPerks();
  else if (out) welcomeBack(out);
  last = performance.now();
  setInterval(frame, 250);
  setInterval(save, 10_000);
}

start();
