# Boîte noire

L'enregistreur de ce qu'on vit. Une PWA personnelle, mobile d'abord, où l'on
garde l'historique de ses concerts, de ses spectacles — et de tout ce qu'on
décidera d'y ajouter ensuite.

**Application en ligne** : https://boite-noire.matthieu-grelaud.workers.dev (Cloudflare Workers + D1,
derrière Cloudflare Access)

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
| `/carburant` | Le module de consommation du camping-car (table `pleins`) |
| `/reglages` | Rubriques (créer, modifier, supprimer), import d'origine, export CSV, déconnexion |

Dans les listes, **un glissé vers la gauche découvre la suppression**. Deux
gestes délibérés sont nécessaires — glisser, puis appuyer — pour qu'un frôlement
dans le train ne fasse pas disparaître un souvenir. Un glissé vers la droite,
ou un appui sur la carte, referme.

## Carburant

La consommation se calcule au plein complet : les litres versés depuis le
dernier plein complet, divisés par la distance parcourue entre les deux.

On saisit à chaque plein complet le **relevé du compteur kilométrique total**,
et la distance d'un bloc est l'écart entre deux relevés. Un plein sans relevé
est partiel : ses litres comptent au prochain plein qui en a un.

Le compteur total a remplacé le totaliseur partiel (colonne `km`) après une
coupure de batterie qui avait remis ce dernier à zéro et fait perdre la
distance en cours. Les pleins d'avant gardent leur `km` et restent calculés
comme avant. Le premier relevé sert de **point de départ** : la distance qui y
mène est inconnue, donc ce bloc est clos sans consommation et ses litres
sortent de la moyenne.

## Recherche

Un seul champ, sans syntaxe à retenir : chaque mot tapé doit se retrouver
quelque part dans la fiche — **titre, sous-titre, impressions, tags, lieu,
ville, rubrique, statut ou date**. « cirque 2027 », « grand r janvier » ou
« intéressait ml » fonctionnent donc tels quels, et « ka » retrouve « KA-IN » :
on cherche des fragments, pas des mots entiers.

Deux détails qui comptent :

- les **dates** se cherchent sous toutes leurs écritures — `2026-02-10`,
  `10/02/2026`, « février », « mardi », « 20h30 » ;
- un terme **purement numérique** doit correspondre à un mot entier, sinon
  chercher « 02 » ramènerait tout ce qui contient « 2026 ».

La recherche est faite côté client sur l'ensemble des fiches : elle est
instantanée, insensible aux accents et à la casse, et fonctionne hors ligne.

## Sécurité

- **Cloudflare Access** devant le Worker : seule l'adresse autorisée entre, après
  un code reçu par email (session de 7 jours, partagée avec les autres applis de
  l'équipe Access). Plus de compte Apple.
- **Chaque fonction serveur revérifie** le JWT d'Access (`src/lib/acces.ts`,
  `acces.server.ts`) : signature, émetteur et audience. Si Access était un jour
  désactivé, les données resteraient fermées.
- Une seule personne : plus de `user_id` ni de RLS, la base D1 n'est jamais
  exposée directement au navigateur.

## PWA

Manifeste complet, service worker Workbox, installable depuis Safari iOS
(« Sur l'écran d'accueil »), consultable hors ligne, safe areas respectées.

L'icône est un enregistreur de vol — orange, comme les vraies boîtes noires.
La source est `public/icons/boite-noire.svg` ; les PNG (512, 192, 180, 64) en
sont rendus avec `qlmanage -t -s <taille> -o <dossier> boite-noire.svg`.

Le service worker est écrit dans `.output/public` (`outDir` dans
`vite.config.ts`) : c'est le répertoire que nitro sert réellement. Sans cette
option il atterrissait dans `dist/` et ne partait jamais en production.

## Import d'origine

`src/data/import-initial.ts` contient 102 fiches, **uniquement ce qui a été vu
ou réservé** — la Boîte noire sert à se souvenir, pas à tenir une liste
d'envies. Elles viennent de :

- la **billetterie du Quai M** — 33 concerts de 2022 à 2027, avec le tarif, la
  salle, le nombre de places et le scan à l'entrée ;
- les **classeurs du Grand R** — saisons 24-25, 25-26 et 26-27, pour les
  spectacles réellement pris et les commentaires de l'époque ;
- l'**historique de billetterie du Grand R** (mail du 22/09/2026) — 27
  spectacles des saisons 17-18, 19-20, 22-23 et 23-24, avec le placement, et
  cinq corrections de 25-26 (spectacles finalement pris, dates exactes) ;
- les **réservations 26-27** — dix spectacles en « réservé », avec le placement.

L'import se déclenche depuis `/reglages` et s'exécute côté serveur : les données
d'origine ne partent pas dans le code envoyé au navigateur. Il est **idempotent** : la clé `source`
de chaque fiche est unique, donc le relancer n'ajoute que ce qui
manque et ne touche jamais à ce qui a été corrigé dans l'application.

Pour rectifier après coup une fiche déjà importée, on ajoute une entrée à
`src/data/corrections.ts` plutôt que de modifier `import-initial.ts` (qui ne
vaut que pour un import neuf). Chaque correction est jouée au prochain import,
mais seulement si la fiche a encore ses valeurs d'origine (`si`) : une fiche
retouchée dans l'application reste telle quelle, et une correction passée ne se
rejoue pas.

`SUPPRESSIONS`, dans le même fichier, retire de la base les fiches d'origine
qu'on ne veut plus : les 80 envies des classeurs 25-26 et 26-27 et le concert
annulé du Quai M (purge du 27/09/2026). Même garde-fou : une fiche n'est
supprimée que si elle a encore son statut d'origine, donc une envie passée en
« réservé » ou « vu » dans l'application reste.

## Données

Base **D1** `boite-noire` (SQLite), schéma dans `migrations/`. Le navigateur
n'y accède jamais : il appelle les fonctions serveur de `src/lib/donnees.ts`,
qui passent par `src/lib/d1.server.ts`. `tags` et `extra` sont stockés en JSON
texte ; dates et heures restent du texte ISO.

## Développement

Les fonctions serveur ont besoin du runtime Workers (`cloudflare:workers`) :
`npm run dev` affiche les écrans mais pas les données. Pour tester en entier :

```sh
npm install
npx wrangler d1 migrations apply boite-noire --local --config wrangler.jsonc --persist-to .wrangler/state
npm run build
npx wrangler dev --port 8788 --persist-to .wrangler/state --var DEV_USER_EMAIL:<adresse>
```

Sans Access configuré, seul `localhost` passe, avec l'email de `DEV_USER_EMAIL`.

## Déployer

```sh
npx wrangler d1 migrations apply boite-noire --remote --config wrangler.jsonc   # si nouvelle migration
npm run build
npx wrangler deploy
```

`wrangler.jsonc` est fusionné par nitro dans la config générée
(`.output/server/wrangler.json`), que `wrangler deploy` suit d'office.

Jusqu'au 02/11/2026, l'application vivait sur Lovable (Lovable Cloud + connexion
Apple) ; elle n'y est plus synchronisée.
