#!/usr/bin/env python3
"""Fotky k výletům: zkopíruje je z Wikimedia Commons k nám (data/img/<id>.jpg), ať nejsou jen odkazem.

  python3 -I scripts/fotky.py            náhled: co by se stáhlo a co doplnilo (nic nemění, Pillow nepotřebuje)
  python3 -I scripts/fotky.py --zapsat   stáhne, zmenší na šířku 1024 px, uloží a přepíše `photo` v data/trips.json
                                         + přegeneruje data/img/FOTKY.md

Závislost: Pillow (`pip3 install pillow`) – jen pro --zapsat, když je co stahovat nebo měřit. Jinak repo žádné
závislosti nemá (CLAUDE.md: žádný npm install); proto se PIL importuje až uvnitř funkcí, ne nahoře.

U každého výletu s `photo.url` mimo náš web stáhne obrázek, zmenší ho (JPEG, bez EXIF) a `photo.url` přepíše na
adresu u nás; původní adresa zůstane v `photo.original`, stránka souboru na Commons v `photo.source`.
Do `photo` zapíše i `width`/`height` (konzumenti je dávají na <img>, ať se layout při načítání neposouvá)
a ke kreditu připojí „ · zmenšeno“ – licence CC BY / CC BY-SA vyžadují uvést autora, licenci a to, že byl
snímek upraven. Autor a licence (`photo.credit`) se ukazují u fotky v průvodci; přehled je v data/img/FOTKY.md.
U fotek, které už u nás jsou, jen doplní chybějící rozměry a kredit.

trips.json se zapisuje atomicky (tmp + os.replace) a po každé stažené fotce, takže pád uprostřed nenechá
soubor v data/img bez záznamu. Jen vlastní nebo volně licencované fotky. Dá se pouštět opakovaně, hotové
přeskakuje. Pravidla pole `photo` hlídá `node scripts/validate-trips.mjs` (data/trips.schema.json).
"""
import io
import json
import os
import sys
import urllib.request
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
# Kořen, pod kterým jsou fotky veřejně dostupné (site tv.js testuje ^https://, proto absolutní adresa).
NASE = os.environ.get("VR_PORTAL_URL", "https://pavelkubiznak.github.io/villa-rudolf-portal/data/")
SIRKA = 1024
ZMENSENO = "zmenšeno"
UA = "VillaRudolfGuide/1.0 (https://villarudolf.com; trip photos)"


def rozmery(cesta):
    from PIL import Image  # viz docstring – Pillow jen při zápisu
    with Image.open(cesta) as obr:
        return obr.width, obr.height


def stahni(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def zmensi_a_uloz(data, cil):
    from PIL import Image
    obr = Image.open(io.BytesIO(data)).convert("RGB")  # convert zahodí EXIF i průhlednost
    if obr.width > SIRKA:
        obr = obr.resize((SIRKA, round(obr.height * SIRKA / obr.width)), Image.LANCZOS)
    obr.save(cil, "JPEG", quality=80, optimize=True, progressive=True)
    return obr.width, obr.height


def zapis_atomicky(cesta, text):
    tmp = cesta.with_name(cesta.name + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, cesta)


def doplnit(f, w, h):
    """Rozměry a „zmenšeno“ v kreditu. Vrátí True, když se v záznamu něco změnilo."""
    zmena = False
    if f.get("width") != w or f.get("height") != h:
        f["width"], f["height"] = w, h
        zmena = True
    if ZMENSENO not in f.get("credit", ""):
        f["credit"] = (f.get("credit", "") + " · " + ZMENSENO).strip(" ·")
        zmena = True
    return zmena


def chybi_doplneni(f):
    return "width" not in f or "height" not in f or ZMENSENO not in f.get("credit", "")


def fotky_md(d):
    radky = ["# Fotky k výletům", "",
             f"Zkopírované z Wikimedia Commons skriptem `scripts/fotky.py`, zmenšené na šířku {SIRKA} px (jinak beze změny)",
             "– proto má kredit dovětek „· zmenšeno“ (CC BY / CC BY-SA vyžadují uvést, že byl snímek upraven).",
             "Autor a licence se ukazují u fotky v průvodci (`photo.credit` v `data/trips.json`), rozměry jsou",
             "v `photo.width`/`photo.height`. Tabulku generuje skript, ručně ji needitovat.", "",
             "| soubor | rozměry | autor · licence | zdroj |", "|---|---|---|---|"]
    for t in d["trips"]:
        f = t.get("photo")
        if f and f.get("url", "").startswith(NASE):
            rozm = f'{f["width"]}×{f["height"]}' if "width" in f and "height" in f else "?"
            radky.append(f'| {f["url"].rsplit("/", 1)[1]} | {rozm} | {f.get("credit", "")} | {f.get("source") or f.get("original", "")} |')
    return "\n".join(radky) + "\n"


def main():
    zapsat = "--zapsat" in sys.argv
    cesta = KOREN / "data/trips.json"
    d = json.loads(cesta.read_text(encoding="utf-8"))
    img = KOREN / "data/img"
    json_text = lambda: json.dumps(d, ensure_ascii=False, indent=1) + "\n"
    stazeno = doplneno = 0
    for t in d["trips"]:
        f = t.get("photo")
        if not f:
            continue
        if f.get("url", "").startswith(NASE):
            cil = img / f["url"].rsplit("/", 1)[1]
            if not cil.exists():
                print(f'{t["id"]}: soubor {cil.name} v data/img chybí – spusť validate-trips.mjs', file=sys.stderr)
                continue
            if not chybi_doplneni(f):
                continue
            doplneno += 1
            if not zapsat:
                print(f'{t["id"]}: doplnil bych rozměry a „{ZMENSENO}“ do kreditu')
                continue
            w, h = rozmery(cil)
            doplnit(f, w, h)
            print(f'{t["id"]}: doplněno {w}×{h}')
            continue
        if not f["url"].startswith("https://upload.wikimedia.org/"):
            print(f'{t["id"]}: neznámý zdroj {f["url"][:60]} – přeskočeno')
            continue
        stazeno += 1
        if not zapsat:
            print(f'{t["id"]}: stáhl bych {f["url"][-70:]}')
            continue
        try:
            data = stahni(f["url"])
        except OSError as e:
            print(f'{t["id"]}: stažení selhalo ({e}) – přeskočeno', file=sys.stderr)
            stazeno -= 1
            continue
        img.mkdir(exist_ok=True)
        cil = img / f'{t["id"]}.jpg'
        w, h = zmensi_a_uloz(data, cil)
        f["original"] = f["url"]
        f["url"] = NASE + "img/" + cil.name
        doplnit(f, w, h)
        zapis_atomicky(cesta, json_text())  # hned, ať soubor v data/img nikdy nezůstane bez záznamu
        print(f'{t["id"]}: {w}×{h}, {cil.stat().st_size // 1024} kB')
    if zapsat:
        zapis_atomicky(cesta, json_text())
        zapis_atomicky(img / "FOTKY.md", fotky_md(d))
    print(f"{stazeno} fotek {'zkopírováno' if zapsat else 'ke zkopírování'}, "
          f"{doplneno} záznamů {'doplněno' if zapsat else 'k doplnění'}")


if __name__ == "__main__":
    main()
