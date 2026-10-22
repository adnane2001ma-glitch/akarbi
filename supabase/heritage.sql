-- À coller dans Supabase : SQL Editor → New query → Run
-- HÉRITAGE : sélections indépendantes des produits (artisanat, patrimoine, histoire…).
-- Le lien se fait dans un seul sens : un produit indique de quelles sélections il s'inspire.
create table if not exists public.heritage (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  titre       text not null,
  famille     text not null check (famille in ('artisanat', 'patrimoine', 'maritime', 'histoire', 'nature', 'broderie', 'culture', 'art')),
  theme       text not null default '',
  lieu        text not null default '',
  epoque      text not null default '',
  accroche    text not null default '',
  texte       text not null default '',
  reperes     jsonb not null default '[]',
  adn         text not null default '',
  photos      jsonb not null default '[]',
  credit      text not null default '',
  a_la_une    boolean not null default false,
  ordre       integer not null default 0,
  publie      boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- Aucun accès public direct : le site et le dashboard passent par les routes API du serveur.
alter table public.heritage enable row level security;

-- Sélections dont un produit s'inspire (ids de la table heritage)
alter table public.produits add column if not exists heritage text[] not null default '{}';

-- Exemple en brouillon (non visible sur le site) : à compléter ou supprimer depuis le dashboard
insert into public.heritage (id, titre, famille, theme, lieu, epoque, accroche, texte, reperes, adn, photos, ordre, publie)
values (
  'dar-dbagha',
  'Dar Dbagha',
  'artisanat',
  'Tannerie et travail du cuir',
  'Fès',
  'Depuis des siècles',
  'Là où la peau devient cuir, à la main et au soleil.',
  E'Au cœur de la médina, les cuves de pierre forment une palette à ciel ouvert. Les peaux y passent de bain en bain, foulées, rincées, teintes, puis séchées sur les terrasses.\n\nLe geste se transmet de père en fils. Il demande de la force, de la patience et un œil sûr pour juger la souplesse et la couleur d’une peau.',
  '[{"titre":"Matière","texte":"Peaux de chèvre, de mouton et de vache."},{"titre":"Geste","texte":"Trempage, foulage et teinture à la main, dans des cuves de pierre."},{"titre":"Couleurs","texte":"Des teintes tirées de pigments naturels."}]',
  'Le cuir est la première matière d’AKARBI. De Dar Dbagha, nous retenons le temps long, le travail à la main et une couleur qui se mérite.',
  '[{"url":"/akarbi/img/u-tannerie.webp","alt":"Un artisan travaille une peau au milieu des cuves de la tannerie"}]',
  10,
  false
)
on conflict (id) do nothing;
