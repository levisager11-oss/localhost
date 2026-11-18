// The game's rules, without any screen: the same code runs in the browser and in the tests.
import { ACHIEVEMENTS, BASE_COOLING, BASE_POWER, COOLING, GROWTH, INCIDENTS, MILESTONE_STEP, MILESTONES, PERKS, POWER, STAFF, STAGES, TIERS, UPGRADES } from "./data.js";

export const SAVE_VERSION = 1;
/** Seconds the temperature needs to follow the load, and the uptime to forget an outage. */
const TEMP_TAU = 20;
const UPTIME_TAU = 240;
const START_UPTIME = 0.995;
/** Above this the machines slow down; at HOT they barely run and count as partly down. */
export const TEMP_OK = 35;
export const TEMP_HOT = 50;
/** Each stock option from an exit adds this much income (more with the dividends upgrade). */
const SHARE_BONUS = 0.02;
/** An exit needs at least this many new stock options. */
export const MIN_EXIT_SHARES = 10;
/** Away for longer than this counts as "offline": you get a summary when you come back. */
export const OFFLINE_MIN = 60;
/** Hours away that count, before any upgrade. */
export const OFFLINE_HOURS = 8;
/** What the machines earn while you are away with nobody on call, and what full cover adds. */
const AWAY_BASE = 0.25;
const AWAY_STAFF = 0.65;
/** Toki keeps scores up to this. */
const MAX_SCORE = 1_000_000_000_000;

const KINDS = { hw: TIERS, pw: POWER, cl: COOLING, st: STAFF };
const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const UPGRADE = byId(UPGRADES);
const INCIDENT = byId(INCIDENTS);
const PERK = byId(PERKS);
export const incidentDef = (id) => INCIDENT[id];

const counts = (list) => Object.fromEntries(list.map((x) => [x.id, 0]));

export function newState(now = Date.now()) {
  return {
    v: SAVE_VERSION,
    money: 0,
    /** Earned since the last exit, and ever */
    runEarned: 0,
    totalEarned: 0,
    hw: { ...counts(TIERS), pi: 1 },
    pw: counts(POWER),
    cl: counts(COOLING),
    st: counts(STAFF),
    up: [],
    temp: 22,
    // A new service has no track record yet: the nines must be earned.
    uptime: START_UPTIME,
    /** Stock options ever received; each adds income. Perks are paid from them. */
    shares: 0,
    /** Reincarnation upgrade id → level */
    perks: {},
    /** Just sold the company: the new life waits for the reincarnation screen to be closed. */
    reborn: false,
    /** Seconds left of a full outage */
    outage: 0,
    incident: null,
    lastIncident: null,
    nextIncident: 75,
    /** A traffic spike: { rev, draw, left } */
    boost: null,
    /** Broken cooling: { cool, left } */
    debuff: null,
    ach: [],
    stats: { clicks: 0, resolved: 0, failed: 0, auto: 0, streak: 0, bestStreak: 0, exits: 0, played: 0, runStart: now, speedrun: 0 },
    lastSeen: now,
  };
}

/** Every effect of upgrades and perks, multiplied (or added) together. */
function effects(s) {
  const fx = { rev: 1, click: 1, draw: 1, cool: 1, rate: 1, time: 1, recover: 1, backups: false, mash: {}, tier: {}, away: 0, hours: OFFLINE_HOURS };
  for (const id of s.up) {
    const def = UPGRADE[id];
    const u = def?.fx;
    if (!u) continue;
    for (const k of ["rev", "click", "draw", "cool", "rate", "time", "recover"]) if (u[k]) fx[k] *= u[k];
    if (u.backups) fx.backups = true;
    if (u.mash) for (const k in u.mash) fx.mash[k] = (fx.mash[k] ?? 1) * u.mash[k];
    if (u.tier) fx.tier[def.tier] = (fx.tier[def.tier] ?? 1) * u.tier;
    if (u.away) fx.away += u.away;
    if (u.hours) fx.hours = Math.max(fx.hours, u.hours);
  }
  const p = s.perks;
  fx.time *= 1 + PERK.runbooks.per * (p.runbooks ?? 0);
  fx.reward = 1 + PERK.bonus.per * (p.bonus ?? 0);
  fx.away += PERK.nightshift.per * (p.nightshift ?? 0);
  fx.price = 1 - PERK.discount.per * (p.discount ?? 0);
  fx.upPrice = 1 - PERK.notes.per * (p.notes ?? 0);
  fx.share = shareBonus(s);
  if (p.holiday) fx.hours += PERK.holiday.values[p.holiday - 1];
  fx.outage = 1 - PERK.insurance.per * (p.insurance ?? 0);
  fx.compound = PERK.compound.per ** (p.compound ?? 0);
  fx.luck = 1 + (p.luck ?? 0);
  fx.autoclick = p.autoclick ? PERK.autoclick.values[p.autoclick - 1] : 0;
  fx.autoinfra = !!p.autoinfra;
  return fx;
}

/** What one stock option adds to the income. */
export const shareBonus = (s) => SHARE_BONUS + PERK.dividends.per * (s.perks.dividends ?? 0);

/** How much each machine of a kind earns more, by how many you own (×2 per milestone). */
export function milestoneMult(count) {
  let m = 1;
  for (const n of MILESTONES) if (count >= n) m *= 2;
  const last = MILESTONES[MILESTONES.length - 1];
  if (count >= last + MILESTONE_STEP) m *= 2 ** Math.floor((count - last) / MILESTONE_STEP);
  return m;
}
/** The next milestone for this count. There is always one more. */
export function nextMilestone(count) {
  const last = MILESTONES[MILESTONES.length - 1];
  return MILESTONES.find((n) => count < n) ?? last + (Math.floor((count - last) / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}

/** The biggest machine you own, as an index in TIERS. */
export function topTier(s) {
  for (let i = TIERS.length - 1; i > 0; i--) if (s.hw[TIERS[i].id] > 0) return i;
  return 0;
}

/** What customers pay for your uptime: a bonus for many nines, much less below 99%. */
export function slaMult(uptime) {
  if (uptime >= 0.99999) return 1.5;
  if (uptime >= 0.9999) return 1.3;
  if (uptime >= 0.999) return 1.15;
  if (uptime >= 0.99) return 1;
  return Math.max(0.5, 1 - ((0.99 - uptime) / 0.09) * 0.5);
}
/** 0 to 4: below 99%, 99%, 99.9%, 99.99%, 99.999%. */
export function slaTier(uptime) {
  return uptime >= 0.99999 ? 4 : uptime >= 0.9999 ? 3 : uptime >= 0.999 ? 2 : uptime >= 0.99 ? 1 : 0;
}

const thermal = (temp) => (temp <= TEMP_OK ? 1 : Math.max(0.2, 1 - ((temp - TEMP_OK) / (TEMP_HOT - TEMP_OK)) * 0.8));

/** Everything that follows from the state: loads, factors, income. Changes nothing. */
export function derive(s) {
  const fx = effects(s);
  const inc = s.incident ? INCIDENT[s.incident.id] : null;
  const pending = inc?.pending ?? {};

  let draw = 0;
  let baseRev = 0;
  for (const t of TIERS) {
    const n = s.hw[t.id];
    if (!n) continue;
    draw += n * t.power;
    baseRev += n * t.rev * milestoneMult(n) * (fx.tier[t.id] ?? 1);
  }
  draw *= fx.draw * (s.boost?.draw ?? 1);
  let powerCap = BASE_POWER;
  for (const p of POWER) powerCap += s.pw[p.id] * p.cap;
  let coolCap = BASE_COOLING;
  for (const c of COOLING) coolCap += s.cl[c.id] * c.cap;
  coolCap *= fx.cool * (s.debuff?.cool ?? 1) * (pending.cool ?? 1);

  const load = draw / powerCap;
  // More machines than power: the breaker trips again and again, and it gets worse fast.
  const powerFactor = load <= 1 ? 1 : 1 / (load * load);
  const coolLoad = Math.min(draw, powerCap) / coolCap;
  const targetTemp = Math.min(95, 20 + 15 * coolLoad);
  const thermalFactor = thermal(s.temp);

  let ops = 0;
  for (const p of STAFF) ops += s.st[p.id] * p.ops;
  const tier = topTier(s);
  const opsNeeded = 2 * 2.5 ** tier;
  const coverage = Math.min(1, ops / opsNeeded);

  let avail = 1;
  if (load > 1) avail = Math.min(avail, 1 / load);
  if (s.temp >= TEMP_HOT - 5) avail = Math.min(avail, 0.8);
  if (pending.avail != null) avail = Math.min(avail, pending.avail);
  if (s.outage > 0) avail = 0;

  const structural = baseRev * fx.rev * fx.compound * (1 + fx.share * s.shares) * powerFactor;
  const sla = slaMult(s.uptime);
  /** Income without the incident or spike of the moment */
  const nominal = structural * thermalFactor * sla;
  /** Income once the temperature has settled, for the time you are away */
  const steady = structural * thermal(targetTemp) * sla;
  const rate = s.outage > 0 ? 0 : nominal * (pending.rev ?? 1) * (s.boost?.rev ?? 1);
  const clickValue = fx.click * (1 + 0.004 * nominal);
  /** The share of the income the machines keep earning while the game is closed */
  const awayShare = Math.min(1, AWAY_BASE + AWAY_STAFF * coverage + fx.away);

  return {
    fx, draw, powerCap, coolCap, load, coolLoad, targetTemp, powerFactor, thermalFactor, ops, opsNeeded, coverage,
    avail, baseRev, nominal, steady, rate, sla, clickValue, awayShare, awayHours: fx.hours,
    tier, stage: TIERS[tier].stage, stageIndex: STAGES.indexOf(TIERS[tier].stage),
  };
}

/** The leaderboard score: 1000 points for every ten times more money earned in total. */
export const score = (s) => Math.min(MAX_SCORE, Math.floor(1000 * Math.log10(1 + s.totalEarned)));

function earn(s, amount) {
  if (!(amount > 0)) return;
  s.money += amount;
  s.runEarned += amount;
  s.totalEarned += amount;
}

// ----- Buying -----

/** What you pay of the list price: hardware gets cheaper with the discount perk, staff with the headhunter. */
export function priceMult(s, kind) {
  if (kind === "hw") return 1 - PERK.discount.per * (s.perks.discount ?? 0);
  if (kind === "st") return 1 - PERK.headhunter.per * (s.perks.headhunter ?? 0);
  return 1;
}

/** The price of the next n of something you own `owned` of. */
export function costFor(kind, id, owned, n = 1, mult = 1) {
  const item = KINDS[kind].find((x) => x.id === id);
  const g = GROWTH[kind];
  return item.cost * mult * g ** owned * ((g ** n - 1) / (g - 1));
}
/** How many you can pay for right now. */
export function maxAffordable(kind, id, owned, money, mult = 1) {
  const item = KINDS[kind].find((x) => x.id === id);
  const g = GROWTH[kind];
  const first = item.cost * mult * g ** owned;
  if (money < first) return 0;
  const n = Math.floor(Math.log(1 + (money * (g - 1)) / first) / Math.log(g));
  // Rounding can be off by one at the edge.
  return costFor(kind, id, owned, n, mult) <= money ? n : Math.max(0, n - 1);
}

/** Buys up to n (or as many as the money allows for "max"); returns how many it bought. */
export function buy(s, kind, id, n = 1, now = Date.now()) {
  if (!KINDS[kind]?.some((x) => x.id === id)) return 0;
  const owned = s[kind][id];
  const mult = priceMult(s, kind);
  const can = maxAffordable(kind, id, owned, s.money, mult);
  const want = n === "max" ? can : Math.min(n, can);
  if (want < 1 || (n !== "max" && want < n)) return 0;
  s.money -= costFor(kind, id, owned, want, mult);
  s[kind][id] += want;
  // The first hyperscale region of this run: the time since the run began, if it's a record.
  if (kind === "hw" && id === "region" && owned === 0) {
    const took = Math.max(1, now - s.stats.runStart);
    s.stats.speedrun = s.stats.speedrun ? Math.min(s.stats.speedrun, took) : took;
  }
  return want;
}

/** Whether an upgrade is on offer: a machine's upgrades once you own enough of it, the others once you could nearly pay for them. */
export function upgradeOffered(s, u) {
  if (s.up.includes(u.id)) return false;
  if (u.after && !s.up.includes(u.after)) return false;
  return u.tier ? s.hw[u.tier] >= u.need : s.runEarned >= u.cost * 0.2;
}

/** What an upgrade costs you (less with the old notes). */
export const upgradeCost = (s, u) => u.cost * (1 - PERK.notes.per * (s.perks.notes ?? 0));

export function buyUpgrade(s, id) {
  const u = UPGRADE[id];
  if (!u || s.up.includes(id) || s.money < upgradeCost(s, u)) return false;
  if (u.tier && s.hw[u.tier] < u.need) return false;
  if (u.after && !s.up.includes(u.after)) return false;
  s.money -= upgradeCost(s, u);
  s.up.push(id);
  return true;
}

/** Handling a request by hand. Returns what it earned. */
export function click(s) {
  const v = derive(s).clickValue;
  s.stats.clicks++;
  earn(s, v);
  return v;
}

// ----- Perks: lasting advantages for stock options -----

/** How many levels a perk has: an endless one never ends (a save keeps at most this many). */
const ENDLESS_LEVELS = 1000;
export const perkLevels = (p) => (p.endless ? Infinity : p.costs.length);
/** What level `level` + 1 of a perk costs, or null when there is none. */
export function levelCost(p, level) {
  if (p.endless) return level < ENDLESS_LEVELS ? p.endless.cost * p.endless.growth ** level : null;
  return p.costs[level] ?? null;
}
/** Stock options already spent on perks. */
export function spentShares(s) {
  let n = 0;
  for (const p of PERKS) for (let l = 0; l < (s.perks[p.id] ?? 0); l++) n += levelCost(p, l);
  return n;
}
export const freeShares = (s) => s.shares - spentShares(s);
/** The price of a perk's next level, or null when it has them all. */
export const perkCost = (s, id) => (PERK[id] ? levelCost(PERK[id], s.perks[id] ?? 0) : null);
/** Whether the upgrade it builds on is there. */
export function perkOpen(s, id) {
  const needs = PERK[id]?.needs;
  return !needs || (s.perks[needs.id] ?? 0) >= needs.level;
}

/** Only between two lives: right after selling the company, before the new life starts. */
export function buyPerk(s, id) {
  if (!s.reborn) return false;
  const cost = perkCost(s, id);
  if (cost == null || freeShares(s) < cost || !perkOpen(s, id)) return false;
  s.perks[id] = (s.perks[id] ?? 0) + 1;
  return true;
}

/** With the procurement bot: buys power and cooling before they run out. */
function autoInfra(s, d) {
  const best = (kind, list) => {
    let pick = null;
    let value = Infinity;
    for (const item of list) {
      const cost = costFor(kind, item.id, s[kind][item.id]);
      if (cost <= s.money && cost / item.cap < value) {
        value = cost / item.cap;
        pick = item;
      }
    }
    if (pick) buy(s, kind, pick.id, 1);
  };
  if (d.load > 0.9) best("pw", POWER);
  if (d.coolLoad > 0.9) best("cl", COOLING);
}

// ----- Incidents -----

function schedule(s, rng, fx, short = false) {
  const base = short ? 25 + rng() * 25 : 45 + rng() * 55;
  s.nextIncident = base / fx.rate;
}

function spawn(s, rng, ev) {
  const d = derive(s);
  const fit = INCIDENTS.filter((i) => d.tier >= i.min && d.tier <= (i.max ?? 99) && i.id !== s.lastIncident);
  if (!fit.length) return schedule(s, rng, d.fx);
  // Good news comes more often with friends in the right places.
  const weight = (i) => (i.weight ?? 1) * (i.good ? d.fx.luck : 1);
  let roll = rng() * fit.reduce((n, i) => n + weight(i), 0);
  let def = fit[fit.length - 1];
  for (const i of fit) {
    roll -= weight(i);
    if (roll < 0) {
      def = i;
      break;
    }
  }
  const total = def.time * d.fx.time;
  let need = def.kind === "mash" ? Math.max(1, Math.round(def.clicks * (d.fx.mash[def.id] ?? 1))) : 1;
  // With tested backups, restoring is three clicks.
  if (def.id === "intern" && d.fx.backups) need = 3;
  s.incident = { id: def.id, left: total, total, clicks: 0, need };
  s.lastIncident = def.id;
  ev.push({ type: "incident", id: def.id, good: !!def.good });
}

function resolve(s, def, rng, ev, how = "ok", mult = 1) {
  s.incident = null;
  const d = derive(s);
  let reward = 0;
  if (def.good) {
    if (def.boost) s.boost = { rev: def.boost.rev, draw: def.boost.draw, left: def.boost.time };
    if (def.cash) reward = Math.max(50, def.cash * d.nominal);
  } else if (how !== "auto") {
    reward = Math.max(10, def.reward * d.nominal) * mult * d.fx.reward;
    s.stats.resolved++;
  } else {
    s.stats.auto++;
  }
  earn(s, reward);
  schedule(s, rng, d.fx, !!def.good);
  ev.push({ type: "resolved", id: def.id, how, reward, good: !!def.good });
  if (how === "ok" || how === "lucky") {
    if (def.id === "dns") unlock(s, "it-was-dns", ev);
    if (def.id === "ddos") unlock(s, "ddos", ev);
    if (how === "lucky") unlock(s, "yolo", ev);
  }
}

function fail(s, def, rng, ev) {
  s.incident = null;
  const d = derive(s);
  const f = def.fail ?? {};
  let lost = 0;
  if (f.lose) {
    lost = s.money * f.lose * (d.fx.backups ? 0.5 : 1);
    s.money -= lost;
  }
  if (f.outage) {
    s.outage = f.outage * d.fx.outage;
    s.stats.streak = 0;
  }
  if (f.cool) s.debuff = { cool: f.cool, left: f.coolTime };
  s.stats.failed++;
  schedule(s, rng, d.fx);
  ev.push({ type: "failed", id: def.id, lost, outage: f.outage ?? 0 });
}

/** The player presses a button of the incident (option: which one, for a choice). */
export function incidentAction(s, option = 0, rng = Math.random, ev = []) {
  const inc = s.incident;
  if (!inc) return ev;
  const def = INCIDENT[inc.id];
  if (def.kind === "mash") {
    inc.clicks++;
    if (inc.clicks >= inc.need) resolve(s, def, rng, ev);
  } else if (def.kind === "single") {
    resolve(s, def, rng, ev);
  } else {
    const o = def.options[option];
    if (!o) return ev;
    if (o.ok) resolve(s, def, rng, ev);
    else if (o.chance && rng() < o.chance) resolve(s, def, rng, ev, "lucky", o.bonus ?? 1);
    else fail(s, def, rng, ev);
  }
  return ev;
}

// ----- Achievements -----

function unlock(s, id, ev) {
  if (s.ach.includes(id) || !ACHIEVEMENTS.includes(id)) return;
  s.ach.push(id);
  ev.push({ type: "achievement", id });
}

function checkAchievements(s, d, ev) {
  const has = (id) => s.hw[id] > 0;
  if (s.hw.pi >= 2 || d.tier > 0) unlock(s, "hello-world", ev);
  if (has("cage")) unlock(s, "colo", ev);
  if (has("hall")) unlock(s, "datacenter", ev);
  if (has("region")) unlock(s, "hyperscaler", ev);
  if (has("orbit")) unlock(s, "into-orbit", ev);
  if (has("moon")) unlock(s, "moon", ev);
  if (has("dyson")) unlock(s, "dyson", ev);
  if (has("simulation")) unlock(s, "simulation", ev);
  if (has("fork")) unlock(s, "fork", ev);
  if (has("heatdeath")) unlock(s, "last-light", ev);
  if (has("home")) unlock(s, "home", ev);
  if (s.up.includes("release-10")) unlock(s, "ten-oh", ev);
  if (s.uptime >= 0.999) unlock(s, "three-nines", ev);
  if (s.uptime >= 0.99999) unlock(s, "five-nines", ev);
  if (s.temp >= TEMP_HOT) unlock(s, "space-heater", ev);
  if (d.load > 1) unlock(s, "breaker", ev);
  if (s.stats.resolved >= 50) unlock(s, "firefighter", ev);
  if (s.stats.resolved >= 250) unlock(s, "on-call-hero", ev);
  if (s.stats.clicks >= 10_000) unlock(s, "carpal", ev);
  if (s.up.includes("ipv6")) unlock(s, "ipv6", ev);
  if (s.up.length >= 40) unlock(s, "patched", ev);
  if (d.coverage >= 1 && d.tier >= 3) unlock(s, "sleep", ev);
  if (s.stats.exits > 0) unlock(s, "exit", ev);
  if (s.stats.exits >= 5) unlock(s, "serial", ev);
  if (PERKS.some((p) => s.perks[p.id] > 0)) unlock(s, "perk", ev);
  if (TIERS.some((t) => s.hw[t.id] >= 100)) unlock(s, "fleet", ev);
}

// ----- Time -----

/** Moves the game on by dt seconds. Events (incidents, achievements) are added to ev. */
export function tick(s, dt, rng = Math.random, ev = []) {
  if (s.outage > 0) {
    s.outage = Math.max(0, s.outage - dt);
    if (s.outage === 0) ev.push({ type: "recovered" });
  }
  if (s.boost && (s.boost.left -= dt) <= 0) s.boost = null;
  if (s.debuff && (s.debuff.left -= dt) <= 0) s.debuff = null;

  if (s.incident) {
    s.incident.left -= dt;
    if (s.incident.left <= 0) {
      const def = INCIDENT[s.incident.id];
      if (def.good) {
        s.incident = null;
        schedule(s, rng, effects(s));
        ev.push({ type: "missed", id: def.id });
      } else if (rng() < 0.9 * derive(s).coverage) resolve(s, def, rng, ev, "auto");
      else fail(s, def, rng, ev);
    }
  } else if (s.outage <= 0 && (s.nextIncident -= dt) <= 0) {
    spawn(s, rng, ev);
  }

  let d = derive(s);
  if (d.fx.autoinfra && (d.load > 0.9 || d.coolLoad > 0.9)) {
    autoInfra(s, d);
    d = derive(s);
  }
  s.temp += (d.targetTemp - s.temp) * (1 - Math.exp(-dt / TEMP_TAU));
  const tau = d.avail >= s.uptime ? UPTIME_TAU / d.fx.recover : UPTIME_TAU;
  s.uptime = Math.min(1, Math.max(0, s.uptime + (d.avail - s.uptime) * (1 - Math.exp(-dt / tau))));
  earn(s, d.rate * dt);
  // The macro keyboard handles requests by itself (not while everything is down).
  if (d.fx.autoclick && s.outage <= 0) earn(s, d.clickValue * d.fx.autoclick * dt);
  s.stats.played += dt;
  if (s.outage <= 0) {
    s.stats.streak += dt;
    if (s.stats.streak > s.stats.bestStreak) s.stats.bestStreak = s.stats.streak;
  }
  checkAchievements(s, d, ev);
  return d;
}

/**
 * The time the game was closed or hidden: the machines kept earning, but nobody clicked
 * incidents away. How well that went depends on your staff and upgrades. Returns a summary.
 */
export function applyOffline(s, now = Date.now(), ev = []) {
  const away = Math.max(0, (now - s.lastSeen) / 1000);
  s.lastSeen = now;
  // Whatever was on fire when you left is over by now.
  s.incident = null;
  if (away < 1) return { seconds: 0, earned: 0, efficiency: 1, long: false };
  const d = derive(s);
  const long = away >= OFFLINE_MIN;
  const max = d.awayHours * 3600;
  const seconds = Math.min(away, max);
  const efficiency = long ? d.awayShare : 1;
  if (long) {
    s.outage = 0;
    s.boost = null;
    s.debuff = null;
    s.temp = d.targetTemp;
  }
  const earned = (long ? derive(s).steady : d.nominal) * seconds * efficiency;
  earn(s, earned);
  s.stats.played += seconds;
  if (away >= 8 * 3600) unlock(s, "away", ev);
  return { seconds, earned, efficiency, long, capped: away > max, hours: d.awayHours, staffed: d.coverage > 0 };
}

// ----- Exit (starting over with a bonus) -----

/** Stock options you would get for selling the company now. */
export const exitShares = (s) => Math.floor(Math.cbrt(s.runEarned / 1e6));
/** How much more this run must earn before anyone buys the company. */
export const exitNeeds = (s) => Math.max(0, MIN_EXIT_SHARES ** 3 * 1e6 - s.runEarned);
export const canExit = (s) => exitShares(s) >= MIN_EXIT_SHARES;

/**
 * Starts the new life after the reincarnation screen: what the upgrades give you to begin with.
 */
export function beginRun(s, now = Date.now()) {
  if (!s.reborn) return;
  s.reborn = false;
  const seed = s.perks.seed ?? 0;
  if (seed) s.money = PERK.seed.values[seed - 1];
  if (s.perks.reputation) s.uptime = Math.max(s.uptime, 0.999);
  const kit = s.perks.starter ? PERK.starter.values[s.perks.starter - 1] : {};
  for (const kind in kit) for (const id in kit[kind]) s[kind][id] = Math.max(s[kind][id], kit[kind][id]);
  s.stats.runStart = now;
  s.lastSeen = now;
}

/**
 * Sells the company: everything is gone except stock options, reincarnation upgrades,
 * achievements and records. The new life starts with beginRun.
 */
export function exit(s, now = Date.now()) {
  if (!canExit(s)) return null;
  const fresh = newState(now);
  fresh.shares = s.shares + exitShares(s);
  fresh.perks = { ...s.perks };
  fresh.totalEarned = s.totalEarned;
  fresh.ach = [...s.ach];
  fresh.stats = { ...fresh.stats, clicks: s.stats.clicks, resolved: s.stats.resolved, failed: s.stats.failed, auto: s.stats.auto, bestStreak: s.stats.bestStreak, exits: s.stats.exits + 1, played: s.stats.played, speedrun: s.stats.speedrun };
  for (const k of ["lang", "buyMode", "muted"]) if (s[k] != null) fresh[k] = s[k];
  fresh.reborn = true;
  return fresh;
}

// ----- Saving -----

export function serialize(s, now = Date.now()) {
  const { incident, ...rest } = s;
  return JSON.stringify({ ...rest, lastSeen: now });
}

const num = (v, fallback, min = 0, max = Infinity) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);

/** A save put back into a full state; anything missing or broken falls back to a new game's value. */
export function deserialize(text, now = Date.now()) {
  const fresh = newState(now);
  let o;
  try {
    o = typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return fresh;
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return fresh;
  const s = fresh;
  s.money = num(o.money, 0);
  s.runEarned = num(o.runEarned, 0);
  s.totalEarned = Math.max(num(o.totalEarned, 0), s.runEarned);
  for (const kind of ["hw", "pw", "cl", "st"]) {
    for (const item of KINDS[kind]) s[kind][item.id] = Math.floor(num(o[kind]?.[item.id], s[kind][item.id], 0, 100_000));
  }
  if (Array.isArray(o.up)) s.up = [...new Set(o.up.filter((id) => UPGRADE[id]))];
  s.temp = num(o.temp, 22, 0, 95);
  s.uptime = num(o.uptime, START_UPTIME, 0, 1);
  s.shares = Math.floor(num(o.shares, 0));
  for (const p of PERKS) {
    const level = Math.floor(num(o.perks?.[p.id], 0, 0, Math.min(perkLevels(p), ENDLESS_LEVELS)));
    if (level) s.perks[p.id] = level;
  }
  // A save can't have spent more stock options than it has: drop perks until it fits.
  for (const p of [...PERKS].reverse()) while (s.perks[p.id] && spentShares(s) > s.shares) s.perks[p.id]--;
  s.outage = num(o.outage, 0, 0, 120);
  s.nextIncident = num(o.nextIncident, 60, 0, 600);
  if (typeof o.lastIncident === "string" && INCIDENT[o.lastIncident]) s.lastIncident = o.lastIncident;
  if (o.boost && typeof o.boost === "object") s.boost = { rev: num(o.boost.rev, 1, 1, 10), draw: num(o.boost.draw, 1, 1, 3), left: num(o.boost.left, 0, 0, 120) };
  if (o.debuff && typeof o.debuff === "object") s.debuff = { cool: num(o.debuff.cool, 1, 0.1, 1), left: num(o.debuff.left, 0, 0, 120) };
  if (Array.isArray(o.ach)) s.ach = ACHIEVEMENTS.filter((id) => o.ach.includes(id));
  const st = o.stats && typeof o.stats === "object" ? o.stats : {};
  for (const k of ["clicks", "resolved", "failed", "auto", "streak", "bestStreak", "exits", "played", "speedrun"]) s.stats[k] = num(st[k], 0);
  s.stats.runStart = num(st.runStart, now, 0, now);
  s.lastSeen = num(o.lastSeen, now, 0, now);
  if (o.lang === "en" || o.lang === "de") s.lang = o.lang;
  if (o.buyMode === 1 || o.buyMode === 10 || o.buyMode === "max") s.buyMode = o.buyMode;
  if (o.muted === true) s.muted = true;
  if (o.reborn === true) s.reborn = true;
  return s;
}
