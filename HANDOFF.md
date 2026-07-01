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
npm test             # 26 tests moteur + 5 tests store, mode dev ET official

# Servir la PWA en local (service worker + Firebase impossibles en file://)
npm start            # = node tools/serve.mjs  → http://localhost:8000
                     # (pas de Python sur la machine ; npx serve marche aussi)
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
| _(ce commit)_ | `npm start` : mini serveur statique de dev (`tools/serve.mjs`, zéro dépendance) |
| `1f6c260` | Étape 5 : PWA (`manifest.webmanifest` + `sw.js` SWR + icônes générées) |
| `b63bc44` | Étape 4 : art via manifeste (`assets.js` + `assets/manifest.json`, repli émoji) |
| `1156a8e` | Étape 3 : UI jouable (`index.html` + `ui.js` + `game.js`, placeholders émoji) |
| `6289047` | Étape 2 : `store.js` (interface async load/save/clear, impl localStorage) + 5 tests |
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
3. ✅ **UI** (fait, ce commit) — `index.html` (coquille + CSS inline, 7 icônes
   P1 : Repas→sous-menu repas/friandise, Lumière, Jouer, Médicament, Nettoyer,
   Santé, Discipline) + `src/ui.js` (boot, ticker unique 5 s + rattrapage au
   chargement/`visibilitychange`, rendu par `summary()`, refus = shake, check
   meter sans care mistakes, écran de mort → nouvel œuf) + `src/game.js`
   (mini-jeu gauche/droite 5 manches → `play(state, wins)`). Placeholders émoji
   en attendant l'étape 4. Moteur : ajout `toLocalIso` (convention ISO locale
   sans Z) et `canPlay` (prédicat exporté, pas de règle dupliquée dans l'UI).
   Vérifié : `node --check`, 31 tests verts, smoke-test du boot en Node (DOM
   factice, clics sur les 7 boutons). **Pas encore testé dans un vrai
   navigateur** → à faire : `npx serve .` puis jouer une vie en mode dev.
4. ✅ **Art** (fait, ce commit) — `src/assets.js` (`loadArt()` : fetch du
   manifeste, slot → URL, `noArt` par défaut) + `assets/manifest.json`
   (11 stages dont 6 adultes, 5 overlays, 7 icônes → `sprites/*.png`) +
   `assets/sprites/README.md` (mode d'emploi pour Alex). Dans `ui.js` :
   helper `face()` = PNG si dispo, sinon émoji — fichier introuvable mémorisé
   (pas de clignotement), donc **manifeste/slot/PNG manquant = placeholder,
   jamais de crash**. Alex peut déposer ses PNG à tout moment.
5. ✅ **PWA** (fait, ce commit) — relais effectué le 2026-07-01 **avec les outils
   web de l'assistant** (MDN « Making PWAs installable » + web.dev
   « install-criteria ») : installabilité Chrome = manifest (`name`,
   `start_url`, `display: standalone`, icônes réelles **192 + 512 px**) + HTTPS ;
   le service worker n'est **plus requis** pour installer, mais nécessaire pour
   l'offline. Livré : `manifest.webmanifest` (+ icône maskable), `sw.js`
   (précache du shell, cache versionné `tama-v1` purgé à l'activation, fetch en
   **stale-while-revalidate** → maj au rechargement suivant sans build),
   `<link rel="manifest">` + enregistrement SW dans `ui.js`,
   `tools/make-icons.mjs` (génère les PNG d'icône en Node pur, zéro dépendance —
   remplaçables par ceux d'Alex dans `assets/icons/`).
6. **Hébergement + Andy lanceur** — publier à une URL https (choix d'hébergeur à
   trancher avec Alex : GitHub Pages / Netlify / Firebase Hosting), puis action
   « ouvrir l'URL » côté Andy.

**Reste à faire** : (a) **tester une vie complète dans un vrai navigateur**
(`npx serve .`, mode dev : éclosion 30 s, adulte en ~30 min) — le smoke-test Node
ne remplace pas un œil humain ; (b) **étape 6** : choix d'hébergement à trancher
par Alex (le repo GitHub est privé → Pages exigerait de le rendre public ;
Netlify/Firebase Hosting marchent en privé), puis Andy-lanceur ; (c) les PNG
d'Alex (sprites + icônes) quand il veut.

**Phase 2 (plus tard)** : `store.js` → Firebase, horloge serveur, un seul pet partout.

_Décisions actées : brief versionné dans le repo (copie Drive = breadcrumb seul) ;
`WHERE-IS-THE-CODE.md` retiré du repo (il appartient au Drive) ; mode **Dev** par
défaut dans `constants.js` (éclosion 30 s, stades courts), l'Officiel à un flag près._
