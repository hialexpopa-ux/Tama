// store.js — la couture entre le moteur et la persistance (TAMA-START §1, §8.2).
// Phase 1 : localStorage (un pet par appareil). Phase 2 : MÊME interface,
// implémentation Firebase (un seul pet partout). C'est pour ça que tout est
// asynchrone dès maintenant : la bascule cloud ne changera rien chez les appelants.
//
// Contrat :
//   load()  → Promise<state | null>   (null = pas de sauvegarde exploitable)
//   save(s) → Promise<void>
//   clear() → Promise<void>
// Une donnée corrompue ou d'une version inconnue renvoie null (→ œuf neuf),
// jamais d'exception qui remonte à l'UI.

const KEY = 'tama:state';
const KNOWN_VERSIONS = [1]; // point d'ancrage des migrations futures

export function createLocalStore(storage = globalThis.localStorage) {
  return {
    async load() {
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return null;
        const state = JSON.parse(raw);
        return state && KNOWN_VERSIONS.includes(state.version) ? state : null;
      } catch {
        return null;
      }
    },
    async save(state) {
      storage.setItem(KEY, JSON.stringify(state));
    },
    async clear() {
      storage.removeItem(KEY);
    },
  };
}
