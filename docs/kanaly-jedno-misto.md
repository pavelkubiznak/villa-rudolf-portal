# Ceny a kalendáře z jednoho místa — co je reálně možné

Stav k 13. 8. 2026. Navazuje na [`cenova-parita-2027.md`](cenova-parita-2027.md) a na první audit.
Otázka zněla: dá se to spravovat z jednoho místa, ideálně přes API?

## 1. Krátká odpověď

**Přímé API k vlastnímu objektu nedostaneme ani u jednoho z velkých kanálů.** Není to
technický problém, je to obchodní rozhodnutí platforem:

| Kanál | API existuje? | Dostane ho majitel objektu? | iCal export/import |
|---|---|---|---|
| Booking.com | ano (Connectivity API) | ne — jen certifikovaní connectivity partneři, přihlášky navíc pozastavené | pravděpodobně ano, **ověřit v extranetu** |
| Airbnb | ano (partnerské API) | ne — jen schválení software partneři, příjem žádostí pozastaven | ano |
| FeWo-direkt / Vrbo | ano | ne — jen přes schválené integrační partnery | ano |
| e-chalupy.cz | ne | — | **ano** (export i import v klientské administraci) |
| megaubytko.cz | ne | — | **ano** (základní i kompletní export) |

**Channel manager (Beds24, Smoobu) zamítnut** — rozhodnutí Pavel, 13. 8. 2026. Důvody:
Lodgify už jednou nepomohl, paušál ~8–15 €/měs. je proti přínosu vysoký, a hlavně:
**žádný channel manager nepodporuje e-chalupy ani megaubytko**, což jsou 2 z 5 kanálů —
a jeden z nich je ten bez provize. Zaplatili bychom předplatné za sjednocení tří kanálů
a dva bychom stejně řešili ručně. Tím je varianta uzavřená, dál se k ní nevracíme.

**Co postavit jde a co doporučuju: vlastní iCal hub** (kapitola 3). Neřeší ceny —
ty zůstávají na auditu a asistovaném zápisu — ale řeší chaos v kalendářích a stojí 0 Kč navíc.

## 2. Pět kanálů, ne tři

| Kanál | Provize | Měna ceníku | Role |
|---|---|---|---|
| Booking.com | ~15 % | EUR | hlavní objem |
| Airbnb | ~3 % hostitel | CZK | druhý objem |
| FeWo-direkt | ~8 % | EUR | německá klientela |
| e-chalupy.cz | **0 %** (paušál ~2 000 Kč/rok) | CZK | česká klientela, slušný objem |
| megaubytko.cz | ověřit | CZK | okrajový, 1–2 skupiny/rok |

**E-chalupy do hrubé parity nepatří.** Při nulové provizi vynese stejná cena zhruba o 15 %
víc než na Bookingu. Číselně: Booking 569 € hrubého ≈ 484 € čistého; aby e-chalupy
vynesly stejných 484 €, stačila by cena ~11 900 Kč místo ~13 900 Kč. Máš tedy na výběr:

- **A) stejná cena pro hosta všude** — rozdíl v provizi si necháš jako marži. Doporučuju:
  e-chalupy podle tebe zákazníky vozí i tak, takže není co dotovat.
- **B) nižší cena na e-chalupách** — máš ji „zadarmo", pokud bys chtěl přitopit poptávce.

Pozor, dřív to bylo riskantní kvůli paritním klauzulím Bookingu. **Od 2. 12. 2024 to
riziko není** — Booking.com je podle DMA „gatekeeper" a paritní klauzule mu byly v EU
zakázané; nesmí ti kvůli nižší ceně jinde zvednout provizi ani stáhnout nabídku.
V ceníku to znamená koeficient na kanál, ne jednu cenu pro všechny.

## 3. Vlastní iCal hub — návrh

### Proč

Dnes si portály posílají obsazenost **každý s každým**. Pět kanálů = až dvacet vazeb,
v nich smyčky a ozvěny: týž pobyt dorazí do FeWo dvěma cestami a vyrobí červený
„Konflikt", který není konflikt. Řešení není rychlejší synchronizace, ale **jiná
topologie** — hvězda místo sítě:

```
Booking ─┐                            ┌─→ Booking      (feed bez událostí z Bookingu)
Airbnb  ─┤                            ├─→ Airbnb       (feed bez událostí z Airbnb)
FeWo    ─┼─→  HUB (Hetzner, á 10 min) ─┼─→ FeWo         …atd.
e-chalupy┤    sloučí + odstraní duplicity   ├─→ e-chalupy
megaubytko┘   jediný zdroj pravdy      └─→ megaubytko
```

Klíčový trik je ten **filtr na výstupu**: feed, který dostane Airbnb, neobsahuje
události pocházející z Airbnb. Tím zmizí ozvěny a s nimi celá třída falešných konfliktů.
Přesně tohle dělají channel managery uvnitř — jen my to uděláme pěti řádky kódu
a bez předplatného.

### Kde to poběží

Na Hetzneru, kde už cron běží (`refresh-weather.sh` každých 12 h commituje `forecast.json`).
Stejný vzorec, jen častěji:

1. cron á 10 min stáhne 5 exportních ICS URL,
2. sloučí je do `obsazenost.json` — každá událost nese `{od, do, zdroj, uid}`,
3. vygeneruje 5 výstupních `.ics`, každý bez událostí z cílového kanálu,
4. uloží je do statické složky nginx na Hetzneru (např. `cal.villarudolf.com`),
5. jednou denně commitne snímek do repa — kvůli historii a auditu.

Publikovat se to **musí ven** (portály si feed samy stahují), takže n8n na localhostu
na to nestačí. Statický soubor za nginx to řeší bez další služby. Alternativa —
commitovat `.ics` do repa a servírovat přes GitHub Pages — funguje taky, ale dělá
144 commitů denně a přidává cache Pages; radši nginx.

### Přepojení kanálů (jednorázová práce)

V každém extranetu **smazat všechny stávající importy** a přidat jediný — naši URL.
Dokud tam zůstane byť jedna stará křížová vazba, chaos pokračuje. Tohle je vlastně
celá migrace: jeden večer klikání a týden pozorování.

### Na co si dát pozor

- **e-chalupy: exportovat vždy variantu „včetně podrobností".** Export bez detailů
  obsahuje podle dokumentace chybná data a působí falešné rezervace — je dost možné,
  že právě odsud pocházejí ty „Konflikty" ve FeWo.
- **e-chalupy odmítají překrývající se rezervace**, takže import z hubu se tam může
  tiše nepropsat. Hub musí hlásit, když se stav po zápisu nerovná očekávání.
- **megaubytko načítá import po ~2 hodinách** (údaj z roku 2024).
- **Žádné PII ven.** Vstupní feedy můžou nést jména hostů, náš výstupní feed nesmí —
  jen `Obsazeno` + datum + zdroj. Je to veřejná URL.
- **Booking.com import iCalu ověřit** přímo v extranetu; u některých typů objektů
  ho Booking nenabízí a tlačí na channel managera.

### Co to vyřeší a co ne

Vyřeší:

- jedno místo, kde je obsazenost pravdivá a viditelná (dnes takové místo neexistuje),
- smyčky, ozvěny a falešné „Konflikty",
- **pokrytí všech pěti kanálů** včetně dvou českých, které žádný channel manager neumí,
- o nové rezervaci víš do 10 minut → dá se na ni upozornit,
- přirozené místo, kam pak přibude ceník.

Nevyřeší:

- **ceny.** iCal přenáší jen obsazenost, cena v něm není. Parita zůstává na auditu
  a asistovaném zápisu — to jsou dvě oddělené úlohy a nesmí se plést dohromady.
- **zpoždění.** Portály si náš feed stahují po svém (řádově hodiny), a to neovlivníme.
  Okno pro dvojitý prodej se zmenší, ale nezavře. Hub je rychlý na čtení, ne na zápis.
- Riziko chyby v hubu = dvojitý prodej. Proto: hub nikdy nemaže blok bez potvrzení
  a denně hlásí každý termín, kde se portál s hubem neshodne.

### Odhad práce

Skript (stažení, parsování ICS, sloučení, výstup) je bez závislostí půlden. Přepojení
kanálů večer. Pak týden pozorování a doladění. Audit cen v tomhle repu zůstává
nezávislou kontrolou — hub tvrdí, co má být, audit přečte, co doopravdy je.

## 4. Otevřená rozhodnutí

1. Pořadí: napřed hub, nebo napřed doměřit Booking a srovnat ceny? (Doporučuju hub —
   je nezávislý na tvých cenových rozhodnutích a ubírá riziko.)
2. e-chalupy a megaubytko: varianta A (stejná cena, marže tobě), nebo B (levněji)?
3. Kde bude hub veřejně viset — subdoména na Hetzneru?

---

Zdroje (ověřeno 12.–13. 8. 2026):
[Booking.com Connectivity docs](https://developers.booking.com/connectivity/docs) ·
[Airbnb API pro hostitele](https://www.smoobu.com/en/blog/airbnb-api/) ·
[iCal na e-chalupy.cz](https://www.trevlix.cz/cz/icalendar-e-chalupy/) ·
[iCal na megaubytko.cz](https://www.trevlix.cz/cz/megaubytko/) ·
[DMA a konec paritních klauzulí](https://digital-strategy.ec.europa.eu/en/news/booking-must-now-comply-digital-markets-act)
