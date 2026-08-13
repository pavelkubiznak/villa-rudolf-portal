# Úklid iCal vazeb — postup krok za krokem

> **PROVEDENO 13. 8. 2026** (Claude přes Chrome, Pavel u toho). Výsledek dole
> v kapitole „Co se skutečně stalo".

Stav k 13. 8. 2026. Vychází z mapy v [`kanaly-jedno-misto.md`](kanaly-jedno-misto.md).
Cíl: **každý kanál bere obsazenost jednou cestou** — přes e-chalupy jako relé.
Bez kódu, bez předplatného, jen klikání v extranetech.

Cílový stav:

```
Booking ─┐                        ┌─→ Booking
Airbnb  ─┤                        ├─→ Airbnb
FeWo    ─┼─→  e-chalupy (relé) ───┼─→ FeWo
megaubytko┤                       └─→ megaubytko
hledamchatu┘
```

Airbnb a megaubytko už tak jedou. Měnit se bude **Booking a FeWo**, a napřed se musí
spravit rozbitá vazba do e-chalup.

---

## Než začneš: dvě pravidla

1. **Pořadí se nesmí obrátit.** Nejdřív krok 1 (spravit relé), teprve pak 3 (mazat trasy).
   Kdyby se mazalo dřív, vznikne okno, kdy se rezervace nepropíše nikam.
2. **Před smazáním každého importu si zkopíruj jeho URL** (v FeWo přes „Bearbeiten",
   v Bookingu u položky). Kdyby se něco pokazilo, vracíš to vložením té samé adresy.
   Ulož si je stranou — do repa nepatří, jsou to fakticky hesla.

---

## Krok 1 — spravit import FeWo do e-chalup

`klient.e-chalupy.cz` → **Import kalendáře (ICAL)**

U položky `Fewo-direkt.de` svítí **„chyba při importu, bude ověřeno správcem"**.

1. Klikni **„ihned importovat"** a chvíli počkej. Když chyba zmizí, hotovo.
2. Když nezmizí, potřebuješ novou exportní adresu z FeWo:
   FeWo → kalendář → ⚙ vpravo nahoře → záložka **Availability** →
   **Calendar synchronization → Link your calendars**. Tam je vedle importů i export.
   Adresu zkopíruj, v e-chalupách u položky `Fewo-direkt.de` dej **„zrušit import"**
   a založ ji znovu přes **„+ přidat import kalendáře"**.
3. Když ani to nepomůže, napiš správcům e-chalup (770 123 500) — hlásí to sami jako
   „bude ověřeno správcem", takže to může být na jejich straně.

**Ověření:** v kalendáři rezervací e-chalup musí být vidět rezervace, které vznikly
na FeWo (Glen Gelmroth 14.–18. 5. 2027 tam je už teď; přibýt má tentativní
Sandra B. 27. 12. 2027 – 3. 1. 2028).

> Pozn.: chybějící Sandra nemusí být jen touhle chybou — je vedená jako „Unter Vorbehalt"
> a je možné, že FeWo tentativní rezervace do exportu vůbec nedává. Když se po opravě
> neobjeví, ber ten termín jako **ručně hlídaný** a zablokuj ho na Airbnb sám.

---

## Krok 2 — smazat zbytek po Lodgify

`admin.booking.com` → objekt 12558473 → **Rates & Availability → Sync calendars**

U položky **Lodgify** je stav „Import needed / Complete setup". Klikni u ní **Remove**.

Nic jiného na téhle obrazovce zatím neměň — mazání dalších přijde v kroku 3.

**Ověření:** v seznamu zůstanou `airbnb.cz`, `fewo-direkt.de`, `e-chalupy.cz`.

---

## Krok 3 — zrušit duplicitní trasy

### 3a) Booking.com

Stejná obrazovka (**Sync calendars**). Zkopíruj si URL, pak dej **Remove** u:

- `airbnb.cz`
- `fewo-direkt.de`

**Ponech `e-chalupy.cz`.** Obě rušené trasy jsou nadbytečné — e-chalupy obojí
přeposílají (ověřeno: v jejich exportu jsou airbnb i booking termíny).

Ještě dole na té obrazovce je **„Decide what to export"**. Přepni z „Booked and closed
dates" na **„Booked dates only"** a ulož.

> Proč: jinak Booking posílá ven i dny, které má zavřené kvůli importu z e-chalup —
> tedy vrací e-chalupám jejich vlastní data zpátky. Tím vznikají ozvěny.
> **Cena za to:** dny, které si na Bookingu zavřeš ručně (třeba pro sebe), se přestanou
> propisovat jinam. Když takhle blokuješ, dělej to napříště v e-chalupách.

### 3b) FeWo-direkt

Kalendář → ⚙ → **Availability** → **Calendar synchronization → Link your calendars**

Zkopíruj URL, pak odstraň:

- `Airbnb`
- `Booking.com`
- `hledamchatu.cz` — **jen pokud přes hledamchatu neprodáváš.** Pokud ano, nech ho být;
  e-chalupy z něj sice taky importují (`hladamchatu.sk`), ale to je potřeba ověřit,
  než se ta trasa zruší.

**Ponech `e-chalupy`.**

### 3c) Airbnb a megaubytko

Nic nedělej, už mají jediný import (e-chalupy). Jen zkontroluj, že tam po úklidu
nepřibyl další.

---

## Po úklidu: co ověřit

1. **Hned:** v každém extranetu má seznam importů jedinou položku — `e-chalupy`
   (u e-chalup naopak zůstávají všechny).
2. **Za den:** v kalendáři FeWo (červen 2027) už nesmí být červené „Konflikt" pruhy
   na 17.–19. a 23.–26. 6. Doběhnutí trvá — e-chalupy načítají á 4 h, FeWo á 30 min.
3. **Za týden:** projít kalendáře všech pěti kanálů proti sobě a porovnat s auditem.

---

## Co tím vyřešeno NEBUDE

Ať to nevyzní líp, než to je:

- **Ozvěna vlastních rezervací zůstane.** Kanál, který sám prodává *a zároveň* bere feed,
  ve kterém jeho vlastní pobyty jsou, uvidí svou rezervaci dvakrát — jednou jako vlastní,
  jednou jako importovanou. Blokuje to navíc, neprodává to navíc, takže je to bezpečné,
  ale hezké to není. Tohle spraví až hub s filtrem na výstupu.
- **Relé jede á 4 hodiny** a tiše zahazuje překryvy — když se termín kryje s něčím,
  co už v e-chalupách je, import se nepropíše a nikdo to neohlásí.
- **Není do toho vidět.** Že relé spadlo, ses dozvěděl až teď a náhodou.
- Relé stojí na chování, které je v rozporu s vlastní nápovědou e-chalup, takže se
  může kdykoli změnit bez varování.

Tyhle čtyři body jsou to, co po úklidu zbude jako zadání pro vlastní hub.

---

## Co se skutečně stalo (13. 8. 2026)

| Krok | Výsledek |
|---|---|
| 1. Import FeWo → e-chalupy | ✅ spraveno jediným „ihned importovat", chyba zmizela (`importováno 12:49:46`) |
| 2. Lodgify v Bookingu | ❌ **nejde smazat** — řádek nabízí jen „Complete setup", žádné Remove |
| 3a. Booking: `airbnb.cz`, `fewo-direkt.de` | ✅ odebráno, zůstalo jen `e-chalupy.cz` |
| 3b. FeWo: `Airbnb`, `Booking.com` | ✅ odebráno, zůstalo `e-chalupy` + `hledamchatu.cz` |

**Ověření hned po zásahu:** v kalendáři FeWo na červnu 2027 **zmizely oba červené
„Konflikt" pruhy** a nahradily je čisté šedé bloky z e-chalup (10.–12., 17.–19., 23.–26. 6.).
Rezervace z Bookingu 3.–10. 7. 2027 zůstala korektně zablokovaná přes e-chalupy,
takže odebrání přímého importu nic neodkrylo.

### Co zůstalo otevřené

- **Lodgify pořád tahá tvůj booking kalendář** („Last exported: před 2 hodinami"),
  a z Bookingu ho odstranit nejde. Řešit na straně Lodgify (odpojit/zrušit účet),
  případně přes podporu Booking.com.
- **Silvestr 27. 12. 2027 – 3. 1. 2028** se do e-chalup nedostal ani po opravě.
  Příčina nalezena: FeWo má vypnuté **„Auch Buchungen unter Vorbehalt erfassen"**
  (kalendář → ⚙ → Verfügbarkeit → Verknüpfen Sie Ihre Kalender → Schritt 1),
  takže tentativní rezervace do exportu nedává. Do rozhodnutí hlídat ručně.
- **Booking „Decide what to export"** zůstal na „Booked and closed dates" — čeká na rozhodnutí.
- **`hledamchatu.cz`** v FeWo ponechán, dokud se nepotvrdí, jestli je kanál aktivní.

### Zálohy

URL smazaných importů leží mimo repo (jsou to fakticky hesla) v poznámkách k session.
Exportní adresa Airbnb, kterou FeWo používalo, se bude hodit i pro budoucí hub.
