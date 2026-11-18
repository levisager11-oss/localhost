// Numbers as people read them: "$1.25M", "3.5 kW", "99.950%", "12 min 05 s".
import { getLang } from "./i18n.js";

const SUFFIX = {
  en: ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg"],
  de: [
    "", " Tsd.", " Mio.", " Mrd.", " Bio.", " Brd.", " Trio.", " Trd.", " Quad.", " Qrd.", " Quint.", " Qtd.",
    " Sext.", " Sxd.", " Sept.", " Spd.", " Okt.", " Okd.", " Non.", " Nod.", " Dez.", " Dzd.",
  ],
};
const sep = (text) => (getLang() === "de" ? text.replace(".", ",") : text);
/** Three digits that matter: 1.25, 12.5, 125. */
const short = (v) => (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0));

/** A big number with a word for its size. Below 1000: whole, or with cents when asked. */
export function num(v, cents = false) {
  if (!Number.isFinite(v)) return "∞";
  if (v < 0) return `−${num(-v, cents)}`;
  if (v < 999.995) return sep(cents ? v.toFixed(2) : String(Math.round(v)));
  let k = Math.floor(Math.log10(v) / 3);
  let m = v / 1000 ** k;
  // 999,999 would round up to "1000K".
  if (m >= 999.5) {
    k++;
    m /= 1000;
  }
  const list = SUFFIX[getLang()];
  if (k >= list.length) return sep(v.toExponential(2).replace("e+", "e"));
  return sep(short(m)) + list[k];
}

/** Money with cents while it is small. */
export const money = (v) => `$${num(v, true)}`;
/** A price: cents only when it has some. */
export const price = (v) => `$${num(v, Math.abs(v - Math.round(v)) > 0.005)}`;

const WATT = ["W", "kW", "MW", "GW", "TW", "PW", "EW", "ZW", "YW", "RW", "QW"];
export function watts(v) {
  if (!Number.isFinite(v)) return "∞ W";
  if (v < 999.5) return `${Math.round(v)} W`;
  let k = Math.floor(Math.log10(v) / 3);
  let m = v / 1000 ** k;
  if (m >= 999.5) {
    k++;
    m /= 1000;
  }
  if (k >= WATT.length) return `${sep(v.toExponential(2).replace("e+", "e"))} W`;
  return `${sep(short(m))} ${WATT[k]}`;
}

export const percent = (v) => `${Math.round(v * 100)}%`;
/** Uptime never rounds up: 99.9996% is not 100%. */
export const uptime = (v) => `${sep((Math.floor(v * 100000) / 1000).toFixed(3))}%`;
export const degrees = (v) => `${sep(v.toFixed(1))} °C`;

export function duration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} min`;
}
