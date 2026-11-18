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
  { id: "subsea", cost: 6.1e13, rev: 2.1e8, power: 4.5e9, stage: "ocean" },
  { id: "orbit", cost: 1.4e16, rev: 1.3e9, power: 5e10, stage: "orbit" },
  { id: "moon", cost: 4.6e18, rev: 7.6e9, power: 6e11, stage: "moon" },
  { id: "dyson", cost: 2.1e21, rev: 4.5e10, power: 8e12, stage: "star" },
  { id: "brain", cost: 1.5e24, rev: 2.7e11, power: 1.2e14, stage: "star" },
  { id: "simulation", cost: 1.2e27, rev: 1.6e12, power: 2e15, stage: "universe" },
  { id: "fork", cost: 6.2e28, rev: 9.8e12, power: 1.2e16, stage: "multiverse" },
  { id: "mesh", cost: 3.1e30, rev: 5.9e13, power: 7.2e16, stage: "multiverse" },
  { id: "loop", cost: 1.5e32, rev: 3.5e14, power: 4.3e17, stage: "time" },
  { id: "heatdeath", cost: 7.7e33, rev: 2.1e15, power: 2.6e18, stage: "time" },
  { id: "kernel", cost: 3.9e35, rev: 1.3e16, power: 1.6e19, stage: "source" },
  { id: "dreamer", cost: 1.9e37, rev: 7.6e16, power: 9.3e19, stage: "source" },
  // The last machine is a Raspberry Pi again. It draws 5 watts. It always did.
  { id: "home", cost: 9.6e38, rev: 4.6e17, power: 5, stage: "home" },
];

/** Owning this many of one machine doubles what each of them earns. After the last, every MILESTONE_STEP more. */
export const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400];
export const MILESTONE_STEP = 100;

export const POWER = [
  { id: "strip", cost: 25, cap: 100 },
  { id: "ups", cost: 900, cap: 1_500 },
  { id: "circuit", cost: 30_000, cap: 20_000 },
  { id: "generator", cost: 1_200_000, cap: 300_000 },
  { id: "substation", cost: 60_000_000, cap: 5_000_000 },
  { id: "solar", cost: 3_000_000_000, cap: 80_000_000 },
  { id: "reactor", cost: 150_000_000_000, cap: 1_200_000_000 },
  { id: "fusion", cost: 5.1e13, cap: 1.5e10 },
  { id: "sunpower", cost: 2.3e16, cap: 2e11 },
  { id: "helium", cost: 1e19, cap: 2.5e12 },
  { id: "collectors", cost: 4.6e21, cap: 4e13 },
  { id: "blackhole", cost: 4.3e24, cap: 6e14 },
  { id: "vacuum", cost: 2.5e27, cap: 1e16 },
  { id: "neighbour", cost: 1.2e29, cap: 6e16 },
  { id: "bigbang", cost: 6.2e30, cap: 3.6e17 },
  { id: "future", cost: 3.1e32, cap: 2.2e18 },
  { id: "lastlight", cost: 1.6e34, cap: 1.3e19 },
  { id: "sudo", cost: 7.8e35, cap: 7.8e19 },
  { id: "dream", cost: 3.9e37, cap: 4.7e20 },
];

export const COOLING = [
  { id: "fan", cost: 20, cap: 80 },
  { id: "ac", cost: 700, cap: 1_200 },
  { id: "crac", cost: 25_000, cap: 18_000 },
  { id: "chiller", cost: 1_000_000, cap: 280_000 },
  { id: "immersion", cost: 50_000_000, cap: 4_500_000 },
  { id: "fjord", cost: 2_500_000_000, cap: 75_000_000 },
  { id: "arctic", cost: 120_000_000_000, cap: 1_100_000_000 },
  { id: "deepsea", cost: 3.2e13, cap: 1.3e10 },
  { id: "radiators", cost: 1.4e16, cap: 1.8e11 },
  { id: "nightside", cost: 6.5e18, cap: 2.2e12 },
  { id: "sunshade", cost: 3.2e21, cap: 3.5e13 },
  { id: "gasgiant", cost: 2.7e24, cap: 5e14 },
  { id: "entropy", cost: 2.1e27, cap: 9e15 },
  { id: "otherside", cost: 1e29, cap: 5.4e16 },
  { id: "yesterday", cost: 5e30, cap: 3.2e17 },
  { id: "devnull", cost: 2.5e32, cap: 1.9e18 },
  { id: "darkness", cost: 1.2e34, cap: 1.2e19 },
  { id: "config", cost: 6.2e35, cap: 7e19 },
  { id: "lullaby", cost: 3.1e37, cap: 4.2e20 },
];

/** People who fix incidents you miss, and keep things running while you are away. */
export const STAFF = [
  { id: "intern", cost: 2_000, ops: 1 },
  { id: "admin", cost: 60_000, ops: 5 },
  { id: "sre", cost: 4_000_000, ops: 30 },
  { id: "noc", cost: 400_000_000, ops: 200 },
  { id: "aiops", cost: 50_000_000_000, ops: 1_500 },
  { id: "agi", cost: 3.2e16, ops: 20_000 },
  { id: "probes", cost: 4.9e23, ops: 400_000 },
  { id: "selves", cost: 1.3e30, ops: 8_000_000 },
  { id: "oracle", cost: 8.2e36, ops: 200_000_000 },
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
  { id: "lightsoff", cost: 2.4e13, fx: { away: 0.1, hours: 72 } },

  { id: "blockchain", cost: 5e9, fx: { rev: 1.01, draw: 1.1 } },
  { id: "serverless", cost: 6.7e11, fx: { rev: 1.5 } },
  { id: "quantum", cost: 8.8e14, fx: { rev: 2 } },
  { id: "superconductor", cost: 1.2e18, fx: { draw: 0.8 } },
  { id: "tachyon", cost: 4.3e19, fx: { rev: 2 } },
  { id: "lasercooling", cost: 1.6e21, fx: { cool: 1.5 } },
  { id: "uploads", cost: 2.1e24, fx: { rev: 3, rate: 0.8 } },
  { id: "answer", cost: 1.7e27, fx: { rev: 4.2 } },

  { id: "multitenant", cost: 2e29, fx: { rev: 2 } },
  { id: "deja", cost: 2.1e30, fx: { rev: 2 } },
  { id: "branches", cost: 2.2e31, fx: { rate: 0.8 } },
  { id: "precog", cost: 2.3e32, fx: { time: 2 } },
  { id: "undo", cost: 2.4e33, fx: { recover: 3 } },
  { id: "entropybudget", cost: 2.5e34, fx: { cool: 2 } },
  { id: "noop", cost: 2.6e35, fx: { rev: 3, draw: 0.5 } },
  { id: "parallelyou", cost: 2.7e36, fx: { away: 0.1, hours: 168 } },
  { id: "root", cost: 2.8e37, fx: { rev: 3 } },
  { id: "lucid", cost: 3e38, fx: { rev: 2, rate: 0.8 } },
  { id: "hosts", cost: 3.1e39, fx: { rev: 5 } },
];

/**
 * New versions of localhost, from 2.0 on: each one earns half as much again, and costs a
 * thousand times the last. They go on for longer than anyone will play.
 */
export const RELEASES = { first: 2, last: 90, cost: 6.4e29, growth: 1000, rev: 1.5 };
const RELEASE_UPGRADES = Array.from({ length: RELEASES.last - RELEASES.first + 1 }, (_, i) => {
  const v = RELEASES.first + i;
  return { id: `release-${v}`, kind: "release", version: v, index: i, cost: RELEASES.cost * RELEASES.growth ** i, fx: { rev: RELEASES.rev }, ...(i ? { after: `release-${v - 1}` } : {}) };
});

/**
 * Two upgrades for every machine: "tune" doubles what it earns once you own 15, "gen2" triples
 * it once you own 75. Their texts come from a template with the machine's name.
 */
const TIER_UPGRADES = TIERS.flatMap((t, i) => [
  { id: `tune-${t.id}`, kind: "tune", tier: t.id, index: i, need: 15, cost: t.cost * 40, fx: { tier: 2 } },
  { id: `gen2-${t.id}`, kind: "gen2", tier: t.id, index: i, need: 75, cost: t.cost * 5000, fx: { tier: 3 } },
]);

export const UPGRADES = [...GLOBAL_UPGRADES, ...TIER_UPGRADES, ...RELEASE_UPGRADES].sort((a, b) => a.cost - b.cost);
/** How many different jokes the template upgrades have. */
export const TEMPLATE_TEXTS = 4;

/**
 * Reincarnation upgrades: lasting advantages, bought with stock options when you sell the
 * company, and kept through every new life. costs: one per level. values: what each level
 * gives (seed: money to start with; autoclick: requests per second; starter: machines and
 * what they need). per: what each level adds (discount on hardware or upgrades, time for
 * alerts, alert rewards, income while away, income per stock option, cheaper staff, shorter
 * outages; for compound, the income factor per level). holiday values: hours added to the time
 * away. endless: no last level, each costs `growth` times the one before. needs: another upgrade
 * that must have that level first.
 */
export const PERKS = [
  { id: "seed", costs: [5, 50, 500, 5000], values: [1e3, 1e6, 1e9, 1e12] },
  { id: "starter", costs: [3, 30, 300, 3000, 30_000], values: [
    { hw: { pi: 10 }, pw: { strip: 1 }, cl: { fan: 1 } },
    { hw: { pi: 10, laptop: 10 }, pw: { strip: 1, ups: 1 }, cl: { fan: 1, ac: 1 } },
    { hw: { pi: 10, laptop: 10, tower: 10 }, pw: { strip: 1, ups: 4 }, cl: { fan: 1, ac: 5 } },
    { hw: { pi: 10, laptop: 10, tower: 10, server: 10 }, pw: { strip: 1, ups: 4, circuit: 1 }, cl: { fan: 1, ac: 5, crac: 1 } },
    { hw: { pi: 10, laptop: 10, tower: 10, server: 10, rack: 10 }, pw: { strip: 1, ups: 4, circuit: 5 }, cl: { fan: 1, ac: 5, crac: 6 } },
  ] },
  { id: "autoclick", costs: [5, 25, 125, 625], values: [1, 3, 10, 30] },
  { id: "runbooks", costs: [8, 40, 200], per: 0.2 },
  { id: "nightshift", costs: [10, 60, 300], per: 0.1 },
  { id: "discount", costs: [10, 30, 90, 270, 810, 2430, 7290, 21_870], per: 0.05, needs: { id: "seed", level: 1 } },
  { id: "autoinfra", costs: [25], needs: { id: "starter", level: 1 } },
  { id: "bonus", costs: [8, 40, 200], per: 0.5, needs: { id: "runbooks", level: 1 } },
  { id: "reputation", costs: [15], needs: { id: "runbooks", level: 1 } },
  { id: "headhunter", costs: [20, 100, 500], per: 0.2, needs: { id: "runbooks", level: 1 } },
  { id: "notes", costs: [15, 75, 375, 1875, 9375], per: 0.1, needs: { id: "discount", level: 1 } },
  { id: "holiday", costs: [40, 400, 4000], values: [24, 72, 168], needs: { id: "nightshift", level: 1 } },
  { id: "insurance", costs: [30, 150, 750], per: 0.25, needs: { id: "reputation", level: 1 } },
  { id: "luck", costs: [20, 200], needs: { id: "bonus", level: 1 } },
  { id: "dividends", costs: [100, 1000], per: 0.01, needs: { id: "discount", level: 2 } },
  // No last level: each one costs twice the one before and makes everything earn a tenth more.
  { id: "compound", endless: { cost: 500, growth: 2 }, per: 1.1, needs: { id: "dividends", level: 1 } },
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
  { id: "review", min: 14, kind: "single", time: 15, pending: { rev: 0.6 }, fail: { outage: 30 }, reward: 60 },
  { id: "paradox", min: 16, kind: "choice", options: [{ ok: true }, { ok: false }], time: 15, pending: { rev: 0.5, avail: 0.8 }, fail: { outage: 40, lose: 0.05 }, reward: 80 },
  { id: "merge", min: 16, kind: "mash", clicks: 12, time: 16, pending: { rev: 0.5 }, fail: { outage: 40 }, reward: 80 },
  { id: "groundhog", min: 18, kind: "single", time: 12, pending: { rev: 0.5, avail: 0.7 }, fail: { outage: 40 }, reward: 80 },
  { id: "y10k", min: 18, kind: "mash", clicks: 10, time: 15, pending: { rev: 0.4 }, fail: { outage: 45 }, reward: 90 },
  { id: "rootkit", min: 20, kind: "choice", options: [{ ok: false }, { ok: true }], time: 15, pending: { rev: 0.5 }, fail: { outage: 45, lose: 0.05 }, reward: 100 },
  { id: "wake", min: 21, kind: "mash", clicks: 14, time: 18, pending: { rev: 0.3, avail: 0.6 }, fail: { outage: 50 }, reward: 110 },
  { id: "noplace", min: 22, kind: "choice", options: [{ ok: false }, { ok: true }], time: 15, pending: { rev: 0.3, avail: 0.5 }, fail: { outage: 50 }, reward: 120 },

  { id: "hn", min: 2, kind: "single", good: true, time: 15, boost: { rev: 3, draw: 1.4, time: 40 }, weight: 0.5 },
  { id: "vc", min: 3, kind: "single", good: true, time: 15, cash: 90, weight: 0.4 },
  { id: "enterprise", min: 5, kind: "mash", clicks: 10, good: true, time: 15, cash: 200, weight: 0.4 },
  { id: "tourist", min: 16, kind: "single", good: true, time: 15, cash: 300, weight: 0.4 },
];

/** Where you are, by the biggest machine you own. */
export const STAGES = [
  "bedroom", "basement", "closet", "colo", "datacenter", "campus", "hyperscale", "ocean", "orbit", "moon", "star", "universe",
  "multiverse", "time", "source", "home",
];

/** One emoji per achievement, as in toki.json. */
export const ACHIEVEMENT_ICONS = {
  "hello-world": "👋", fork: "🍴", "last-light": "🕯️", colo: "🔒", datacenter: "🏢", hyperscaler: "☁️",
  "three-nines": "📈", "five-nines": "🏆", "space-heater": "🔥", breaker: "⚡", "it-was-dns": "🔍", ddos: "🛡️",
  yolo: "🎲", firefighter: "🧯", "on-call-hero": "📟", ipv6: "🐢", sleep: "😴", home: "🏠", "ten-oh": "🔟", exit: "🤝",
  "into-orbit": "🛰️", moon: "🌙", dyson: "☀️", simulation: "🌌", perk: "🪂", serial: "🔁", away: "🏖️", carpal: "🖱️", patched: "🩹", fleet: "🚢",
};

/** Achievement ids, as in toki.json. */
export const ACHIEVEMENTS = [
  "hello-world", "fork", "last-light", "colo", "datacenter", "hyperscaler",
  "three-nines", "five-nines", "space-heater", "breaker", "it-was-dns", "ddos",
  "yolo", "firefighter", "on-call-hero", "ipv6", "sleep", "home", "ten-oh", "exit",
  "into-orbit", "moon", "dyson", "simulation", "perk", "serial", "away", "carpal", "patched", "fleet",
];
