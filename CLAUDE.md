# CLAUDE.md — Tama (instructions permanentes, lues à chaque session)

> App **autonome** (repo `C:\dev\Tama`, hors Drive/OneDrive, sauvegardée sur GitHub).
> Le brief de conception complet est versionné à la racine du repo :
> **[`TAMA-START.md`](TAMA-START.md)** — le consulter pour le détail des mécaniques P1.
> (Le dossier Drive `g:\My Drive\CodexApps\Tama` ne garde qu'un breadcrumb pointant ici.)

## Passation entre sessions

Ce projet utilise le mécanisme de passation. **Le protocole est défini dans le
`CLAUDE.md` global** (lecture de `HANDOFF.md`, contrôle de fraîcheur ancré git,
spot-check « fraîcheur ≠ exactitude », maj dans le même commit que le code) — ne pas
le redéfinir ici. **Doc de contexte vivant : [`HANDOFF.md`](HANDOFF.md)** (racine du
repo), à lire en entier au démarrage et à tenir à jour à chaque commit substantiel.

Ce fichier (`CLAUDE.md`) porte les **conventions stables** ; `HANDOFF.md` porte
l'**état vivant** (historique, avancement, directions).

## Objectif

Un **Tamagotchi fidèle au fonctionnement officiel Bandai Gen 1 (P1, 1996-97)**, livré en
**PWA** installable sur **desktop + Android**. Table rase : **rien** n'est importé d'Andy
(pas de code, pas de sauvegarde, pas de docs).

## Imbrication (à garder en tête)

Il n'existe **qu'UNE seule app : la PWA**. Desktop et Android ne sont pas des versions
différentes — ce sont des **portes d'entrée** vers la même app web hébergée à une URL :

- **Andy (Electron)** = simple **lanceur** : il ouvre l'URL de la PWA et peut *lire* l'état
  pour un badge, mais il ne **calcule jamais** le pet.
- **Navigateur desktop** = on ouvre l'URL directement.
- **Android** = « ajouter à l'écran d'accueil » (icône + plein écran + offline).

Ce qui rend le pet « le même » partout, c'est le **`store`** : en phase 1 il est **local**
à chaque appareil (donc pets distincts) ; en **phase 2** il pointe vers **Firebase** et
devient la couche partagée → un seul pet vécu depuis les trois portes.
**Drive n'intervient jamais dans la synchro du pet** (la sync passe par Firebase, pas Drive).

## Conventions (non négociables)

- **PWA vanilla** : HTML + CSS + JS pur. **Pas de framework, pas d'étape de build.**
- **Moteur pur** (`src/tama.js`) : **aucun accès DOM, `fs` ni réseau**. État sérialisable
  unique. `tick(state, elapsedMin, nowIso, rand)` avec **horloge et aléatoire injectés**
  (jamais `Date.now()` / `Math.random()` dans le moteur). Sous-pas de 15 min, plafond de
  rattrapage hors-ligne 12 h. Actions **pures** renvoyant le nouvel état.
- **Un seul propriétaire du tick** : cette app seule fait vivre le pet.
- **Aucune logique de jeu dans l'UI** : l'UI lit l'état et déclenche des actions, rien d'autre.
- **Art 100 % remplaçable via manifeste** : aucun chemin d'image codé en dur. `assets/manifest.json`
  mappe chaque *slot* logique → un PNG. Slot manquant → placeholder auto, jamais de crash.
- **Toutes les valeurs de gameplay** vivent dans `src/constants.js`, nulle part ailleurs.
- **Pas de stat hors-P1** : faim & bonheur (4 cœurs chacun), discipline (paliers 0/25/50/75/100),
  poids ; sommeil/caca/maladie = **flags** ; santé **implicite** (négligence → maladie → mort).

## Règle de relais (IMPORTANT — pour tout sujet qui bouge)

Le savoir de Claude Code peut être **daté**. Dès qu'un sujet demande de l'info **actuelle ou
vérifiée** — specs **PWA / service worker**, mise en place **Firebase**, **versions de libs**,
**quirks d'installation Android**, **capacités navigateur** — **NE PAS DEVINER**. Rédiger une
**question précise** à faire relayer à « Claude-avec-internet » pour obtenir la consigne à jour,
puis **appliquer** la réponse. (Alex fait le pont, ou l'assistant utilise ses outils web s'il en a.)

## Commandes (lancement / test)

- **Tester le moteur en Node** (aucune UI) : `npm test` (= `node test/tama.test.js`,
  zéro dépendance ; le `package.json` ne sert qu'à activer l'ESM en Node, pas de build).
- **Servir la PWA en local** (service worker + Firebase impossibles en `file://`) :
  `npx serve .` ou `python -m http.server 8000` puis ouvrir `http://localhost:8000`.
- ⚠️ **Piège PowerShell 5.1** : ne jamais faire de round-trip `Get-Content`/`Set-Content`
  sur les sources (mojibake UTF-8) — passer par les outils d'édition.

## Garde-fous

- `.git` **hors-Drive** (repo entier dans `C:\dev\Tama`). **GitHub = la seule sauvegarde de
  l'historique** → pousser régulièrement.
- Repartir d'un œuf neuf : ne jamais réintroduire de dépendance à Andy.

## État d'avancement (phases)

- **Phase 1 (locale)** : moteur `tama.js` + `constants.js` → `store.js` (local) → UI + `game.js`
  → art via manifeste → PWA (`manifest.webmanifest` + `sw.js`) → Andy lanceur.
- **Phase 2 (plus tard)** : `store.js` pointe vers **Firebase** (autorité serveur : état
  canonique + horloge serveur passée à `tick`, actions atomiques poussées par chaque client).

**Suivi de l'avancement détaillé : voir [`HANDOFF.md`](HANDOFF.md)** (état vivant,
mis à jour à chaque commit). Étapes 0-5 terminées (moteur + tests, store, UI, art
via manifeste, PWA) ; suivante = étape 6 (hébergement https — choix d'Alex — puis
Andy lanceur), après un test navigateur d'une vie complète.
