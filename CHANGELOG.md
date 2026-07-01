# Changelog

Toutes les modifications notables de Tama sont consignées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionnage sémantique.

## [Non publié]

### Ajouté
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
