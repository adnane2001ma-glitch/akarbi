-- À coller dans Supabase : SQL Editor → New query → Run
create table if not exists public.inscriptions (
  id            bigint generated always as identity primary key,
  email         text not null unique check (email = lower(email) and length(email) <= 254),
  consentement  boolean not null default true,
  chapitre      text not null default 'Chapter 01',
  source        text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  prevenu_le    timestamptz,
  jour_j_le     timestamptz,
  created_at    timestamptz not null default now()
);

-- Aucun accès public : seule la route API (clé service_role) peut écrire et lire.
alter table public.inscriptions enable row level security;

-- Si la table existait déjà avant l'email du jour J :
alter table public.inscriptions add column if not exists jour_j_le timestamptz;
