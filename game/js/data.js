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
  { id: "subsea", cost: 9e12, rev: 4.2e8, power: 4.5e9, stage: "ocean" },
  { id: "orbit", cost: 3e14, rev: 5.5e9, power: 5e10, stage: "orbit" },
  { id: "moon", cost: 1.2e16, rev: 7.5e10, power: 6e11, stage: "moon" },
  { id: "dyson", cost: 6e17, rev: 1.1e12, power: 8e12, stage: "star" },
  { id: "brain", cost: 4e19, rev: 1.8e13, power: 1.2e14, stage: "star" },
  { id: "simulation", cost: 3e21, rev: 3.2e14, power: 2e15, stage: "universe" },
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
  { id: "fusion", cost: 8e12, cap: 1.5e10 },
  { id: "sunpower", cost: 4e14, cap: 2e11 },
  { id: "helium", cost: 2e16, cap: 2.5e12 },
  { id: "collectors", cost: 1e18, cap: 4e13 },
  { id: "blackhole", cost: 8e19, cap: 6e14 },
  { id: "vacuum", cost: 6e21, cap: 1e16 },
];

export const COOLING = [
  { id: "fan", cost: 20, cap: 80 },
  { id: "ac", cost: 700, cap: 1_200 },
  { id: "crac", cost: 25_000, cap: 18_000 },
  { id: "chiller", cost: 1_000_000, cap: 280_000 },
  { id: "immersion", cost: 50_000_000, cap: 4_500_000 },
  { id: "fjord", cost: 2_500_000_000, cap: 75_000_000 },
  { id: "arctic", cost: 120_000_000_000, cap: 1_100_000_000 },
  { id: "deepsea", cost: 6e12, cap: 1.3e10 },
  { id: "radiators", cost: 3e14, cap: 1.8e11 },
  { id: "nightside", cost: 1.5e16, cap: 2.2e12 },
  { id: "sunshade", cost: 8e17, cap: 3.5e13 },
  { id: "gasgiant", cost: 6e19, cap: 5e14 },
  { id: "entropy", cost: 5e21, cap: 9e15 },
];

/** People who fix incidents you miss, and keep things running while you are away. */
export const STAFF = [
  { id: "intern", cost: 2_000, ops: 1 },
  { id: "admin", cost: 60_000, ops: 5 },
  { id: "sre", cost: 4_000_000, ops: 30 },
  { id: "noc", cost: 400_000_000, ops: 200 },
  { id: "aiops", cost: 50_000_000_000, ops: 1_500 },
  { id: "agi", cost: 5e14, ops: 20_000 },
  { id: "probes", cost: 2e19, ops: 400_000 },
];

/** How fast prices rise with each one you own. */
export const GROWTH = { hw: 1.15, pw: 1.12, cl: 1.12, st: 1.15 };

/**
 * One-time upgrades. fx multiplies: rev (income), click, draw (power use), cool (cooling),
 * rate (how often incidents come), time (how long you have to react), recover (uptime recovery
 * speed). backups: restoring is quick and failures cost half the money. mash: fewer clicks for
 * the named incident. away: added to what the machines earn while the game is closed (0.15 =
 * 15 points more). hours: how many hours away count.
 */
const GLOBAL_UPGRADES = [
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

  { id: "logrotate", cost: 250_000, fx: { hours: 24 } },
  { id: "phone", cost: 5_000_000, fx: { away: 0.15 } },
  { id: "selfheal", cost: 5e9, fx: { away: 0.2 } },
  { id: "lightsoff", cost: 5e12, fx: { away: 0.1, hours: 72 } },

  { id: "blockchain", cost: 5e9, fx: { rev: 1.01, draw: 1.1 } },
  { id: "serverless", cost: 5e11, fx: { rev: 1.5 } },
  { id: "quantum", cost: 5e13, fx: { rev: 2 } },
  { id: "superconductor", cost: 5e15, fx: { draw: 0.8 } },
  { id: "tachyon", cost: 5e16, fx: { rev: 2 } },
  { id: "lasercooling", cost: 5e17, fx: { cool: 1.5 } },
  { id: "uploads", cost: 5e19, fx: { rev: 3, rate: 0.8 } },
  { id: "answer", cost: 4.2e21, fx: { rev: 4.2 } },
];

/**
 * Two upgrades for every machine: "tune" doubles what it earns once you own 15, "gen2" triples
 * it once you own 75. Their texts come from a template with the machine's name.
 */
const TIER_UPGRADES = TIERS.flatMap((t, i) => [
  { id: `tune-${t.id}`, kind: "tune", tier: t.id, index: i, need: 15, cost: t.cost * 40, fx: { tier: 2 } },
  { id: `gen2-${t.id}`, kind: "gen2", tier: t.id, index: i, need: 75, cost: t.cost * 5000, fx: { tier: 3 } },
]);

export const UPGRADES = [...GLOBAL_UPGRADES, ...TIER_UPGRADES].sort((a, b) => a.cost - b.cost);
/** How many different jokes the template upgrades have. */
export const TEMPLATE_TEXTS = 4;

/**
 * Reincarnation upgrades: lasting advantages, bought with stock options when you sell the
 * company, and kept through every new life. costs: one per level. values: what each level
 * gives (seed: money to start with; autoclick: requests per second; starter: machines and
 * what they need). per: what each level adds (discount on hardware or upgrades, time for
 * alerts, alert rewards, income while away, income per stock option). needs: another upgrade
 * that must have that level first.
 */
export const PERKS = [
  { id: "seed", costs: [5, 50, 500, 5000], values: [1e3, 1e6, 1e9, 1e12] },
  { id: "starter", costs: [3, 30, 300], values: [
    { hw: { pi: 10 }, pw: { strip: 1 }, cl: { fan: 1 } },
    { hw: { pi: 10, laptop: 10 }, pw: { strip: 1, ups: 1 }, cl: { fan: 1, ac: 1 } },
    { hw: { pi: 10, laptop: 10, tower: 10 }, pw: { strip: 1, ups: 4 }, cl: { fan: 1, ac: 5 } },
  ] },
  { id: "autoclick", costs: [5, 25, 125], values: [1, 3, 10] },
  { id: "runbooks", costs: [8, 40, 200], per: 0.2 },
  { id: "nightshift", costs: [10, 60, 300], per: 0.1 },
  { id: "discount", costs: [10, 30, 90, 270, 810], per: 0.05, needs: { id: "seed", level: 1 } },
  { id: "autoinfra", costs: [25], needs: { id: "starter", level: 1 } },
  { id: "bonus", costs: [8, 40, 200], per: 0.5, needs: { id: "runbooks", level: 1 } },
  { id: "reputation", costs: [15], needs: { id: "runbooks", level: 1 } },
  { id: "notes", costs: [15, 75, 375], per: 0.1, needs: { id: "discount", level: 1 } },
  { id: "luck", costs: [20, 200], needs: { id: "bonus", level: 1 } },
  { id: "dividends", costs: [100, 1000], per: 0.01, needs: { id: "discount", level: 2 } },
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
  { id: "update", min: 2, kind: "choice", options: [{ ok: true }, { ok: false }], time: 14, pending: {}, fail: { outage: 25 }, reward: 30 },
  { id: "coffee", min: 3, kind: "single", time: 16, pending: { rev: 0.7 }, fail: { outage: 15 }, reward: 30 },
  { id: "shark", min: 10, kind: "mash", clicks: 10, time: 15, pending: { rev: 0.5, avail: 0.8 }, fail: { outage: 30 }, reward: 60 },
  { id: "debris", min: 11, kind: "choice", options: [{ ok: true }, { ok: false }], time: 14, pending: {}, fail: { outage: 35, lose: 0.05 }, reward: 60 },
  { id: "flare", min: 11, kind: "single", time: 10, pending: { rev: 0.6 }, fail: { outage: 30 }, reward: 50 },
  { id: "dust", min: 12, kind: "mash", clicks: 9, time: 16, pending: { cool: 0.6 }, fail: { cool: 0.5, coolTime: 60 }, reward: 50 },
  { id: "strike", min: 13, kind: "choice", options: [{ ok: true }, { ok: false }], time: 15, pending: { rev: 0.6 }, fail: { outage: 40 }, reward: 70 },

  { id: "hn", min: 2, kind: "single", good: true, time: 15, boost: { rev: 3, draw: 1.4, time: 40 }, weight: 0.5 },
  { id: "vc", min: 3, kind: "single", good: true, time: 15, cash: 90, weight: 0.4 },
  { id: "enterprise", min: 5, kind: "mash", clicks: 10, good: true, time: 15, cash: 200, weight: 0.4 },
];

/** Where you are, by the biggest machine you own. */
export const STAGES = ["bedroom", "basement", "closet", "colo", "datacenter", "campus", "hyperscale", "ocean", "orbit", "moon", "star", "universe"];

/** One emoji per achievement. */
export const ACHIEVEMENT_ICONS = {
  "hello-world": "👋", "moved-out": "✈️", "rack-em-up": "🗄️", colo: "🔒", datacenter: "🏢", hyperscaler: "☁️",
  "three-nines": "📈", "five-nines": "🏆", "space-heater": "🔥", breaker: "⚡", "it-was-dns": "🔍", ddos: "🛡️",
  yolo: "🎲", firefighter: "🧯", "on-call-hero": "📟", ipv6: "🐢", sleep: "😴", millionaire: "💰", unicorn: "🦄", exit: "🤝",
  "into-orbit": "🛰️", moon: "🌙", dyson: "☀️", simulation: "🌌", perk: "🪂", serial: "🔁", away: "🏖️", carpal: "🖱️", patched: "🩹", fleet: "🚢",
};

/** Achievement ids. Their names and descriptions are in i18n.js. */
export const ACHIEVEMENTS = [
  "hello-world", "moved-out", "rack-em-up", "colo", "datacenter", "hyperscaler",
  "three-nines", "five-nines", "space-heater", "breaker", "it-was-dns", "ddos",
  "yolo", "firefighter", "on-call-hero", "ipv6", "sleep", "millionaire", "unicorn", "exit",
  "into-orbit", "moon", "dyson", "simulation", "perk", "serial", "away", "carpal", "patched", "fleet",
];
