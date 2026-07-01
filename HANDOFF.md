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
> GitHub `hialexpopa-ux/Tama`). Le brief de conception `TAMA-START.md` vit
> **ailleurs**, dans `g:\My Drive\CodexApps\Tama` (dossier Drive, non versionné avec
> le code) — le consulter pour le détail des mécaniques P1, mais **coder ici**.
>
> Réf permanente (ne se périme pas comme ce handoff) : `TAMA-START.md` (brief de
> conception complet, dans le dossier Drive) + `CLAUDE.md` (conventions).

## 1. Ce qu'est l'app

Un **Tamagotchi fidèle au P1 officiel (Bandai Gen 1, 1996-97)**, livré en **PWA**
installable **desktop + Android**, en **JS pur sans build**. Il n'existe qu'**une
seule app : la PWA**, ouverte par trois portes — Andy (lanceur Electron qui ouvre
l'URL et *lit* l'état, ne calcule jamais), navigateur desktop, Android (« ajouter à
l'écran d'accueil »). Le **moteur** (`src/tama.js`) est du **pur calcul d'état**
(aucun DOM/`fs`/réseau). Persistance derrière une interface **`store`** : locale en
phase 1, **Firebase** en phase 2 (couche partagée → un seul pet vécu partout ;
**Drive n'intervient jamais dans la synchro**).

Mécaniques P1 (détail complet dans `TAMA-START.md`, dossier Drive) : 2 compteurs de
**4 cœurs** (faim/bonheur), **discipline** par paliers 0/25/50/75/100, **poids**,
**care mistakes cachés** (fenêtre 15 min) qui pilotent l'évolution œuf→bébé→enfant→
ado→adulte, sommeil/caca/maladie en **flags**, santé implicite. **Pas de stat hors-P1.**

## 2. Lancer / tester

```powershell
# Tester le moteur en Node (aucune UI) — dès que src/tama.js existe
node src/tama.js

# Servir la PWA en local (service worker + Firebase impossibles en file://)
npx serve .          # ou : python -m http.server 8000  → http://localhost:8000
```

_(À compléter au fur et à mesure que les fichiers existent.)_

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
  fois, finis par `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
  **GitHub = seule sauvegarde de l'historique** (repo hors-Drive) → pousser après
  chaque commit substantiel.

## 5. Historique (le plus récent en haut)

| Commit | Quoi |
| --- | --- |
| _(à venir)_ | Étape 1 : moteur `tama.js` + `constants.js` |
| `4be0377` | Étape 0 : squelette du dépôt (CLAUDE.md, CHANGELOG 0.1.0, README, .gitignore) |

## 6. État courant & directions

**Étape 0 terminée** : repo neuf `C:\dev\Tama` (hors Drive), docs fraîches, premier
commit `4be0377` poussé sur GitHub (privé). Mécanisme de passation installé (ce doc
+ section « Passation » de `CLAUDE.md`).

**Prochaine étape = 1 (moteur)** : `src/tama.js` + `src/constants.js` — moteur pur
fidèle P1 (état sérialisable §3 du brief, actions pures, `tick` à horloge/aléatoire
injectés, sous-pas 15 min, plafond 12 h), **testable en Node sans UI**, avec un petit
script de test pour valider faim/bonheur, discipline, care mistakes, évolution.

_Directions possibles quand on reprend : (a) attaquer le moteur (recommandé) ;
(b) d'abord poser `constants.js` avec les deux jeux de valeurs (Officiel/Dev) ;
(c) esquisser l'interface `store` avant le moteur._
