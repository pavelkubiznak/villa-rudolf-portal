#!/usr/bin/env python3
"""Fotky k výletům: zkopíruje je z Wikimedia Commons k nám (data/img/<id>.jpg), ať nejsou jen odkazem.

  python3 -I scripts/fotky.py            náhled: které fotky by se stáhly (nic nemění)
  python3 -I scripts/fotky.py --zapsat   stáhne, zmenší na šířku 1024 px, uloží a přepíše photo.url v data/trips.json

U každého výletu s `photo.url` mimo náš web stáhne obrázek, zmenší ho (JPEG, bez EXIF) a `photo.url` přepíše na
adresu u nás; původní adresa zůstane v `photo.original`, stránka souboru na Commons v `photo.source`.
Autor a licence (`photo.credit`) se ukazují u fotky v průvodci; přehled je v data/img/FOTKY.md
(licence CC BY / CC BY-SA vyžadují uvést autora, licenci a že byl snímek upraven – zmenšen).
Jen vlastní nebo volně licencované fotky. Dá se pouštět opakovaně, hotové přeskakuje.
"""
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image

KOREN = Path(__file__).resolve().parent.parent
NASE = "https://pavelkubiznak.github.io/villa-rudolf-portal/data/"
SIRKA = 1024


def main():
    zapsat = "--zapsat" in sys.argv
    cesta = KOREN / "data/trips.json"
    d = json.loads(cesta.read_text())
    img = KOREN / "data/img"
    n = 0
    for t in d["trips"]:
        f = t.get("photo")
        if not f or f.get("url", "").startswith(NASE):
            continue
        if not f["url"].startswith("https://upload.wikimedia.org/"):
            print(f'{t["id"]}: neznámý zdroj {f["url"][:60]} – přeskočeno')
            continue
        n += 1
        if not zapsat:
            print(f'{t["id"]}: stáhl bych {f["url"][-70:]}')
            continue
        req = urllib.request.Request(f["url"], headers={"User-Agent": "VillaRudolfGuide/1.0 (https://villarudolf.com; trip photos)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        obr = Image.open(io.BytesIO(data)).convert("RGB")
        if obr.width > SIRKA:
            obr = obr.resize((SIRKA, round(obr.height * SIRKA / obr.width)), Image.LANCZOS)
        img.mkdir(exist_ok=True)
        cil = img / f'{t["id"]}.jpg'
        obr.save(cil, "JPEG", quality=80, optimize=True, progressive=True)
        f["original"] = f["url"]
        f["url"] = NASE + "img/" + cil.name
        print(f'{t["id"]}: {obr.width}×{obr.height}, {cil.stat().st_size // 1024} kB')
    if zapsat:
        cesta.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n")
        radky = ["# Fotky k výletům", "",
                 "Zkopírované z Wikimedia Commons skriptem `scripts/fotky.py`, zmenšené na šířku 1024 px (jinak beze změny).",
                 "Autor a licence se ukazují u fotky v průvodci (`photo.credit` v `data/trips.json`).", "",
                 "| soubor | autor · licence | zdroj |", "|---|---|---|"]
        for t in d["trips"]:
            f = t.get("photo")
            if f and f.get("url", "").startswith(NASE):
                radky.append(f'| {f["url"].rsplit("/", 1)[1]} | {f.get("credit", "")} | {f.get("source") or f.get("original", "")} |')
        (img / "FOTKY.md").write_text("\n".join(radky) + "\n")
    print(f"{n} fotek {'zkopírováno' if zapsat else 'ke zkopírování'}")


if __name__ == "__main__":
    main()
