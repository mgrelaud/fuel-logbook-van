# Carburant Malin

Crée une PWA mobile-first de suivi de consommation pour un camping-car.

FONCTIONNEL

- Saisie d'un plein, 3 champs seulement :

  - litres (obligatoire)

  - km parcourus depuis le dernier plein (obligatoire) — l'utilisateur remet son

    compteur de trajet à zéro à chaque passage à la pompe

  - coût du plein en € (optionnel)

  + date pré-remplie à aujourd'hui, modifiable.

- Calcul immédiat sur la ligne : conso = litres / km * 100 → L/100 km.

  Si le coût est renseigné : prix au litre et coût aux 100 km.

- Écran d'accueil :

  - grande carte "Moyenne" = (somme des litres / somme des km) * 100, en L/100 km

  - carte "Dernier plein" avec sa conso et une flèche ↑/↓ vs la moyenne

  - totaux : km cumulés, litres cumulés, € dépensés, coût moyen /100 km

- Historique antéchronologique : date, litres, km, L/100 km, coût.

  Appui long ou swipe pour éditer / supprimer.

- Petit graphique d'évolution du L/100 km dans le temps.

- Export CSV.

- Validation : litres > 0 et km > 0, sinon message d'erreur clair en français.

UI / UX

- 100 % mobile, pensé pour iPhone. Ajout d'un plein en moins de 10 secondes,

  debout à la pompe.

- Bouton flottant "+" bien visible, formulaire en bottom sheet, focus automatique

  sur le champ litres.

- inputmode="decimal" sur litres / km / coût pour le clavier numérique iOS.

- Thème sombre par défaut, accent orange, gros chiffres, coins arrondis.

- Safe areas iOS respectées (encoche + barre home).

- Interface entièrement en français. Unités : L, km, €.

PWA

- Manifest complet (nom "Conso CC", icônes 192/512 + apple-touch-icon,

  display standalone, orientation portrait, theme-color).

- Service worker : installable et consultable hors ligne.

- Doit fonctionner en "Ajouter à l'écran d'accueil" sur Safari iOS, sans barre

  d'adresse.

AUTHENTIFICATION

- Supabase Auth, Sign in with Apple comme unique méthode.

- Écran de login minimal : titre + bouton "Se connecter avec Apple".

- Row Level Security : chaque utilisateur ne voit que ses propres pleins.

DONNÉES

Table `pleins` : id, user_id, date, litres (numeric), km (numeric),

cout (numeric nullable), created_at.

Index sur (user_id, date).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fuel-logbook-van.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28bab547-8d5e-4da5-9e2f-ebd6a606367d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
