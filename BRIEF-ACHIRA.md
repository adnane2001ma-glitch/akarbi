# Brief : site ACHIRA + dashboard

## 1. Le projet en une phrase

ACHIRA est le cercle d'artistes et de créatifs de la maison AKARBI (maison marocaine de cuir contemporain). Le site ACHIRA présente **les projets du cercle de façon détaillée** : chaque projet a sa propre page, comme un récit éditorial. Tout ce qui s'affiche (projets, membres, textes des pages, images) se gère depuis **un dashboard**, sans toucher au code.

Le site reprend **à l'identique le thème du site AKARBI** : mêmes couleurs, même typographie (police maison AKARBI), même navigation en pilule, mêmes animations. ACHIRA, c'est la déclinaison **bordeaux** de l'univers AKARBI.

Signature : « Un cercle qui avance ensemble. » / « Des histoires singulières. Des valeurs partagées. » / « TRUST YOUR WAY. »

---

## 2. Stack technique (la même que le site AKARBI existant)

- **Next.js 16** (App Router, TypeScript, React 19), déployé sur **Vercel**
- **Supabase** : base Postgres + Storage pour les photos et vidéos. RLS activée sur toutes les tables, aucun accès public direct : le site et le dashboard passent par des routes API serveur (clé `service_role` côté serveur uniquement).
- CSS écrit à la main avec des variables CSS (pas de thème Tailwind générique, pas de composants shadcn visibles tels quels)
- Polices : fichier `akarbi-typeface.woff2` (fourni) + Google Fonts *Cormorant Garamond* et *Hanken Grotesk*
- Code, noms de fichiers, de tables et de colonnes **en français** (ex. `projets`, `membres`, `publie`, `ordre`), comme dans le projet AKARBI
- Textes du site en français, tutoiement

---

## 3. Le thème (à respecter strictement)

### Couleurs

```css
:root {
  /* bordeaux, l'univers ACHIRA */
  --b950: #140309; --b900: #260610; --b800: #3b0a17; --b700: #561020;
  --achira: #7f0b1f;           /* accent principal : boutons, filets, numéros */
  /* vert pétrole, l'univers AKARBI (à utiliser en contrepoint) */
  --p950: #050f0c; --p900: #0a1a16; --p800: #0f261f; --p700: #173a30;
  /* textes */
  --ivory: #eee5d3;            /* texte principal sur fond sombre, aussi fond "papier" */
  --ink: #10231d; --ink2: #44544d;   /* texte sur fond ivoire */
  --iv80: rgba(238,229,211,.82); --iv60: rgba(238,229,211,.62);
  --iv30: rgba(238,229,211,.3);  --iv14: rgba(238,229,211,.14);  /* filets, bordures */
  --champ: #c5a676;            /* champagne : focus, petits détails */
  color-scheme: dark;
}
```

Fonds des sections ACHIRA :
- Hero : `radial-gradient(90% 70% at 50% 30%, #3b0a17 0%, #16040a 60%, #0a0205 100%)`
- Section sombre : `#0e0306`
- Section bordeaux : `linear-gradient(180deg, #1b050b, #2a0711)`
- Section claire « papier » (ponctuelle) : fond `--ivory` avec léger grain, texte `--ink`

On alterne sombre / bordeaux / ponctuellement papier, jamais de blanc pur, jamais de noir pur.

### Typographie

```css
@font-face { font-family: 'AKARBI'; src: url('/font/akarbi-typeface.woff2') format('woff2'); font-display: swap; }
--brand: 'AKARBI', 'Bebas Neue', 'Oswald', Impact, sans-serif;  /* titres, toujours en MAJUSCULES */
--serif: 'Cormorant Garamond', 'Times New Roman', serif;        /* phrases d'accroche en italique */
--sans:  'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif; /* texte courant, interface */
```

| Classe | Rôle | Style |
|---|---|---|
| `.display` | Très gros titre (hero) | `400 clamp(64px,11vw,176px)/.9 var(--brand)`, letter-spacing .03em |
| `.h2` | Titre de section | `400 clamp(40px,5.6vw,92px)/.95 var(--brand)` |
| `.h3` | Sous-titre | `400 clamp(28px,2.9vw,46px)/1 var(--brand)` |
| `.h4` | Petit titre | `400 clamp(22px,1.8vw,28px)/1.05 var(--brand)`, letter-spacing .06em |
| `.lead` | Accroche | `italic 400 clamp(21px,2vw,32px)/1.2 var(--serif)`, couleur `--iv80` |
| `.eyebrow` | Surtitre | `600 11px var(--sans)`, letter-spacing .26em, MAJUSCULES, couleur `--iv60` |
| `.body` | Paragraphe | `400 16px/1.65 var(--sans)`, max 62ch, couleur `--iv80` |
| `.num` | Numéro (01, 02…) | `18px var(--brand)`, letter-spacing .12em, couleur `--champ` |
| `.big` | Grand numéro de parcours | `clamp(54px,6vw,96px) var(--brand)`, couleur `--achira` |

### Composants visuels

- **Navigation** : pilule flottante centrée en haut (`position: fixed`, `top: 16px`), fond `rgba(38,6,16,.42)` + `backdrop-filter: blur(10px)`, bordure `1px rgba(238,229,211,.14)`, `border-radius: 999px`. Contenu : monogramme + logotype à gauche, liens en `11px` Hanken Grotesk, letter-spacing .2em, MAJUSCULES, couleur `rgba(238,229,211,.72)` ; lien actif en ivoire, souligné d'un filet. Au scroll vers le bas, la pilule se réduit et ne garde que le monogramme agrandi au centre ; elle réapparaît au scroll vers le haut. Liens : **PROJETS · LE CERCLE · REJOINDRE · AKARBI ↗**.
- **Boutons** : pilules `min-height: 50px`, `padding: 0 26px`, `600 12px` letter-spacing .2em MAJUSCULES. Variantes : `--solid` (fond ivoire, texte encre), `--line` (bordure `--iv30`), `--bord` (fond `--achira`, survol `#95102a`).
- **Lien fléché** : texte MAJUSCULES souligné d'un filet, la flèche glisse de 6px au survol.
- **Images** : `border-radius: 14px`, `object-fit: cover`, jamais de bordure ni d'ombre forte.
- **Listes numérotées** : lignes séparées par un filet `--iv14`, grand numéro bordeaux à gauche.
- **Puces / étiquettes** : pilules bordure `--iv30`, `600 11px` MAJUSCULES.
- **Marges latérales** : `--gut: clamp(20px, 4.5vw, 76px)` ; sections `padding: clamp(96px,14vh,170px) var(--gut)`.
- **Sélection de texte** : fond `--achira`, texte ivoire. **Focus clavier** : contour 1.5px `--champ`.

### Mouvement

- Courbe unique : `--ease: cubic-bezier(.22, 1, .36, 1)`
- Titres qui apparaissent mot par mot (chaque mot monte depuis un masque), paragraphes en fondu + léger glissement à l'entrée dans l'écran, parallaxe douce sur les grandes images
- Tout est désactivé avec `prefers-reduced-motion: reduce`

### Ton

Sobre, poétique, jamais commercial. Phrases courtes. Vocabulaire : cercle, chemin, trace, chapitre, matière, avancer, ombre et lumière.

---

## 4. Pages du site public

### `/` Accueil
1. **Hero** plein écran (fond radial bordeaux) : emblème ACHIRA (SVG fourni), titre `ACHIRA` en `.display`, accroche `.lead--xl` « Un cercle qui avance ensemble. », surtitre « Des histoires singulières. Des valeurs partagées. »
2. **Manifeste** : un grand paragraphe qui s'écrit mot par mot.
3. **Projets à la une** : 3 projets mis en avant depuis le dashboard, grandes cartes image + titre + catégorie + année.
4. **Le parcours** (Suivre / Devenir ACHIRA / Construire avec nous) en liste numérotée.
5. **Membres** : bande de portraits défilante.
6. **Appel final** : citation « L'achat donne un accès. *Les valeurs donnent l'appartenance.* » + boutons.

Tous les textes de cette page viennent du dashboard (section « Contenus du site »).

### `/projets` Tous les projets
- Grille éditoriale asymétrique (pas une grille de cartes identiques), avec de grandes et de petites images en alternance
- Filtres en pilules : catégorie (Artisanat, Musique, Photographie, Design, Mode, Événement, Collaboration…), statut (À venir, En cours, Terminé), année
- Chaque carte : image de couverture, numéro, titre en police AKARBI, catégorie en surtitre, lieu + année

### `/projets/[slug]` Page projet détaillée (le cœur du site)
1. **Hero** : image ou vidéo de couverture plein écran assombrie, surtitre (catégorie · lieu · année), titre `.display`, accroche en italique
2. **Fiche** : bandeau en colonnes séparées par des filets : Statut · Dates · Lieu · Porteurs du projet · Partenaires
3. **Récit** : contenu en blocs, assemblés librement dans le dashboard :
   - texte (titre + paragraphes)
   - image pleine largeur avec légende
   - duo / trio d'images (collage décalé comme sur la page ACHIRA d'AKARBI)
   - citation (grande, en Cormorant italique)
   - vidéo (fichier ou lien)
   - chiffres clés (ex. « 120 heures de travail », « 6 artisans »)
   - étapes numérotées (01, 02, 03…)
   - galerie (ouverture en plein écran au clic, navigation au clavier)
4. **L'équipe du projet** : portraits des membres liés, nom, savoir-faire, lien vers leur profil
5. **Pièces AKARBI liées** (optionnel) : lien vers les produits concernés du site AKARBI
6. **Projet suivant** : grande bannière cliquable vers le projet suivant

SEO : titre, description et image Open Graph par projet (modifiables dans le dashboard, valeurs par défaut sinon).

### `/cercle` Le cercle
Reprend la page ACHIRA actuelle (manifeste, « Un cercle d'artistes », le parcours, « La vie du cercle ») + l'annuaire des membres (portrait, nom, savoir-faire, ville, projets auxquels il a participé).

### `/cercle/[slug]` Profil d'un membre
Portrait, bio, savoir-faire, liens (Instagram, site), liste de ses projets.

### `/rejoindre` Construire avec nous
Formulaire : nom, email, ville, savoir-faire (Tailleur, Designer, Photographe, Mannequin, Artisan, Autre), lien vers son travail, message, consentement. Les candidatures arrivent dans le dashboard. Protection anti-spam (champ piège + limitation de fréquence).

Pied de page commun : devise « TRUST YOUR WAY » en police AKARBI couleur `--achira`, liens AKARBI, Instagram, mentions légales.

---

## 5. Base de données (Supabase)

```sql
create table public.projets (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  titre         text not null,
  accroche      text not null default '',
  categorie     text not null default '',
  statut        text not null default 'en-cours' check (statut in ('a-venir','en-cours','termine')),
  date_debut    date,
  date_fin      date,
  lieu          text not null default '',
  couverture    jsonb,                       -- { url, alt, type: 'image'|'video', poster }
  blocs         jsonb not null default '[]', -- le récit, liste ordonnée de blocs typés
  chiffres      jsonb not null default '[]', -- [{ valeur, libelle }]
  partenaires   jsonb not null default '[]', -- [{ nom, lien }]
  produits_lies text[] not null default '{}',-- ids de la table produits d'AKARBI
  a_la_une      boolean not null default false,
  ordre         integer not null default 0,
  publie        boolean not null default false,
  seo           jsonb not null default '{}', -- { titre, description, image }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.membres (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  nom         text not null,
  savoir_faire text not null default '',
  ville       text not null default '',
  bio         text not null default '',
  portrait    jsonb,
  liens       jsonb not null default '[]',
  ordre       integer not null default 0,
  publie      boolean not null default false
);

create table public.projets_membres (
  projet_id uuid references public.projets on delete cascade,
  membre_id uuid references public.membres on delete cascade,
  role      text not null default '',
  ordre     integer not null default 0,
  primary key (projet_id, membre_id)
);

create table public.contenus (            -- textes et images des pages, éditables
  cle        text primary key,            -- ex. 'accueil.hero', 'cercle.parcours'
  valeur     jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.candidatures (
  id          uuid primary key default gen_random_uuid(),
  nom text not null, email text not null, ville text, savoir_faire text,
  lien text, message text,
  statut      text not null default 'nouvelle' check (statut in ('nouvelle','en-discussion','acceptee','refusee')),
  note_interne text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.projets        enable row level security;
alter table public.membres        enable row level security;
alter table public.projets_membres enable row level security;
alter table public.contenus       enable row level security;
alter table public.candidatures   enable row level security;
```

Storage : un bucket public `achira` pour les médias (dossiers `projets/`, `membres/`, `pages/`). Formats JPEG, PNG, WebP (4 Mo max), MP4/WebM pour les vidéos. Conversion en WebP et plusieurs tailles pour l'affichage.

Le site lit les données côté serveur avec revalidation à la demande (`revalidatePath`) : une modification enregistrée dans le dashboard apparaît sur le site en quelques secondes.

---

## 6. Le dashboard (`/admin`)

Même esprit visuel que le site, en version outil : fond `--p950` ou `#0e0306`, cartes `--p900` / `--b900` à bordure `--iv14` et `border-radius: 14px`, titres de page en Cormorant italique, surtitres en champagne, boutons pilules, bouton principal en `--achira`. Lisible et rapide avant tout, utilisable sur téléphone.

**Accès** : page de connexion, session signée par cookie HttpOnly (7 jours), toutes les routes `/admin` et `/api/admin` protégées côté serveur.

**Entête** : ACHIRA · Dashboard | Projets · Membres · Contenus · Candidatures · Médias | Voir le site | Déconnexion

### Projets
- Liste avec vignette, titre, statut, à la une, publié/brouillon, date de mise à jour
- Recherche, filtres, réordonnancement par glisser-déposer
- Interrupteurs rapides « Publié » et « À la une » directement dans la liste
- Dupliquer, supprimer (avec confirmation)

### Éditeur de projet
- Colonne principale : informations (titre → slug généré automatiquement et modifiable, accroche, catégorie, statut, dates, lieu), couverture (glisser-déposer d'image ou vidéo), **éditeur de blocs** pour le récit : ajouter un bloc par type (section 4), réordonner, supprimer, chaque bloc avec ses propres champs
- Colonne latérale : publication, à la une, membres liés (recherche + rôle), partenaires, chiffres clés, produits AKARBI liés, SEO
- **Aperçu** : bouton qui ouvre la page projet telle qu'elle apparaîtra, même en brouillon (lien secret)
- Enregistrement explicite avec indicateur « modifications non enregistrées », alerte si on quitte la page sans enregistrer
- Texte alternatif obligatoire pour chaque image

### Membres
Liste + éditeur (portrait, nom, savoir-faire, ville, bio, liens, publié, ordre). On voit les projets auxquels chaque membre participe.

### Contenus du site
Une fiche par page (Accueil, Le cercle, Rejoindre, Pied de page) avec un champ pour chaque texte et chaque image affichés. Les valeurs actuelles d'ACHIRA (section 7) servent de contenu initial.

### Candidatures
Tableau (date, nom, savoir-faire, ville, statut), fiche détaillée, changement de statut, note interne, bouton « Créer le membre » qui pré-remplit une fiche membre. Export CSV.

### Médias
Bibliothèque de tous les fichiers envoyés : envoi multiple, recherche, copie du lien, suppression (refusée si le fichier est encore utilisé).

---

## 7. Contenu de départ (repris de la page ACHIRA d'AKARBI)

- Hero : « ACHIRA » / « Un cercle qui avance ensemble. » / « Des histoires singulières. Des valeurs partagées. »
- Manifeste : « AKARBI est née d'une rencontre. ACHIRA prolonge cette possibilité : trouver, au croisement de parcours différents, des personnes avec qui partager une ambition, une sensibilité et l'envie de construire. »
- Un cercle d'artistes, « Contre la routine qui enferme. » : « ACHIRA rassemble des artistes et des créatifs, de l'art traditionnel à l'art moderne : artisans, musiciens, photographes, designers, tous ceux qui cherchent leur propre voie plutôt que de tourner en rond. Ce qui nous relie : le goût du travail bien fait, le respect des racines et l'envie d'avancer, même dans les périodes d'ombre. »
- Le parcours, « Chacun sa manière d'avancer. » :
  01 **Suivre** : Le premier lien peut naître d'une image, d'une pièce ou d'une histoire. Tu découvres AKARBI, tu suis ses chapitres et ses coulisses à ton rythme, sans obligation d'achat.
  02 **Devenir ACHIRA** : Tu deviens ACHIRA avec ta première pièce AKARBI, et en faisant vivre nos principes : ne jamais abandonner, avancer avec discipline, aimer le processus. TRUST YOUR WAY.
  03 **Construire avec nous** : Tu as un savoir-faire qui peut faire grandir la maison ? Tu peux devenir membre d'AKARBI et d'ACHIRA, et construire la marque avec nous.
- La vie du cercle, « Faire vivre le cercle. » : 01 Entretenir le lien · 02 Se retrouver (Casablanca et la diaspora) · 03 Contribuer aux choix · 04 Garder une direction
- Citation finale : « L'achat donne un accès. *Les valeurs donnent l'appartenance.* » / « Le compte AKARBI montre la marque. Le compte ACHIRA montre le chemin. »

Prévoir 3 projets d'exemple réalistes (en brouillon) pour montrer la mise en page.

---

## 8. Fichiers fournis

- `akarbi-typeface.woff2` : la police maison (dans `public/akarbi/font/` du projet AKARBI)
- SVG de l'emblème ACHIRA, du monogramme et du logotype AKARBI (dans `public/akarbi/index.html` du projet AKARBI, templates `#achiraTpl` et nav)
- Photos d'ambiance : `public/akarbi/img/` (`u-cercle-1/2/3.webp`, `poster-achira.webp`, `end-achira.webp`, `portrait-*.webp`…)
- Capture d'écran du hero ACHIRA actuel comme référence visuelle

---

## 9. Exigences de qualité

- Responsive soigné du 360px au grand écran ; sur mobile, la nav devient pilule + bouton MENU ouvrant un panneau plein écran
- Accessibilité WCAG AA : contrastes, navigation clavier, textes alternatifs, lien d'évitement, `lang="fr"`
- Performance : images en WebP avec `srcset`, vidéos en `preload="none"` avec poster, police préchargée, LCP sous 2,5 s
- Pages vides gérées proprement (« Aucun projet pour l'instant », etc.)
- Messages d'erreur clairs en français dans le dashboard
- Aucune clé secrète côté navigateur ; toutes les écritures passent par des routes API protégées
