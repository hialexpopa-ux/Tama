# Sprites — dépose tes PNG ici

Le manifeste [`../manifest.json`](../manifest.json) mappe chaque **slot logique**
vers un fichier de ce dossier. Deux façons de faire :

1. **Zéro édition** : nomme tes fichiers comme dans le manifeste actuel
   (`egg.png`, `baby.png`, `child.png`, `teen_good.png`, `teen_bad.png`,
   `adult_1.png` … `adult_6.png`, `poop.png`, `skull.png`, `zzz.png`,
   `heart_call.png`, `angel.png`, `ic_feed.png`, `ic_light.png`, `ic_play.png`,
   `ic_medicine.png`, `ic_clean.png`, `ic_meter.png`, `ic_discipline.png`)
   et recharge la page.
2. **Tes noms à toi** : dépose n'importe quels fichiers et édite les chemins
   dans `manifest.json`.

Conseils (brief §6) : PNG **carré transparent** (ex. 240×240), rendu net garanti
par `image-rendering: pixelated`. Les 6 adultes = qualité d'ado × rang de
discipline (1-3 = issu du bon ado, 4-6 = du moins bon) — tu peux pointer
plusieurs slots vers le même fichier.

**Un slot sans fichier n'est jamais une erreur** : l'app affiche un placeholder.
