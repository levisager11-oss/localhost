import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACHIEVEMENT_ICONS, ACHIEVEMENTS, COOLING, INCIDENTS, PERKS, POWER, RELEASES, STAFF, STAGES, TIERS, UPGRADES } from "../game/js/data.js";
import {
  applyOffline, beginRun, buy, buyPerk, buyUpgrade, canExit, click, costFor, derive, deserialize, exit, exitShares, freeShares,
  incidentAction, incidentDef, maxAffordable, milestoneMult, newState, nextMilestone, perkCost, priceMult, score, serialize, slaMult,
  spentShares, tick, upgradeOffered,
} from "../game/js/sim.js";
import { setLang, TEXTS, upgradeText } from "../game/js/i18n.js";
import { num, watts } from "../game/js/format.js";

/** A random source that always says the same: the tests decide what "random" means. */
const fixed = (v) => () => v;

function run(s, seconds, rng = fixed(0.5), dt = 0.25) {
  const ev = [];
  for (let t = 0; t < seconds; t += dt) tick(s, dt, rng, ev);
  return ev;
}

test("a new game earns a little by itself and by clicking", () => {
  const s = newState(0);
  s.nextIncident = 1e9;
  assert.equal(derive(s).rate, 0.25);
  run(s, 10);
  assert.ok(Math.abs(s.money - 2.5) < 1e-9);
  assert.ok(Math.abs(click(s) - 1.001) < 1e-9);
  assert.equal(s.stats.clicks, 1);
});

test("prices rise, and buying takes exactly the money", () => {
  const s = newState(0);
  s.money = 100;
  assert.equal(buy(s, "hw", "pi", 1), 1);
  assert.ok(Math.abs(s.money - (100 - 15 * 1.15)) < 1e-9);
  assert.equal(buy(s, "hw", "pi", 10), 0, "can't pay for ten");
  const n = maxAffordable("hw", "pi", s.hw.pi, s.money);
  assert.ok(costFor("hw", "pi", s.hw.pi, n) <= s.money);
  assert.ok(costFor("hw", "pi", s.hw.pi, n + 1) > s.money);
  assert.equal(buy(s, "hw", "pi", "max"), n);
  assert.ok(s.money >= 0);
  assert.equal(buy(s, "hw", "nope", 1), 0);
});

test("milestones double what a machine earns, and never run out", () => {
  assert.equal(milestoneMult(9), 1);
  assert.equal(milestoneMult(10), 2);
  assert.equal(milestoneMult(25), 4);
  assert.equal(milestoneMult(400), 2 ** 8);
  assert.equal(milestoneMult(499), 2 ** 8);
  assert.equal(milestoneMult(500), 2 ** 9);
  assert.equal(milestoneMult(1000), 2 ** 14);
  assert.equal(nextMilestone(0), 10);
  assert.equal(nextMilestone(400), 500);
  assert.equal(nextMilestone(1234), 1300);
});

test("too many machines for the socket: income drops", () => {
  const s = newState(0);
  s.hw.pi = 12;
  const ok = derive(s);
  assert.equal(ok.load, 1);
  assert.equal(ok.powerFactor, 1);
  s.hw.pi = 24;
  const over = derive(s);
  assert.equal(over.load, 2);
  assert.equal(over.powerFactor, 0.25);
  assert.ok(over.avail < 1);
  s.pw.strip = 1;
  assert.equal(derive(s).powerFactor, 1);
});

test("without cooling it gets hot and the machines slow down", () => {
  const s = newState(0);
  s.nextIncident = 1e9;
  s.hw.laptop = 4;
  s.pw.ups = 1;
  run(s, 200);
  assert.ok(s.temp > 50, `temperature ${s.temp}`);
  assert.equal(derive(s).thermalFactor, 0.2);
  assert.ok(s.ach.includes("space-heater"));
  s.cl.ac = 1;
  run(s, 200);
  assert.ok(s.temp < 35);
  assert.equal(derive(s).thermalFactor, 1);
});

test("uptime pays: bonus for nines, less below 99%", () => {
  assert.equal(slaMult(1), 1.5);
  assert.equal(slaMult(0.9995), 1.15);
  assert.equal(slaMult(0.995), 1);
  assert.ok(slaMult(0.95) < 1);
  assert.equal(slaMult(0), 0.5);
});

test("an incident comes, and clicking it away pays", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  s.nextIncident = 1;
  const ev = run(s, 2, fixed(0));
  assert.equal(ev.find((e) => e.type === "incident")?.id, "vacuum");
  assert.ok(derive(s).rate < derive({ ...s, incident: null }).rate);
  const money = s.money;
  const out = incidentAction(s, 0, fixed(0.5));
  assert.equal(out[0].type, "resolved");
  assert.equal(s.incident, null);
  assert.ok(s.money > money);
  assert.equal(s.stats.resolved, 1);
  assert.ok(s.nextIncident > 0);
});

test("an incident nobody handles ends in an outage", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  s.nextIncident = 0.1;
  const ev = run(s, 20, fixed(0.99));
  assert.ok(ev.some((e) => e.type === "failed"));
  assert.ok(s.outage > 0);
  assert.equal(derive(s).rate, 0);
  assert.ok(s.uptime < 1);
  assert.equal(s.stats.failed, 1);
  run(s, 40, fixed(0.99));
  assert.equal(s.outage, 0);
});

test("staff fixes what you miss", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  s.st.admin = 5;
  s.nextIncident = 0.1;
  const ev = run(s, 40, fixed(0.1));
  assert.ok(ev.some((e) => e.type === "resolved" && e.how === "auto"));
  assert.equal(s.stats.failed, 0);
  assert.equal(s.outage, 0);
});

test("choices: it is always DNS, and Friday deploys are a gamble", () => {
  const s = newState(0);
  s.hw.server = 1;
  const def = incidentDef("dns");
  s.incident = { id: "dns", left: def.time, total: def.time, clicks: 0, need: 1 };
  incidentAction(s, 1, fixed(0.5));
  assert.ok(s.outage > 0, "wrong answer");
  s.outage = 0;
  s.incident = { id: "dns", left: def.time, total: def.time, clicks: 0, need: 1 };
  incidentAction(s, 0, fixed(0.5));
  assert.ok(s.ach.includes("it-was-dns"));
  s.incident = { id: "friday", left: 10, total: 10, clicks: 0, need: 1 };
  assert.equal(incidentAction(s, 1, fixed(0.1))[0].how, "lucky");
  assert.ok(s.ach.includes("yolo"));
  s.incident = { id: "friday", left: 10, total: 10, clicks: 0, need: 1 };
  assert.equal(incidentAction(s, 1, fixed(0.9))[0].type, "failed");
});

test("mashing needs every click", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  s.incident = { id: "ddos", left: 10, total: 10, clicks: 0, need: 3 };
  incidentAction(s);
  incidentAction(s);
  assert.equal(s.incident.clicks, 2);
  incidentAction(s);
  assert.equal(s.incident, null);
  assert.ok(s.ach.includes("ddos"));
});

test("upgrades multiply, and can be bought once", () => {
  const s = newState(0);
  s.money = 1000;
  assert.equal(buyUpgrade(s, "rgb"), true);
  assert.equal(buyUpgrade(s, "rgb"), false);
  assert.ok(Math.abs(derive(s).rate - 0.25 * 1.15) < 1e-9);
  assert.equal(buyUpgrade(s, "ai"), false);
});

test("coming back after a while pays for the time away, capped", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  const rate = derive(s).steady;
  const out = applyOffline(s, 3600_000);
  assert.equal(out.long, true);
  assert.equal(out.efficiency, 0.25);
  assert.ok(Math.abs(out.earned - rate * 3600 * 0.25) < 1e-6);
  const day = applyOffline(s, 3600_000 + 48 * 3600_000);
  assert.equal(day.seconds, 8 * 3600);
  assert.equal(day.capped, true);
  assert.ok(s.ach.includes("away"));
  const short = applyOffline(s, s.lastSeen + 5000);
  assert.equal(short.long, false);
  assert.equal(short.efficiency, 1);
});

test("an exit starts over with stock options", () => {
  const s = newState(0);
  assert.equal(canExit(s), false);
  assert.equal(exit(s), null);
  s.runEarned = s.totalEarned = 8e9;
  s.hw.rack = 3;
  s.ach = ["hello-world"];
  assert.equal(exitShares(s), 20);
  const next = exit(s, 5);
  assert.equal(next.shares, 20);
  assert.equal(next.hw.rack, 0);
  assert.equal(next.hw.pi, 1);
  assert.equal(next.money, 0);
  assert.equal(next.totalEarned, 8e9);
  assert.deepEqual(next.ach, ["hello-world"]);
  assert.equal(next.stats.exits, 1);
  assert.ok(Math.abs(derive(next).rate - 0.25 * 1.4) < 1e-9);
  assert.equal(next.reborn, true);
});

test("upgrades make the time away pay more and count longer", () => {
  const s = newState(0);
  s.hw.laptop = 1;
  assert.equal(derive(s).awayShare, 0.25);
  assert.equal(derive(s).awayHours, 8);
  s.up = ["logrotate", "phone", "selfheal"];
  assert.ok(Math.abs(derive(s).awayShare - 0.6) < 1e-9);
  assert.equal(derive(s).awayHours, 24);
  const out = applyOffline(s, 48 * 3600_000);
  assert.equal(out.seconds, 24 * 3600);
  assert.ok(Math.abs(out.efficiency - 0.6) < 1e-9);
  s.up.push("lightsoff");
  s.perks.nightshift = 3;
  assert.equal(derive(s).awayShare, 1, "never more than everything");
  assert.equal(derive(s).awayHours, 72);
});

test("a machine's own upgrades appear once you own enough, and multiply only that machine", () => {
  const s = newState(0);
  const tune = UPGRADES.find((u) => u.id === "tune-pi");
  s.money = 1e9;
  assert.equal(upgradeOffered(s, tune), false);
  assert.equal(buyUpgrade(s, "tune-pi"), false);
  s.hw.pi = 15;
  s.hw.laptop = 1;
  const before = derive(s).baseRev;
  assert.equal(upgradeOffered(s, tune), true);
  assert.equal(buyUpgrade(s, "tune-pi"), true);
  assert.ok(Math.abs(derive(s).baseRev - (before + 15 * 0.25 * 2)) < 1e-9);
});

test("reincarnation upgrades cost stock options and shape the next life", () => {
  let s = newState(0);
  assert.equal(buyPerk(s, "seed"), false, "no stock options yet");
  s.runEarned = s.totalEarned = 1e12;
  s = exit(s, 10);
  assert.equal(s.shares, 100);
  assert.equal(buyPerk(s, "discount"), false, "builds on seed money");
  assert.equal(buyPerk(s, "seed"), true);
  assert.equal(buyPerk(s, "seed"), true);
  assert.equal(buyPerk(s, "starter"), true);
  assert.equal(buyPerk(s, "discount"), true);
  assert.equal(buyPerk(s, "autoinfra"), true);
  assert.equal(freeShares(s), 100 - 5 - 50 - 3 - 10 - 25);
  assert.equal(buyPerk(s, "discount"), false, "can't pay for the next level");
  assert.equal(s.shares, 100, "spending doesn't cost the income bonus");
  assert.equal(s.money, 0);
  beginRun(s, 20);
  assert.equal(s.reborn, false);
  assert.equal(buyPerk(s, "runbooks"), false, "only between two lives");
  assert.equal(freeShares(s), 7);
  assert.equal(s.money, 1e6);
  assert.equal(s.hw.pi, 10);
  assert.equal(s.pw.strip, 1);
  assert.ok(Math.abs(costFor("hw", "pi", 0, 1, 0.95) - 15 * 0.95) < 1e-9);
  const money = s.money;
  buy(s, "hw", "laptop", 1);
  assert.ok(Math.abs(money - s.money - 150 * 0.95) < 1e-9);
  // The procurement bot keeps the power up.
  s.money = 1e6;
  s.hw.laptop = 40;
  s.nextIncident = 1e9;
  for (let i = 0; i < 40; i++) tick(s, 0.25, () => 0.5);
  assert.ok(derive(s).load <= 0.9 && derive(s).coolLoad <= 0.9, "bought power and cooling by itself");
  // Switched off, it leaves power and cooling alone, and stays off through a save and the next life.
  s.botOff = true;
  s.hw.laptop = 80;
  const pw = { ...s.pw };
  for (let i = 0; i < 40; i++) tick(s, 0.25, () => 0.5);
  assert.deepEqual(s.pw, pw, "switched off: buys nothing");
  assert.ok(derive(s).load > 0.9);
  assert.equal(deserialize(serialize(s)).botOff, true);
  s.runEarned = 1e12;
  assert.equal(exit(s, 30).botOff, true);
  delete s.botOff;
  s.hw.laptop = 40;
  assert.ok(s.ach.includes("perk"));
  const again = deserialize(serialize(s));
  assert.deepEqual(again.perks, s.perks);
  assert.equal(deserialize(JSON.stringify({ shares: 4, perks: { seed: 4, starter: 3 } })).perks.seed ?? 0, 0, "a save can't spend what it never had");
  for (const p of PERKS) assert.ok(perkCost(newState(0), p.id) > 0);
});

test("the score fits Toki's leaderboard", () => {
  const s = newState(0);
  assert.equal(score(s), 0);
  s.totalEarned = 999;
  assert.equal(score(s), 3000);
  s.totalEarned = 1e300;
  assert.ok(score(s) <= 1e12);
});

test("saves survive a round trip, and broken ones start a new game", () => {
  const s = newState(1000);
  s.money = 1234.5;
  s.hw.tower = 3;
  s.up = ["rgb", "made-up"];
  s.ach = ["hello-world", "made-up"];
  s.lang = "de";
  s.incident = { id: "ddos", left: 5, total: 10, clicks: 1, need: 12 };
  const back = deserialize(serialize(s, 2000), 3000);
  assert.equal(back.money, 1234.5);
  assert.equal(back.hw.tower, 3);
  assert.deepEqual(back.up, ["rgb"]);
  assert.deepEqual(back.ach, ["hello-world"]);
  assert.equal(back.lang, "de");
  assert.equal(back.incident, null);
  assert.equal(back.lastSeen, 2000);
  assert.equal(deserialize("{nope", 0).hw.pi, 1);
  assert.equal(deserialize('{"money":"lots","hw":{"pi":-5},"uptime":7}', 0).money, 0);
  assert.equal(deserialize('{"hw":{"pi":-5},"uptime":7}', 0).uptime, 1);
});

test("a long game stays sane", () => {
  const s = newState(0);
  let seed = 42;
  const rng = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = 0; i < 20000; i++) {
    tick(s, 0.5, rng);
    if (s.incident && i % 3 === 0) incidentAction(s, 0, rng);
    if (i % 5 === 0) click(s);
    for (const [kind, list] of [["cl", COOLING], ["pw", POWER], ["hw", TIERS], ["st", STAFF]]) {
      for (const item of list) {
        const d = derive(s);
        // Buy machines only while power and cooling have room for them.
        if (kind === "hw" && ((d.draw + item.power) / d.powerCap > 0.9 || (d.draw + item.power) / d.coolCap > 0.9)) continue;
        if ((kind === "pw" && d.load < 0.6) || (kind === "cl" && d.coolLoad < 0.6)) continue;
        buy(s, kind, item.id, 1);
      }
    }
    for (const u of UPGRADES) buyUpgrade(s, u.id);
  }
  for (const v of [s.money, s.runEarned, s.totalEarned, s.temp, s.uptime]) assert.ok(Number.isFinite(v) && v >= 0);
  assert.ok(s.uptime <= 1);
  assert.ok(derive(s).tier >= 3, `only reached machine ${derive(s).tier}`);
});

test("every thing in the game has its texts in both languages", () => {
  const need = [];
  for (const [p, list] of [["hw", TIERS], ["pw", POWER], ["cl", COOLING], ["st", STAFF], ["up", UPGRADES.filter((u) => !u.tier && !u.kind)], ["perk", PERKS]]) {
    for (const x of list) need.push(`${p}.${x.id}.name`, `${p}.${x.id}.desc`, ...(p === "up" || p === "perk" ? [`${p}.${x.id}.fx`] : []));
  }
  for (const i of INCIDENTS) {
    need.push(`inc.${i.id}.title`, `inc.${i.id}.desc`, `inc.${i.id}.ok`);
    if (i.kind === "choice") i.options.forEach((_, n) => need.push(`inc.${i.id}.opt${n}`));
    else need.push(`inc.${i.id}.btn`);
    if (!i.good) need.push(`inc.${i.id}.fail`);
  }
  for (const s of STAGES) need.push(`stage.${s}`);
  for (const a of ACHIEVEMENTS) need.push(`ach.${a}.name`, `ach.${a}.desc`);
  for (const lang of ["en", "de"]) {
    for (const k of need) assert.ok(typeof TEXTS[lang][k] === "string" && TEXTS[lang][k], `${lang}: ${k}`);
  }
  assert.deepEqual(Object.keys(TEXTS.de).sort(), Object.keys(TEXTS.en).sort());
  for (const lang of ["en", "de"]) {
    setLang(lang);
    for (const u of UPGRADES) {
      for (const field of ["name", "desc", "fx"]) {
        const text = upgradeText(u, field);
        assert.ok(text && !text.includes("{") && !text.startsWith("up."), `${lang}: ${u.id} ${field}: ${text}`);
      }
    }
  }
  setLang("en");
});

test("toki.json lists the game's achievements and boards", () => {
  const toki = JSON.parse(readFileSync(new URL("../toki.json", import.meta.url), "utf8"));
  assert.deepEqual(toki.achievements.map((a) => a.id).sort(), [...ACHIEVEMENTS].sort());
  for (const a of toki.achievements) {
    assert.ok(a.name.length <= 40 && a.name_de.length <= 40, a.id);
    assert.ok(a.description.length <= 120 && a.description_de.length <= 120, a.id);
    assert.equal(a.name, TEXTS.en[`ach.${a.id}.name`]);
    assert.equal(a.name_de, TEXTS.de[`ach.${a.id}.name`]);
    assert.equal(a.description, TEXTS.en[`ach.${a.id}.desc`]);
    assert.equal(a.description_de, TEXTS.de[`ach.${a.id}.desc`]);
    assert.equal(a.icon, ACHIEVEMENT_ICONS[a.id]);
  }
  assert.deepEqual(toki.boards.map((b) => b.id), ["", "streak", "speedrun"]);
  assert.equal(toki.folder, "game");
  assert.match(toki.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("the late game: prices keep rising, and the last machine is a Raspberry Pi again", () => {
  for (const list of [TIERS, POWER, COOLING, STAFF]) {
    for (let i = 1; i < list.length; i++) assert.ok(list[i].cost > list[i - 1].cost, list[i].id);
  }
  // Every machine after the first has a stage, and every stage has machines.
  for (const t of TIERS) assert.ok(STAGES.includes(t.stage), t.id);
  for (const stage of STAGES) assert.ok(TIERS.some((t) => t.stage === stage), stage);
  const home = TIERS[TIERS.length - 1];
  assert.equal(home.id, "home");
  assert.equal(home.power, TIERS[0].power);
  // Power and cooling can keep up with the biggest machines.
  assert.ok(POWER[POWER.length - 1].cap > 4 * TIERS[TIERS.length - 2].power);
  assert.ok(COOLING[COOLING.length - 1].cap > 4 * TIERS[TIERS.length - 2].power);
  // Prices stay numbers a computer can count.
  for (const u of UPGRADES) assert.ok(Number.isFinite(u.cost) && u.cost < 1e300, u.id);
});

test("new versions of localhost come one after another", () => {
  const s = newState(0);
  const v2 = UPGRADES.find((u) => u.id === `release-${RELEASES.first}`);
  const v3 = UPGRADES.find((u) => u.id === `release-${RELEASES.first + 1}`);
  s.runEarned = v3.cost;
  s.money = v3.cost * 2;
  assert.equal(upgradeOffered(s, v3), false, "2.0 comes first");
  assert.equal(buyUpgrade(s, v3.id), false);
  assert.equal(upgradeOffered(s, v2), true);
  const before = derive(s).fx.rev;
  assert.equal(buyUpgrade(s, v2.id), true);
  assert.equal(derive(s).fx.rev, before * RELEASES.rev);
  assert.equal(upgradeOffered(s, v3), true);
  for (let v = RELEASES.first; v <= 10; v++) s.up.push(`release-${v}`);
  tick(s, 0.1, fixed(0.5));
  assert.ok(s.ach.includes("ten-oh"));
  setLang("de");
  assert.equal(upgradeText(v3, "name"), "localhost 3.0");
  setLang("en");
});

test("compound interest never ends", () => {
  let s = newState(0);
  s.runEarned = s.totalEarned = 1e30;
  s = exit(s, 0);
  s.perks = { seed: 1, discount: 2, runbooks: 1, bonus: 1 };
  assert.equal(buyPerk(s, "compound"), false, "builds on dividends");
  assert.equal(buyPerk(s, "dividends"), true);
  const free = freeShares(s);
  let bought = 0;
  while (buyPerk(s, "compound")) bought++;
  assert.ok(bought >= 15, `only ${bought} levels`);
  assert.ok(freeShares(s) >= 0 && freeShares(s) < perkCost(s, "compound"));
  assert.equal(free - freeShares(s), spentShares(s) - (spentShares({ perks: { ...s.perks, compound: 0 } })));
  const rev = derive(s).fx.compound;
  assert.ok(Math.abs(rev - 1.1 ** bought) < 1e-9 * rev);
  // A save keeps every level it paid for.
  assert.equal(deserialize(serialize(s)).perks.compound, bought);
});

test("the new reincarnation upgrades: cheaper staff, longer holidays, shorter outages", () => {
  let s = newState(0);
  s.runEarned = s.totalEarned = 1e18;
  s = exit(s, 0);
  s.perks = { runbooks: 1, reputation: 1, nightshift: 1 };
  for (const id of ["headhunter", "holiday", "insurance"]) assert.equal(buyPerk(s, id), true, id);
  beginRun(s, 0);
  assert.ok(Math.abs(priceMult(s, "st") - 0.8) < 1e-9);
  assert.equal(derive(s).fx.hours, 8 + 24);
  s.hw.tower = 1;
  s.nextIncident = 0;
  tick(s, 0.1, fixed(0.5));
  assert.ok(s.incident);
  const def = incidentDef(s.incident.id);
  s.st.intern = 0;
  tick(s, s.incident.left + 0.1, fixed(0.99));
  if (def.fail?.outage) assert.ok(Math.abs(s.outage - def.fail.outage * 0.75) < 1e-9);
});

test("big numbers still read well", () => {
  setLang("en");
  assert.equal(num(1.5e36), "1.50Ud");
  assert.equal(num(2e63), "2.00Vg");
  assert.equal(num(1e70), "1.00e70");
  assert.equal(watts(2e15), "2.00 PW");
  assert.equal(watts(4.7e20), "470 EW");
  assert.equal(watts(1e40), "1.00e40 W");
  setLang("de");
  assert.equal(num(1.5e36), "1,50 Sext.");
  setLang("en");
});

test("every stage has a picture", () => {
  const scene = readFileSync(new URL("../game/js/scene.js", import.meta.url), "utf8");
  for (const stage of STAGES) assert.match(scene, new RegExp(`\\n    ${stage}\\(\\) \\{`), stage);
});
