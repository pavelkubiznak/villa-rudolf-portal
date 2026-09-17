#!/usr/bin/env node
// Ceník Villy Rudolf → plán pro kanály a porovnání s auditem.
// Zdroj pravdy: docs/cenik.json (pravidla sezón, ceny, min. noci, horizont, kanály).
//
// Použití:
//   node scripts/cenik.mjs sezony [rok …]            hranice sezón spočítané z pravidel
//   node scripts/cenik.mjs plan [volby]              plán na kanál: úsek → cena, min. noci, otevřeno/zavřeno
//   node scripts/cenik.mjs diff docs/audit-cen/<datum>.json [volby]
//                                                    porovná snímek auditu s ceníkem (kde je kanál pod cenou)
//   node scripts/cenik.mjs svatky [rok]              státní svátky DE/NL/BE/CZ spočítané z pravidel (+ prodloužené víkendy)
//   node scripts/cenik.mjs poptavka [volby]          týden po týdnu (So–So): podíl obyvatel na prázdninách po zemích,
//                                                    svátky, sezóna a cena z ceníku; --navrh vypíše týdny, kde je
//                                                    poptávka vysoká a ceník má jen mimosezónu (kandidáti na výjimku)
//   node scripts/cenik.mjs provize [rok …]           čistý výnos → cena na kanál, co zaplatí host a co zbude nám
//   node scripts/cenik.mjs kalendar [volby]          den po dni: sezóna, cena na každém kanálu, min. noci, otevřeno,
//                                                    podíl trhů s volnem; --json pro stránku s kalendářem
// Volby:
//   --kanal booking|airbnb|fewo|echalupy   jen jeden kanál
//   --od YYYY-MM-DD --do YYYY-MM-DD        rozsah (výchozí: dnes → konec nejzazšího otevřeného dne + 1 měsíc)
//   --jen min_noci|cena|otevreno           u plánu slučovat úseky jen podle jednoho pole (plán zápisu)
//   --dnes YYYY-MM-DD                      předstírat jiné „dnes“ (kvůli horizontu)
//   --md                                   výstup jako markdown tabulka
//   --json                                 (poptavka) surová data pro report
//   --navrh                                (poptavka) jen týdny, kde poptávka ≥ prah a sezóna je „mimo“
//   --prah 40                              (poptavka) práh v % pro --navrh (výchozí 40)
//   --bez-indexace                         nepočítat roční indexaci z cenik.json (ceny v základním roce)
//   --vyjimky soubor.json                  přidat výjimky z jiného souboru (např. docs/cenik-navrh-vyjimky.json)
//
// Nic nezapisuje do extranetů. Zápis je asistovaný přes Chrome podle docs/cenova-parita-2027.md sekce 5.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cenik = JSON.parse(readFileSync(join(root, "docs/cenik.json"), "utf8"));
const svatky = JSON.parse(readFileSync(join(root, "data/svatky.json"), "utf8"));

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

// ---------- indexace (inflace) ----------
// Ceny v ceníku platí pro rok_zaklad; každý další rok se násobí (1 + rocni_pct/100), zaokrouhleno.
// Rok ceny = rok sezóny (Vánoce 2027 zůstávají v ceně 2027 i 1. 1. 2028), u mimosezóny kalendářní rok noci.
let bezIndexace = false;
function indexuj(noc, rok) {
  const ix = cenik.indexace;
  if (bezIndexace || !ix || rok <= ix.rok_zaklad) return noc;
  const z = ix.zaokrouhleni ?? 100;
  return Math.round((noc * Math.pow(1 + ix.rocni_pct / 100, rok - ix.rok_zaklad)) / z) * z;
}

function denInfo(t, sezony) {
  for (const v of cenik.vyjimky) {
    if (t >= d(v.od) && t <= d(v.do)) {
      // buď pevný čistý výnos (noc), nebo odkaz na sezónu: jako + koef, indexováno rokem noci (nebo v.rok)
      const z = cenik.indexace?.zaokrouhleni ?? 100;
      const noc = v.jako ? Math.round((indexuj(cenik.sezony[v.jako].noc, v.rok ?? t.getUTCFullYear()) * (v.koef ?? 1)) / z) * z : v.noc;
      return { sezona: `výjimka: ${v.duvod ?? ""}`.trim(), noc, min_noci: v.min_noci, premiova: !!v.premiova };
    }
  }
  for (const s of sezony) {
    if (t >= s.od && t <= s.do) {
      const def = cenik.sezony[s.sezona];
      return { sezona: `${s.sezona} ${s.rok}`, noc: indexuj(def.noc, s.rok), min_noci: def.min_noci, premiova: def.premiova };
    }
  }
  const def = cenik.sezony.mimo;
  return { sezona: "mimo", noc: indexuj(def.noc, t.getUTCFullYear()), min_noci: def.min_noci, premiova: false };
}

// ---------- státní svátky (z pravidel) ----------
function velikonoce(rok) { // neděle velikonoční (Meeus/Jones/Butcher)
  const a = rok % 19, b = Math.floor(rok / 100), c = rok % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), den = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(rok, mes - 1, den));
}
// vrací { DE: [{datum, nazev, regiony}], NL: [...], BE: [...], CZ: [...] } — regiony = null znamená celostátní
function statniSvatky(rok) {
  const v = velikonoce(rok);
  const E = (n) => addDays(v, n);
  const F = (m, dn) => d(`${rok}-${String(m).padStart(2, "0")}-${String(dn).padStart(2, "0")}`);
  // Buß- und Bettag: středa před 23. 11.
  let bub = F(11, 22); while (bub.getUTCDay() !== 3) bub = addDays(bub, -1);
  return {
    DE: [
      { datum: F(1, 1), nazev: "Neujahr" }, { datum: F(1, 6), nazev: "Heilige Drei Könige", regiony: ["BW", "BY", "ST"] },
      { datum: F(3, 8), nazev: "Frauentag", regiony: ["BE", "MV"] },
      { datum: E(-2), nazev: "Karfreitag" }, { datum: E(1), nazev: "Ostermontag" }, { datum: F(5, 1), nazev: "Tag der Arbeit" },
      { datum: E(39), nazev: "Christi Himmelfahrt" }, { datum: E(50), nazev: "Pfingstmontag" },
      { datum: E(60), nazev: "Fronleichnam", regiony: ["BW", "BY", "HE", "NW", "RP", "SL"] },
      { datum: F(8, 15), nazev: "Mariä Himmelfahrt", regiony: ["SL", "BY"] }, { datum: F(9, 20), nazev: "Weltkindertag", regiony: ["TH"] },
      { datum: F(10, 3), nazev: "Tag der Deutschen Einheit" },
      { datum: F(10, 31), nazev: "Reformationstag", regiony: ["BB", "HB", "HH", "MV", "NI", "SN", "ST", "SH", "TH"] },
      { datum: F(11, 1), nazev: "Allerheiligen", regiony: ["BW", "BY", "NW", "RP", "SL"] }, { datum: bub, nazev: "Buß- und Bettag", regiony: ["SN"] },
      { datum: F(12, 25), nazev: "1. Weihnachtstag" }, { datum: F(12, 26), nazev: "2. Weihnachtstag" },
    ],
    NL: [
      { datum: F(1, 1), nazev: "Nieuwjaar" }, { datum: E(1), nazev: "Tweede paasdag" }, { datum: F(4, 27), nazev: "Koningsdag" },
      { datum: F(5, 5), nazev: "Bevrijdingsdag" }, { datum: E(39), nazev: "Hemelvaart" }, { datum: E(50), nazev: "Tweede pinksterdag" },
      { datum: F(12, 25), nazev: "Eerste kerstdag" }, { datum: F(12, 26), nazev: "Tweede kerstdag" },
    ],
    BE: [
      { datum: F(1, 1), nazev: "Nieuwjaar" }, { datum: E(1), nazev: "Paasmaandag" }, { datum: F(5, 1), nazev: "Dag van de Arbeid" },
      { datum: E(39), nazev: "O.L.H. Hemelvaart" }, { datum: E(50), nazev: "Pinkstermaandag" }, { datum: F(7, 21), nazev: "Nationale feestdag" },
      { datum: F(8, 15), nazev: "O.L.V. Hemelvaart" }, { datum: F(11, 1), nazev: "Allerheiligen" }, { datum: F(11, 11), nazev: "Wapenstilstand" },
      { datum: F(12, 25), nazev: "Kerstmis" },
    ],
    CZ: [
      { datum: F(1, 1), nazev: "Nový rok" }, { datum: E(-2), nazev: "Velký pátek" }, { datum: E(1), nazev: "Velikonoční pondělí" },
      { datum: F(5, 1), nazev: "Svátek práce" }, { datum: F(5, 8), nazev: "Den vítězství" }, { datum: F(7, 5), nazev: "Cyril a Metoděj" },
      { datum: F(7, 6), nazev: "Jan Hus" }, { datum: F(9, 28), nazev: "Sv. Václav" }, { datum: F(10, 28), nazev: "Vznik ČSR" },
      { datum: F(11, 17), nazev: "Den boje za svobodu" }, { datum: F(12, 24), nazev: "Štědrý den" }, { datum: F(12, 25), nazev: "1. svátek vánoční" }, { datum: F(12, 26), nazev: "2. svátek vánoční" },
    ],
  };
}

// ---------- poptávka: kdo má který den volno ----------
// Den je „volný“ pro region, když je víkend, státní svátek, školní prázdniny (rozsah Po–Pá se roztáhne o víkend),
// nebo most (pracovní den sevřený mezi svátkem/prázdninami a víkendem).
const svatkyCache = new Map();
function svatkyRoku(rok) { if (!svatkyCache.has(rok)) svatkyCache.set(rok, statniSvatky(rok)); return svatkyCache.get(rok); }
function rozsahy(zeme, reg) {
  const z = svatky.zeme[zeme];
  const vse = [...(z.spolecne ?? []), ...z.regiony[reg].prazdniny];
  return vse.map((p) => {
    let od = d(p.od), do_ = d(p.do);
    if (od.getUTCDay() === 1) od = addDays(od, -2);     // pondělí → od soboty
    if (do_.getUTCDay() === 5) do_ = addDays(do_, 2);   // pátek → do neděle
    return { od, do: do_, nazev: p.nazev };
  });
}
const rozsahyCache = new Map();
function rozsahyReg(zeme, reg) { const k = zeme + reg; if (!rozsahyCache.has(k)) rozsahyCache.set(k, rozsahy(zeme, reg)); return rozsahyCache.get(k); }
function jeSvatek(t, zeme, reg) {
  return svatkyRoku(t.getUTCFullYear())[zeme].some((s) => s.datum.getTime() === t.getTime() && (!s.regiony || s.regiony.includes(reg)));
}
function volnoBezMostu(t, zeme, reg) {
  const dow = t.getUTCDay();
  if (dow === 0 || dow === 6) return true;
  if (jeSvatek(t, zeme, reg)) return true;
  return rozsahyReg(zeme, reg).some((r) => t >= r.od && t <= r.do);
}
function volno(t, zeme, reg) {
  if (volnoBezMostu(t, zeme, reg)) return true;
  const dow = t.getUTCDay(); // most: pondělí před úterním svátkem / pátek po čtvrtečním
  if (dow === 1) return jeSvatek(addDays(t, 1), zeme, reg);
  if (dow === 5) return jeSvatek(addDays(t, -1), zeme, reg);
  return false;
}
// podíl obyvatel země, pro které je den t volný (0–1)
function podilVolna(t, zeme) {
  const regs = svatky.zeme[zeme].regiony;
  let suma = 0, vol = 0;
  for (const [k, r] of Object.entries(regs)) { suma += r.obyv; if (volno(t, zeme, k)) vol += r.obyv; }
  return vol / suma;
}
// Týden So–So (noci od soboty do pátku). Skóre = průměr přes 5 pracovních nocí (Ne→Po … Čt→Pá),
// jak velká část obyvatel má následující den volno. Víkendové noci se nepočítají — má je volné každý.
function tydenPoptavka(sobota) {
  const zeme = Object.keys(svatky.zeme);
  const out = { od: sobota, do: addDays(sobota, 6), zeme: {}, svatky: [] };
  for (const z of zeme) {
    let s = 0;
    for (let i = 1; i <= 5; i++) s += podilVolna(addDays(sobota, i + 1), z); // noc So+i → den So+i+1
    out.zeme[z] = s / 5;
  }
  const vahy = svatky.vahy_zemi;
  let sv = 0, sw = 0;
  for (const z of zeme) { sv += out.zeme[z] * (vahy[z] ?? 1); sw += vahy[z] ?? 1; }
  out.mix = sv / sw;
  for (let i = 0; i < 7; i++) {
    const t = addDays(sobota, i);
    for (const z of zeme) for (const s of svatkyRoku(t.getUTCFullYear())[z]) if (s.datum.getTime() === t.getTime()) out.svatky.push(`${z}: ${s.nazev} (${cz(t).replace(/ \d{4}$/, "")})${s.regiony ? " [" + s.regiony.join(",") + "]" : ""}`);
  }
  return out;
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
// Model „cisty_vynos“: noc = čistý výnos v CZK. Portál = noc ÷ (1 − provize); přímý kanál = referenční portál × (1 − sleva).
// Starý model (koeficient) zůstává funkční, když cenik.model chybí.
function cenaKanaluCZK(noc, kanal) {
  const k = cenik.kanaly[kanal], m = cenik.model;
  if (m?.typ !== "cisty_vynos") return noc * (k.koeficient ?? 1);
  if (k.primy) return cenaKanaluCZK(noc, m.referencni_kanal) * (1 + (cenik.kanaly[m.referencni_kanal].poplatek_hosta_pct ?? 0) / 100) * (1 - m.sleva_primo_pct / 100);
  return noc / (1 - k.provize_pct / 100);
}
function cenaKanalu(noc, kanal) {
  const k = cenik.kanaly[kanal];
  let c = cenaKanaluCZK(noc, kanal);
  if (k.mena !== cenik.mena_zaklad) c = c / cenik.kurz[k.mena];
  return Math.round(c / k.zaokrouhleni) * k.zaokrouhleni;
}
// co zaplatí host (v CZK) a co zbude nám, při zaokrouhlené ceně kanálu
function rozpad(noc, kanal) {
  const k = cenik.kanaly[kanal];
  const cenaCZK = cenaKanalu(noc, kanal) * (k.mena !== cenik.mena_zaklad ? cenik.kurz[k.mena] : 1);
  return { host: Math.round(cenaCZK * (1 + (k.poplatek_hosta_pct ?? 0) / 100)), cisty: Math.round(cenaCZK * (1 - (k.provize_pct ?? 0) / 100)) };
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
bezIndexace = !!opt["bez-indexace"];
if (opt.vyjimky) cenik.vyjimky = [...JSON.parse(readFileSync(join(root, opt.vyjimky), "utf8")).vyjimky, ...cenik.vyjimky];
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
    console.log(`## ${kk.nazev} (${kk.mena}${kk.koeficient != null && kk.koeficient !== 1 ? `, koef. ${kk.koeficient}` : ""}${kk.provize_pct ? `, provize ${kk.provize_pct} %` : ""})${kk.k_potvrzeni ? " — k potvrzení: " + kk.k_potvrzeni : ""}`);
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

if (cmd === "kalendar") {
  const od = opt.od ? d(opt.od) : dnes;
  const do_ = opt.do ? d(opt.do) : d(`${rokDnes + 2}-03-31`);
  const zemeK = Object.keys(svatky.zeme);
  const dny = [];
  for (let t = od; t <= do_; t = addDays(t, 1)) {
    const info = denInfo(t, sezony);
    const zitra = addDays(t, 1); // noc t → volno následující den
    let sv = 0, sw = 0; const podil = {};
    for (const z of zemeK) { const p = podilVolna(zitra, z); podil[z] = Math.round(p * 100); sv += p * (svatky.vahy_zemi[z] ?? 1); sw += svatky.vahy_zemi[z] ?? 1; }
    const sv_dne = [];
    for (const z of zemeK) for (const x of svatkyRoku(t.getUTCFullYear())[z]) if (x.datum.getTime() === t.getTime()) sv_dne.push(`${z}: ${x.nazev}${x.regiony ? " (" + x.regiony.join(", ") + ")" : ""}`);
    dny.push({ d: iso(t), s: info.sezona, noc: info.noc, min: info.min_noci, o: ctx.h.otevreno(t) || /^výjimka/.test(info.sezona) && t <= addDays(ctx.h.konecKlouzaveho, 31), mix: Math.round((sv / sw) * 100), podil, sv: sv_dne,
      ceny: Object.fromEntries(Object.keys(cenik.kanaly).map((k) => [k, cenaKanalu(info.noc, k)])),
      host: Object.fromEntries(Object.keys(cenik.kanaly).map((k) => [k, rozpad(info.noc, k).host])), cisty: Object.fromEntries(Object.keys(cenik.kanaly).map((k) => [k, rozpad(info.noc, k).cisty])) });
  }
  if (opt.json) {
    console.log(JSON.stringify({ verze: cenik.verze, dnes: iso(dnes), kurz: cenik.kurz.EUR, indexace: bezIndexace ? null : cenik.indexace ?? null, horizont_do: iso(h.konecKlouzaveho),
      kanaly: Object.fromEntries(Object.entries(cenik.kanaly).map(([k, v]) => [k, { nazev: v.nazev, mena: v.mena, primy: !!v.primy, nevratna_sleva_pct: v.nevratna_sleva_pct ?? null, provize_pct: v.provize_pct ?? null, poplatek_hosta_pct: v.poplatek_hosta_pct ?? 0 }])), dny }));
    process.exit(0);
  }
  const ks = Object.keys(cenik.kanaly);
  tabulka(["noc", "den", "sezóna", ...ks.map((k) => cenik.kanaly[k].nazev), "min", "stav", "volno %"], dny.map((x) => [x.d, ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"][d(x.d).getUTCDay()], x.s, ...ks.map((k) => sMenou(x.ceny[k], k)), x.min, x.o ? "otevřeno" : "ZAVŘENO", x.mix]), opt.md);
  process.exit(0);
}

if (cmd === "provize") {
  const roky = pos.length ? pos.map(Number) : [rokDnes, rokDnes + 1, rokDnes + 2];
  console.log(`Model ${cenik.model?.typ ?? "koeficient"} · kurz ${cenik.kurz.EUR} Kč/€ · indexace ${cenik.indexace.rocni_pct} %/rok od ${cenik.indexace.rok_zaklad} · přímo o ${cenik.model?.sleva_primo_pct} % levněji než ${cenik.model?.referencni_kanal}\n`);
  const radky = [];
  for (const rok of roky) for (const sz of ["leto", "vanoce", "mimo"]) {
    const noc = indexuj(cenik.sezony[sz].noc, rok);
    for (const k of Object.keys(cenik.kanaly)) {
      const r = rozpad(noc, k), kk = cenik.kanaly[k];
      radky.push([rok, sz === "leto" ? "sezóna (léto, zima)" : sz, kk.nazev, `${kk.provize_pct} %`, sMenou(cenaKanalu(noc, k), k), `${r.host.toLocaleString("cs-CZ")} Kč`, `${r.cisty.toLocaleString("cs-CZ")} Kč`, `${(((r.cisty - noc) / noc) * 100).toFixed(1)} %`]);
    }
  }
  tabulka(["rok", "sezóna", "kanál", "provize", "cena v kanálu", "host zaplatí", "nám zbude", "vs. cíl"], radky, opt.md);
  process.exit(0);
}

if (cmd === "svatky") {
  const roky = pos.length ? pos.map(Number) : [rokDnes + 1];
  for (const rok of roky) {
    console.log(`Státní svátky ${rok} (Velikonoce ${cz(velikonoce(rok))}). Pracovní den + svátek = prodloužený víkend.\n`);
    const sv = statniSvatky(rok);
    const radky = [];
    for (const z of Object.keys(sv)) for (const s of sv[z].sort((a, b) => a.datum - b.datum)) {
      const dow = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"][s.datum.getUTCDay()];
      const most = s.datum.getUTCDay() === 2 ? "most Po" : s.datum.getUTCDay() === 4 ? "most Pá" : (s.datum.getUTCDay() === 1 || s.datum.getUTCDay() === 5) ? "dlouhý víkend" : "";
      radky.push([z, iso(s.datum), dow, s.nazev, s.regiony ? s.regiony.join(",") : "celostátní", most]);
    }
    tabulka(["země", "datum", "den", "svátek", "kde", "dopad"], radky, opt.md);
    console.log();
  }
  process.exit(0);
}

if (cmd === "poptavka") {
  const od = satOnOrBefore(opt.od ? d(opt.od) : dnes);
  const do_ = opt.do ? d(opt.do) : d(`${rokDnes + 2}-12-31`);
  const prah = Number(opt.prah ?? 40) / 100;
  const tydny = [];
  for (let t = od; t <= do_; t = addDays(t, 7)) {
    const w = tydenPoptavka(t);
    const info = denInfo(addDays(t, 3), sezony); // úterní noc reprezentuje týden
    tydny.push({ ...w, sezona: info.sezona, noc: info.noc, min_noci: info.min_noci, premiova: info.premiova, otevreno: h.otevreno(t) });
  }
  if (opt.json) {
    console.log(JSON.stringify({ verze_ceniku: cenik.verze, verze_svatku: svatky.verze, dnes: iso(dnes), vahy_zemi: svatky.vahy_zemi,
      tydny: tydny.map((w) => ({ od: iso(w.od), do: iso(w.do), zeme: Object.fromEntries(Object.entries(w.zeme).map(([k, v]) => [k, Math.round(v * 100)])), mix: Math.round(w.mix * 100), svatky: w.svatky, sezona: w.sezona, noc: w.noc, min_noci: w.min_noci, premiova: w.premiova, otevreno: w.otevreno })) }, null, 1));
    process.exit(0);
  }
  const pct = (x) => `${Math.round(x * 100)} %`.padStart(5);
  const vyber = opt.navrh ? tydny.filter((w) => w.mix >= prah && w.sezona === "mimo") : tydny;
  console.log(`Poptávka podle prázdnin a svátků (data ${svatky.verze}, ceník ${cenik.verze}${cenik.indexace && !bezIndexace ? `, indexace ${cenik.indexace.rocni_pct} %/rok od ${cenik.indexace.rok_zaklad}` : ""}).`);
  console.log(`Týden = noci So–Pá; % = podíl obyvatel země, kteří mají v pracovních dnech toho týdne volno (prázdniny, svátky, mosty).`);
  if (opt.navrh) console.log(`Jen týdny s mixem ≥ ${Math.round(prah * 100)} % v mimosezóně — kandidáti na výjimku v cenik.json.`);
  console.log();
  tabulka(["příjezd So", "DE", "NL", "BE", "CZ", "mix", "sezóna", "noc (Kč)", "svátky v týdnu"], vyber.map((w) => [
    iso(w.od), pct(w.zeme.DE), pct(w.zeme.NL), pct(w.zeme.BE), pct(w.zeme.CZ), pct(w.mix), w.sezona, w.noc.toLocaleString("cs-CZ"), w.svatky.map((x) => x.replace(/ \[.*\]/, "")).join("; "),
  ]), opt.md);
  if (opt.navrh) {
    console.log(`\nŠablona výjimek (cena = mimosezóna, doplň):`);
    for (const w of vyber) console.log(`  {"od":"${iso(w.od)}","do":"${iso(w.do)}","noc":${w.noc},"min_noci":${w.min_noci},"duvod":"poptávka ${Math.round(w.mix * 100)} % — ${w.svatky[0] ?? "prázdniny"}"}`);
  }
  process.exit(0);
}

console.error("Neznámý příkaz. Použití: node scripts/cenik.mjs sezony|plan|diff|provize|svatky|poptavka|kalendar …  (viz hlavička souboru)");
process.exit(1);
