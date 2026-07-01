# Tama — Brief de démarrage (référence de conception)

> **Copie versionnée dans le repo (`C:\dev\Tama`)** — c'est désormais la référence.
> L'original vivait dans le dossier Drive `g:\My Drive\CodexApps\Tama` (qui ne garde
> qu'un breadcrumb `WHERE-IS-THE-CODE.md` pointant ici). Certains détails d'époque
> (« Emplacement : CodexApps/Tama », « pas de HANDOFF.md » §2b) sont **caducs** :
> le repo vit hors-Drive et le mécanisme de passation (`HANDOFF.md`) est en place.
> Les **mécaniques P1** (§3-§7), elles, restent la référence.

> Nouvelle app **séparée** d'Andy. Objectif : un Tamagotchi **fidèle au fonctionnement
> officiel Bandai Gen 1 (P1, 1996-97)**, en **PWA** (desktop + Android), ouvrable par Andy,
> **synchronisable plus tard**. Les graphismes PNG seront refaits par toi → l'art doit être
> **entièrement remplaçable** via un manifeste (§6).

---

## 1. Positionnement & décisions actées

- **App indépendante**, pas une feature d'Andy. Andy devient un simple **lanceur** (il ouvre
  l'URL de la PWA) et, plus tard, un lecteur d'état — il ne calcule plus le pet.
- **PWA vanilla** (HTML + CSS + JS pur, pas de framework, pas de build) : fidèle à ton ADN,
  un seul codebase pour desktop (fenêtre/navigateur) et Android (« ajouter à l'écran d'accueil »).
- **Sync en phase 2**, pas maintenant. La persistance de la phase 1 passe derrière une
  interface `store` (impl locale), pour brancher Firebase plus tard **sans toucher au moteur**.
- **Un seul propriétaire du tick** : dès que cette app existe, elle seule fait vivre le pet.

---

## 1b. Imbrication web / desktop / Android (à comprendre avant tout)

Le point clé : **il n'existe qu'UNE seule app, et c'est la web (PWA)**. Le desktop et Android
ne sont pas des versions différentes — ce sont des **portes d'entrée** vers la même app web.

```
                    ┌───────────────────────────────────┐
                    │   COEUR = LA PWA TAMA (web)         │
                    │   tama.js (moteur) + ui + store     │
                    │   = LE pet, une seule fois          │
                    └───────────────┬───────────────────┘
                                    │ hébergée à une URL (https)
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ DESKTOP via ANDY │  │ DESKTOP navigateur│  │ ANDROID (PWA)    │
   │ Andy (Electron)  │  │ on ouvre l'URL    │  │ "ajouter à       │
   │ ouvre l'URL de   │  │ directement       │  │  l'écran d'accueil"│
   │ la PWA + lit     │  │                   │  │ = icône + plein   │
   │ l'état (badge)   │  │                   │  │ écran + offline   │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Ce que ça veut dire concrètement :**
- **Andy n'embarque pas le Tama.** Il n'en est qu'un **lanceur** : il ouvre l'URL de la PWA
  (soit dans le navigateur via `shell.openExternal`, soit dans une fenêtre Electron dédiée qui
  charge l'URL). Andy peut aussi **lire** l'état pour afficher un badge/alerte — mais il ne le
  **calcule jamais** (rappel : un seul propriétaire du tick).
- **La même URL sert les trois portes.** Desktop et Android chargent exactement le même code.
  Zéro duplication, zéro "version Android à part".
- **Il faut donc héberger la PWA** (https) : c'est indispensable pour l'installabilité PWA, le
  service worker offline, et plus tard Firebase. Hébergement gratuit : GitHub Pages, Netlify,
  Firebase Hosting. (En dev local pur, un petit serveur statique suffit ; `file://` ne permet
  ni service worker ni Firebase.)
- **Ce qui rend le pet "le même" partout, c'est le `store`** : en phase 1, il est local à
  chaque appareil (donc trois pets distincts) ; en **phase 2**, le `store` pointe vers Firebase
  et devient la **couche partagée** → un seul et même pet vécu depuis les trois portes.

En résumé de l'imbrication : **PWA au centre (le pet) → hébergée à une URL → ouverte par trois
portes (Andy/desktop, navigateur, Android) → état unifié par le `store` cloud en phase 2.**

---

## 2. Structure du repo

```
CodexApps/Tama/
├─ index.html            # écran plein, conteneur du pet + jauges + boutons
├─ manifest.webmanifest  # PWA installable
├─ sw.js                 # service worker (cache offline)
├─ src/
│  ├─ tama.js            # MOTEUR pur (état + tick), fidèle P1, isomorphe
│  ├─ constants.js       # tous les nombres réglables (§5)
│  ├─ store.js           # interface persistance : local now, cloud plus tard
│  ├─ ui.js              # rendu écran + branchement des contrôles
│  ├─ game.js            # mini-jeu "gauche ou droite" (5 manches)
│  └─ assets.js          # charge le manifeste d'art (§6)
├─ assets/
│  ├─ manifest.json      # mappe chaque "slot" -> ton fichier PNG
│  └─ sprites/           # TES PNG (placeholders au début)
├─ CLAUDE.md             # instructions permanentes pour Claude Code (§2b)
├─ CHANGELOG.md          # journal versionné (repart à 0.1.0)
└─ README.md             # pitch + démarrage
```

Le moteur `tama.js` ne touche jamais au DOM, à `fs`, ni au réseau : c'est de l'**état pur**
(un principe d'or : c'est ce qui rendra la sync et Android faciles plus tard).

---

## 2b. Fresh start & source de conseils (pas de transfert)

**Table rase, zéro héritage.** Ce repo ne reprend **rien** d'Andy : pas de migration de
sauvegarde, pas de code copié, pas de docs importés. On repart d'un œuf neuf et d'un `pet.js`
réécrit de zéro (§7). Un seul document d'instructions, écrit frais pour ce projet :

- **`CLAUDE.md`** — les **bonnes indications permanentes**, lues à chaque session. Doit contenir :
  l'objectif (Tama fidèle P1, PWA desktop+Android), les conventions (JS pur, pas de build, moteur
  pur, un seul ticker, art via manifeste), les commandes de lancement/test, les garde-fous
  (pas de logique dans l'UI, `.git` hors-Drive), et l'état d'avancement des phases.
- **`CHANGELOG.md`** — journal neuf, démarre à `0.1.0`.
- **`README.md`** — pitch court + comment lancer/installer la PWA.

Pas de `HANDOFF.md`, pas de système de passation : les instructions vivent dans `CLAUDE.md`,
c'est tout.

### Claude Code peut demander conseil à « Claude-avec-internet »
Le savoir de Claude Code peut être **daté** sur tout ce qui bouge vite : specs PWA/service
worker, mise en place Firebase, versions de libs, quirks d'installation Android, capacités
navigateur. **Règle à écrire dans `CLAUDE.md`** : dès que Claude Code touche à un sujet qui
demande de l'info **actuelle ou vérifiée**, il ne devine pas — il **rédige une question
précise** que tu transmets à Claude (cette interface, qui a accès au web) pour obtenir la
consigne à jour, puis il applique la réponse.

Bons cas d'usage de ce relais :
- « Quel est le bon `manifest.webmanifest` minimal pour une PWA installable sur Android en 2026 ? »
- « Étapes exactes pour créer un projet Firestore + auth anonyme aujourd'hui ? »
- « Pattern de service worker pour du cache offline d'une app statique, version actuelle ? »
- « Contraintes réelles des notifications web sur Android (arrière-plan) aujourd'hui ? »

Toi tu fais le pont (copier la question ici, coller la réponse dans Claude Code). C'est ce
qui garde le projet **frais et à jour** sans dépendre d'un savoir figé.

---

## 3. Modèle d'état (fidèle P1, un seul objet sérialisable)

```js
{
  version: 1,
  name: "Tama",
  bornAt: "ISO", lastUpdate: "ISO",   // horodatages
  stage: "egg",         // egg | baby | child | teen | adult | dead
  character: "egg",     // id de slot d'art (§6)
  alive: true, deathCause: null,
  ageYears: 0,          // officiel : 1 jour = 1 "année" tama

  hunger: 0,            // 0..4 coeurs (0 = affamé, 4 = rassasié)
  happiness: 0,         // 0..4 coeurs
  discipline: 0,        // paliers officiels : 0 / 25 / 50 / 75 / 100
  weight: 5,            // poids de base selon le perso ; +manger, -jouer

  flags: { poop: false, sick: false, asleep: false, misbehaving: false },
  attention: null,      // null | hunger | happy | sick | poop | discipline
  callStartedAt: null,  // pour la fenêtre de 15 min (care mistake)

  careMistakes: 0,      // CACHÉ, compté par stade -> pilote l'évolution
  care: { meals:0, snacks:0, games:0, cleans:0, heals:0, scolds:0 }
}
```

Note : le modèle P1 officiel est volontairement **simple** — pas de jauge d'énergie ni
d'hygiène. Le sommeil, le caca et la maladie sont des **flags**, et la santé est **implicite**
(négligence prolongée -> maladie -> mort). Ne rajoute pas de stats hors P1.

---

## 4. Mécaniques officielles à implémenter (Gen 1 / P1)

**Faim & bonheur — 2 compteurs de 4 cœurs, vides au départ.** Plus il y a de cœurs remplis, plus le Tamagotchi est satisfait ; on le nourrit ou on joue pour remplir les cœurs vides. Chaque compteur vide déclenche un appel d'attention.

**Nourrir — repas vs friandise.** Le repas remplit la faim et il refuse de manger quand c'est plein ; la friandise remplit le bonheur. Officiellement, on peut donner des friandises à l'infini sans conséquence réelle sur l'original, hormis le poids. Repas → +1 faim (max 4, refuse si plein), +poids ; friandise → +1 bonheur, +poids (plus lourd).

**Jouer — mini-jeu « gauche ou droite ».** Chaque partie dure cinq manches ; en gagner au moins trois remplit un cœur de bonheur, et une partie complète réduit toujours le poids de 1. A = gauche, B = droite, C = quitter.

**Discipline — paliers de 25 %.** La barre de discipline part vide et se remplit à chaque fois qu'on gronde correctement ; elle vaut 0, 25, 50, 75 ou 100 %. On gronde quand il appelle alors qu'aucun compteur n'est vide, ou qu'il refuse de manger/jouer. Ne pas gronder n'entraîne pas de care mistake — c'est à toi de choisir le niveau de discipline.

**Care mistake (caché).** Ne pas répondre à un appel légitime dans les 15 minutes crée un "care mistake", et le jeu compte combien tu en accumules par évolution. C'est le facteur d'évolution principal.

**Maladie.** Il tombe malade une fois par stade d'évolution, et en plus s'il reste trop longtemps dans son caca ; un crâne apparaît alors à côté de lui. Le médicament le soigne, parfois en 2 ou 3 doses.

**Sommeil & lumière.** La lumière doit être éteinte quand il dort, sinon il devient agité. Laisser la lumière = care mistake.

**Poids.** Chaque perso a un poids de base non franchissable ; le poids monte en mangeant, baisse en jouant, et un poids élevé nuit à la santé globale.

**Âge.** Sur l'original, une "année" équivaut à un jour.

**Sept icônes du menu** (fidèle P1) : Repas, Lumière, Jouer, Médicament, Nettoyer, Santé (check meter), Discipline. Le check meter n'affiche pas les attributs cachés comme le total de care mistakes.

### Règles d'évolution (le cœur du jeu)
Rien de ce que tu fais au stade bébé ne compte ; c'est à partir du stade enfant que le jeu suit ta discipline et tes erreurs. Puis :
- **Enfant → ado** selon les care mistakes du stade : 0 ou 1 erreur donne le "meilleur" ado, 2 erreurs ou plus donnent le "moins bon".
- **Ado → adulte** selon la discipline à l'évolution : 100 % de discipline donne l'adulte de rang 1, 75 % le rang 2, 50 % ou moins le rang 3, indépendamment des care mistakes.
- La discipline **retombe** entre deux stades : un enfant à 100 % de discipline commence son stade suivant à 50 %.
- L'original compte six adultes et deux ados. Prévois donc ~2 slots d'ado et ~5-6 slots d'adulte (§6).

---

## 5. Constantes de départ (`constants.js`)

Deux jeux de valeurs. **Officiel** = fidélité ; **Dev/Moderne** = pour tester vite et pour un
rythme "2-3 soins/jour" jouable. Commence en Dev, garde l'Officiel en réf.

| Paramètre | Officiel (P1) | Dev/Moderne (défaut) |
|-----------|---------------|----------------------|
| Éclosion œuf | ~5 min | 30 s |
| Stade bébé | ~1 h | 2 min |
| Stade enfant | ~24 h+ | 10 min |
| Stade ado | ~24-48 h | 15 min |
| Perte faim (vieil adulte, cap) | 1 / 6 min | plus lent, réglable |
| Perte bonheur (vieil adulte, cap) | 1 / 7 min | plus lent, réglable |
| Fenêtre care mistake | 15 min | 15 min (garde-la) |
| Pas de discipline par grondement | +25 % | +25 % |
| Rattrapage hors-ligne (plafond) | — | **12 h** (évite qu'un week-end fermé tue le pet) |

Toutes les valeurs "gameplay" vivent ici, nulle part ailleurs.

---

## 6. Art remplaçable (tu refais les PNG)

L'app ne code **aucun** chemin d'image en dur. `assets/manifest.json` mappe chaque **slot**
logique vers ton fichier. Tu déposes tes PNG dans `assets/sprites/` et tu édites le manifeste.

Slots minimum à prévoir (rôles génériques, tu nommes/dessines comme tu veux) :

```json
{
  "stages": {
    "egg": "sprites/egg.png",
    "baby": "sprites/baby.png",
    "child": "sprites/child.png",
    "teen_good": "sprites/teen_good.png",
    "teen_bad": "sprites/teen_bad.png",
    "adult_1": "sprites/adult_1.png",
    "adult_2": "sprites/adult_2.png",
    "adult_3": "sprites/adult_3.png"
  },
  "overlays": {
    "poop": "sprites/poop.png",
    "sick": "sprites/skull.png",
    "sleep": "sprites/zzz.png",
    "call": "sprites/heart_call.png",
    "angel": "sprites/angel.png"
  },
  "icons": {
    "feed": "sprites/ic_feed.png", "light": "sprites/ic_light.png",
    "play": "sprites/ic_play.png", "medicine": "sprites/ic_medicine.png",
    "clean": "sprites/ic_clean.png", "meter": "sprites/ic_meter.png",
    "discipline": "sprites/ic_discipline.png"
  }
}
```

Conseils art : **2 frames par pose** suffisent pour l'idle (le "bob" vivant). Prévois au moins
idle + manger + content + malade + dort. Format conseillé : PNG carré transparent (ex. 240×240),
rendu net (`image-rendering: pixelated` si pixel-art). Un slot manquant → placeholder auto, pas de crash.

---

## 7. Contrat du moteur (`tama.js`) — écrit de zéro

Le moteur est neuf, mais il doit respecter ces principes (ce sont eux qui rendent la sync
et les tests faciles) :
- `createEgg(nowIso)` → état neuf.
- `tick(state, elapsedMin, nowIso, rand)` → **horloge et aléatoire injectés** (jamais `Date.now()`
  ni `Math.random()` dans le moteur). Sous-pas de 15 min, plafond de rattrapage 12 h.
- Actions **pures** : `feed(state,'meal'|'snack')`, `play(state,result)`, `clean`, `heal`,
  `scold`, `toggleLight`, `reset`. Chacune renvoie le nouvel état.
- `summary(state)` → humeur/alerte pour l'UI (happy/meh/sad/sick/asleep/dead + niveau d'alerte).

Le `rand` seedé (sur `bornAt`+temps) n'est pas obligatoire en phase 1 (autorité serveur en
phase 2), mais **fais-le quand même** : 5 min de travail qui ferment une classe de bugs et
gardent la porte de l'event-sourcing ouverte.

---

## 8. Étapes de démarrage (phase 1, testables une par une)

**0.** Créer le repo `CodexApps/Tama` **vide, sans rien importer d'Andy**. Initialiser les docs
frais : `CLAUDE.md` (avec la règle « demander conseil à Claude-avec-internet pour tout sujet
qui bouge », §2b), `CHANGELOG.md` (à `0.1.0`), `README.md`. Décider **où vit le `.git`** (voir
avertissement Drive).
**1.** `tama.js` + `constants.js` : moteur fidèle P1, état §3, actions pures, tick à horloge injectée. Testable en Node (aucune UI).
**2.** `store.js` : interface `load()/save()` avec impl **locale** (localStorage/IndexedDB).
**3.** `ui.js` + `index.html` + `game.js` : écran plein, jauges cœurs, 7 icônes, mini-jeu gauche/droite. Placeholders d'art.
**4.** `assets.js` + `manifest.json` : art remplaçable. Tu déposes tes premiers PNG.
**5.** PWA : `manifest.webmanifest` + `sw.js` → installable desktop + Android, marche hors-ligne.
**6.** Andy = lanceur : une action qui ouvre l'URL de la PWA (voir consigne de nettoyage séparée).

**Phase 2 (plus tard) — sync** : `store.js` pointe vers Firebase (autorité serveur : état
canonique + horloge serveur passée à `tick`, actions atomiques poussées par chaque client).

---

## ⚠️ Avertissement Google Drive
Un repo git **actif** dans un dossier Drive synchronisé peut corrompre le `.git` (Drive touche
les fichiers pendant les opérations git — tu as déjà eu ce souci avec Electron/node_modules).
Soit tu exclus `.git` de la synchro Drive, soit tu gardes le repo **hors-Drive** et tu pousses
sur GitHub. Le Tama n'a aucun secret (contrairement à Andy) → public possible, mais non obligatoire.
