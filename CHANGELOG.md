# Changelog

Toutes les modifications notables de Tama sont consignées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionnage sémantique.

## [Non publié]

### Ajouté
- **Résumé d'absence en 3 tons** : le récap « Pendant ton absence… » hiérarchise
  désormais les états **observables** en *grave* (gras : tombé malade / avait très
  faim), *moyen* (caca / cœurs baissés / lumière restée allumée / a grandi) et
  *neutre* (atténué : dort paisiblement / t'attendait). Rendu sobre compatible LCD
  monochrome (poids + opacité, pas de couleur). **UI seulement** (`ui.js` + CSS
  `index.html`), moteur intact. Ligne rouge tenue : jamais d'appel manqué, de care
  mistake ni de raison d'évolution ; l'ancienne ligne « il réclame ton attention »
  (trop proche d'une narration d'appel) est retirée. Wording public aussi corrigé
  dans la meta description de `index.html`.
- **Doctrine design gravée + brief d'art** (suite à une critique d'un web/game
  designer, 2026-07-02) : **« toute nouveauté habille le P1, elle ne le remplace
  pas »** (listes Oui/Non, frontière *écran LCD = PNG* / *coque = CSS thémable*,
  wording public prudent). Nouveau **`ASSETS.md`** : liste **fermée et autoritaire**
  des 23 slots réels (11 stages + 5 overlays + 7 icons), section « non slotté
  aujourd'hui », structure par thème, ordre Classic → Vampire → Secrétaire.
  Doctrine reprise dans `CLAUDE.md` (§ Doctrine) et `HANDOFF.md` (§7, + raffinement
  « résumé en 3 tons » et *future polish* « mort lisible »). **README** repassé en
  wording public (« inspiré des virtual pets LCD des 90s », plus de « fonctionnement
  officiel Bandai »). Docs seulement — **moteur intact**.
- **Résumé d'absence (Bloc A de la « Voie A » — enrichissement fidèle P1)** : au
  retour dans l'app après une absence, une modale douce **« Pendant ton absence… »**
  raconte ce qui s'est passé (a grandi, a pris de l'âge, cœurs baissés, caca à
  nettoyer, pas en forme, réclame de l'attention, ou dort) — jamais culpabilisant
  (« il t'attendait sagement » quand rien de notable). Moteur : **fonction pure
  `absenceSummary(before, after)`** qui **diffe** l'état d'avant/après le
  rattrapage et renvoie des **faits** (aucun texte, jamais les care mistakes) ;
  **aucune signature du moteur changée** (le tick reste tel quel). UI : `ui.js`
  capture l'état d'avant le rattrapage au boot et déclenche la modale au-delà d'un
  seuil de présentation (20 min ; « coucou » nu réservé aux absences ≥ 2 h). Si le
  pet est mort pendant l'absence, l'écran de mort prime. +4 tests moteur.
  Raccourci de test **`?ago=N`** (recule l'horloge de N min, se combine à `?reset`)
  pour voir le résumé sans attendre.
- **`ANDY-INTEGRATION.md`** : spec pour brancher le mode `?mini` dans le widget
  Andy (URL à charger, iframe / fenêtre flottante / `WebContentsView`, rappels
  d'archi — Andy n'affiche que l'URL, pet local distinct). À exécuter côté Andy.
- **Mode compact `?mini`** : ouvrir `…/Tama/?mini` retire la coque rose et les
  gros boutons, ne garde que l'écran LCD + une rangée de boutons réduits, sur
  **fond transparent** — pour glisser le Tama dans un accessoire flottant (widget
  Andy). Le paramètre est conservé dans l'URL (compatible avec `?reset`). Rien
  d'autre ne change : même moteur, mêmes actions, pet jouable dans le petit format.
- **Mise à jour auto de la PWA** : le service worker n'active plus la nouvelle
  version en douce (plus de `skipWaiting()` à l'install → il attend). L'app
  détecte la version en attente et affiche un **bandeau « Nouvelle version —
  Recharger »** ; au clic, elle bascule (`SKIP_WAITING` → `controllerchange` →
  reload). Fini le « recharger deux fois sans savoir ». Convention associée :
  **bumper `CACHE_VERSION` à chaque déploiement** qu'on veut signaler.

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
