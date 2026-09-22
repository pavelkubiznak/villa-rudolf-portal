# Název „Villa Rudolf“ na všech kanálech — stav a návrh

Stav k 17. 9. 2026. **Jen návrh — v extranetech nebylo nic změněno.** Zápis až po výslovném
souhlasu Pavla, kanál po kanálu (postup v kapitole 5).

Zadání (Pavel, 17. 9. 2026): všude „Villa Rudolf, Svoboda nad Úpou“ a za tím, kde to portál dovolí,
lákadla — bazén, sauna, ohniště, kulečník. Cíl: host si název zapamatuje, najde villarudolf.com
a objedná přímo (přímá cena je v `docs/cenik.json` 10 % pod Bookingem, storno si řídí Pavel sám).

## 1. Co je dnes kde (ověřeno čtením 17. 9. 2026)

| Kanál | Dnešní název | Obsahuje „Villa Rudolf“? | Jak ověřeno |
|---|---|---|---|
| Booking.com (12558473) | `Villa with pool, sauna, pergola, park, and playground` — jediné znění, anglicky i na české verzi webu | ne | veřejný web; **extranet byl odhlášený**, viz 2.1 |
| Airbnb (1122389326464885565) | cs `Vila s bazénem, saunou, pergolou, hřištěm a parkem` (50/50) · de `Villa mit Pool, Sauna, Pergola, Spielplatz & Park` · en `Villa with pool, sauna, pergola, playground, park` · nl `Villa met zwembad, sauna, pergola, park, speeltuin` · + es, fr, it, hu, pl, pt, bg, ru, uk, zh (celkem 14 jazyků) | ne | editor nabídky |
| FeWo-direkt / Vrbo (5510810) | de (hlavní) `Villa mit beheiztem Swimmingpool, Sauna, Pergola, Park und Spielplatz.` (70/80) · en `Villa with heated swimming pool, sauna, pergola, park and playground` · **nl už dnes `Villa Rudolf – Verwarmd zwembad, sauna & grote tuin`** · další překlady fr, it, ja, pt, es nepřečteny | jen nl | Unterkunfts-Editor + vrbo.com |
| e-chalupy (18852) | `Villa Rudolf`; portál sám doplňuje „Svoboda nad Úpou – Krkonoše“ | ano | veřejný web |
| megaubytko | `Villa Rudolf` (megaubytko.cz/villa-rudolf) | ano | veřejný web |
| czech-cottages.com (anglické zrcadlo e-chalup) | `Villa Rudolfův Dvůr` | **starý název** | výsledek vyhledávání — ověřit a nechat opravit |
| Google Mapy | `Rudolfův dvůr`, 4,4 (54), nenárokovaný profil | **starý název** | Mapy Google; souvislosti v memory `google-profil-rudolfuv-dvur` |

Postřeh z výpisu vil na Bookingu pro Svobodu nad Úpou: konkurence se jmenuje jménem
(„Vila Sluneční stráň“, „Vila Lumina“, „Pension nad Truhlárnou“). My jsme mezi nimi jediní
s popisnou větou místo jména — nejde si nás zapamatovat ani dohledat.

## 2. Kde se název mění, limity, jazyky

### 2.1 Booking.com — NEOVĚŘENO v extranetu
`admin.booking.com` byl 17. 9. 2026 odhlášený (přihlašovací stránka); heslo zadává jen Pavel.
Až bude přihlášený, ověřit proklikem z admin.booking.com (nikdy URL bez `ses`):

- Property → **General info & property status** (dřív „View your descriptions“ / „Property name“) —
  je tam pole názvu, nebo jen odkaz „request a change“ přes Inbox → Booking.com messages?
- Podle veřejné nápovědy partnerů: název není marketingové pole, změna jde ke schválení,
  název má odpovídat skutečnému jménu objektu (ideálně tomu, co je na domě / webu / Googlu).
  Výčet vybavení v názvu je proti jejich zásadám — to, že dnešní popisný název prošel, je spíš
  náhoda z registrace. **Jedno znění pro všechny jazyky**, lokalizace není.
- Město doplňuje Booking sám (řádek pod názvem), takže „Svoboda nad Úpou“ v názvu je nadbytečné
  a schvalovatel ho může škrtnout.

### 2.2 Airbnb — ověřeno
- Nabídky → Editor nabídky → **Název** (`/hosting/listings/editor/<id>/details/title`).
- Limit **50 znaků**, ve výsledcích hledání se zobrazuje zhruba prvních 32.
- **Samostatné pole pro každý jazyk**, dnes vyplněno 14 jazyků včetně cs/de/en/nl/pl. Prázdný jazyk
  Airbnb dopřeloží strojově — vlastní jméno pak může zkomolit, proto vyplnit ručně aspoň cs/de/en/nl/pl.
- „Interní název“ (40 znaků, dnes `Celý dům`) hosté nevidí — nechat.
- Bez schvalování, změna je okamžitá. Vlastní odkaz už existuje: `airbnb.cz/h/rudolf`.
- Airbnb u nabídky píše „Trutnov“, ne Svoboda nad Úpou — město v názvu tu tedy dává smysl.

### 2.3 FeWo-direkt / Vrbo — ověřeno
- Unterkunft → Unterkunfts-Editor → Unterkunftsbeschreibung → **Überschrift und Beschreibung**
  (`/supply/pe/description/headlineDescription?propertyId=106405316`).
- **Überschrift max. 80 znaků** (min. 20), „zobrazuje se ve výsledcích hledání a nahoře v inzerátu“.
- Hlavní jazyk je němčina; překlady titulku + popisu: en, fr, it, ja, nl, pt, es. **Čeština není.**
- Pole „Name der Unterkunft“ (Ihre Unterkunft, 30 znaků, dnes prázdné) je **jen interní** — host ho nevidí.
  Klidně vyplnit „Villa Rudolf“, ale nic to neřeší.
- Pozor při práci v editoru: vedle „Anzeigen“ u každého překladu je hned „Löschen“ a stránka po
  načtení poskakuje. Klikat přes odkaz prvku, ne přes souřadnice. Dialog překladu zavírat „Schließen“.

### 2.4 e-chalupy a megaubytko
Název je už správně. Místo doplňuje portál sám; lákadla patří do perexu, ne do názvu (katalog
řadí podle jména objektu). Jazykové verze na stránce objektu nejsou. **Bez změny.**
Jediná věc: `czech-cottages.com` (anglická verze e-chalup) ukazuje „Villa Rudolfův Dvůr“ —
ověřit v klientské administraci, jestli je tam zvláštní pole pro cizojazyčný název; jinak napsat podpoře.

### 2.5 Google profil
Zásady Googlu pro název firmy: jen skutečné jméno, **bez klíčových slov a bez města** — za „Villa
Rudolf – bazén, sauna“ hrozí pozastavení profilu. Správně je holé `Villa Rudolf`. Podmínkou je
profil nárokovat (dnes nenárokovaný „Rudolfův dvůr“, web `dvur.tripcombined.com`); při nárokování
zároveň přepsat web na villarudolf.com a telefon. Nemazat — nese naše recenze.
Tohle je z hlediska cíle (host googlí „Villa Rudolf“) **nejdůležitější krok ze všech** a nic nestojí.

## 3. Návrh znění

**Rozhodnutí Pavla 21. 9. 2026: jednotný název `Villa Rudolf, Svoboda nad Úpou` (30 znaků) všude,
kde to jde — na Airbnb a FeWo s lákadly za dvojtečkou/pomlčkou (vidí je host až v detailu), na Bookingu požádat o plné znění a mít holé „Villa Rudolf“ jako zálohu. Město v názvu
je záměrně: portály jinak dopisují „Trutnov“. Výjimky: Google profil (jen „Villa Rudolf“, město do
názvu Google nepovoluje) a e-chalupy/megaubytko (město dopisují samy, název nechat). Na Airbnb
vyplnit stejný řetězec ručně do všech 14 jazyků, aby ho strojový překlad nezkomolil.**
Varianty níže (A/B, lákadla) zůstávají jen jako záloha pro případ, že by některý portál plné znění nevzal.


Pořadí lákadel pro skupinu 16+: **bazén** (krytý vyhřívaný — filtr na všech portálech, funguje
i za deště) → **sauna** (filtr, táhne zimu) → **ohniště** (společný večer velké skupiny) →
**kulečník**. Kde je místo, stojí za zvážení přidat kapacitu („22 Pers.“) — kdo hledá pro 16+,
nejdřív zjišťuje, jestli se vejde; kulečník je z těch pěti údajů nejslabší a vypadává první.
Počty znaků přepočítány skriptem.

### 3.1 Booking.com
| | Znění | Pozn. |
|---|---|---|
| **Žádat** | `Villa Rudolf, Svoboda nad Úpou` | jednotné znění; město v názvu Booking jinde toleruje („Villa Svoboda na Úpou by Interhome“) |
| Záloha | `Villa Rudolf` | kdyby schvalovatel město škrtl — pořád splňuje cíl |
| Nežádat | cokoli s „pool, sauna…“ | proti zásadám, zbytečné zamítnutí |

Lákadla na Bookingu nesou fotky, vybavení (filtry) a popis generovaný z vybavení — ne název.

### 3.2 Airbnb (limit 50; prvních ~32 = celé „Villa Rudolf, Svoboda nad Úpou“)
**Finální znění (Pavel, 21. 9. 2026):** jméno + město + lákadla za dvojtečkou (pomlčka s mezerami
se nevejde). Ve výpisu je vidět jen jméno a město, lákadla až v detailu — nic nestojí, nic se neztratí.
Tři lákadla se vejdou jen v cs/de/en/pl, jinde dvě. Jméno a město všude stejně, i v azbuce latinkou.

| Jazyk | Znění | Znaků |
|---|---|---|
| cs | `Villa Rudolf, Svoboda nad Úpou: bazén, sauna, park` | 50 |
| de | `Villa Rudolf, Svoboda nad Úpou: Pool, Sauna, Park` | 49 |
| en | `Villa Rudolf, Svoboda nad Úpou: pool, sauna, park` | 49 |
| pl | `Villa Rudolf, Svoboda nad Úpou: basen, sauna, park` | 50 |
| nl | `Villa Rudolf, Svoboda nad Úpou: zwembad, sauna` | 46 |
| es | `Villa Rudolf, Svoboda nad Úpou: piscina, sauna` | 46 |
| fr | `Villa Rudolf, Svoboda nad Úpou: piscine, sauna` | 46 |
| it | `Villa Rudolf, Svoboda nad Úpou: piscina, sauna` | 46 |
| pt | `Villa Rudolf, Svoboda nad Úpou: piscina, sauna` | 46 |
| hu | `Villa Rudolf, Svoboda nad Úpou: medence, szauna` | 47 |
| bg | `Villa Rudolf, Svoboda nad Úpou: басейн, сауна` | 45 |
| ru | `Villa Rudolf, Svoboda nad Úpou: бассейн, сауна` | 46 |
| uk | `Villa Rudolf, Svoboda nad Úpou: басейн, сауна` | 45 |
| zh | `Villa Rudolf, Svoboda nad Úpou：泳池、桑拿、公园` | 39 |

Pavel zapisuje ručně v editoru Airbnb (21. 9. 2026 začal češtinou). Pozor na háček v „bazén“.

### 3.3 FeWo-direkt / Vrbo (limit 80)
**Základ: `Villa Rudolf, Svoboda nad Úpou` (30) ve všech překladech.** Protože limit je 80 a nic se
neusekne, jde za jméno bez újmy přidat lákadla — např. de `Villa Rudolf, Svoboda nad Úpou – Pool, Sauna,
Feuerstelle, Billard` (66). Rozhodnutí, zda lákadla ano/ne, je na Pavlovi; pro jednotnost je čistší bez.
Plné varianty s kapacitou:
| Jazyk | Znění | Znaků |
|---|---|---|
| de (hlavní) | `Villa Rudolf, Svoboda nad Úpou – Pool, Sauna, Feuerstelle, Billard \| 22 Pers.` | 77 |
| en | `Villa Rudolf, Svoboda nad Úpou – pool, sauna, fire pit, billiards \| sleeps 22` | 77 |
| nl | `Villa Rudolf, Svoboda nad Úpou – zwembad, sauna, vuurplaats, biljart \| 22 pers.` | 79 |
| fr | `Villa Rudolf, Svoboda nad Úpou – piscine, sauna, brasero, billard \| 22 pers.` | 76 |
| it | `Villa Rudolf, Svoboda nad Úpou – piscina, sauna, braciere, biliardo \| 22 pers.` | 78 |
| es | `Villa Rudolf, Svoboda nad Úpou – piscina, sauna, hoguera, billar \| 22 pers.` | 75 |
| pt | `Villa Rudolf, Svoboda nad Úpou – piscina, sauna, fogueira, bilhar \| 22 pess.` | 76 |

„Riesengebirge“ se do 80 znaků s městem a čtyřmi lákadly nevejde (81). Varianta pro DE, pokud má
pohoří přednost před kapacitou: vypustit „| 22 Pers.“ a Billard →
`Villa Rudolf, Svoboda nad Úpou (Riesengebirge) – Pool, Sauna, Feuerstelle` (73).
Japonský překlad doporučuju smazat nebo nechat být — trh nulový.
Kapacitu „22“ sladit s max. počtem hostů nastaveným na FeWo (popis říká 19 + 3 přistýlky).

### 3.4 e-chalupy, megaubytko, Google
`Villa Rudolf` — beze změny / po nárokování profilu. Lákadla na e-chalupách dát na začátek perexu.

### 3.5 Bez ohledu na název
Na všech portálech začít **popis** větou se jménem („Villa Rudolf je…“) — Airbnb i FeWo to už mají.
A mít jméno fyzicky na domě / v knize hosta / na Wi-Fi kartě: opakovaný host, který jméno zná,
je ten, kdo příště objedná přímo. To je v pravidlech všech portálů v pořádku.

## 4. Rizika

1. **Pozice ve vyhledávání portálu.** Airbnb ani Vrbo titulek jako řadicí signál oficiálně neuvádějí
   (řadí cena, dostupnost, hodnocení, konverze); titulek působí nepřímo přes proklik z výpisu.
   „Villa Rudolf, Svoboda nad Úpou –“ sní celých 32 viditelných znaků na Airbnb, takže ve výpisu
   zmizí „bazén, sauna“ — dnes to jediné, co náš řádek odlišuje textem. Bazén je ale na titulní
   fotce. Opatření: měnit **po jednom kanálu**, zapsat datum, a po 3–4 týdnech porovnat zobrazení →
   prokliky → poptávky (Airbnb Statistiky, FeWo Vermietungserfolg). Když proklik spadne, přejít na
   variantu B. Neměnit těsně před hlavním rezervačním oknem (leden–únor na léto), ideální je teď.
2. **Schvalování na Bookingu.** Může trvat dny, můžou chtít doklad (fotka cedule, web, faktura
   s názvem). Zamítnutí nic nerozbije, zůstane starý název. Změna názvu nemění URL ani recenze.
   Riziko je jen v tom žádat o lákadla v názvu — proto žádat holé „Villa Rudolf“.
3. **Pravidla proti odvádění hostů.** Všechny tři portály zakazují v názvu, popisu, fotkách
   i zprávách před rezervací kontakty, URL a výzvy typu „najdete nás na webu / přímo levněji“.
   Samotné jméno domu je v pořádku (nl titulek na FeWo s ním běží bez problému). Tedy: **nikdy**
   „villarudolf.com“, „.com“, „rezervujte přímo“, telefon; ani ve fotkách (logo s URL). Sankce:
   skrytí inzerátu, u Airbnb až zrušení účtu. Parita cen už riziko není (DMA, viz `kanaly-jedno-misto.md`).
4. **Aby to fungovalo, musí jméno vést k nám.** Dnes hledání „Villa Rudolf Svoboda nad Úpou“ vede
   na e-chalupy a Google Mapy ukazují „Rudolfův dvůr“ s cizím webem. Bez nároku na Google profil
   (2.5) a bez villarudolf.com na první pozici přejmenování na portálech pošle hosta nanejvýš na
   e-chalupy (což je při 0 % provizi pořád výhra, ale ne cíl).
5. **Strojové překlady Airbnb.** Nevyplněný jazyk = automatický překlad, jméno může dopadnout
   jako „Vila Rudolf“/„Rudolf-Villa“. Vyplnit ručně všech 14, nebo nepotřebné jazyky aspoň sjednotit.
6. **Pravdivost titulku.** Kulečník a ohniště musí být i ve vybavení a na fotkách daného portálu
   (na e-chalupách jsou; na Airbnb/FeWo ověřit), jinak je to důvod ke stížnosti hosta.

## 5. Doporučené pořadí (po Pavlově souhlasu)

1. Google: nárokovat profil → `Villa Rudolf`, web villarudolf.com. (Nulové riziko, největší přínos.)
2. FeWo-direkt: de + en + nl titulek (80 znaků, vejde se všechno, bez schvalování).
3. Airbnb: varianta A v cs/de/en/nl/pl, pak ostatní jazyky. Zapsat datum, za měsíc vyhodnotit.
4. Booking: Pavel se přihlásí, doověříme 2.1 a podáme žádost o `Villa Rudolf`.
5. e-chalupy: nechat opravit „Villa Rudolfův Dvůr“ na czech-cottages.com.

## 6. Otevřená rozhodnutí pro Pavla

1. ~~Airbnb~~ — rozhodnuto 21. 9.: `Villa Rudolf, Svoboda nad Úpou: bazén, sauna, park` (viz 3.2).
2. FeWo: za jméno lákadla (Pool, Sauna, Feuerstelle, Billard), nebo taky holé?
3. Kdy se Pavel přihlásí do Booking extranetu, abychom doověřili 2.1 a podali žádost.
