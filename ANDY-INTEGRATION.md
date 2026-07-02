# Intégrer Tama dans Andy — mode compact `?mini`

> **But** : afficher le Tama comme **accessoire flottant** dans le launcher **Andy**
> (entrée « MON TAMA » de son menu), au lieu de la grande coque rose plein écran.
>
> ⚠️ **Ce travail se fait dans le repo d'Andy, PAS ici.** Ce document est la
> **spec côté Tama** : ce que l'app expose et comment Andy doit s'en servir. À
> ouvrir dans une session Claude sur le repo d'Andy pour brancher l'intégration.

## L'URL à charger

```
https://hialexpopa-ux.github.io/Tama/?mini
```

Le paramètre **`?mini`** (implémenté dans `index.html` + `src/ui.js`) :

- retire la **coque rose** et rétrécit les boutons ;
- ne garde que l'**écran LCD + une rangée de boutons réduits** ;
- met le **fond transparent** (`body.mini { background: transparent }`) → c'est
  **Andy qui fournit le cadre** (sa coquille pixel) autour.

Le pet reste **entièrement jouable** dans ce format (même moteur, mêmes actions).
Le paramètre est **conservé dans l'URL** (compatible avec `?mini&reset`).

## Rappels d'architecture (non négociables)

- **Andy ne calcule JAMAIS le pet.** Il se contente d'**afficher l'URL** ; tout le
  tick tourne dans la PWA chargée. Andy = fenêtre/vue, rien de plus.
- **Pet local distinct.** Le Tama affiché dans Andy a **sa propre sauvegarde**
  (`localStorage` de la vue Andy), séparée du navigateur desktop et du téléphone.
  C'est **assumé** : pas de synchronisation entre appareils (décision 2026-07-02,
  cf. `HANDOFF.md`). Ne pas réintroduire de sync/Firebase.

## Comment Andy peut l'afficher (3 options)

### A. Dans une `<iframe>` du widget existant — le plus simple

Vu que « MON TAMA » est une entrée du menu du widget, le plus direct est de
charger l'URL dans une iframe qui remplit la zone d'écran, avec fond transparent :

```html
<iframe
  src="https://hialexpopa-ux.github.io/Tama/?mini"
  style="border:0; width:100%; height:100%; background:transparent"></iframe>
```

- GitHub Pages n'envoie pas `X-Frame-Options` → l'embarquement en iframe est
  permis. À **revérifier** si un jour on change d'hébergeur.
- La transparence marche car le document Tama a `body { background: transparent }`
  en mode mini ; le conteneur Andy derrière doit, lui, dessiner la coquille.

### B. Fenêtre flottante Electron séparée — accessoire de bureau autonome

Si on veut une petite fenêtre indépendante (hors du widget) :

```js
const tama = new BrowserWindow({
  width: 240, height: 320,
  frame: false, transparent: true, resizable: false,
  alwaysOnTop: true, skipTaskbar: true,
});
tama.loadURL('https://hialexpopa-ux.github.io/Tama/?mini');
// Zone de drag : injecter un CSS -webkit-app-region: drag sur une bande,
// ou prévoir une poignée, sinon la fenêtre sans cadre n'est pas déplaçable.
```

### C. `WebContentsView` positionné dans la fenêtre du widget — le plus « propre »

Pour intégrer la vue **dans** la fenêtre du widget sans iframe, Electron recommande
aujourd'hui `WebContentsView` (l'ancien `<webview>` et `BrowserView` sont
dépréciés/en transition).

> ⚠️ **Règle de relais** : l'API de vues d'Electron **bouge**. Au moment de coder,
> **vérifier la version d'Electron d'Andy** et l'API de vue en cours (nom, options
> de transparence) — ne pas se fier de mémoire. Demander la consigne à jour si doute.

## Réglage recommandé

- Taille de départ conseillée : ~**240×320** (l'écran garde son ratio, cf. CSS mini).
- **Ne PAS** mettre `?mini` dans le `start_url` du `manifest.webmanifest` : ça
  forcerait aussi la **PWA installée** en mini. Le mini est réservé à l'hôte Andy.
- Après tout déploiement de Tama, le **bandeau « Nouvelle version »** gère la MAJ
  (bumper `CACHE_VERSION` dans `sw.js` reste le déclencheur — déjà en place).

## Checklist d'intégration (à faire côté Andy)

1. Faire pointer l'entrée **« MON TAMA »** vers l'URL `?mini` (option A, B ou C).
2. Assurer la **transparence** du conteneur pour voir la coquille Andy autour.
3. Vérifier que le pet **vit** (tick) quand la vue est affichée, et **persiste**
   entre ouvertures (localStorage de la vue).
4. Optionnel : bouton pour ouvrir la **grande app** (`…/Tama/` sans `?mini`).
