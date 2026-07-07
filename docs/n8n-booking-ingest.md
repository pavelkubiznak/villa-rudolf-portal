# n8n workflow „VR – nový host"

Automatický příjem nové rezervace přes **webhook** → založení hosta v Supabase (`vr_bookings`
přes RPC `vr_create_booking`) → vygenerování odkazu na guest portál + hotové uvítací zprávy
v jazyce hosta. Odkaz vkládá majitel do zprávy hostovi (např. na Booking.com) **ručně** – Booking
blokuje odkazy od botů, takže workflow jen vrátí připravený text a odkaz, nic sám neodesílá.

Portál: <https://pavelkubiznak.github.io/villa-rudolf-portal/>
Supabase projekt: `fpknbrzbqpalguajskut` (sdílený, tabulky a funkce s prefixem `vr_`)
n8n: běží jako Docker kontejner `n8n` na produkčním serveru, port jen `127.0.0.1:5678`.

---

## Bezpečnost tokenů (přečti první)

- Hostovi posíláme **RAW token** (32 hex znaků = 128 bit) v odkazu `?t=RAWTOKEN`.
- Do databáze ukládáme **jen sha256 hash** (`token_hash`). RAW token nikam neukládáme – vzniká
  v Code nodu, projde workflowem jen do odkazu a uvítací zprávy, a dál nikam.
- Zápis rezervace probíhá přes RPC `vr_create_booking` s **veřejným anon klíčem** + malým
  **ingest secretem** (`p_secret`). Ingest secret smí JEN zakládat rezervace (malý blast radius);
  je uložený uvnitř workflow (Code node), **nikoli v tomto repozitáři**. `SERVICE_ROLE` klíč se
  **nepoužívá** a nikdy nesmí být v repu, v URL, v logu ani ve zprávě hostovi.
- `expires_at`: workflow posílá `p_expires: null` (bez expirace). Denní úklid řeší RPC
  `vr_purge_expired` (viz níže).

---

## Trigger: webhook

- **Node:** `n8n-nodes-base.webhook` (typeVersion 2)
- **Method:** `POST`
- **Path:** `vr-new-guest`
- **Response Mode:** `responseNode` (odpověď vrací node „Odpověď")
- **URL (přes SSH tunel na server):** `POST http://localhost:5678/webhook/vr-new-guest`

Tělo požadavku (JSON) je v n8n dostupné pod `$json.body`:

```json
{
  "first_name": "Max",
  "last_name":  "Mustermann",
  "lang":       "de",              // cs | de | en (default de)
  "arrival":    "2026-07-10",      // YYYY-MM-DD
  "departure":  "2026-07-15",      // YYYY-MM-DD
  "adults":     2,                  // int, clamp 1–30, default 2
  "children":   "8, 10",           // string „8, 10" NEBO pole [8,10]; clamp 0–17, max 20
  "booking_ref": "BK-12345"        // volitelné; když chybí, vygeneruje se VR-YYYY-MM-DD-xxxxxx
}
```

---

## Přehled uzlů (nodes)

```
Webhook ──▶ Připravit (Code) ──▶ Založit v Supabase (HTTP) ──▶ Odpověď (Respond to Webhook)
```

### 1) Webhook

Přijme POST na `vr-new-guest`, tělo je pod `$json.body`. Response mode = „responseNode".

### 2) Připravit (Code, typeVersion 2)

Používá builtin `require('crypto')`. Dělá:

- `rawToken = crypto.randomBytes(16).toString('hex')` – 32 hex = 128 bit.
- `tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')` – ukládá se do DB.
- **děti:** string → split podle čárek → čísla; pole → totéž. Clamp 0–17, nevalidní ignoruje,
  max 20. Prázdné = `[]`.
- **adults:** clamp 1–30, default 2. **lang:** cs|de|en, default de.
- **booking_ref:** když chybí → `VR-` + dnešní datum + `-` + prvních 6 znaků rawTokenu.
- **link** = `https://pavelkubiznak.github.io/villa-rudolf-portal/?t=` + rawToken.
- **welcome** = uvítací šablona v jazyce hosta, s dosazeným `{LINK}` a jménem (příjmení, jinak
  fallback „Gäste" / „hosté" / „guests").
- Sestaví `rpcBody` = `{ p_secret, p_booking_ref, p_token_hash, p_first, p_last, p_lang,
  p_arrival, p_departure, p_adults, p_children, p_expires: null }`. Ingest secret je inline
  v tomto nodu (viz Bezpečnost – neuvádí se v repu).

Výstup jedné položky: `{ rawToken, tokenHash, booking_ref, link, welcome, lang, rpcBody }`.

> **n8n quirk:** `rpcBody` se skládá tady v Code nodu, aby v HTTP nodu bylo v těle jen
> `JSON.stringify($json.rpcBody)`. Nikdy nedávej composite template literal + `JSON.stringify`
> do jednoho `={{ }}` výrazu.

### 3) Založit v Supabase (HTTP Request, typeVersion 4.2)

- **Method:** `POST`
- **URL:** `https://fpknbrzbqpalguajskut.supabase.co/rest/v1/rpc/vr_create_booking`
- **Headers** (anon klíč je **veřejný** – je i v portál HTML):
  - `apikey`: `<anon key>`
  - `Authorization`: `Bearer <anon key>`
  - `Content-Type`: `application/json`
- **Body (JSON):** `={{ JSON.stringify($json.rpcBody) }}`
- **Response Format: `Text`** (v options → Response → Response Format = Text, výstup do `data`).

> **n8n quirk (důležité):** RPC vrací **holé uuid jako JSON string** (`"…-uuid-…"`) s hlavičkou
> `application/json`. HTTP node ve výchozím „autodetect JSON" režimu takový skalární JSON odmítne
> chybou *„Response body is not valid JSON. Change Response Format to Text."* Proto je Response
> Format nastavený na **Text** – uuid pak přijde jako text do `$json.data` (i s uvozovkami),
> které node „Odpověď" ořízne.

RPC při špatném `p_secret` vrací `{"code":"P0001","message":"unauthorized"}` (HTTP 400).

### 4) Odpověď (Respond to Webhook, typeVersion 1)

Vrátí JSON:

```json
{
  "ok": true,
  "id": "<uuid nové rezervace>",
  "booking_ref": "<booking_ref>",
  "link": "https://pavelkubiznak.github.io/villa-rudolf-portal/?t=<rawToken>",
  "welcome": "<hotová uvítací zpráva v jazyce hosta>"
}
```

`id` se získá z textové odpovědi Supabase (`$json.data`) – ořízne se obalující uvozovky.

---

## Šablony uvítací zprávy

Placeholder `{LINK}` (odkaz s RAW tokenem) se dosazuje v Code nodu; jméno se dosazuje přímo
(příjmení hosta, jinak fallback „Gäste" / „hosté" / „guests"). Krátké a srdečné; zmiňují, že
stránka ukazuje počasí živě a funguje i offline.

### DE

```
Liebe/r {NAME},

wir freuen uns auf Ihren Aufenthalt in der Villa Rudolf! Wir haben Ihnen einen kleinen
persönlichen Reiseführer für die Umgebung vorbereitet – mit Ausflugstipps, sortiert nach Wetter,
Alter der Kinder und Gruppengröße:

{LINK}

Die Seite zeigt das Wetter live und funktioniert auch offline – einfach zum Startbildschirm
hinzufügen. Wir wünschen Ihnen einen wunderschönen Aufenthalt und sehen uns bald im
Riesengebirge!

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
v Krkonoších líbí a užijete si krásný pobyt!

Srdečně
Villa Rudolf
```

### EN

```
Dear {NAME},

we're looking forward to your stay at Villa Rudolf! We've prepared a little personal guide to the
area for you – trip ideas ranked by weather, kids' ages and your group size:

{LINK}

The page shows live weather and works offline too – just add it to your home screen. We wish you
a wonderful stay and see you soon in the Giant Mountains!

Warm regards,
Villa Rudolf
```

---

## Test webhooku (ze serveru, přes SSH tunel)

```bash
curl -s -X POST http://localhost:5678/webhook/vr-new-guest \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Max","last_name":"Mustermann","lang":"de",
       "arrival":"2026-07-10","departure":"2026-07-15",
       "adults":2,"children":"8, 10","booking_ref":"BK-12345"}'
```

Ověření, že host vznikl (RAW token z vráceného `link`, anon klíč je veřejný):

```bash
curl -s -X POST https://fpknbrzbqpalguajskut.supabase.co/rest/v1/rpc/vr_verify_token \
  -H "apikey: <anon>" -H "Authorization: Bearer <anon>" \
  -H "Content-Type: application/json" \
  -d '{"p_token":"<rawToken>"}'
```

Vrátí jméno, jazyk, termín, počet dospělých a pole dětí.

---

## Denní úklid expirovaných rezervací

Úklid se dělá přes RPC **`vr_purge_expired`** (odstraní rezervace po expiraci / dávno po odjezdu).
Volej ho jednou denně (n8n Schedule node, cron, nebo externí scheduler) přes Supabase REST
s anon klíčem + ingest secretem – stejně jako zakládání, žádný `SERVICE_ROLE`:

```bash
curl -s -X POST https://fpknbrzbqpalguajskut.supabase.co/rest/v1/rpc/vr_purge_expired \
  -H "apikey: <anon>" -H "Authorization: Bearer <anon>" \
  -H "Content-Type: application/json" \
  -d '{"p_secret":"<ingest secret uložený ve workflow>"}'
```

RPC smaže expirované řádky serverově, takže se DB nehromadí a nedotýká se aktivních hostů.
