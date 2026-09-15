#!/usr/bin/env node
// Ceník Villy Rudolf → plán pro kanály a porovnání s auditem.
// Zdroj pravdy: docs/cenik.json (pravidla sezón, ceny, min. noci, horizont, kanály).
//
// Použití:
//   node scripts/cenik.mjs sezony [rok …]            hranice sezón spočítané z pravidel
//   node scripts/cenik.mjs plan [volby]              plán na kanál: úsek → cena, min. noci, otevřeno/zavřeno
//   node scripts/cenik.mjs diff docs/audit-cen/<datum>.json [volby]
//                                                    porovná snímek auditu s ceníkem (kde je kanál pod cenou)
// Volby:
//   --kanal booking|airbnb|fewo|echalupy   jen jeden kanál
//   --od YYYY-MM-DD --do YYYY-MM-DD        rozsah (výchozí: dnes → konec nejzazšího otevřeného dne + 1 měsíc)
//   --jen min_noci|cena|otevreno           u plánu slučovat úseky jen podle jednoho pole (plán zápisu)
//   --dnes YYYY-MM-DD                      předstírat jiné „dnes“ (kvůli horizontu)
//   --md                                   výstup jako markdown tabulka
//
// Nic nezapisuje do extranetů. Zápis je asistovaný přes Chrome podle docs/cenova-parita-2027.md sekce 5.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cenik = JSON.parse(readFileSync(join(root, "docs/cenik.json"), "utf8"));

// ---------- data ----------
const DAY = 86400000;
const d = (s) => new Date(s + "T00:00:00Z");
const iso = (t) => t.toISOString().slice(0, 10);
const addDays = (t, n) => new Date(t.getTime() + n * DAY);
const addMonths = (t, n) => new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + n, 1));
const satOnOrBefore = (t) => addDays(t, -((t.getUTCDay() + 1) % 7));
const cz = (t) => `${t.getUTCDate()}. ${t.getUTCMonth() + 1}. ${t.getUTCFullYear()}`;

// ---------- sezóny (noci od–do včetně; odjezd = do + 1) ----------
function sezonyRoku(rok) {
  const out = [];
  // Vánoce: týden So–So s 24. 12. + týden So–So s 31. 12.
  const vOd = satOnOrBefore(d(`${rok}-12-24`));
  const vOdjezd = addDays(satOnOrBefore(d(`${rok}-12-31`)), 7);
  out.push({ sezona: "vanoce", rok, od: vOd, do: addDays(vOdjezd, -1) });
  // Léto: všechny týdny So–So zasahující do 1. 7.–31. 8.
  const lOd = satOnOrBefore(d(`${rok}-07-01`));
  const lOdjezd = addDays(satOnOrBefore(d(`${rok}-08-31`)), 7);
  out.push({ sezona: "leto", rok, od: lOd, do: addDays(lOdjezd, -1) });
  // Zima: leden + únor (Vánoce mají přednost, řeší priorita)
  out.push({ sezona: "zima", rok, od: d(`${rok}-01-01`), do: addDays(d(`${rok}-03-01`), -1) });
  return out;
}

const vsechnySezony = (odRok, doRok) => {
  const s = [];
  for (let r = odRok; r <= doRok; r++) s.push(...sezonyRoku(r));
  return s.sort((a, b) => cenik.sezony[a.sezona].priorita - cenik.sezony[b.sezona].priorita);
};

function denInfo(t, sezony) {
  for (const v of cenik.vyjimky) {
    if (t >= d(v.od) && t <= d(v.do)) return { sezona: `výjimka: ${v.duvod ?? ""}`.trim(), noc: v.noc, min_noci: v.min_noci, premiova: !!v.premiova };
  }
  for (const s of sezony) {
    if (t >= s.od && t <= s.do) {
      const def = cenik.sezony[s.sezona];
      return { sezona: `${s.sezona} ${s.rok}`, noc: def.noc, min_noci: def.min_noci, premiova: def.premiova };
    }
  }
  const def = cenik.sezony.mimo;
  return { sezona: "mimo", noc: def.noc, min_noci: def.min_noci, premiova: false };
}

// ---------- horizont ----------
function horizont(dnes, sezony) {
  const h = cenik.horizont;
  const konecKlouzaveho = addDays(addMonths(dnes, h.klouzavy_mesicu), -1);
  const premiove = [];
  for (const nazev of Object.keys(cenik.sezony).filter((k) => cenik.sezony[k].premiova)) {
    const budouci = sezony.filter((s) => s.sezona === nazev && s.do >= dnes).sort((a, b) => a.od - b.od);
    premiove.push(...budouci.slice(0, h.premiove_sezony_dopredu));
  }
  const otevreno = (t) => t <= konecKlouzaveho || premiove.some((s) => t >= s.od && t <= s.do);
  const nejzazsi = premiove.reduce((m, s) => (s.do > m ? s.do : m), konecKlouzaveho);
  return { konecKlouzaveho, premiove, otevreno, nejzazsi };
}

// ---------- kanály ----------
function cenaKanalu(noc, kanal) {
  const k = cenik.kanaly[kanal];
  let c = noc * k.koeficient;
  if (k.mena !== cenik.mena_zaklad) c = c / cenik.kurz[k.mena];
  return Math.round(c / k.zaokrouhleni) * k.zaokrouhleni;
}
const sMenou = (c, kanal) => (c == null ? "—" : `${c.toLocaleString("cs-CZ")} ${cenik.kanaly[kanal].mena === "CZK" ? "Kč" : "€"}`);

// ---------- úseky ----------
function useky(od, do_, kanal, jen, ctx) {
  const rows = [];
  let cur = null;
  for (let t = od; t <= do_; t = addDays(t, 1)) {
    const info = denInfo(t, ctx.sezony);
    const row = {
      sezona: info.sezona,
      cena: cenaKanalu(info.noc, kanal),
      min_noci: info.min_noci,
      otevreno: ctx.h.otevreno(t),
    };
    const klic = jen ? String(row[jen]) : `${row.sezona}|${row.cena}|${row.min_noci}|${row.otevreno}`;
    if (cur && cur.klic === klic) cur.do = t;
    else { cur = { ...row, klic, od: t, do: t }; rows.push(cur); }
  }
  return rows;
}

// ---------- výstup ----------
function tabulka(hlavicka, radky, md) {
  if (md) {
    console.log(`| ${hlavicka.join(" | ")} |`);
    console.log(`| ${hlavicka.map(() => "---").join(" | ")} |`);
    for (const r of radky) console.log(`| ${r.join(" | ")} |`);
    return;
  }
  const w = hlavicka.map((h, i) => Math.max(h.length, ...radky.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(w[i])).join("  ");
  console.log(line(hlavicka));
  console.log(w.map((n) => "-".repeat(n)).join("  "));
  for (const r of radky) console.log(line(r));
}

// ---------- CLI ----------
const argv = process.argv.slice(2);
const cmd = argv.shift();
const opt = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    opt[k] = v;
  } else pos.push(argv[i]);
}
const dnes = d(opt.dnes ?? iso(new Date()));
const rokDnes = dnes.getUTCFullYear();
const sezony = vsechnySezony(rokDnes - 1, rokDnes + 4);
const h = horizont(dnes, sezony);
const ctx = { sezony, h };
const kanaly = opt.kanal ? [opt.kanal] : Object.keys(cenik.kanaly);
for (const k of kanaly) if (!cenik.kanaly[k]) { console.error(`Neznámý kanál: ${k}`); process.exit(1); }

if (cmd === "sezony") {
  const roky = pos.length ? pos.map(Number) : [rokDnes, rokDnes + 1, rokDnes + 2, rokDnes + 3];
  const radky = [];
  for (const rok of roky) {
    for (const s of sezonyRoku(rok).sort((a, b) => a.od - b.od)) {
      const def = cenik.sezony[s.sezona];
      radky.push([s.sezona, rok, cz(s.od), cz(addDays(s.do, 1)), `${def.noc.toLocaleString("cs-CZ")} Kč`, def.min_noci, def.k_potvrzeni ? "k potvrzení" : ""]);
    }
  }
  console.log(`Sezóny spočítané z pravidel (ceník verze ${cenik.verze}). Noci = příjezd až odjezd.\n`);
  tabulka(["sezóna", "rok", "příjezd", "odjezd", "noc (základ)", "min. noci", ""], radky, opt.md);
  console.log(`\nmimo: ${cenik.sezony.mimo.noc.toLocaleString("cs-CZ")} Kč, min. ${cenik.sezony.mimo.min_noci} noci${cenik.sezony.mimo.k_potvrzeni ? " (k potvrzení)" : ""}`);
  process.exit(0);
}

if (cmd === "plan") {
  const od = opt.od ? d(opt.od) : dnes;
  const do_ = opt.do ? d(opt.do) : addDays(addMonths(h.nejzazsi, 2), -1);
  console.log(`Plán z ceníku ${cenik.verze} k ${cz(dnes)} · kurz ${cenik.kurz.EUR} Kč/€ · klouzavý horizont do ${cz(h.konecKlouzaveho)}`);
  console.log(`Prémiové sezóny otevřené za horizontem: ${h.premiove.map((s) => `${s.sezona} ${s.rok}`).join(", ")}`);
  console.log(`Rozsah: ${cz(od)} – ${cz(do_)} (noci; odjezd = poslední noc + 1)\n`);
  for (const k of kanaly) {
    const kk = cenik.kanaly[k];
    console.log(`## ${kk.nazev} (${kk.mena}${kk.koeficient !== 1 ? `, koef. ${kk.koeficient}` : ""})${kk.k_potvrzeni ? " — k potvrzení: " + kk.k_potvrzeni : ""}`);
    const rows = useky(od, do_, k, opt.jen, ctx);
    const hl = ["od (noc)", "do (noc)", "nocí"];
    if (!opt.jen || opt.jen === "cena") hl.push("cena/noc");
    if (!opt.jen || opt.jen === "min_noci") hl.push("min. noci");
    if (!opt.jen || opt.jen === "otevreno") hl.push("stav");
    if (!opt.jen) hl.push("sezóna");
    tabulka(hl, rows.map((r) => {
      const c = [iso(r.od), iso(r.do), Math.round((r.do - r.od) / DAY) + 1];
      if (!opt.jen || opt.jen === "cena") c.push(sMenou(r.cena, k));
      if (!opt.jen || opt.jen === "min_noci") c.push(r.min_noci);
      if (!opt.jen || opt.jen === "otevreno") c.push(r.otevreno ? "otevřít" : "ZAVŘÍT");
      if (!opt.jen) c.push(r.sezona);
      return c;
    }), opt.md);
    console.log();
  }
  process.exit(0);
}

if (cmd === "diff") {
  const soubor = pos[0];
  if (!soubor) { console.error("Chybí snímek auditu, např.: node scripts/cenik.mjs diff docs/audit-cen/2026-08-12.json"); process.exit(1); }
  const snap = JSON.parse(readFileSync(join(root, soubor), "utf8"));
  console.log(`Audit ${snap._meta?.datum_auditu ?? soubor} × ceník ${cenik.verze} (tolerance ±${cenik.tolerance_pct} %, kurz ${cenik.kurz.EUR} Kč/€)\n`);
  let podCenou = 0, zavritMel = 0;
  for (const k of kanaly) {
    const s = snap[k];
    if (!s) { console.log(`## ${cenik.kanaly[k].nazev}: v auditu chybí\n`); continue; }
    const kk = cenik.kanaly[k];
    const us = s.useky ?? s.useky_standard_eur ?? [];
    const radky = [];
    for (const u of us) {
      if (u.stav && /rezervace/i.test(u.stav)) continue;
      const uOd = d(u.od), uDo = d(u.do);
      if (uDo < dnes) continue;
      for (const r of useky(uOd < dnes ? dnes : uOd, uDo, k, null, ctx)) {
        const cil = r.cena;
        let verdikt, roz = "";
        if (u.cena == null) verdikt = "NEDOMĚŘENO";
        else {
          const p = ((u.cena - cil) / cil) * 100;
          roz = `${p >= 0 ? "+" : ""}${p.toFixed(1)} %`;
          if (p < -cenik.tolerance_pct) { verdikt = "POD CENOU"; podCenou++; }
          else if (p > cenik.tolerance_pct) verdikt = "nad cenou";
          else verdikt = "ok";
        }
        if (!r.otevreno && u.stav !== "blok") { verdikt += " · má být ZAVŘENO"; zavritMel++; }
        radky.push([iso(r.od), iso(r.do), sMenou(u.cena, k), sMenou(cil, k), roz, verdikt, r.sezona, u.stav ?? ""]);
      }
    }
    console.log(`## ${kk.nazev} (${s.mena ?? kk.mena})`);
    if (s.mena && s.mena !== kk.mena) console.log(`⚠️ měna v auditu (${s.mena}) ≠ měna v ceníku (${kk.mena})`);
    const mn = s.nastaveni?.min_noci;
    if (mn != null) console.log(`min. noci v auditu: ${typeof mn === "number" ? mn : JSON.stringify(mn)}; ceník žádá léto ${cenik.sezony.leto.min_noci}, Vánoce ${cenik.sezony.vanoce.min_noci}, jinak ${cenik.sezony.mimo.min_noci}`);
    tabulka(["od", "do", "audit", "cíl", "rozdíl", "verdikt", "sezóna", "stav"], radky, opt.md);
    console.log();
  }
  console.log(`Souhrn: ${podCenou} úseků pod cenou, ${zavritMel} úseků otevřených za horizontem.`);
  process.exit(0);
}

console.error("Neznámý příkaz. Použití: node scripts/cenik.mjs sezony|plan|diff …  (viz hlavička souboru)");
process.exit(1);
