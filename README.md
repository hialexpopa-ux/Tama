# Tama 🥚

Un **Tamagotchi fidèle au fonctionnement officiel Bandai Gen 1 (P1, 1996-97)**, en **PWA**
(Progressive Web App) installable sur **desktop et Android**. JS pur, sans framework ni build.

**▶ Jouer : <https://hialexpopa-ux.github.io/Tama/>** (installable depuis le navigateur ;
sur Android : menu → « Ajouter à l'écran d'accueil »)

## Le pitch

Un vrai P1 : deux compteurs de 4 cœurs (**faim** et **bonheur**), une barre de **discipline**
par paliers de 25 %, un **poids**, et des **care mistakes** cachés qui pilotent l'évolution
(œuf → bébé → enfant → ado → adulte). Sommeil, caca et maladie sont gérés en *flags* ; la
santé est implicite (négliger le pet finit par le rendre malade, puis le tuer). Un mini-jeu
« gauche ou droite » remplit le bonheur et fait maigrir.

## Architecture (une seule app, trois portes)

Il n'existe **qu'une seule app : la PWA**. Hébergée à une URL, elle s'ouvre par trois portes —
Andy (lanceur Electron), navigateur desktop, et Android (« ajouter à l'écran d'accueil »).
Le **moteur** (`src/tama.js`) est du pur calcul d'état : aucun DOM, aucun réseau. La
persistance passe par une interface `store` (locale en phase 1, **Firebase** en phase 2).

## Démarrer en local

Un `file://` ne permet ni service worker ni Firebase — il faut un petit serveur statique :

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
