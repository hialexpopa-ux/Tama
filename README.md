# Tama 🥚

Un **compagnon virtuel LCD à l'ancienne**, dans l'esprit des *virtual pets* de 1996, livré en
**PWA** (Progressive Web App) installable sur **desktop et Android**. JS pur, sans framework ni build.

**▶ Jouer : <https://hialexpopa-ux.github.io/Tama/>** (installable depuis le navigateur ;
sur Android : menu → « Ajouter à l'écran d'accueil »)

## Le pitch

Fidèle à l'esprit des premiers compagnons virtuels : deux compteurs de 4 cœurs (**faim** et
**bonheur**), une barre de **discipline** par paliers de 25 %, un **poids**, et des **care
mistakes** cachés qui pilotent l'évolution (œuf → bébé → enfant → ado → adulte). Sommeil, caca
et maladie sont gérés en *flags* ; la santé est implicite (négliger le pet finit par le rendre
malade, puis le tuer). Un mini-jeu « gauche ou droite » remplit le bonheur et fait maigrir.

> Projet **hommage indépendant**, sans lien avec une marque. « Comportement Gen 1 / 1996 »
> est notre **boussole de conception interne**, pas une revendication officielle.

## Architecture (une seule app, trois portes)

Il n'existe **qu'une seule app : la PWA**. Hébergée à une URL, elle s'ouvre par trois portes —
Andy (lanceur Electron), navigateur desktop, et Android (« ajouter à l'écran d'accueil »).
Le **moteur** (`src/tama.js`) est du pur calcul d'état : aucun DOM, aucun réseau. La
persistance passe par une interface `store`, **locale à chaque appareil** : chaque porte
a son propre pet (pas de synchronisation — choix assumé). Les trois portes partagent
l'app et l'art, pas la vie du pet.

## Démarrer en local

Un `file://` ne permet pas le service worker — il faut un petit serveur statique :

```bash
# au choix
npx serve .
# ou
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

Pour tester le **moteur** seul (sans UI), en Node :

```bash
npm test
```

## Installer comme PWA

- **Desktop (Chrome/Edge)** : icône d'installation dans la barre d'adresse.
- **Android (Chrome)** : menu → « Ajouter à l'écran d'accueil ».

## État

Phase 1 (locale) en cours. Voir `CHANGELOG.md` pour l'avancement et `CLAUDE.md` pour les
conventions de développement.
