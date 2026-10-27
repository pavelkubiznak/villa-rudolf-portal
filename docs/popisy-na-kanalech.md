# Popisy objektu na kanálech — audit, mapování polí a stav zápisu

Stav k 23. 9. 2026. **Texty a fakta jsou v [`text-villa-rudolf.md`](text-villa-rudolf.md)** — master CZ,
EN a DE v hlasu webu villarudolf.com. Tady je jen to, co se týká kanálů: co na nich bylo
(kap. 2), co se do inzerátu smí (kap. 3), které bloky jdou do kterého pole (kap. 5), Booking
(kap. 6), co je skutečně zapsané (kap. 6a) a postup (kap. 7).
Navazuje na [`nazev-na-kanalech.md`](nazev-na-kanalech.md) (názvy) a [`kanaly-jedno-misto.md`](kanaly-jedno-misto.md).

Zadání (Pavel, 21.–23. 9. 2026): sjednotit popisy na Airbnb, Bookingu, FeWo-direkt a e-chalupách,
obsahově **1 : 1 na všech kanálech** a ve stejném hlasu i názvosloví jako web.

---

## 1. Fakta

Přesunuto do [`text-villa-rudolf.md`](text-villa-rudolf.md), kap. 3 — jediné místo, kde se fakta
o domě vedou. Tamtéž rozpis lůžek po pokojích (Pokoj 1–4, apartmá Suite).

**Jak je rozpis zapsaný na Bookingu** (21. 9. 2026; Queen 151–180 cm = manželská, Twin 90–130 cm
= jednolůžko): ložnice 1/4/5 = 1× Queen; ložnice 2/3/6 = 1× Twin + 1× Queen; ložnice 7 =
2× Twin + 1× Queen. Celkem 19. Přistýlky (3) jsou v politikách, ne mezi lůžky.

---

## 2. Co je dnes na kanálech (ověřeno čtením 21. 9. 2026)

> Historický snímek z 21. 9. 2026, podle kterého vznikl přepis. Opravy se odškrtávají
> v kap. 6 a 6a, ne tady.

| Údaj | Pravda | Airbnb | Booking | FeWo-direkt | e-chalupy |
|---|---|---|---|---|---|
| Název | Villa Rudolf, Svoboda nad Úpou | ✅ | ✅ | ✅ | ✅ |
| Ložnice | 7 | 7 ✅ | 7 ✅ | 7 ✅ | 7 ✅ |
| Koupelny | 5 | 5 ✅ | 5 ✅ | 5 ✅ | 5 ✅ |
| Kapacita | 22 | **16 (strop Airbnb)** ⚠️ | 22 ✅ | 22 ✅ | 22 ✅ |
| Přistýlky | 3 | v textu ✅ | **„nejsou k dispozici"** ❌ | v textu ✅ | ✅ |
| Bazén | zastřešený, V–IX | „venkovní, 24 h" ❌ | **„venkovní (dočasně uzavřeno)"** ❌ | chybí sezona ❌ | štítek „venkovní" ❌ |
| Pozemek 4 500 m² | ano | chybí ❌ | chybí ❌ | chybí ❌ | ✅ |

### 2.1 Airbnb (1122389326464885565)

- ❌ Hlavička **„15 lůžek", „16 a více hostů"**; text pod ní 19+3. Strop Airbnb je 16 hostů,
  ale **do textu musí přijít 22 (19 + 3)** — dnes tam je jen „19 lůžek + 3 přistýlky"
  bez součtu, takže si host spočítá kapacitu podle hlavičky.
- ❌ Chybí: noční osvětlení, ohniště, elektrické grily, lanové prvky, trampolína v hlavním
  textu, 4 500 m², sauna v ceně, pračka/žehlička/fény, masér, **Netflix**.
- ⚠️ „2× TV s Netflixem" → **2× velká Smart TV s Netflixem, jedna dole a jedna nahoře**.
- ⚠️ Vybavení: parkování uvedeno jako **10 míst** → sjednotit na 7 (+ „10–11 při troše dobré vůle").
- ⚠️ Vybavení: bazén jako **„Soukromý venkovní bazén… sezónně, otevřeno 24 hodin"**.
- 🐞 Překlep **„SkyResort"** → **SkiResort**.

### 2.2 Booking.com — dva objekty, a popis se psát nedá

**Ověřeno v extranetu 21. 9. 2026** (Pavel přihlášený v Chrome).

**Dva objekty pod účtem Sintera Czech s.r.o.:**

| ID | Název | Stav |
|---|---|---|
| **12558473** | Villa Rudolf, Svoboda nad Úpou | **Open/Bookable** — živý, 9,7 z 18 recenzí |
| 353795 | Rudolfův dvůr | Closed/Not bookable, **4 nepřečtené zprávy od Booking.com** |

Slug živého objektu je `booking.com/hotel/cz/villa-with-a-covered-pool-park-and-playground.cs.html`.
Starý `rudolfa-v-dva-r` patří objektu 353795 — odtud pocházel `closed_msg=353795` při hledání
zvenku. **Dřívější závěr, že je inzerát stažený, byl chybný.**

**Kapacita je v pořádku.** Property Layout hlásí Maximum guests 22 / Maximum adults 22
a editor jednotky říká „Total number of guests 22 — this room will appear in searches for
22 adults". Údaj „Doporučeno pro 15 dospělých" na veřejné stránce byl artefakt vyhledávacího
odkazu (`group_adults=15`), ne nastavení. **Dřívější závěr o kapacitě 15 byl taky chybný.**

**Vlastní popis na Bookingu napsat nejde.** Property → View Your Descriptions to říká doslova:
*„Your property description is created based on the facilities and amenities you add."*
a *„We can't customize your description except to fix typos, because descriptions are created
in a way to get you as many bookings as possible."* Volná pole jsou **jen profil hostitele**,
**house rules** a **fine print**. Popis se tedy mění **vybavením**, ne psaním.

**Co dnes ten generovaný popis tvrdí** (a co je z toho špatně):
- ❌ **„a rooftop swimming pool"** — bazén na střeše.
- ❌ **„spa facilities"** — wellness/lázně v objektu nejsou (masér je vedle domu, ne u nás).
- ❌ **„shared kitchen"**, **„a lounge"**, **„tour desk"**, **„bicycle parking"** — u celého domu
  pro jednu skupinu to mate nebo to prostě není pravda.
- ❌ Popis jednotky: **„The unit offers 17 beds."** Třetí číslo v pořadí (viz níže).
- ✅ Správně: 7 ložnic, 5 koupelen, private pool, sauna, barbecue, washing machine,
  flat-screen TV with streaming services, children's playground, outdoor fireplace.

**Tři různé počty lůžek na jednom inzerátu:** rozpis ložnic dává **24** (2/4/4/2/4/4/4),
popis jednotky **17**, kapacita **22**. Správně má být **19 pevných lůžek v ložnicích
+ 3 přistýlky v politikách = 22 hostů**. Rozpis srovnán na 19 dne 21. 9. 2026 (kap. 6).

**Další nálezy:**
- ❌ Veřejné „Venkovní bazén (Dočasně uzavřeno)" + „uzavřeno 1. 10. 2026 – 30. 4. 2027".
  Sezona je správně (rozhodnutí Pavla 21. 9. 2026 — bazén **je** venkovní, jen zastřešený,
  a od 1. 10. do 30. 4. zavřený). Zůstává vyřešit, že se objekt kvůli tomu nedostane
  do filtru „krytý bazén"; správný amenity je venkovní bazén **s krytím**, ne indoor.
- ❌ **Přistýlky: „nejsou v tomto ubytování k dispozici"** — máme tři.
- 🐞 **The Fine Print je plný textů z doby covidu** — PCR testy, roušky v interiéru, karanténa,
  pozastavené shuttle služby, očkování, „only essential workers". Desítky řádků, které host
  vidí před rezervací a které dělají z inzerátu opuštěný objekt. **Smazat.**
- ⚠️ Fine Print dál tvrdí „Payment before arrival by bank transfer is required" a „Guests are
  required to show a photo ID and credit card upon check-in" — ověřit, jestli to tak pořád je.

### 2.3 FeWo-direkt / Vrbo (5510810, propertyId 106405316)

Název správně, čísla sedí (22 osob), ale jsou zaškrtnuté **špatné amenity**, které FeWo
vytahuje jako highlights:

- ❌ **„Strandausstattung — für die Zeit am Meer"** (plážové vybavení u moře) jako hlavní highlight.
- ⚠️ **„Massagen im Wellnessbereich"** — masáže v domě nejsou; masér je **vedle domu**.
  Odškrtnout a napsat to do textu tak, jak to je (blok I).
- ❌ Chybí: sezona bazénu, 27 °C, noční osvětlení, elektrické grily, ping-pong, trampolína,
  hřiště v textu, lanové prvky, 4 500 m², sauna v ceně, skibus 200 m, pračka/žehlička/fény.
- ⚠️ „2 TVs mit Netflix" → **2 große Smart-TVs mit Netflix**.
- ℹ️ Čeština není. Hlavní jazyk DE, překlady en, fr, it, ja, nl, pt, es.
  Überschrift max. 80 znaků (dnešní název 49).

### 2.4 e-chalupy (18852)

Nejúplnější popis, ale i tady jsou věcné chyby:

- ❌ **Štítek „venkovní bazén"** vs. zastřešený v popisu.
- ❌ **Štítek „sjezdovka do 1500 m"** — nejbližší areál (Svoboda) je 1,9 km.
- ❌ **„7 ložnic, každá vlastní koupelna"** vs. 5 koupelen.
- ❌ **„velký obývák s kulečníkem, velkým gaučem a 2× velká Smart TV"** — nahoře je jedna,
  druhá je dole v kuchyni.
- ❌ **„2× trouba, 2× myčka, 3× mikrovlnka"** je uvedeno u společné kuchyně; ve skutečnosti
  je to součet obou kuchyní.
- ⚠️ Min. délka pobytu 2 noci vs. 5 nocí pro léto 2027 a Vánoce v `cenik.json`.
- 🐞 Rozbité mezery: `ping - pong`, `Wi - Fi`, `Check - in od 15: 00`, `2.patro`,
  neuzavřená závorka u `(kapsle Nespresso, kompletní vybavení nádobím.`
- 🐞 Odkazy na prohlídku a videa jsou v textu jen jako `bit.ly` / `youtu.be` bez cíle.
- ℹ️ Anglické zrcadlo **czech-cottages.com** má pořád starý název „Villa Rudolfův Dvůr"
  a detail vrací 404.

---


## 3. Přímé rezervace — co se do inzerátu smí a co funguje líp

Otázka Pavla: dá se v popisu naznačit „přijďte si rezervovat přímo"?

**Krátce: do popisu to nepatří.** Booking i Airbnb v obsahových pravidlech zakazují odkazovat
hosta mimo platformu — URL, e-mail a telefon filtry chytají automaticky a text smažou;
formulace typu „na našem webu" je v šedé zóně a na Airbnb se při opakování řeší jako obcházení
platformy. Za ten zisk to nestojí, protože existují tři cesty, které fungují líp a nic neriskují:

1. **Název.** `Villa Rudolf, Svoboda nad Úpou` je už všude (viz `nazev-na-kanalech.md`).
   Host, kterému se pobyt líbil, si nás vygooglí podle jména — proto ten název vznikl.
2. **Google profil.** Dodnes nenárokovaný, vedený pod starým „Rudolfův dvůr" a s cizím webem
   `dvur.tripcombined.com`. **Tohle je největší páka ze všech a stojí to nula korun** —
   nárokovat profil, přepsat web na villarudolf.com, přidat telefon.
3. **Po pobytu a v domě.** Kontakt na hosta už máme v evidenci, QR kód s průvodcem je v domě.
   Opakovaná rezervace napřímo je legální a nikdo ji neřeší.

**Do popisu smí tohle** — popisuje službu k pobytu, ne prodejní kanál, a projde moderací:

> Ke každému pobytu dostanete odkaz na náš plánovač výletů — s mapou, filtry a tipem
> na konkrétní den podle počasí.

Kdo si průvodce otevře, je na `villarudolf.com` — jen se tam dostane přes nás, ne přes odkaz
v inzerátu. **Na e-chalupách žádné takové omezení není**, tam se odkaz napsat může a má.

---


## 4. Co ještě chybí, než se to zapíše

1. **Booking: dočistit vybavení, fine print a house rules** — viz kap. 6. Lůžka, přistýlky
   a bazén už hotové jsou.
2. **Booking: 4 nepřečtené zprávy** na starém objektu 353795 — projít a rozhodnout, jestli
   požádat o převod recenzí na 12558473.
3. **Booking: platební podmínky ve Fine Print** — platí pořád „platba předem převodem"
   a „občanka + karta při check-inu"?
4. **e-chalupy: přístup do klientské sekce** (číslo objektu 18852 + heslo).
5. **Web villarudolf.com** — sjednotit s fakty (kuchyňka, altán, sjezdovky, Pec, hřiště,
   masér); seznam v [`text-villa-rudolf.md`](text-villa-rudolf.md), kap. 8.

Vyřešeno 22.–23. 9. 2026: upload internetu se měřit nemusí (rychlost se do textů nepíše),
štítek „sjezdovka do 1 500 m" nahrazuje skibus zdarma 200 m od brány, stojany na lyže
v textech nejsou.

---

## 5. Které bloky jdou do kterého pole

Bloky A–L, krátké verze a zvláštní texty jsou v [`text-villa-rudolf.md`](text-villa-rudolf.md)
(CZ kap. 4, EN kap. 6, DE kap. 7, krátké a zvláštní kap. 5 — v tabulce „texty, kap. 5"). Pole se jen poskládají z bloků —
znění se na kanálu nepřepisuje.

| Kanál | Pole | Jazyky | Obsah |
|---|---|---|---|
| **Airbnb** | Popis (max. 500 zn.) | CS · EN · DE | krátká verze (texty, kap. 5) |
| | Tvá nemovitost / The space / Die Unterkunft | CS · EN · DE | B C D E F G |
| | Přístup pro hosty / Guest access | CS · EN · DE | H I |
| | Ostatní poznámky / Other things to note | CS · EN · DE | J L + věta o kapacitě (texty, kap. 5) |
| | Okolí / Neighbourhood | CS · EN · DE | K |
| | Lokalita → Doprava | CS · EN · DE | skibus + doprava (texty, kap. 5) |
| | polština a ostatní jazyky | — | **vyprázdnit** — Airbnb přeloží z češtiny |
| **FeWo-direkt** | Überschrift (max. 80 zn.) | DE | podle [`nazev-na-kanalech.md`](nazev-na-kanalech.md), kap. 3.3 |
| | Beschreibung | DE + EN | A → L; vkládat **po odstavcích** (editor zamrzá kolem 4 300 zn.) |
| **Booking** | About the Property | CS | A B C F G |
| | About the Host | CS | I |
| | About the Neighborhood | CS | H K |
| | Why Families Love Your Property | CS | zvláštní text (texty, kap. 5) |
| | House rules → Additional information | EN | zkrácený blok J (texty, kap. 5) |
| **e-chalupy** | nadpis popisu | CS | texty, kap. 5 |
| | popis | CS | A → L + odkaz na villarudolf.com na konec (e-chalupy odkazy povolují) |

**Mimo text — nastavení na kanálech** (každý kanál ještě jednou v kap. 2):

- **Airbnb:** rozpis lůžek (hlavička hlásí 15), pokoje pojmenovat jako na webu (apartmá Suite,
  Pokoj 1–4), SkyResort → SkiResort, bazén krytý a vyhřívaný V–IX, parkování 10 → 7, doplnit
  kulečník, stolní tenis, trampolínu, hřiště, saunu, pračku, žehličku, fén, Netflix.
- **FeWo:** odškrtnout Strandausstattung a Massagen im Wellnessbereich; zaškrtnout Billard,
  Tischtennis, Spielplatz, Trampolin, Sauna, beheizter/überdachter Pool, Waschmaschine,
  Bügeleisen, Haartrockner, Netflix. Golf odškrtnout a Gartenmöbel zaškrtnout **ručně**
  (stránka Außenbereich nemá tlačítko Uložit, kap. 6a). V editoru klikat přes odkaz prvku,
  ne přes souřadnice — vedle „Anzeigen" je hned „Löschen".
- **Booking:** kap. 6.
- **e-chalupy:** štítek „venkovní bazén" → zastřešený a vyhřívaný; „sjezdovka do 1500 m" pryč;
  „7 ložnic, každá vlastní koupelna" (koupelen je 5); TV jen v kuchyni a v apartmá Suite;
  vybavení rozdělit na dvě kuchyně; „pergola s grilem" → altán se dvěma elektrickými grily,
  doplnit ohniště; rozbité mezery (`ping - pong`, `Check - in od 15: 00`); min. počet nocí
  podle `cenik.json`; pak ověřit czech-cottages.com.

---

## 6. Booking.com — co je hotové a co zbývá

Popis se tu psát nedá (kap. 2.2), takže text jde do **profilu hostitele** a zbytek se řídí **daty**.

**✅ Hotovo 21. 9. 2026 — profil hostitele, čeština.** Přepsány všechny čtyři sekce.
Booking hlásí „Your profile was updated", projeví se do 24 hodin.

Co tam bylo předtím (pro případ, že by se to mělo vrátit):
- *About the Property:* „In the embrace of the Giant Mountains, where time slows down and nature
  whispers stories, our villa lies like a hidden treasure… a pool like a mirror of the sky and
  a stream that whispers dreams."
- *About the Host:* „The fastest connection is on my phone number or via QR code with my contact,
  which is available in the house." — **odkaz na kontakt mimo platformu, proto pryč.**
- *About the Neighborhood:* starý anglický text s překlepem „the local ješčiny".
- *Why Families Love Your Property:* prázdné.

Nově tam je česky: **About the Property** = bloky A–G (dům, koupelny, dvě kuchyně, bazén se
sezonou a poctivou větou o teplotě, sauna v ceně, pozemek), **About the Host** = my + masér
vedle domu, **About the Neighborhood** = doprava, skibus, sjezdovky, výlety + zmínka o průvodci
k pobytu, **Why Families Love Your Property** = děti, hřiště, trampolína, ping-pong,
zamykatelný bazén, postýlka zdarma.

**❌ Anglická verze se uložit nepodařilo.** „Add a language → English" vyplněné pole po uložení
zahodí (zkoušeno třikrát, i ručním psaním). Buď to zkusit znovu později, nebo to nechat na
strojový překlad Bookingu z češtiny. Anglické znění je v [`text-villa-rudolf.md`](text-villa-rudolf.md), kap. 6.

**✅ Hotovo 21. 9. 2026 — data.**
- **Přistýlky: 3, zdarma, bez omezení věku** (Policies → Extra bed & crib options).
  Předtím „You haven't added any extra beds". Booking potvrdil „Changes saved!".
- **Rozpis lůžek srovnán na 19** (bylo 24): ložnice 1/4/5 = 1× Queen, ložnice 2/3/6 =
  1× Twin + 1× Queen, ložnice 7 = 2× Twin + 1× Queen. Ověřeno po znovunačtení.
- **Max. number of adults zpátky na 22.** Pozor, tohle je past: jakmile se rozpis lůžek snížil
  na 19, Booking sám přenastavil „Max adults" na 19 a v náhledu hlásil
  „This room will appear in searches for: 19 adults + 3 children" — tedy skupina 20–22 dospělých
  by nabídku nenašla. Po ručním zvednutí na 22 hlásí zase „22 adults".
  **Kdokoli bude příště sahat na lůžka, musí tohle zkontrolovat.**
- **Bazén: odškrtnuto „Rooftop"** (Facilities → Swimming pool → Bazén → Pool details).
  Odtud pocházela věta „a rooftop swimming pool" v generovaném popisu.
  Zůstává správně: Outdoor + Seasonal + Free + Heated + Pool cover + Lounge chairs + Toys.

**Zbývá — a tohle je to, co doopravdy mění popis:**
1. ✅ *25. 9. 2026 hotovo (kap. 6a).* **Vybavení dočistit.** „Spa facilities" a „Massage" mají v extranetu „See details" a někde
   je nastavené „Off-site" (což u maséra vedle domu sedí), ale generovaný popis z toho pořád
   dělá „spa facilities". Projít Pool and Spa sekci ručně. Dál ověřit **shared kitchen**,
   **lounge**, **tour desk**, **bicycle parking** — všechny čtyři jsou v popisu a u celého domu
   pro jednu skupinu nedávají smysl. Kulečník mezi facilities není (Booking ho bere z Room
   Amenities — popis ho zmiňuje, takže tam nastavený je); **stolní tenis a trampolínu ověřit tam**.
2. ✅ *25. 9. 2026:* **Booking hlásí „What's Missing: Closing dates of your seasonal pool"** — doplněno jako Temporary closure na konci stránky Facilities (odkaz ve žlutém boxu nikam nevede).
3. **Popis jednotky tvrdí „The unit offers 17 beds"** — po opravě rozpisu by se to mělo
   přepočítat samo; zkontrolovat za pár dní.
4. **The Fine Print** — smazat celý covidový blok (kap. 2.2). Jde to jen přes
   Property → View Your Descriptions → „Request a fix", editoři to zpracují ~6 dní.
5. **House rules → Additional information** — doplnit zkrácený blok J
   ([`text-villa-rudolf.md`](text-villa-rudolf.md), kap. 5).
7. **Profil hostitele přepsat do nového znění** (kap. 5) — to z 21. 9. je fakticky správné,
   ale psané jako výčet. Pokus 22. 9. selhal na chybě Bookingu (kap. 6a).
6. **Starý objekt 353795** — projít 4 nepřečtené zprávy.


---

## 6a. Co je skutečně zapsané (stav 25. 9. 2026)

**24. 9. 2026 zapsáno nové znění na Airbnb a FeWo-direkt** (texty; nastavení a vybavení ještě ne).
**25. 9. 2026 zapsáno i na Booking (profil hostitele) a e-chalupy (celý popis).** Nové znění je tím
na všech čtyřech kanálech; zbývá vybavení a nastavení (kap. 5 a 6).

| Kanál | Zapsáno dřív | Zbývá |
|---|---|---|
| **Airbnb** | ✅ **24. 9. 2026, nové znění v CS/EN/DE:** Popis nabídky, Tvá nemovitost, Přístup pro hosty, Další podrobnosti (= Other things to note, dřív prázdné), Lokalita → Popis sousedství (dřív prázdné). **Polština vyprázdněná** ve všech čtyřech polích popisu. Ověřeno v náhledu editoru. | **25. 9. 2026 vybavení:** u bazénu odškrtnuto „Střešní" (= bazén na střeše), parkování na pozemku 10 → 7, odebrán „Kuchyňský kout" (obě kuchyně jsou plnohodnotné) — ověřeno po reloadu. **Rozpis lůžek je správně** — Airbnb počítá postele, ne místa: 7 manželských + 8 jednolůžek (vč. 3 výsuvných přistýlek) = 15 postelí = 22 míst. Bazén „otevřeno 24 hodin" → **6:00–22:00** jako na Bookingu a sporák 1 → **4 plotýnky** (Pavel 25. 9. 2026, ověřeno po reloadu). Ložnice 7 (podkrovní ložnice Suite pro 4) „větší jednolůžko" → **manželská** (Pavel 25. 9. 2026) — teď „1 manželská postel, 2 jednolůžka", ověřeno po reloadu. **25. 9. 2026 hotovo:** věta o hudbě v Domácích pravidlech sladěná s blokem J, štítek „U sjezdovky" (ski-in/ski-out) vypnutý, pole Lokalita → Doprava vyplněné (skibus zdarma) v CS/EN/DE — vše ověřeno po reloadu |
| **FeWo-direkt** | ✅ **24. 9. 2026:** Beschreibung **DE** (7 174 zn., „ihr") a **anglický překlad** (6 671 zn.) — obojí ověřeno po znovunačtení. Überschrift beze změny. Massage odškrtnuto dřív. | **25. 9. 2026 smazány překlady fr, it, ja** (Pavel: smazat). **Zbývají nl, pt, es** — potvrzovací dialog se při dalších pokusech neotevřel a stránka zamrzala; smazat ručně (Löschen → Löschen). · Golf a Gartenmöbel ručně · vybavení |
| **Booking** | data: lůžka 19, přistýlky 3, max. dospělých 22, Rooftop pryč · ✅ **25. 9. 2026 profil hostitele v novém znění** (CS, 4 pole, limit 2 000 zn. na pole): About the Property = A + kapacita + koupelny + půdorys + kuchyně + bazén + sauna + ohniště; About the Host = „Jsme rodina…“ + I + **J (sousedé)**; Neighbourhood = H + K; Families = zvláštní text. Ověřeno po reloadu.  · ✅ **25. 9. 2026 vybavení:** vypnuto Shared kitchen, Shared lounge/TV area („shared“ = sdílené s cizími hosty, TV a sedačka jsou ve vybavení jednotky), Tour desk, Golf course (within 2 miles); Massage zůstává (masér vedle domu). **Spa facilities zapnuto** (Pavel 25. 9. 2026: sauna s odpočívárnou a sprchou = wellness, fotky sauny u něj zůstaly); Spa and wellness centre vypnuté. **Temporary closure: Bazén 1. 10. 2026 – 30. 4. 2027 a 1. 10. 2027 – 30. 4. 2028** — „What's Missing" zmizelo. Ověřeno po reloadu. Vybavení jednotky (pračka, žehlička, fén, Netflix, kuchyň) sedí. | covidový fine print (Request a fix), popis jednotky „17 beds" zkontrolovat za pár dní, bicycle parking (pozemek je oplocený — nechán). **House rules nemají volné pole** (jen přepínače: nekouřit, bez večírků, klid 22–6, mazlíčci na požádání), proto J v About the Host |
| **e-chalupy** | ✅ **25. 9. 2026 celý popis** (8 polí, jeden formulář): Celkový popis = nadpis + A + J + L; Místnosti = B bez koupelen a termostatu; Sociální zařízení; Vytápění; Vybavení = F + G + lyžárna + E + I; Stravování = C (dřív prázdné); Doprava = skibus + H; Zábava = K. **Kontakty → www = https://www.villarudolf.com** (dřív prázdné). **Vzdálenosti → Vlek** = „Skiareál Svoboda nad Úpou (1,9 km), skibus zdarma 200 m od domu“. Ověřeno po reloadu i na veřejné stránce. | štítky v hlavičce („venkovní bazén“, „sjezdovka do 1500m“) skládá portál sám — napsat správcům; czech-cottages.com se překládá automaticky z CZ — ověřit za pár dní |

**⚠️ e-chalupy „opravují“ typografii při uložení.** Kolem spojovníku uvnitř slova přidají mezery
(`Check-in` → `Check - in`, `Wi-Fi` → `Wi - Fi`), za dvojtečku před číslicí taky (`15:00` → `15: 00`),
za tečku uvnitř slova taky (`www.villarudolf.com` → `www. villarudolf. com`) a za číslicí mažou mezeru
po čárce či tečce (`1, 2 a 3` → `1,2 a 3`). Odtud byly rozbité staré odkazy na videa. Pro e-chalupy
proto: „Příjezd od 15 hodin, odjezd do 10 hodin“, „Wifi“, „stolní tenis“, „Pokoje 1 až 3“ a odkaz
na web jen v Kontaktech. Server navíc přidává mezeru na konec řádků (neviditelné).

**e-chalupy — jazykové verze (czech-cottages.com) jsou strojový překlad z češtiny.** Ruční úprava
jde až po „Zpřístupnit texty pro úpravy“, což automatiku vypne — neklikat, dokud to nechceme napořád.

**Booking — profil se ukládá jen skutečným kliknutím myší na Save.** Kliknutí přes odkaz prvku
nebo skriptem neodešle nic; 22. 9. to vypadalo jako chyba Bookingu, nebyla.

**✅ Airbnb: rozpor v Domácích pravidlech vyřešen 25. 9. 2026** — věta o hudbě přepsaná podle bloku J
(znění v `text-villa-rudolf.md`, kap. 5). Noční klid 22:00–6:00 a vypnuté kouření beze změny.

**FeWo — mazání překladu:** kliknutí na „Löschen" otevře potvrzovací dialog až po 10–30 s a stránka
mezitím zamrzá; opakované pokusy za sebou dialog neotevřely vůbec. Po reloadu a pauze to znovu jde.

**FeWo — dlouhý text přes hodnotu pole jde.** Celý Beschreibung vložený najednou přes JS (ne psaním)
se uložil; renderer po vložení na ~40 s zamrzl, ale pak se vzpamatoval. Dialog překladu se otevírá
se zpožděním několika sekund.

**✅ Booking: profil hostitele jde uložit** (25. 9. 2026) — viz výše, jen skutečné kliknutí na Save.

**🐞 FeWo: stránka Außenbereich nemá tlačítko Uložit.** Checkbox se v UI přepne, ale změna
se nikam nepropíše a po reloadu je zpátky. Týká se **Golfu** (odškrtnout, hraje se v Mladých
Bukách) a **Gartenmöbel** (zaškrtnout). **Jedno kliknutí ručně.**

**Airbnb — jazyky:** pole popisu jsou per jazyk a je jich 14. Vyplňujeme CS, EN a DE;
ostatní prázdná, Airbnb je překládá z češtiny (rozhodnutí Pavla 22. 9. 2026). Polština byla
22. 9. vyplněná starým zněním — při přepisu ji vyprázdnit. Když se text mění, mění se ve
třech jazycích.

**FeWo — editor se zasekne na dlouhém textu.** Vkládat po odstavcích, ne celý najednou.

---

## 7. Postup zápisu

1. **Airbnb** — editor nabídky, změna je okamžitá. Všech pět polí v CS, EN, DE; polštinu
   vyprázdnit; pak rozpis lůžek a vybavení.
2. **FeWo-direkt** — Unterkunfts-Editor → Überschrift und Beschreibung, nejdřív němčina,
   pak angličtina. Golf a Gartenmöbel ručně.
3. **e-chalupy** — klientská administrace, plná kontrola nad textem, 0 % provize. Zároveň
   opravit štítky a vybavení (kap. 5). Pak ověřit czech-cottages.com.
4. **Booking** — vybavení a fine print mění generovaný popis víc než profil; profil zkusit
   znovu, až Booking přestane padat.
5. **Google profil** — nárokovat, přepsat web na villarudolf.com (kap. 3). Nic to nestojí
   a pro přímé rezervace je to větší páka než cokoli v inzerátech.
6. **villarudolf.com** — srovnat s fakty ([`text-villa-rudolf.md`](text-villa-rudolf.md), kap. 8).

Každý zapsaný kanál zapiš do kap. 6a s datem, ať je vidět, co už je hotové.
