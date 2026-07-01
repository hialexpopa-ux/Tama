# Passation — Tama

**Fraîcheur (auto-cohérente)** : ce doc est committé **avec** le code, donc il est
à jour ⇔ le dernier commit qui le modifie est HEAD. Contrôle au démarrage :
`git log -1 --format=%h -- HANDOFF.md` vs `git rev-parse --short HEAD`. S'il y a
des commits **après** → répare-le (reconstruis l'état manquant depuis
`git log --oneline <dernierCommitDoc>..HEAD`) avant de continuer.

> **Nouvelle session Claude : lis ce doc en entier d'abord.** Contexte, ce qui a
> été fait, conventions/pièges, directions. Réponds **en français** (l'utilisateur
> est Alex, francophone). Après lecture, propose 2-3 directions (ne code pas avant
> son OK).
>
> **Protocole complet : `CLAUDE.md` global.** Rappels clés : (1) **vérifie la
> fraîcheur** (git log vs HEAD ci-dessus) et **répare** si périmé ; (2) **fraîcheur
> ≠ exactitude** — recoupe les affirmations concrètes (commits listés vs `git log`,
> fichiers/fonctions cités encore présents, chiffres de tests = « dernière valeur
> connue », ne pas relancer par principe) contre le réel, ne crois pas le seul feu
> vert ; (3) **mets ce doc à jour dans le même commit** que le code.
>
> ⚠️ **Emplacement du vrai repo : `C:\dev\Tama`** (hors Drive/OneDrive, poussé sur
> GitHub `hialexpopa-ux/Tama`). Le brief de conception **`TAMA-START.md` est
> versionné à la racine du repo** (le dossier Drive `g:\My Drive\CodexApps\Tama`
> ne garde qu'un breadcrumb `WHERE-IS-THE-CODE.md` pointant ici).
>
> Réf permanente (ne se périme pas comme ce handoff) : `TAMA-START.md` (brief de
> conception complet, racine du repo) + `CLAUDE.md` (conventions).

## 1. Ce qu'est l'app

Un **Tamagotchi fidèle au P1 officiel (Bandai Gen 1, 1996-97)**, livré en **PWA**
installable **desktop + Android**, en **JS pur sans build**. Il n'existe qu'**une
seule app : la PWA**, ouverte par trois portes — Andy (lanceur Electron qui ouvre
l'URL et *lit* l'état, ne calcule jamais), navigateur desktop, Android (« ajouter à
l'écran d'accueil »). Le **moteur** (`src/tama.js`) est du **pur calcul d'état**
(aucun DOM/`fs`/réseau). Persistance derrière une interface **`store`** : locale en
phase 1, **Firebase** en phase 2 (couche partagée → un seul pet vécu partout ;
**Drive n'intervient jamais dans la synchro**).

Mécaniques P1 (détail complet dans `TAMA-START.md`, racine du repo) : 2 compteurs de
**4 cœurs** (faim/bonheur), **discipline** par paliers 0/25/50/75/100, **poids**,
**care mistakes cachés** (fenêtre 15 min) qui pilotent l'évolution œuf→bébé→enfant→
ado→adulte, sommeil/caca/maladie en **flags**, santé implicite. **Pas de stat hors-P1.**

## 2. Lancer / tester

```powershell
# Tester le moteur en Node (aucune UI, zéro dépendance)
npm test             # = node test/tama.test.js — 26 tests, mode dev ET official

# Servir la PWA en local (service worker + Firebase impossibles en file://)
npx serve .          # ou : python -m http.server 8000  → http://localhost:8000
```

_Le `package.json` n'existe que pour `"type": "module"` (ESM en Node) et le script
de test — zéro dépendance, zéro build. Piège : pas de round-trip
`Get-Content`/`Set-Content` PowerShell sur les sources (casse l'UTF-8)._

## 3. Structure cible (voir `TAMA-START.md` §2 pour le détail)

```
index.html · manifest.webmanifest · sw.js
src/  tama.js (moteur pur) · constants.js · store.js · ui.js · game.js · assets.js
assets/  manifest.json (slots→PNG) · sprites/ (PNG remplaçables)
CLAUDE.md · CHANGELOG.md · README.md · HANDOFF.md
```

## 4. Conventions & garde-fous (résumé — détail dans `CLAUDE.md`)

- **JS pur, pas de build. Moteur pur** : `tick(state, elapsedMin, nowIso, rand)`,
  horloge + aléatoire **injectés** (jamais `Date.now()`/`Math.random()` dedans),
  sous-pas 15 min, plafond rattrapage 12 h, actions pures.
- **Un seul ticker.** **Aucune logique de jeu dans l'UI.** **Toutes les valeurs de
  gameplay dans `constants.js`.** **Art 100 % remplaçable via manifeste** (slot
  manquant → placeholder, jamais de crash).
- **Règle de relais** : pour tout sujet qui bouge (PWA/service worker, Firebase,
  versions de libs, quirks Android, capacités navigateur) → **ne pas deviner**,
  faire relayer une question précise à « Claude-avec-internet », puis appliquer.
- **Git** : travail direct sur `main`, **Conventional Commits**, une intention à la
  fois, finis par le trailer `Co-Authored-By` du **modèle courant** (aujourd'hui
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`).
  **GitHub = seule sauvegarde de l'historique** (repo hors-Drive) → pousser après
  chaque commit substantiel.

## 5. Historique (le plus récent en haut)

| Commit | Quoi |
| --- | --- |
| _(ce commit)_ | Étape 2 : `store.js` (interface async load/save/clear, impl localStorage) + 5 tests |
| `ec273eb` | Étape 1 : moteur pur `tama.js` + `constants.js` + 26 tests Node (verts en dev ET official) |
| `29e50c5` | Docs : brief `TAMA-START.md` versionné dans le repo, plan de phase 1 gravé ici |
| `8f70f00` | Mécanisme universel de passation (HANDOFF.md + renvoi CLAUDE.md + hook global) |
| `4be0377` | Étape 0 : squelette du dépôt (CLAUDE.md, CHANGELOG 0.1.0, README, .gitignore) |

## 6. État courant & plan de phase 1 (validé par Alex, 2026-07-01)

**Étape 0 terminée**, plan complet validé (« documente tout et puis suis ton plan »).
Chaque étape = commit(s) Conventional + HANDOFF.md à jour dedans + push.

1. ✅ **Moteur** (fait, ce commit) — `src/constants.js` (Officiel/Dev, sélecteur
   `MODE`, défaut Dev) + `src/tama.js` (état §3 + internes `timers`/`sickness`/
   `counted`, `createEgg`, `tick` sous-pas 15 min / plafond 12 h, actions pures
   contrat « refus = même référence », `summary`, `makeRand` seedé) +
   `test/tama.test.js` (26 tests, verts dans les DEUX modes ; dernière valeur
   connue : 26/26). Choix notables : 6 adultes = qualité d'ado × rang de
   discipline ; sommeil par horloge locale (ISO **sans** suffixe Z) ; en mode dev
   les stades (2-15 min) sont plus courts que la fenêtre de care mistake (15 min)
   → l'évolution « négligée » ne se déclenche naturellement qu'en mode official
   (les tests craftent l'état pour rester déterministes).
2. ✅ **Store** (fait, ce commit) — `src/store.js`, `createLocalStore(storage)` :
   interface **async** `load()/save()/clear()` (pour que la bascule Firebase ne
   change rien aux appelants), impl localStorage, corruption/version inconnue →
   `null` (œuf neuf, jamais de crash). 5 tests (`test/store.test.js`, faux
   localStorage). `npm test` lance les deux suites : 31 tests, dernière valeur
   connue 31/31.
3. **UI** — `index.html` + `src/ui.js` + `src/game.js` : cœurs, 7 icônes P1
   (Repas, Lumière, Jouer, Médicament, Nettoyer, Santé, Discipline), check meter
   (sans les care mistakes cachés), mini-jeu gauche/droite 5 manches, un seul
   `setInterval` propriétaire du tick + rattrapage au chargement. Placeholders.
4. **Art** — `src/assets.js` + `assets/manifest.json` (slots §6 du brief,
   fallback placeholder, `image-rendering: pixelated`). Alex dépose ses PNG
   librement ensuite.
5. **PWA** — `manifest.webmanifest` + `sw.js`. ⚠️ **Règle de relais obligatoire** :
   questions précises à Claude-avec-internet (manifest minimal Android 2026,
   pattern service worker + stratégie de mise à jour du cache) AVANT de coder.
6. **Hébergement + Andy lanceur** — publier à une URL https (choix d'hébergeur à
   trancher avec Alex : GitHub Pages / Netlify / Firebase Hosting), puis action
   « ouvrir l'URL » côté Andy.

**Phase 2 (plus tard)** : `store.js` → Firebase, horloge serveur, un seul pet partout.

_Décisions actées : brief versionné dans le repo (copie Drive = breadcrumb seul) ;
`WHERE-IS-THE-CODE.md` retiré du repo (il appartient au Drive) ; mode **Dev** par
défaut dans `constants.js` (éclosion 30 s, stades courts), l'Officiel à un flag près._
