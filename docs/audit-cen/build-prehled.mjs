#!/usr/bin/env node
// Vygeneruje samostatnou HTML tabulku ze snapshotu auditu cen.
// Použití:  node docs/audit-cen/build-prehled.mjs 2026-08-12
// Výstup:   docs/audit-cen/<datum>-prehled.html  (self-contained, otevři v prohlížeči)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const datum = process.argv[2];
if (!datum) {
  console.error("Chybí datum snapshotu, např.: node docs/audit-cen/build-prehled.mjs 2026-08-12");
  process.exit(1);
}

const data = readFileSync(join(dir, `${datum}.json`), "utf8");
const tpl = readFileSync(join(dir, "prehled.tpl.html"), "utf8");
if (!tpl.includes("/*__DATA__*/")) throw new Error("V šabloně chybí značka /*__DATA__*/");

// </script> uvnitř dat by ukončil <script> blok — pojistka, i když v datech nic takového není
const out = tpl.replace("/*__DATA__*/ null", data.replace(/<\//g, "<\\/"));
const cil = join(dir, `${datum}-prehled.html`);
writeFileSync(cil, out);
console.log(`Hotovo: docs/audit-cen/${datum}-prehled.html`);
