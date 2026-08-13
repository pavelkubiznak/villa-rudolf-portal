# Ceny a kalendáře z jednoho místa — co je reálně možné

Stav k 13. 8. 2026. Navazuje na [`cenova-parita-2027.md`](cenova-parita-2027.md) a na první audit.
Otázka zněla: dá se to spravovat z jednoho místa, ideálně přes API?

## 1. Krátká odpověď

**Přímé API k vlastnímu objektu nedostaneme ani u jednoho z velkých kanálů.** Není to
technický problém, je to obchodní rozhodnutí platforem:

| Kanál | API existuje? | Dostane ho majitel objektu? | iCal export/import |
|---|---|---|---|
| Booking.com | ano (Connectivity API) | ne — jen certifikovaní connectivity partneři, přihlášky navíc pozastavené | **ano** — Rates & Availability → Sync calendars (ověřeno 13. 8. 2026) |
| Airbnb | ano (partnerské API) | ne — jen schválení software partneři, příjem žádostí pozastaven | ano |
| FeWo-direkt / Vrbo | ano | ne — jen přes schválené integrační partnery | ano |
| e-chalupy.cz | ne | — | **ano** (export i import v klientské administraci) |
| megaubytko.cz | ne | — | **ano** (základní i kompletní export) |

**Channel manager (Beds24, Smoobu) zamítnut** — rozhodnutí Pavel, 13. 8. 2026. Důvody:
Lodgify už jednou nepomohl, paušál je proti přínosu vysoký (Beds24 reálně od 16 €/měs.,
ne 8–9 € podle srovnávačů — ověřeno na ceníku), a hlavně:
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

### Proč — a co je dnes špatně

**Kompletní zmapování všech pěti extranetů, 13. 8. 2026 (čtení přes Chrome):**

| Kanál | Importuje z | Interval |
|---|---|---|
| Booking.com | airbnb.cz ✅ · fewo-direkt.de ✅ · **Lodgify ⚠️ „Import needed"** · e-chalupy.cz ✅ | — |
| FeWo-direkt | Airbnb · hledamchatu.cz · Booking.com · e-chalupy | min. á 30 min |
| e-chalupy | hladamchatu.sk · booking.com · megaubytko.cz · **fewo-direkt.de ❌ „chyba při importu"** · airbnb.cz | á ~4 h |
| Airbnb | **jen e-chalupy** | — |
| megaubytko | **jen e-chalupy** | á 2 h |

**Hvězda platí jen pro Airbnb a megaubytko.** Booking a FeWo mezi sebou i s e-chalupami
sdílejí obsazenost napřímo, takže tam vede víc tras najednou. Proto ty konflikty —
ověřeno na 17.–20. 6. 2027: popup v FeWo vypisuje tentýž pobyt dvakrát, jednou ze zdroje
`Airbnb` a jednou z `e-chalupy`. V kalendáři e-chalup je ta rezervace vedená jako
**importovaná z Airbnb**, ne jako vlastní.

**Klíčové ověření: e-chalupy přeposílají i importované rezervace.** Jejich nápověda
tvrdí, že export obsahuje „pouze rezervace vzniklé na e-chalupy.cz", ale stažení
základního exportu ukazuje opak — jsou v něm i termíny 17.–20. 6. 2027 (z Airbnb)
a 3.–10. 7. 2027 (z Bookingu). Relé tedy funguje, ale na nezdokumentovaném chování,
které se může kdykoli změnit.

**Dvě přerušené vazby právě teď:**

1. e-chalupy **nedokážou načíst FeWo** („chyba při importu, bude ověřeno správcem").
   Rezervace z FeWo se tedy nedostanou do e-chalup → ani na Airbnb a megaubytko,
   které berou jen z e-chalup. Konkrétní důsledek: tentativní rezervace Sandry B.
   na 27. 12. 2027 – 3. 1. 2028 **v exportu e-chalup není**, zatímco Airbnb ty dny prodává.
2. V Bookingu visí **nedokončené propojení na Lodgify** — pozůstatek opuštěného nástroje.

Objevil se i **šestý kanál `hledamchatu.cz` / `hladamchatu.sk`** — importuje z něj
FeWo i e-chalupy. Ověřit, jestli je aktivní.

### Levná náprava před stavbou hubu

Protože e-chalupy relé opravdu dělají, jde velká část bolesti odstranit hned a bez kódu:
spravit import FeWo do e-chalup, smazat zbytek po Lodgify a v Bookingu a FeWo zrušit
duplicitní přímé importy tak, aby každý kanál bral obsazenost **jednou cestou**.
Tím by měly konflikty zmizet. Teprve co zbude potom, je práce pro hub.

Zbývající důvody pro vlastní hub:

1. **Střed tiše zahazuje.** e-chalupy odmítají překrývající se rezervace — když už tam
   blok z jednoho kanálu je, import z druhého se nepropíše a nikdo to neohlásí.
   Systém, který za určitých okolností událost nepřevezme, nemůže být zdrojem pravdy.
2. **Střed neumí filtrovat na výstupu.** Vydává jeden feed pro všechny, takže Airbnb
   dostane zpátky vlastní rezervace jako cizí blok. Odsud ozvěny a červené „Konflikty".
3. **Dvě přeskočení za sebou.** Nejpomalejší článek je samo relé — e-chalupy načítají
   á ~4 hodiny, teprve pak si to berou ostatní (FeWo á 30 min, megaubytko á 2 h).
4. **Do středu není vidět.** Výpis rezervací je omezený na 12 měsíců od data ve filtru,
   žádná historie, žádné upozornění na novou rezervaci, žádný audit.
5. **Střed je cizí systém — a právě selhal.** Import FeWo do e-chalup je v chybě
   a nikdo tě neupozornil. Navíc relé stojí na nezdokumentovaném chování (viz výše).
6. **Osobní údaje.** Detailní export nese jména hostů do všech ostatních portálů.

Vlastní hub nemění topologii — hvězda je správná — ale mění vlastnosti středu:
filtr na výstupu, čtení á 10 minut, nic se tiše nezahazuje, výstup bez osobních údajů,
historie a upozornění.

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
- **zpoždění na výstupu.** Portály si náš feed stahují po svém (megaubytko ~2 h,
  ostatní řádově hodiny) a to neovlivníme. Zrychlí se jen první přeskočení —
  z portálové rychlosti na 10 minut — takže z „hodiny + hodiny" bude
  „10 minut + hodiny". Okno pro dvojitý prodej se zhruba půlí, ale nezavře.
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
