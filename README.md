# localhost

An idle game for [Toki](https://playtoki.app). You start with a Raspberry Pi in your bedroom and
end with a hyperscale datacenter. Buy machines, keep power and cooling in balance, and watch your
uptime. Now and then an alert fires (a DDoS attack, a full disk, a deploy on Friday afternoon):
click it away in time, or everything goes down.

It looks like a monitoring dashboard, and it is in English and German.

![The game: a dashboard with revenue, power, temperature and uptime, and an alert firing](game/shots/1.png)

## How it plays

- **Machines** earn money every second, use power, and turn all of it into heat. Ten kinds,
  from the Raspberry Pi to the hyperscale region. Owning 10, 25, 50… of one kind doubles what
  each of them earns.
- **Power**: more machines than your supply can take, and the breaker keeps tripping. Income
  drops fast.
- **Cooling**: above 35 °C the machines slow down; near 50 °C they barely run.
- **Uptime** is what customers pay for. Below 99% they pay less; 99.9%, 99.99% and 99.999% each
  pay a bonus. A new company starts at 99.5% and has to earn its nines.
- **Alerts** come every minute or so. Some need one click, some many, some an answer (it is
  always DNS). Solved in time, they pay; missed, they end in an outage. A few are good news
  (the front page of Hacker News, an investor on the phone).
- **Staff** fix the alerts you miss and keep things running while the game is closed. Away,
  the machines earn 25% without staff and up to 90% with full cover, for up to 8 hours.
- **Selling the company** starts you over in the bedroom with stock options: each adds 2%
  income, forever.

Keys: Space handles a request, 1 and 2 answer an alert.

## Run it on your computer

It is plain HTML, CSS and JavaScript: no build step and no packages.

```bash
npm start
```

Then open http://localhost:5173/ (yes). To check the rules of the game:

```bash
npm test
```

## What is where

| Path | What |
| --- | --- |
| `game/` | The game as Toki serves it: `index.html`, `style.css`, the cover and screenshots |
| `game/js/data.js` | Every number: prices, income, power, alerts. Change the balance here |
| `game/js/sim.js` | The rules, without any screen (the tests run these) |
| `game/js/i18n.js` | Every text, English and German |
| `game/js/main.js` | The screen, saving, and what the game tells Toki |
| `toki.json` | What Toki shows about the game: texts, achievements, high-score lists |
| `tests/` | Tests for the rules, the texts and `toki.json` |

## On Toki

The game follows [Toki's guide for games](https://www.playtoki.app/agents.md):

- **Saves**: the game keeps its progress in `localStorage` under one key (`localhost.save`).
  Toki's save script copies that into the player's account by itself.
- **High scores**: three lists. The main one is the score (1000 points for every ten times more
  money earned in total, so it fits Toki's limit however long someone plays), `streak` is the
  longest time without an outage, and `speedrun` the fastest time to a hyperscale region.
- **Achievements**: 20, listed in `toki.json`. Toki shows "Achievement unlocked" itself.

### Putting it on Toki

The easiest way: on Toki, add the game under **My games → Add game** and choose
**From GitHub** with this repository and the `main` branch. `toki.json` tells Toki that the game is in the `game` folder,
and from then on every push to `main` updates the game.

Or with an upload key (from **My games → Upload keys** on Toki):

```bash
curl -fsSL https://www.playtoki.app/toki-upload.mjs -o toki-upload.mjs
```

```bash
TOKI_KEY="toki_…" node toki-upload.mjs
```

For a new version with news for players, raise `version` in `toki.json` and write `notes`.
