-- À coller dans Supabase : SQL Editor → New query → Run
-- HÉRITAGE, page en grille : format de chaque carte et en-tête de la page, tous deux gérés depuis le dashboard.
alter table public.heritage add column if not exists format text not null default 'auto'
  check (format in ('auto', 'portrait', 'carre', 'paysage', 'haut'));

create table if not exists public.heritage_page (
  id          smallint primary key default 1 check (id = 1),
  image       text not null default '/akarbi/img/u-tannerie.webp',
  image_alt   text not null default 'Un artisan travaille une peau au milieu des cuves de la tannerie',
  surtitre    text not null default 'Héritage',
  titre       text not null default 'Ce qui nous précède.',
  texte       text not null default 'Des gestes, des lieux, des mémoires : le Maroc qui nourrit l’identité d’AKARBI. Huit familles pour le raconter, une sélection après l’autre.',
  updated_at  timestamptz not null default now()
);
alter table public.heritage_page enable row level security;
insert into public.heritage_page (id) values (1) on conflict (id) do nothing;
