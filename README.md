# Boîte noire

L'enregistreur de ce qu'on vit. Une PWA personnelle, mobile d'abord, où l'on
garde l'historique de ses concerts, de ses spectacles — et de tout ce qu'on
décidera d'y ajouter ensuite.

**Application en ligne** : https://fuel-logbook-van.lovable.app

## Le principe

Deux tables suffisent, et elles sont volontairement génériques :

- **`rubriques`** — les catégories, créées depuis l'application (Concerts,
  Spectacles, puis Restaurants, Voyages, Films… au fur et à mesure des envies).
  Chacune a un nom, une icône et une couleur.
- **`fiches`** — une entrée d'historique dans une rubrique : titre, sous-titre,
  date et heure, lieu, ville, statut, **note sur 5**, impressions, prix, places,
  tags libres, et un `extra` en JSON pour ce qui est propre à un domaine.

Conséquence : **ajouter une rubrique ne demande aucune migration**. Ce qui est
spécifique va dans les tags et dans `extra`, jamais dans une nouvelle colonne.

Les quatre statuts d'une fiche — **vu**, **réservé**, **envie**, **annulé** —
permettent de tenir dans le même endroit ce qu'on a vécu et ce qu'on aimerait
vivre.

## Écrans

| Route | Rôle |
| --- | --- |
| `/` | Accueil : recherche globale, compteurs, tuiles de rubriques, ce qui arrive, derniers vécus |
| `/r/$slug` | Une rubrique : recherche, filtres par statut et par tag, tri, liste groupée par année |
| `/carburant` | Le module de consommation du camping-car (table `pleins`, inchangé) |
| `/reglages` | Rubriques (créer, modifier, supprimer), import d'origine, export CSV, déconnexion |

La recherche est faite côté client sur l'ensemble des fiches : elle est
instantanée, insensible aux accents et à la casse, et fonctionne hors ligne.

## Sécurité

- **Sign in with Apple comme unique méthode de connexion.** Aucun écran n'est
  accessible sans session : tout passe par `PorteAuth`.
- **Row Level Security** sur `rubriques`, `fiches` et `pleins` : chaque ligne est
  rattachée à un `user_id` et les politiques n'autorisent que `auth.uid() =
  user_id`. Même en parlant directement à l'API avec la clé publique, on ne voit
  que ses propres données.

## PWA

Manifeste complet, service worker Workbox, installable depuis Safari iOS
(« Sur l'écran d'accueil »), consultable hors ligne, safe areas respectées.

Le service worker est écrit dans `.output/public` (`outDir` dans
`vite.config.ts`) : c'est le répertoire que nitro sert réellement. Sans cette
option il atterrissait dans `dist/` et ne partait jamais en production.

## Import d'origine

`src/data/import-initial.ts` contient 156 fiches reprises de :

- la **billetterie du Quai M** — 34 concerts de 2022 à 2027, avec le tarif, la
  salle, le nombre de places et le scan à l'entrée ;
- les **classeurs du Grand R** — saisons 24-25, 25-26 et 26-27, dont les
  spectacles réellement pris, les hésitations et les commentaires de l'époque.

L'import se déclenche depuis `/reglages`. Il est **idempotent** : la clé `source`
de chaque fiche est unique par utilisateur, donc le relancer n'ajoute que ce qui
manque et ne touche jamais à ce qui a été corrigé dans l'application.

## Développement

```sh
npm install
npm run dev      # http://localhost:8080
npm run build
npm run lint
```

Les migrations vivent dans `supabase/migrations/` et sont appliquées par Lovable
Cloud lors de la synchronisation.

## Lovable

Ce projet est connecté à [Lovable](https://lovable.dev/projects/28bab547-8d5e-4da5-9e2f-ebd6a606367d).
Chaque changement poussé sur `main` y est synchronisé — garder la branche dans un
état qui compile.
