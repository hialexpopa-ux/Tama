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
(aucun DOM/`fs`/réseau). Persistance derrière une interface **`store`** :
**locale à chaque appareil** (`localStorage`). **Décision Alex 2026-07-02 : pas de
synchronisation entre appareils** — chaque porte a son propre pet ; on partage l'app
et l'art (même URL, mêmes PNG), pas la vie du pet. **Firebase / phase 2 abandonnés.**

Mécaniques P1 (détail complet dans `TAMA-START.md`, racine du repo) : 2 compteurs de
**4 cœurs** (faim/bonheur), **discipline** par paliers 0/25/50/75/100, **poids**,
**care mistakes cachés** (fenêtre 15 min) qui pilotent l'évolution œuf→bébé→enfant→
ado→adulte, sommeil/caca/maladie en **flags**, santé implicite. **Pas de stat hors-P1.**

## 2. Lancer / tester

```powershell
# Tester le moteur en Node (aucune UI, zéro dépendance)
npm test             # 32 tests moteur (33 en official) + 5 store, verts dans les DEUX modes

# Servir la PWA en local (service worker impossible en file://)
npm start            # = node tools/serve.mjs  → http://localhost:8000
                     # (pas de Python sur la machine ; npx serve marche aussi)
# Repartir d'un œuf neuf pendant les tests : http://localhost:8000/?reset
# Voir le résumé d'absence sans attendre : ...?ago=25 (recule l'horloge de 25 min ;
#   se combine : ...?reset&ago=25). Les deux params se retirent de l'URL après coup.
```

_Le `package.json` n'existe que pour `"type": "module"` (ESM en Node) et le script
de test — zéro dépendance, zéro build. Piège : pas de round-trip
`Get-Content`/`Set-Content` PowerShell sur les sources (casse l'UTF-8)._

## 3. Structure cible (voir `TAMA-START.md` §2 pour le détail)

```
index.html · manifest.webmanifest · sw.js
src/  tama.js (moteur pur) · constants.js · store.js · ui.js · game.js · assets.js
assets/  manifest.json (slots→PNG) · sprites/ (PNG remplaçables)
CLAUDE.md · CHANGELOG.md · README.md · HANDOFF.md · ASSETS.md (brief d'art : slots réels)
```

## 4. Conventions & garde-fous (résumé — détail dans `CLAUDE.md`)

- **JS pur, pas de build. Moteur pur** : `tick(state, elapsedMin, nowIso, rand)`,
  horloge + aléatoire **injectés** (jamais `Date.now()`/`Math.random()` dedans),
  sous-pas 15 min, plafond rattrapage 12 h, actions pures.
- **Un seul ticker.** **Aucune logique de jeu dans l'UI.** **Toutes les valeurs de
  gameplay dans `constants.js`.** **Art 100 % remplaçable via manifeste** (slot
  manquant → placeholder, jamais de crash).
- **Règle de relais** : pour tout sujet qui bouge (PWA/service worker,
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
| _(ce commit)_ | **Résumé d'absence en 3 tons** (grave/moyen/neutre, gras+atténué) — UI seulement (`ui.js` + CSS), moteur intact ; ligne « réclame ton attention » retirée ; wording public `index.html` ; bump `CACHE_VERSION` v5 |
| `5580eeb` | **Doctrine design gravée** : « toute nouveauté habille le P1 » (README wording public prudent, doctrine `CLAUDE.md`, §7 enrichie, nouveau `ASSETS.md`). Docs seulement, moteur intact |
| `e22c492` | Docs : spec traçable des blocs B (thèmes) et C (saveur narrative) — critères de « c'est bien fait » (§7) |
| `d38bd66` | chore : `CACHE_VERSION` → `tama-v4` (signaler le résumé d'absence aux installs existantes) |
| `6d69fd0` | **Bloc A — Résumé d'absence** : fonction pure `absenceSummary(before,after)` (diff, +4 tests) + modale « Pendant ton absence… » dans `ui.js` (non punitive) + raccourci `?ago=N`. Fidèle P1, moteur inchangé |
| `3cb95df` | Doc `ANDY-INTEGRATION.md` : spec pour brancher le mode `?mini` dans le widget Andy (à faire côté repo d'Andy) |
| `e87b452` | Mode compact `?mini` : coque retirée, écran + boutons réduits, fond transparent → accessoire flottant (widget Andy) |
| `993cc0e` | Mise à jour auto de la PWA : bandeau « Nouvelle version — Recharger » (SW en attente + `SKIP_WAITING`) ; convention bump `CACHE_VERSION` |
| `5f11936` | Décision : **pas de sync / Firebase / phase 2 abandonnés** — pets locaux distincts assumés (doc alignée) |
| `2847063` | Fix cycle de vie fidèle P1 : bébé sans nuit (+ sieste official), sommeil par personnage, décroissance par stade, mode dev rééchelonné, noms français |
| `895cdc0` | Toilettage passation : historique recalé sur les vrais hashes |
| `cdf0918` | URL Pages validée sur le téléphone d'Alex |
| `5807ab8` | Étape 6a : GitHub Pages activé, repo public → <https://hialexpopa-ux.github.io/Tama/> |
| `367bcec` | Validation navigateur d'Alex : offline + installation desktop OK |
| `c3771ab` | `?reset` dans l'URL = œuf neuf (raccourci de test sans DevTools) |
| `dcd5295` | `npm start` : mini serveur statique de dev (`tools/serve.mjs`, zéro dépendance) |
| `1f6c260` | Étape 5 : PWA (`manifest.webmanifest` + `sw.js` SWR + icônes générées) |
| `b63bc44` | Étape 4 : art via manifeste (`assets.js` + `assets/manifest.json`, repli émoji) |
| `1156a8e` | Étape 3 : UI jouable (`index.html` + `ui.js` + `game.js`, placeholders émoji) |
| `6289047` | Étape 2 : `store.js` (interface async load/save/clear, impl localStorage) + 5 tests |
| `ec273eb` | Étape 1 : moteur pur `tama.js` + `constants.js` + 26 tests Node (verts en dev ET official) |
| `29e50c5` | Docs : brief `TAMA-START.md` versionné dans le repo, plan de phase 1 gravé ici |
| `8f70f00` | Mécanisme universel de passation (HANDOFF.md + renvoi CLAUDE.md + hook global) |
| `4be0377` | Étape 0 : squelette du dépôt (CLAUDE.md, CHANGELOG 0.1.0, README, .gitignore) |

## 6. État courant & plan de phase 1 (validé par Alex, 2026-07-01)

**Phase 1 quasi bouclée en une session (2026-07-01)** : étapes 0 à 6a toutes
faites, app **en ligne et validée** sur desktop + téléphone. Chaque étape =
commit(s) Conventional + HANDOFF.md à jour dedans + push.

1. ✅ **Moteur** (fait, `ec273eb`) — `src/constants.js` (Officiel/Dev, sélecteur
   `MODE`, défaut Dev) + `src/tama.js` (état §3 + internes `timers`/`sickness`/
   `counted`, `createEgg`, `tick` sous-pas 15 min / plafond 12 h, actions pures
   contrat « refus = même référence », `summary`, `makeRand` seedé) +
   `test/tama.test.js` (26 tests, verts dans les DEUX modes ; dernière valeur
   connue : 26/26). Choix notables : 6 adultes = qualité d'ado × rang de
   discipline ; sommeil par horloge locale (ISO **sans** suffixe Z) ; en mode dev
   les stades (2-15 min) sont plus courts que la fenêtre de care mistake (15 min)
   → l'évolution « négligée » ne se déclenche naturellement qu'en mode official
   (les tests craftent l'état pour rester déterministes).
2. ✅ **Store** (fait, `6289047`) — `src/store.js`, `createLocalStore(storage)` :
   interface **async** `load()/save()/clear()` (garde l'app découplée de la
   persistance ; l'async ne coûte rien même en localStorage), corruption/version inconnue →
   `null` (œuf neuf, jamais de crash). 5 tests (`test/store.test.js`, faux
   localStorage). `npm test` lance les deux suites : 31 tests, dernière valeur
   connue 31/31.
3. ✅ **UI** (fait, `1156a8e`) — `index.html` (coquille + CSS inline, 7 icônes
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
4. ✅ **Art** (fait, `b63bc44`) — `src/assets.js` (`loadArt()` : fetch du
   manifeste, slot → URL, `noArt` par défaut) + `assets/manifest.json`
   (11 stages dont 6 adultes, 5 overlays, 7 icônes → `sprites/*.png`) +
   `assets/sprites/README.md` (mode d'emploi pour Alex). Dans `ui.js` :
   helper `face()` = PNG si dispo, sinon émoji — fichier introuvable mémorisé
   (pas de clignotement), donc **manifeste/slot/PNG manquant = placeholder,
   jamais de crash**. Alex peut déposer ses PNG à tout moment.
5. ✅ **PWA** (fait, `1f6c260`) — relais effectué le 2026-07-01 **avec les outils
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
6. 🟡 **Hébergement ✅ / Andy à faire** — choix d'Alex (2026-07-01) : **GitHub
   Pages**, repo passé en **public** (aucun secret dedans, le brief le permet).
   Pages activé (`gh api repos/…/pages`, branche `main`, racine) → **l'app vit à
   <https://hialexpopa-ux.github.io/Tama/>** (vérifié : tous les fichiers clés
   répondent 200 ; les chemins relatifs partout rendent le sous-chemin `/Tama/`
   transparent). Reste : **Andy lanceur** (action « ouvrir l'URL » — se fait dans
   le repo d'Andy, pas ici) et le test d'installation **Android** par Alex.

**Validé par Alex (2026-07-01, navigateur réel)** : offline OK (Wi-Fi coupé →
l'app s'affiche) et **installation desktop OK** (fenêtre autonome, icône œuf).
**En ligne le même jour : <https://hialexpopa-ux.github.io/Tama/>** (GitHub
Pages, repo public — chaque `git push` sur `main` redéploie tout seul).

**Android (2026-07-01)** : l'URL Pages **s'ouvre et marche sur le téléphone
d'Alex** ✅ — reste à confirmer l'« Ajouter à l'écran d'accueil » (icône œuf +
plein écran + offline).

**Fix cycle de vie (2026-07-02, recoupé avec les données réelles du P1 —
thaao.net/tama/p1 + mesures d'un P1 original)** : le bébé « dormait » 20h→9h dès
l'éclosion → tout gelé sauf l'âge (bug vu par Alex un matin). Corrigé : **bébé
sans sommeil nocturne** (fidèle Babytchi ; en official : stade de 65 min +
micro-sieste 5 min à la 40e min, `C.babyNap`), **sommeil par personnage**
(`C.sleep` indexé par `character` : child 20h→9h, ados 21h→9h, adultes 22h→9h,
adult_3 23h→11h, adult_6 22h→10h), **décroissance faim/bonheur par stade**
(official bébé : 3/4 min, mesuré) et **mode dev rééchelonné** pour qu'une vie de
~30 min montre tout (faim 1-4 min, caca 5 min, maladie mortelle 30 min…).
**Noms français** des formes affichés dans l'écran Santé (`CHAR_NAME` dans
`ui.js`) : Poussin, Bouboule, Mignon/Boudeur, Malin, Peinard, Noctambule,
Glouton, Zigzag, Ronchon.

**Reste à faire** : (a) observer une **vie complète** en mode dev (éclosion 30 s
→ adulte ~30 min : évolutions, maladie, discipline, nuit) — _en cours, Alex
regarde_ ; (b) confirmer l'installation Android à l'écran d'accueil ; (c) **Andy
lanceur / widget « MON TAMA »** (dans le repo d'Andy : afficher l'URL `?mini`,
ne jamais calculer — **spec prête : `ANDY-INTEGRATION.md`**) ; (d) les PNG
d'Alex (sprites + icônes) quand il veut ; (e) **vivre une vraie partie en
`MODE = 'official'`** (jamais éprouvé en conditions réelles, seulement en tests).
✅ **Mise à jour auto faite** : bandeau « Nouvelle version — Recharger » (SW en
attente + `SKIP_WAITING`). ⚠️ **Bumper `CACHE_VERSION` (sw.js) à chaque
déploiement** qu'on veut signaler — c'est le déclencheur du bandeau.
✅ **Assumé** : pets **distincts** par appareil (pas de sync — voir ci-dessous).

**Pas de phase 2 / pas de Firebase (décision Alex, 2026-07-02).** La sync entre
appareils est abandonnée : chaque porte a son propre pet local, et c'est très
bien ainsi. On partage l'app + l'art (même URL, mêmes PNG), pas la vie du pet.
→ La **phase 1 est l'architecture finale** ; le `store` reste `localStorage`.

**Enrichissement « Voie A » (décision Alex, 2026-07-02).** Après avoir pesé une
proposition de refonte « compagnon moderne » (8 stats, pas de mort, affection…),
Alex tranche pour **rester fidèle au P1** et n'ajouter que de l'**habillage
par-dessus le moteur intact** — jamais de nouvelle stat ni de suppression de la
mort. Trois blocs : **A. Résumé d'absence** ✅ (fait, `6d69fd0`) ; **B. Thèmes
remappables** et **C. Saveur narrative** restent à faire — **spec + critères de
« c'est bien fait » en §7 ci-dessous.**

_Décisions actées : brief versionné dans le repo (copie Drive = breadcrumb seul) ;
`WHERE-IS-THE-CODE.md` retiré du repo (il appartient au Drive) ; mode **Dev** par
défaut dans `constants.js` (éclosion 30 s, stades courts), l'Officiel à un flag près._

## 7. Enrichissement Voie A — blocs B & C (à faire, avec critères de « c'est bien fait »)

> **But de cette section** : qu'une future session sache exactement quoi livrer
> **et comment prouver que c'est bien fait**. Chaque bloc a une *définition de fini*
> (cases à cocher) + des *garde-fous vérifiables mécaniquement*. Un bloc n'est
> « fait » que si **toutes** ses cases sont vraies. Cocher ici (`[x]`) et déplacer
> le bloc en ✅ dans le §6 quand c'est livré.

**Doctrine (grave, 2026-07-02 — critique d'un web/game designer relayée par Alex).**
« **Toute nouveauté habille le P1, elle ne le remplace pas.** » Le moteur reste
cruel et fidèle ; le design rend cette dureté **lisible, belle et incarnée**, sans
la transformer en jeu moderne. (Version complète et opérationnelle dans `CLAUDE.md`
§ Doctrine ; spec d'art autoritaire dans **[`ASSETS.md`](ASSETS.md)**.)
- **Oui** : sprites, coques, palettes, sons, phrases, résumés d'absence, thèmes.
- **Non** : nouvelle stat, quête, niveaux, boutique, comptes, cloud, récompenses
  quotidiennes façon mobile game.
- **Frontière art tranchée** : *dans l'écran LCD* → PNG (manifeste) ; *hors écran*
  (coque, boutons, device, mini-mode) → **CSS thémable**. La coque est un contenant
  responsive → CSS ; un `shellImage` PNG par thème = luxe **futur** optionnel.
- **Wording public** corrigé (README) : « inspiré des virtual pets LCD des 90s /
  fidèle à l'esprit » ; « P1 / Gen 1 » = boussole **interne** seulement.

**Invariant commun (non négociable, vaut pour B et C).** Ces blocs sont de
l'**habillage** : ils ne touchent **jamais** aux mécaniques P1. Vérif mécanique
avant de déclarer fini :
- `git diff <base> -- src/tama.js src/constants.js` = **vide** (moteur et valeurs
  de gameplay inchangés — sinon ce n'est plus la Voie A). Bloc C peut ajouter une
  fonction *pure de sélection de texte* à `tama.js`, mais **zéro** nouvelle stat,
  **zéro** mécanique, et elle ne modifie pas l'état.
- `grep -n "Math.random\|Date.now" src/tama.js` = **rien** (aléatoire/horloge
  toujours injectés).
- `npm test` reste **vert** (32 moteur + 5 store), et le **compte de tests ne
  baisse pas**.
- Aucun texte de gameplay ni chemin d'image **codé en dur** ne réapparaît dans
  `ui.js` (règle « art via manifeste » + vocabulaire dans le thème).

### Bloc B — Thèmes remappables

**But** : rhabiller le pet (vampire / sirène / cochon / secrétaire…) — mots **et**
art — sans toucher au moteur. Un thème remappe la **présentation** des slots
existants ; il ne renomme aucun slot et ne déplace aucune valeur de gameplay.

*Définition de fini :*
- [ ] Un **thème par défaut** (P1 français) extrait de `ui.js` : libellés des 7
  boutons + libellés de menus (repas/friandise…), noms des formes (`CHAR_NAME`),
  faces émoji placeholder (`CHAR_FACE`), icônes de besoin (`NEED_ICON`), libellés
  de mort (`DEATH_LABEL`). Après extraction, **`ui.js` ne contient plus aucun de
  ces textes en dur** — il lit le thème actif.
- [ ] Un fichier dédié (ex. `src/themes.js`) exporte un **registre** `{ id → thème }`.
  Un thème = `{ id, labels, formNames, faces, needIcons, deathLabels, manifestUrl }`.
- [ ] Les **clés = slots moteur** (`egg`/`baby`/`child`/`teen_good`/`teen_bad`/
  `adult_1..6`/`dead`) : un thème ne fait que les **remapper**. Aucun slot renommé.
- [ ] **Thème actif persisté** dans le `store` (champ dédié, défaut = P1). Le
  changer est une **action d'UI pure** : elle ne touche **jamais** l'état du pet
  (mêmes cœurs, même âge, même vie après bascule).
- [ ] **Sélecteur** de thème dans l'UI (ex. écran Santé ou petit menu), bascule à
  chaud (re-render immédiat, art + mots).
- [ ] Chaque thème pointe vers son **`assets/<theme>/manifest.json`** ; slot/PNG
  manquant → **placeholder émoji du thème**, jamais de crash (règle art conservée).
- [ ] **Au moins un 2e thème de démonstration** (ne serait-ce que ses `labels` +
  `faces`) pour prouver le remapping **même sans PNG** d'Alex.

*Comment vérifier que c'est bien fait :* `node --check` OK ; `npm test` vert
(moteur intact → aucun test cassé) ; **test live** : basculer de thème change les
mots **et** l'art, et **ne change rien** à la vie du pet (vérifier cœurs/âge avant/
après bascule) ; supprimer un PNG d'un thème → placeholder, pas de crash.

*Fichiers probables :* `src/themes.js` (nouveau), `src/ui.js` (lit le thème au lieu
des constantes en dur), `src/store.js` (persiste le choix), `assets/themes/<id>/manifest.json`
(un par thème — cf. `ASSETS.md`), `index.html` (bouton/sélecteur éventuel). **Pas**
`tama.js` ni `constants.js`.

*Décisions design (2026-07-02) :*
- **Ordre de déploiement des thèmes** : **Classic LCD** (référence sobre, fin des
  émojis) → **Vampire** (signature mémorable) → **Secrétaire** (absurde, prouve le
  changement de ton sans changer de règles). Sirène / cochon ensuite. Trois thèmes
  suffisent (nostalgie / fantaisie / humour).
- **Coque = CSS thémable, pas PNG** (fork tranché) : la coque, les boutons et le
  mode compact sont un **contenant responsive** → variables CSS par thème
  (couleur/ombres/états pressed). PNG **uniquement** pour ce qui vit **dans l'écran
  LCD**. Un `shellImage` optionnel par thème pourra venir plus tard, pas maintenant.
- **Design system LCD d'abord** (priorité designer avant même les sprites) : figer
  grille pixel, contraste, états actif/inactif des icônes, clignotement, shake,
  mode nuit, overlays. Règle : *dans l'écran = monde LCD ; hors écran = device*.

### Bloc C — Saveur narrative

**But** : de petites phrases de personnalité selon l'état (humeur, besoin, moment,
retour d'absence), pour l'attachement — **du texte, pas une mécanique**. Se branche
mieux **après B** (les phrases sont thématisées).

*Définition de fini :*
- [ ] Un **jeu de phrases par thème** (rangé dans le thème du Bloc B, ou un module
  dédié), indexé par situation : humeur (`happy`/`meh`/`sad`), besoin actif
  (`hunger`/`happy`/`sick`/`poop`/`discipline`), moment (jour / nuit / sommeil),
  et éventuellement le retour d'absence (réutilise les faits de `absenceSummary`).
- [ ] La **sélection** d'une phrase utilise le **`rand` injecté** (jamais
  `Math.random` dans le moteur). Si une fonction de sélection va dans `tama.js`,
  elle est **pure** et **ne modifie pas l'état** (elle prend l'état + `rand`,
  renvoie une clé/texte).
- [ ] Les phrases s'affichent **discrètement** (sous l'écran, au tap sur le pet, ou
  dans le résumé d'absence) **sans gêner** le jeu ni masquer les appels.
- [ ] **Fidélité P1 préservée** : aucune phrase ne crée de stat ni n'altère une
  mécanique (garde-fou `git diff` ci-dessus).
- [ ] Un **jeu par défaut** (thème P1) existe ; les thèmes de B peuvent le surcharger.

*Comment vérifier que c'est bien fait :* si la sélection est une fonction pure →
**test de déterminisme** (même seed → même phrase) qui augmente le compte de
tests ; **test live** : les phrases apparaissent, **varient**, et restent
**cohérentes** avec l'état affiché (une phrase « affamé » ne sort pas quand les
cœurs sont pleins).

*Fichiers probables :* `src/themes.js` (phrases par thème) ou `src/phrases.js`
(nouveau), `src/ui.js` (affichage), éventuellement une fonction pure de sélection
dans `src/tama.js` (**pure, sans effet de bord**) + son test dans `test/tama.test.js`.

### Raffinement — résumé d'absence en 3 tons ✅ (livré, ce commit)

Le résumé hiérarchise désormais les **états observables** en **3 tons** (gras pour
grave, atténué pour neutre — sobre, compatible LCD monochrome), UI seulement
(`ui.js` + CSS `index.html`, moteur intact). Ligne rouge tenue : l'ancienne ligne
« il réclame ton attention » a été **retirée** (trop proche d'une narration
d'appel). Doctrine appliquée :
- **grave** : « Il est tombé malade. » / « Il avait très faim. » / « Il dort
  encore, épuisé. »
- **moyen** : « Un caca est apparu. » / « Ses cœurs ont baissé. » / « La lumière
  est restée allumée. »
- **neutre** : « Il a dormi. » / « Il a grandi. » / « Rien à signaler. »

**Interdit** : verbaliser les **appels manqués**, les **care mistakes** ou la
**progression d'évolution** (ex. « il t'a appelé, personne n'a répondu » →
révélerait le compteur caché). Le résumé ne raconte **que** du visible. Se code
côté UI (tons dérivés des faits de `absenceSummary`), moteur inchangé.

### Future polish (hors Voie A immédiate) — rendre la mort plus lisible

Objectif : que le joueur comprenne **« je l'ai négligé → conséquence logique »**,
jamais **« le jeu m'a puni sans prévenir »**. À faire **sans nouvelle mécanique** :
une lecture **dérivée** de l'état existant, à l'usage de l'UI seulement.
- **Autorisé** : flag dérivé dans `summary()` (ex. `dangerHunger` / `dangerSick`,
  calculé depuis les timers déjà présents) → créature **affaiblie** si faim
  critique, overlay malade **accentué**, écran **assombri** en état grave.
  Overlays d'art possibles en plus : `evolution_flash`, `medicine_effect`.
- **Interdit** : barre de santé, jauge de danger affichée, exposition des care
  mistakes. Ce n'est **pas** une stat — juste une **lecture** de l'état existant.
