# ASSETS.md — brief d'art (la liste qui fait foi)

> But : qu'un·e designer sache **exactement** quoi produire, sans jamais demander
> « je dessine quoi ? ». La liste ci-dessous est **fermée** et **autoritaire** :
> elle est dérivée des **slots réels** du moteur (`assets/manifest.json`), pas
> d'une envie. Tout ce qui n'y est pas relève du **polish futur** (section dédiée).

## Règle d'or : la frontière écran / device

- **Dans l'écran LCD** (le pet, ses états, les icônes) → **PNG via manifeste**.
- **Hors écran** (coque, boutons physiques, fond de device, mode compact) →
  **CSS thémable** (décision 2026-07-02). Pas de PNG de coque pour l'instant.

Un **slot sans PNG n'est jamais une erreur** : l'app affiche un placeholder émoji.
Le jeu reste jouable même incomplet — on peut donc livrer l'art par vagues.

## Slots demandés MAINTENANT (un thème = cette liste, entière)

Nommage = **slot logique** → **fichier attendu** par le manifeste actuel. On peut
soit nommer ses fichiers ainsi (zéro édition), soit garder ses noms et éditer
`manifest.json`.

### STAGES — 11 formes (les personnages)

| slot | fichier | note |
| --- | --- | --- |
| `egg` | `egg.png` | l'œuf de départ |
| `baby` | `baby.png` | bébé (un seul, pas de variante) |
| `child` | `child.png` | **enfant unique** — la scission bon/mauvais n'arrive qu'à l'ado |
| `teen_good` | `teen_good.png` | ado « bien élevé » |
| `teen_bad` | `teen_bad.png` | ado « boudeur » |
| `adult_1` | `adult_1.png` | issu du **bon** ado, discipline haute |
| `adult_2` | `adult_2.png` | bon ado, discipline moyenne |
| `adult_3` | `adult_3.png` | bon ado, discipline basse (couche-tard) |
| `adult_4` | `adult_4.png` | issu du **moins bon** ado |
| `adult_5` | `adult_5.png` | moins bon ado |
| `adult_6` | `adult_6.png` | moins bon ado (grasse matinée) |

> Les 6 adultes = **qualité d'ado × rang de discipline** (1-3 du bon ado, 4-6 du
> moins bon). On peut pointer plusieurs slots vers le même PNG au début.

### OVERLAYS — 5 (superposés au pet dans l'écran)

| slot | fichier | quand |
| --- | --- | --- |
| `poop` | `poop.png` | un caca est à l'écran |
| `sick` | `skull.png` | le pet est malade |
| `sleep` | `zzz.png` | il dort |
| `call` | `heart_call.png` | il appelle (besoin actif) |
| `angel` | `angel.png` | **écran de mort** (il n'y a pas de slot « death », c'est cet overlay) |

### ICONS — 7 boutons LCD

| slot | fichier |
| --- | --- |
| `feed` | `ic_feed.png` |
| `light` | `ic_light.png` |
| `play` | `ic_play.png` |
| `medicine` | `ic_medicine.png` |
| `clean` | `ic_clean.png` |
| `meter` | `ic_meter.png` |
| `discipline` | `ic_discipline.png` |

**Total à livrer pour UN thème complet : 11 + 5 + 7 = 23 PNG.**

## Recommandations techniques

- **PNG carré, fond transparent** (ex. **240×240**), rendu net garanti par
  `image-rendering: pixelated` côté CSS.
- Style pensé pour un **écran LCD** : lisible en petit, contraste fort, silhouette
  reconnaissable. Cohérence de famille > détail.
- Priorité aux **états critiques** (les moments émotionnels), plus qu'aux états
  neutres : **il appelle · il dort · il est malade · il a fait caca · il refuse
  une action (shake, géré en CSS) · il évolue · il meurt · il renaît**.

## NON slotté aujourd'hui (polish futur, ne pas produire maintenant)

Ces éléments n'existent pas dans le manifeste — les livrer maintenant serait du
travail perdu. Ils seront ajoutés si/quand on décide de les slotter :

- **coque / device** (aujourd'hui **CSS**), fond de coque
- **boutons physiques** + états `hover`/`pressed` (aujourd'hui **CSS**)
- **flash d'évolution** (`evolution_flash`)
- **effet médicament** (`medicine_effect`)
- **état danger / affaiblissement** (voir *future polish* dans `HANDOFF.md` §7 :
  lecture **dérivée** de l'état, jamais une nouvelle stat)

## Structure par thème (cible du Bloc B — thèmes remappables)

Aujourd'hui il n'y a **qu'un thème implicite** : `assets/manifest.json` +
`assets/sprites/`. Le Bloc B introduira un dossier **par thème** :

```
assets/themes/<id>/
  manifest.json     # les 23 slots ci-dessus → PNG du thème
  sprites/          # les PNG
  copy.json         # vocabulaire : libellés des 7 boutons, noms des 6 adultes, etc.
  palette.json      # couleurs de la coque CSS (variables) + accents
  sounds/           # bips / boutons (optionnel)
```

Les **mécaniques ne changent jamais** d'un thème à l'autre — seuls l'art, les mots,
la palette et les sons changent (cf. **doctrine** dans `CLAUDE.md`).

## Ordre de production conseillé (validé 2026-07-02)

1. **Classic LCD** — thème de référence, sobre et rétro. Prouve que le jeu tourne
   avec une vraie direction artistique (fin des émojis placeholder).
2. **Vampire** — thème signature, mémorable (cercueil, jus rouge, chauve-souris).
   Prouve que le reskin est puissant.
3. **Secrétaire** — thème absurde (café, post-it). Prouve qu'on change de **ton**
   sans changer de **règles**.

Sirène / cochon viendront après. Trois thèmes suffisent à couvrir nostalgie /
fantaisie / humour.
