# PLAYTEST — audit official (avant la baseline Classic LCD)

> **But** : éprouver le **feel P1 réel** en `MODE='official'` avant de figer le
> design system LCD (Commit 2). Ce n'est pas un test technique — c'est un **audit
> design**. On note ce que la baseline LCD devra résoudre **visuellement**.
>
> **Règle** : on **ne touche pas au moteur** après ça, sauf **bug évident**. Les
> notes ci-dessous deviennent le **cahier des charges** du Commit 2 (Classic LCD).

## La réalité temporelle (à assumer)

`official` = **vraies durées P1**, pas de raccourci fidèle : éclosion ~5 min,
**bébé 65 min**, **enfant 24 h**, **ado 48 h**, adulte en jours. Le rattrapage
hors-ligne est **plafonné à 12 h** → on **ne peut pas** compresser une vie
officielle. Donc l'audit se fait en **deux temps** :

- **Early official (~1 h, maintenant)** : œuf + stade bébé. Couvre déjà la majorité
  de la grille (lisibilité, cadence réelle, appels, écran vide, sommeil/lumière,
  1re maladie possible, résumé d'absence).
- **Arc complet (plusieurs jours, sur le tél en tâche de fond)** : évolution,
  vieillesse, mort.

## Comment lancer

- **Œuf official neuf** : ouvrir l'URL en **`?reset`** (`…/Tama/?reset`).
- **Déclencher le résumé d'absence sans attendre** : `?ago=N` (recule l'horloge de
  N min, **plafonné à 12 h** de simulation). Ex. `?ago=40`.
- App en ligne : <https://hialexpopa-ux.github.io/Tama/>

---

## Grille — early official (~1 h)

**1. Compréhension immédiate** — sait-on quoi faire sans le README ? Les 7 icônes se devinent-elles ?
> notes :

**2. Lisibilité des états** — cœurs faim/bonheur, maladie, caca, sommeil, lumière, appel : lisibles d'un coup d'œil ?
> notes :

**3. Priorité d'attention** — plusieurs soucis en même temps : l'appel raconte-t-il **le bon** problème ? (ordre moteur : malade > faim > bonheur > caca > discipline)
> notes :

**4. Friction juste vs confuse** — dureté « cruelle mais logique » ou « opaque/bizarre » ?
> notes :

**5. Résumé d'absence** — tombe-t-il au bon moment ? Raconte-t-il assez **sans** révéler le scoring ? Les 3 tons se lisent-ils ?
> notes :

**6. Rythme de session** — 2-3 min suffisent-elles pour « ouvrir → voir → 2-3 soins → repartir » ?
> notes :

## Grille — arc complet (plusieurs jours)

**7. Évolution** — enfant→ado→adulte : la forme obtenue se ressent-elle comme méritée ?
> notes :

**8. Mort** — juste (« je l'ai négligé ») ou confuse (« pourquoi ? ») ? Assez de signal *avant* ? (→ nourrit le *future polish « mort lisible »*, HANDOFF §7)
> notes :

**9. Temps « écran vide »** — combien de temps sans rien à faire ? Faut-il un état de repos plus vivant ?
> notes :

---

## Bugs éventuels (seuls changements moteur autorisés ici)

- …

## Ce que la baseline LCD devra résoudre (synthèse → Commit 2)

- …
