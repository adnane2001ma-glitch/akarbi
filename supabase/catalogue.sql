-- À coller dans Supabase : SQL Editor → New query → Run
create table if not exists public.produits (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  nom         text not null,
  coloris     text not null default '',
  categorie   text not null default '',
  collection  text not null default '',
  prix_eur    numeric(10,2) check (prix_eur >= 0),
  prix_mad    numeric(10,2) check (prix_mad >= 0),
  couleur     text not null default '#12281f',
  couleur2    text,
  etiquette   text not null default '',
  description text not null default '',
  details     text[] not null default '{}',
  rubriques   jsonb not null default '[]',
  tailles     text[] not null default '{}',
  note        text not null default '',
  photos      jsonb not null default '[]',
  homme       boolean not null default true,
  femme       boolean not null default true,
  nom_carte   text not null default '',
  ordre       integer not null default 0,
  ordre_femme integer,
  publie      boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.signature (
  position  smallint primary key check (position between 1 and 3),
  image     text not null,
  alt       text not null default '',
  titre     text not null default '',
  texte     text not null default ''
);

-- Aucun accès public direct : le site et le dashboard passent par les routes API du serveur.
alter table public.produits enable row level security;
alter table public.signature enable row level security;
