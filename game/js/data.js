// All the numbers of the game. Names and jokes live in i18n.js under the same ids.

/** What you start with in the bedroom: one wall socket and an open window (watts). */
export const BASE_POWER = 60;
export const BASE_COOLING = 60;

/** Machines that earn money. power = watts drawn, which all turn into heat. */
export const TIERS = [
  { id: "pi", cost: 15, rev: 0.25, power: 5, stage: "bedroom" },
  { id: "laptop", cost: 150, rev: 2, power: 45, stage: "bedroom" },
  { id: "tower", cost: 1_400, rev: 12, power: 350, stage: "basement" },
  { id: "server", cost: 14_000, rev: 70, power: 800, stage: "basement" },
  { id: "rack", cost: 180_000, rev: 520, power: 8_000, stage: "closet" },
  { id: "cage", cost: 2_400_000, rev: 4_200, power: 60_000, stage: "colo" },
  { id: "room", cost: 35_000_000, rev: 36_000, power: 450_000, stage: "datacenter" },
  { id: "hall", cost: 600_000_000, rev: 330_000, power: 4_000_000, stage: "datacenter" },
  { id: "campus", cost: 12_000_000_000, rev: 3_200_000, power: 40_000_000, stage: "campus" },
  { id: "region", cost: 300_000_000_000, rev: 35_000_000, power: 400_000_000, stage: "hyperscale" },
];

/** Owning this many of one machine doubles what each of them earns. */
export const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400];

export const POWER = [
  { id: "strip", cost: 25, cap: 100 },
  { id: "ups", cost: 900, cap: 1_500 },
  { id: "circuit", cost: 30_000, cap: 20_000 },
  { id: "generator", cost: 1_200_000, cap: 300_000 },
  { id: "substation", cost: 60_000_000, cap: 5_000_000 },
  { id: "solar", cost: 3_000_000_000, cap: 80_000_000 },
  { id: "reactor", cost: 150_000_000_000, cap: 1_200_000_000 },
];

export const COOLING = [
  { id: "fan", cost: 20, cap: 80 },
  { id: "ac", cost: 700, cap: 1_200 },
  { id: "crac", cost: 25_000, cap: 18_000 },
  { id: "chiller", cost: 1_000_000, cap: 280_000 },
  { id: "immersion", cost: 50_000_000, cap: 4_500_000 },
  { id: "fjord", cost: 2_500_000_000, cap: 75_000_000 },
  { id: "arctic", cost: 120_000_000_000, cap: 1_100_000_000 },
];

/** People who fix incidents you miss, and keep things running while you are away. */
export const STAFF = [
  { id: "intern", cost: 2_000, ops: 1 },
  { id: "admin", cost: 60_000, ops: 5 },
  { id: "sre", cost: 4_000_000, ops: 30 },
  { id: "noc", cost: 400_000_000, ops: 200 },
  { id: "aiops", cost: 50_000_000_000, ops: 1_500 },
];

/** How fast prices rise with each one you own. */
export const GROWTH = { hw: 1.15, pw: 1.12, cl: 1.12, st: 1.15 };

/**
 * One-time upgrades. fx multiplies: rev (income), click, draw (power use), cool (cooling),
 * rate (how often incidents come), time (how long you have to react), recover (uptime recovery
 * speed). backups: restoring is quick and failures cost half the money. mash: fewer clicks for
 * the named incident.
 */
export const UPGRADES = [
  { id: "reboot", cost: 60, fx: { click: 3 } },
  { id: "rgb", cost: 400, fx: { rev: 1.15 } },
  { id: "stackoverflow", cost: 3_000, fx: { click: 2 } },
  { id: "monitoring", cost: 8_000, fx: { time: 1.5 } },
  { id: "ipv6", cost: 10_000, fx: {} },
  { id: "hotcold", cost: 40_000, fx: { cool: 1.25 } },
  { id: "backups", cost: 150_000, fx: { backups: true } },
  { id: "docker", cost: 600_000, fx: { rev: 1.5 } },
  { id: "statuspage", cost: 1_000_000, fx: { recover: 2 } },
  { id: "psu", cost: 2_500_000, fx: { draw: 0.85 } },
  { id: "k8s", cost: 20_000_000, fx: { rev: 2, rate: 1.25 } },
  { id: "cdn", cost: 150_000_000, fx: { rev: 1.5, mash: { ddos: 0.5 } } },
  { id: "iac", cost: 1_500_000_000, fx: { rate: 0.7 } },
  { id: "rust", cost: 20_000_000_000, fx: { rev: 2, draw: 0.9 } },
  { id: "freecooling", cost: 100_000_000_000, fx: { cool: 1.5 } },
  { id: "ai", cost: 2_000_000_000_000, fx: { rev: 3, draw: 1.3 } },
];

/**
 * Incidents. min/max: the highest machine (index in TIERS) you must own for it to happen.
 * kind: "mash" (click `clicks` times), "single" (one click), "choice" (pick an option).
 * time: seconds to react. pending: what it does while you haven't reacted (rev and avail are
 * multipliers, cool cuts the cooling). fail: outage in seconds, lose = share of your money,
 * cool/coolTime = cooling stays cut. reward: seconds of income as a thank-you.
 * good: an opportunity, not a problem; missing it costs nothing.
 */
export const INCIDENTS = [
  { id: "vacuum", min: 0, max: 2, kind: "single", time: 14, pending: { rev: 0.2, avail: 0.5 }, fail: { outage: 15 }, reward: 20 },
  { id: "cat", min: 0, max: 3, kind: "mash", clicks: 5, time: 13, pending: { rev: 0.5 }, fail: { outage: 15 }, reward: 20 },
  { id: "ddos", min: 1, kind: "mash", clicks: 12, time: 14, pending: { rev: 0.7 }, fail: { outage: 25 }, reward: 40, weight: 1.5 },
  { id: "cert", min: 1, kind: "single", time: 20, pending: { rev: 0.4, avail: 0.8 }, fail: { outage: 20 }, reward: 25 },
  { id: "disk", min: 1, kind: "mash", clicks: 6, time: 15, pending: { rev: 0.6 }, fail: { outage: 20 }, reward: 25 },
  { id: "dns", min: 2, kind: "choice", options: [{ ok: true }, { ok: false }], time: 15, pending: { rev: 0.3, avail: 0.7 }, fail: { outage: 25 }, reward: 40 },
  { id: "memleak", min: 2, kind: "mash", clicks: 5, time: 15, pending: { rev: 0.6 }, fail: { outage: 20 }, reward: 25 },
  { id: "miner", min: 2, kind: "single", time: 15, pending: { rev: 0.5 }, fail: { outage: 15, lose: 0.03 }, reward: 30 },
  { id: "friday", min: 3, kind: "choice", options: [{ ok: true }, { chance: 0.35, bonus: 6 }], time: 16, pending: { rev: 0.5 }, fail: { outage: 30 }, reward: 40 },
  { id: "intern", min: 3, kind: "mash", clicks: 18, time: 18, pending: { rev: 0.1, avail: 0.4 }, fail: { outage: 30, lose: 0.05 }, reward: 60 },
  { id: "breaker", min: 3, kind: "single", time: 12, pending: { rev: 0.3, avail: 0.5 }, fail: { outage: 20 }, reward: 25 },
  { id: "ac", min: 4, kind: "mash", clicks: 8, time: 20, pending: { cool: 0.5 }, fail: { cool: 0.5, coolTime: 60 }, reward: 40 },
  { id: "phish", min: 4, kind: "choice", options: [{ ok: true }, { ok: false }], time: 15, pending: {}, fail: { outage: 30, lose: 0.1 }, reward: 40 },
  { id: "leftpad", min: 4, kind: "mash", clicks: 7, time: 15, pending: { rev: 0.5 }, fail: { outage: 20 }, reward: 30 },
  { id: "backhoe", min: 5, kind: "choice", options: [{ ok: true }, { ok: false }], time: 14, pending: { rev: 0.2, avail: 0.5 }, fail: { outage: 35 }, reward: 50 },
  { id: "bgp", min: 6, kind: "mash", clicks: 15, time: 16, pending: { rev: 0.5, avail: 0.7 }, fail: { outage: 30 }, reward: 60 },

  { id: "hn", min: 2, kind: "single", good: true, time: 15, boost: { rev: 3, draw: 1.4, time: 40 }, weight: 0.5 },
  { id: "vc", min: 3, kind: "single", good: true, time: 15, cash: 90, weight: 0.4 },
  { id: "enterprise", min: 5, kind: "mash", clicks: 10, good: true, time: 15, cash: 200, weight: 0.4 },
];

/** Where you are, by the biggest machine you own. */
export const STAGES = ["bedroom", "basement", "closet", "colo", "datacenter", "campus", "hyperscale"];

/** One emoji per achievement, as in toki.json. */
export const ACHIEVEMENT_ICONS = {
  "hello-world": "👋", "moved-out": "✈️", "rack-em-up": "🗄️", colo: "🔒", datacenter: "🏢", hyperscaler: "☁️",
  "three-nines": "📈", "five-nines": "🏆", "space-heater": "🔥", breaker: "⚡", "it-was-dns": "🔍", ddos: "🛡️",
  yolo: "🎲", firefighter: "🧯", "on-call-hero": "📟", ipv6: "🐢", sleep: "😴", millionaire: "💰", unicorn: "🦄", exit: "🤝",
};

/** Achievement ids, as in toki.json. */
export const ACHIEVEMENTS = [
  "hello-world", "moved-out", "rack-em-up", "colo", "datacenter", "hyperscaler",
  "three-nines", "five-nines", "space-heater", "breaker", "it-was-dns", "ddos",
  "yolo", "firefighter", "on-call-hero", "ipv6", "sleep", "millionaire", "unicorn", "exit",
];
