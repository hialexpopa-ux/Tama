// tools/make-icons.mjs — génère les icônes PWA placeholder (œuf sur fond rose)
// en PNG pur Node (zlib), AUCUNE dépendance. Ce n'est pas une étape de build :
// on le lance une fois (node tools/make-icons.mjs) et on committe les PNG.
// Alex peut remplacer les fichiers d'assets/icons/ par les siens quand il veut.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ——— Écriture PNG minimale (RGBA 8 bits, non entrelacé) ———
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function png(size, pixelAt /* (x, y) -> [r,g,b,a] */) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4);
    raw[row] = 0; // filtre None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      raw.set([r, g, b, a], row + 1 + x * 4);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ——— L'œuf (même palette que l'UI : coque rose, LCD crème) ———
const SHELL = [232, 85, 109, 255];   // #e8556d
const EGG = [255, 248, 231, 255];    // blanc cassé
const OUTLINE = [36, 51, 29, 255];   // #24331d
const NONE = [0, 0, 0, 0];

// scale < 1 rétrécit l'œuf (zone sûre maskable : cercle central de rayon 40 %)
function eggIcon(size, { opaque, scale }) {
  const cx = size / 2;
  const cy = size / 2 + size * 0.02;
  const b = size * 0.40 * scale;          // demi-hauteur
  return png(size, (x, y) => {
    const dy = (y - cy) / b;
    // œuf : plus étroit en haut qu'en bas
    const a = b * (dy < 0 ? 0.74 + 0.16 * (1 + dy) : 0.90);
    const d = ((x - cx) / a) ** 2 + dy ** 2;
    if (d <= 0.86) return EGG;
    if (d <= 1) return OUTLINE;
    return opaque ? SHELL : NONE;
  });
}

mkdirSync(new URL('../assets/icons/', import.meta.url), { recursive: true });
const out = (name, buf) => {
  writeFileSync(new URL(`../assets/icons/${name}`, import.meta.url), buf);
  console.log(`assets/icons/${name} (${buf.length} octets)`);
};
out('icon-192.png', eggIcon(192, { opaque: false, scale: 1 }));
out('icon-512.png', eggIcon(512, { opaque: false, scale: 1 }));
out('icon-maskable-512.png', eggIcon(512, { opaque: true, scale: 0.78 }));
