// assets.js — art 100 % remplaçable via manifeste (CLAUDE.md) : AUCUN chemin
// d'image codé en dur dans l'app. assets/manifest.json mappe chaque slot
// logique → un PNG déposé par Alex dans assets/sprites/.
// Slot absent, manifeste illisible ou fichier manquant → l'appelant retombe sur
// son placeholder (émoji). Jamais de crash pour une image.

export async function loadArt(url = 'assets/manifest.json') {
  let manifest = {};
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch {
    // pas de manifeste (ou pas de fetch, ex. tests Node) → tout en placeholder
  }
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const resolve = (rel) => (typeof rel === 'string' && rel ? base + rel : null);
  return {
    stage: (slot) => resolve(manifest.stages?.[slot]),
    overlay: (slot) => resolve(manifest.overlays?.[slot]),
    icon: (slot) => resolve(manifest.icons?.[slot]),
  };
}

// Art « vide » : tout en placeholder (utilisé tant que loadArt n'a pas répondu).
export const noArt = { stage: () => null, overlay: () => null, icon: () => null };
