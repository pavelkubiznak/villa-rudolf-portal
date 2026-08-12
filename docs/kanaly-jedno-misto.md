# Ceny a kalendáře z jednoho místa — co je reálně možné

Stav k 12. 8. 2026. Navazuje na [`cenova-parita-2027.md`](cenova-parita-2027.md) a na první audit.
Otázka zněla: dá se to spravovat z jednoho místa, ideálně přes API?

## 1. Krátká odpověď

**Přímé API k vlastnímu objektu nedostaneme ani u jednoho ze tří kanálů.** Ne proto, že
by to bylo technicky složité — je to obchodní rozhodnutí platforem:

| Kanál | API existuje? | Dostane ho majitel objektu? |
|---|---|---|
| Booking.com | ano (Connectivity API) | ne — jen certifikovaní connectivity partneři (firmy), přímé přihlášky od objektů nepřijímá; přihlášky navíc pozastavené kvůli změně podmínek |
| Airbnb | ano (partnerské API) | ne — jen schválení software partneři; příjem nových žádostí pozastaven |
| FeWo-direkt / Vrbo (Expedia) | ano | ne — jen přes schválené integrační partnery |
| e-chalupy.cz | ne | — (jen ruční administrace, iCal) |

**Ale „jedno místo" jde postavit.** Cesta k němu vede přes **channel manager** — to je
přesně ta firma, která tím certifikovaným partnerem je. Ceny a obsazenost nastavíš u ní,
ona je rozešle do kanálů přes jejich oficiální API. A co je pro nás podstatné:
**slušný channel manager má vlastní veřejné API pro tebe.** Tím se řetěz uzavře —
programově řídit ceny jde, jen ne přímo, nýbrž přes prostředníka.

```
docs/cenik-2027.json  →  skript  →  API channel manageru  →  Booking / Airbnb / FeWo
   (zdroj pravdy v repu)                                       (oficiální partnerské API)
```

## 2. Tři varianty

| | A. Chrome jako ruce (dnešní plán) | B. Channel manager ručně | C. Channel manager přes API |
|---|---|---|---|
| Jedno místo pro ceny | ne (3 extranety, Claude je obchází) | ano (jedno UI) | ano (soubor v repu) |
| Jedno místo pro kalendář | ne (iCal, jednosměrné) | ano (obousměrná synchronizace) | ano |
| Měsíční náklad | 0 Kč | ~8–15 €/měs. | ~8–15 €/měs. |
| Ceny nastaví | Claude klikáním, ty potvrzuješ | ty ručně v jednom UI | skript z ceníku |
| Práce na zavedení | hotová (runbook stojí) | ~1 večer + ověřovací provoz | + půlden skriptu |
| Riziko | UI extranetů se mění, rate-limity | migrace, špatné namapování | totéž co B |
| e-chalupy | zvládne (další karta) | nepodporují | nepodporují |
| Dvojité rezervace | pořád hrozí (iCal má zpoždění) | řeší | řeší |

## 3. Doporučení

**Krátkodobě zůstaň u A, dlouhodobě jdi na C — ale ne obráceným pořadím.**

1. **Teď (do otevření prodeje léta 2027):** doměřit díry, srovnat ceny přes asistovaný
   zápis. Nemá smysl migrovat nesrovnaný ceník — do channel manageru by se přenesl
   ten samý nepořádek, jen rychleji.
2. **Pak zkušebně channel manager** — doporučuju **Beds24**: je nejlevnější
   (řádově 8–9 €/měs. pro jeden objekt), má **otevřené API v2** (token si vygeneruješ
   sám v UI, žádné schvalování) a umí měnu i koeficient zvlášť pro každý kanál —
   tedy přesně to, na čem ztroskotalo Lodgify. Nevýhoda: ošklivé a hodně technické UI.
   Kdyby to mělo být hezké a ty v tom chtěl klikat sám, alternativa je **Smoobu**
   (~15 €/měs., německé, k FeWo-direktu má blízko), API má taky.
3. **Nakonec ceník z repa přes API.** `cenik-2027.json` zůstane zdrojem pravdy,
   skript ho pošle do Beds24, ten to rozešle. Tím se nastavování cen stane
   verzovanou změnou v gitu, ne klikáním — a ceny za rok 2028 se dají připravit
   jedním pull requestem.

Co si od toho slibuju kromě pohodlí:

- **Obousměrná synchronizace obsazenosti** místo iCal. Falešné „Konflikty" na FeWo
  a riziko dvojitého prodeje (viz Silvestr 2027: FeWo drží tentativní rezervaci,
  Airbnb ty dny prodává) by měly zmizet.
- **Jedna sada restrikcí** — min. noci a příjezdové dny se dnes rozjíždějí stejně jako ceny.
- **Audit v tomhle repu neztrácí smysl, naopak.** Zůstane nezávislou kontrolou:
  channel manager tvrdí, že cenu zapsal, audit přečte extranet a ověří, že tam
  opravdu je. Tuhle kontrolu ti žádný channel manager sám o sobě nedá.

## 4. Co migrace stojí za pozornost

- **Nemigruj před sezónou.** Ideální okno je klidné období, ne týden před otevřením prodeje.
- **Po kanálech, ne najednou.** Nejdřív FeWo (nejmíň rezervací), měsíc pozoruj,
  pak Booking, nakonec Airbnb — připojení Airbnb je nejinvazivnější, protože kontrolu
  nad cenami a kalendářem přebírá channel manager.
- **Existující rezervace** se musí do channel manageru dostat, jinak přeprodáš
  obsazené termíny. Většinou se importují automaticky, ale je to bod, kde se to láme —
  po připojení každého kanálu projít kalendář ručně proti dnešnímu snapshotu.
- **e-chalupy zůstanou stranou** — žádný channel manager je nepodporuje. Buď je necháš
  na ruční správě (a v ceníku budou mít vlastní řádek), nebo je odstřihneš.
- **Provize channel manageru nejsou provize kanálů.** Beds24 i Smoobu se platí paušálem,
  neberou % z rezervací — na výnos to nesahá.

## 5. Rozhodnutí, které potřebuju od tebe

1. Jdeme cestou C (channel manager + ceník z repa), nebo zůstáváme u A a řešíme to
   dvakrát ročně ručně?
2. Pokud C: **Beds24** (levné, API, ošklivé), nebo **Smoobu** (dražší, hezké, taky API)?
3. e-chalupy — dovnitř parity, nebo vlastní ceník pro českou klientelu?

Než padne 1 a 2, nic se neděje: dnešní plán (audit + asistovaný zápis) běží dál
a je pro obě varianty stejně užitečný.

---

Zdroje ke stavu API (ověřeno 12. 8. 2026):
[Booking.com Connectivity docs](https://developers.booking.com/connectivity/docs) ·
[Airbnb API pro hostitele — přehled](https://www.smoobu.com/en/blog/airbnb-api/) ·
[srovnání ceníků channel managerů](https://comparatifchannelmanager.fr/en/beds24-pricing/)
