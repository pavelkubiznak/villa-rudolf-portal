# n8n workflow „VR booking ingest"

Automatický příjem rezervací z Booking.com → zápis do Supabase (`vr_bookings`) → příprava uvítací
zprávy s odkazem na guest portál. Odkaz vkládá majitel do zprávy na Booking.com **ručně** – Booking
blokuje odkazy od botů, takže workflow končí uloženým Gmail draftem, nikoli automatickým odesláním.

Portál: <https://pavelkubiznak.github.io/villa-rudolf-portal/>
Supabase projekt: `fpknbrzbqpalguajskut` (sdílený, tabulky s prefixem `vr_`)

---

## Bezpečnost tokenů (přečti první)

- Hostovi posíláme **RAW token** (32 hex znaků = 128 bit) v odkazu `?t=RAWTOKEN`.
- Do databáze ukládáme **jen sha256 hash** (`token_hash`). RAW token nikam neukládáme.
- `SERVICE_ROLE` klíč Supabase patří **výhradně do n8n credentials**. NIKDY ho nedávej do tohoto
  repozitáře, do URL, do logů ani do Gmail draftu.
- `expires_at = departure + 30 dní`. Po expiraci `vr_verify_token` vrací prázdno a portál token odmítne.

---

## Přehled uzlů (nodes)

```
Gmail Trigger ──▶ Function (parse) ──▶ Function (token) ──▶ HTTP Request (upsert) ──▶ Function (zpráva) ──▶ Gmail (create draft)
```

### 1) Gmail Trigger

- Trigger na příchozí e-mail.
- Filtr na potvrzení z Booking.com – např. label `Booking` nebo dotaz
  `from:booking.com subject:(potvrzení OR confirmed OR bestätigt) newer_than:2d`.
- Doporučení: v Gmailu si vytvoř filtr, který potvrzení automaticky štítkuje labelem `Booking`,
  a v triggeru sleduj právě ten label. Sníží to falešné spuštění.

### 2) Function – parse rezervace

Vytáhne z těla e-mailu jméno, termín, počty osob a jazyk. Selektory uprav podle reálné šablony
e-mailu (Booking mění formát). Návratem je jeden objekt s poli, která workflow dál používá.

```js
// n8n Function node – vstup: $json (Gmail zpráva; text v $json.text nebo $json.snippet)
const body = $json.text || $json.html || $json.snippet || '';

function m(re, d = '') { const x = body.match(re); return x ? x[1].trim() : d; }

// --- Uprav regexy podle reálného potvrzení ---
const firstName  = m(/Jm[ée]no[:\s]+([^\n\r]+?)\s/i, '');
const lastName   = m(/P[řr][ií]jmen[ií][:\s]+([^\n\r]+)/i, '') || m(/Guest[:\s]+\S+\s+([^\n\r]+)/i, '');
const bookingRef = m(/(?:Booking number|Rezervace|Buchungsnummer)[:\s#]+(\d[\d\- ]+)/i, '').replace(/\s/g, '');
const arrival    = m(/(?:Check-?in|P[řr][ií]jezd|Anreise)[:\s]+(\d{4}-\d{2}-\d{2})/i, '');
const departure  = m(/(?:Check-?out|Odjezd|Abreise)[:\s]+(\d{4}-\d{2}-\d{2})/i, '');
const adults     = parseInt(m(/(\d+)\s*(?:dosp[ěe]l|adult|Erwachsene)/i, '2'), 10) || 2;
const country    = m(/(?:Country|Zem[ěe]|Land)[:\s]+([^\n\r]+)/i, '');

// děti: buď počet, nebo seznam věků „8, 12"
const childrenAges = (m(/(?:v[ěe]k d[ěe]t[ií]|children ages|Alter der Kinder)[:\s]+([\d,\s]+)/i, '')
  .split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n)));

// jazyk podle země hosta
const c = country.toLowerCase();
let lang = 'de';
if (/(czech|česk|tschech)/.test(c)) lang = 'cs';
else if (/(germ|deutsch|austria|österreich|schweiz|swiss)/.test(c)) lang = 'de';
else if (/(united|great britain|england|usa|ireland|netherlands|poland)/.test(c)) lang = 'en';

return [{ json: { bookingRef, firstName, lastName, lang, arrival, departure, adults, children: childrenAges } }];
```

### 3) Function – vygeneruj token a hash

RAW token vzniká zde a **projde workflowem jen do finální zprávy**. Do DB jde hash, do zprávy RAW.

```js
const crypto = require('crypto');
const d = $json;

const rawToken  = crypto.randomBytes(16).toString('hex');            // 32 hex = 128 bit
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

// expires_at = departure + 30 dní
const exp = new Date(d.departure + 'T00:00:00Z');
exp.setUTCDate(exp.getUTCDate() + 30);

return [{ json: {
  ...d,
  rawToken,
  tokenHash,
  expiresAt: exp.toISOString(),
  link: 'https://pavelkubiznak.github.io/villa-rudolf-portal/?t=' + rawToken
}}];
```

### 4) HTTP Request – upsert do Supabase

- **Method:** `POST`
- **URL:** `https://fpknbrzbqpalguajskut.supabase.co/rest/v1/vr_bookings`
- **Headers:**
  - `apikey`: `={{ $credentials.supabaseServiceRole }}`  ← SERVICE_ROLE, jen z n8n credentials
  - `Authorization`: `Bearer ={{ $credentials.supabaseServiceRole }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates`  (upsert podle unikátního `booking_ref`)
- **Body (JSON):**

```json
{
  "booking_ref": "={{ $json.bookingRef }}",
  "token_hash":  "={{ $json.tokenHash }}",
  "first_name":  "={{ $json.firstName }}",
  "last_name":   "={{ $json.lastName }}",
  "lang":        "={{ $json.lang }}",
  "arrival":     "={{ $json.arrival }}",
  "departure":   "={{ $json.departure }}",
  "adults":      "={{ $json.adults }}",
  "children":    "={{ $json.children }}",
  "expires_at":  "={{ $json.expiresAt }}"
}
```

> `Prefer: resolution=merge-duplicates` zajistí, že opakované potvrzení stejné rezervace nezaloží
> duplicitní řádek (kolize na `booking_ref`). Sloupec `children` je `int[]` – posílej pole čísel.

### 5) Function – sestav uvítací zprávu

Podle `lang` vyber šablonu, doplň `{NAME}` a `{LINK}`, výstup předej do Gmail draft node.

```js
const d = $json;
const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || (d.lastName || '');

const T = {
  de: { subject: 'Willkommen in der Villa Rudolf', body: DE },
  cs: { subject: 'Vítejte ve Ville Rudolf',        body: CS },
  en: { subject: 'Welcome to Villa Rudolf',        body: EN }
}; // DE/CS/EN viz šablony níže

const t = T[d.lang] || T.de;
const message = t.body.replaceAll('{NAME}', name).replaceAll('{LINK}', d.link);

return [{ json: { subject: t.subject, message, to: '' } }];
```

### 6) Gmail – create draft

- Operace **Create Draft** (ne Send – Booking blokuje odkazy od botů).
- `Subject` = `{{ $json.subject }}`, `Message` = `{{ $json.message }}`.
- Draft zůstane v Gmailu; majitel text zkopíruje do zprávy hostovi v rozhraní Booking.com.

---

## Šablony uvítací zprávy

Placeholdery: `{NAME}` (jméno hosta), `{LINK}` (odkaz s RAW tokenem). Krátké a srdečné; zmiňují,
že stránka funguje i offline a ukazuje počasí živě.

### DE

```
Liebe/r {NAME},

wir freuen uns auf Ihren Aufenthalt in der Villa Rudolf! Wir haben Ihnen einen kleinen
persönlichen Reiseführer für die Umgebung vorbereitet – mit Ausflugstipps, sortiert nach Wetter,
Alter der Kinder und Gruppengröße:

{LINK}

Die Seite zeigt das Wetter live und funktioniert auch offline – einfach zum Startbildschirm
hinzufügen. Bis bald in den Krkonoše/Riesengebirge!

Herzliche Grüße
Villa Rudolf
```

### CS

```
Milá rodino {NAME},

moc se na vás do Villy Rudolf těšíme! Připravili jsme vám malého osobního průvodce po okolí –
tipy na výlety řazené podle počasí, věku dětí i velikosti vaší skupiny:

{LINK}

Stránka ukazuje počasí živě a funguje i offline – stačí si ji přidat na plochu. Ať se vám u nás
v Krkonoších líbí!

Srdečně
Villa Rudolf
```

### EN

```
Dear {NAME},

we're looking forward to your stay at Villa Rudolf! We've prepared a little personal guide to the
area for you – trip ideas ranked by weather, kids' ages and your group size:

{LINK}

The page shows live weather and works offline too – just add it to your home screen. See you soon
in the Krkonoše/Giant Mountains!

Warm regards,
Villa Rudolf
```

---

## Denní úklid expirovaných rezervací

Samostatný workflow (n8n **Schedule** node, např. jednou denně) smaže rezervace starší 30 dní po
odjezdu. Používá stejný `SERVICE_ROLE` klíč přes Supabase REST.

- **Method:** `DELETE`
- **URL:** `https://fpknbrzbqpalguajskut.supabase.co/rest/v1/vr_bookings?departure=lt.{{ CUTOFF }}`
  kde `CUTOFF` = dnešní datum − 30 dní (`YYYY-MM-DD`).
- **Headers:** `apikey` + `Authorization: Bearer` = SERVICE_ROLE, `Prefer: return=minimal`.

Výpočet `CUTOFF` v předřazeném Function node:

```js
const cut = new Date();
cut.setUTCDate(cut.getUTCDate() - 30);
return [{ json: { cutoff: cut.toISOString().slice(0, 10) } }];
```

Odpovídá SQL:

```sql
DELETE FROM vr_bookings WHERE departure < now() - interval '30 days';
```

> PostgREST filtr `departure=lt.<datum>` je ekvivalent `WHERE departure < <datum>`. Ochrání DB před
> hromaděním starých rezervací a je bezpečný – dotýká se jen dávno odjetých hostů.
