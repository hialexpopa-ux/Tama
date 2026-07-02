# Changelog

Toutes les modifications notables de Tama sont consignées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionnage sémantique.

## [Non publié]

### Corrigé
- **Cycle de vie fidèle P1** (bug : bébé « endormi » dès l'éclosion le matin →
  âge qui monte mais rien ne bouge, recoupé avec les données réelles du P1) :
  - le **bébé ne dort plus jamais la nuit** (fidèle Babytchi : stade vécu d'une
    traite) ; en mode official il fait la **micro-sieste** du vrai P1 (5 min à
    la 40e minute) et son stade dure 65 min (mesuré) ;
  - **sommeil par personnage** (plus par stade) : Bouboule 20h→9h, ados 21h→9h,
    adultes 22h→9h, Noctambule 23h→11h, Ronchon 22h→10h ;
  - **décroissance faim/bonheur par stade** (official : bébé 3/4 min comme le
    vrai P1) ; **mode dev rééchelonné** pour qu'une vie de ~30 min montre tout
    (faim, bonheur, caca, maladie, discipline).

### Ajouté
- **Noms français des formes** (affichés dans l'écran Santé) : Poussin, Bouboule,
  Mignon/Boudeur, puis Malin, Peinard, Noctambule, Glouton, Zigzag, Ronchon.
- 3 tests de régression sommeil/sieste (28 tests moteur en dev, 29 en official).
- **Étape 5 — PWA installable** : `manifest.webmanifest` (192/512 + maskable),
  `sw.js` (précache, cache versionné, stale-while-revalidate), enregistrement
  dans `ui.js`, icônes générées par `tools/make-icons.mjs` (Node pur).
- **Étape 4 — art remplaçable** : `src/assets.js` (`loadArt` : manifeste →
  URLs, repli placeholder) + `assets/manifest.json` (slots stages/overlays/
  icons) + `assets/sprites/README.md`. `ui.js` rend chaque slot en PNG si
  disponible, émoji sinon — y compris fichier manquant (jamais de crash).
- **Étape 3 — UI jouable** : `index.html` (coquille 7 icônes P1, CSS inline) +
  `src/ui.js` (ticker unique + rattrapage, rendu, modals repas/santé/mort) +
  `src/game.js` (mini-jeu gauche/droite 5 manches). Placeholders émoji.
  Moteur : exports `toLocalIso` et `canPlay` ; store : `save()` ne plante
  jamais (quota/mode privé).
- **Étape 2 — store** : `src/store.js` (`createLocalStore` : interface async
  `load()/save()/clear()`, impl localStorage, corruption → `null`) + 5 tests
  (`test/store.test.js`) ; `npm test` enchaîne les deux suites (31 tests).
- **Étape 1 — moteur pur** : `src/tama.js` (état sérialisable P1, `createEgg`,
  `tick` à horloge/aléatoire injectés — sous-pas 15 min, plafond 12 h —, actions
  pures `feed`/`play`/`clean`/`heal`/`scold`/`toggleLight`, `summary`, RNG seedé
  `makeRand`) + `src/constants.js` (jeux de valeurs Officiel et Dev, `MODE=dev`
  par défaut) + `test/tama.test.js` (26 tests Node sans framework, verts dans les
  deux modes) + `package.json` minimal (`"type": "module"`, zéro dépendance).
- Brief de conception `TAMA-START.md` versionné à la racine du repo (copie de
  référence ; le dossier Drive ne garde que le breadcrumb `WHERE-IS-THE-CODE.md`).
- Plan complet de la phase 1 gravé dans `HANDOFF.md` §6 (6 étapes, décisions actées).

## [0.1.0] — Étape 0 : squelette du dépôt

### Ajouté
- Dépôt git neuf dans `C:\dev\Tama` (hors Drive/OneDrive), sauvegardé sur GitHub.
- `CLAUDE.md` : instructions permanentes (objectif P1, conventions JS-pur / moteur pur /
  un seul ticker / art via manifeste, règle de relais pour les sujets qui bougent,
  imbrication une-app-trois-portes, garde-fous).
- `CHANGELOG.md` (ce fichier), démarré à `0.1.0`.
- `README.md` : pitch + démarrage.
- `.gitignore` adapté à une PWA vanilla.
- **Mécanisme de passation universel** : `HANDOFF.md` (doc de contexte vivant,
  en-tête auto-suffisant + fraîcheur ancrée git) + section « Passation » dans
  `CLAUDE.md` (renvoi au protocole global, sans le recopier). Breadcrumb
  `WHERE-IS-THE-CODE.md` déposé côté Drive pour rediriger vers `C:\dev\Tama`.

_Table rase : rien importé d'Andy._
