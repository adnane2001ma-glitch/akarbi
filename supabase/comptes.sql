-- Comptes clients : profil, adresses, favoris, commandes
-- Chaque client ne voit et ne modifie que ses propres données (RLS).

create table if not exists public.profils (
  id              uuid primary key references auth.users(id) on delete cascade,
  prenom          text not null default '',
  nom             text not null default '',
  telephone       text not null default '',
  date_naissance  date,
  ville           text not null default '',
  pays            text not null default '',
  numero_membre   integer generated always as identity (start with 1) unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.adresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  libelle      text not null default '',
  nom_complet  text not null,
  ligne1       text not null,
  ligne2       text not null default '',
  code_postal  text not null default '',
  ville        text not null,
  pays         text not null,
  telephone    text not null default '',
  par_defaut   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists adresses_user_idx on public.adresses (user_id);

create table if not exists public.favoris (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  produit_id  text not null references public.produits(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, produit_id)
);

create table if not exists public.commandes (
  id          uuid primary key default gen_random_uuid(),
  numero      bigint generated always as identity (start with 1001) unique,
  user_id     uuid not null references auth.users(id) on delete restrict,
  statut      text not null default 'en_attente' check (statut in ('en_attente', 'payee', 'preparee', 'expediee', 'livree', 'annulee')),
  articles    jsonb not null default '[]',
  total_eur   numeric(10,2),
  total_mad   numeric(10,2),
  adresse     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists commandes_user_idx on public.commandes (user_id);

alter table public.profils enable row level security;
alter table public.adresses enable row level security;
alter table public.favoris enable row level security;
alter table public.commandes enable row level security;

drop policy if exists "profil : lecture" on public.profils;
create policy "profil : lecture" on public.profils for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profil : modification" on public.profils;
create policy "profil : modification" on public.profils for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- le numéro de membre et les dates ne sont pas modifiables par le client
revoke update on public.profils from authenticated;
grant update (prenom, nom, telephone, date_naissance, ville, pays, updated_at) on public.profils to authenticated;

drop policy if exists "adresses : tout" on public.adresses;
create policy "adresses : tout" on public.adresses for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "favoris : tout" on public.favoris;
create policy "favoris : tout" on public.favoris for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "commandes : lecture" on public.commandes;
create policy "commandes : lecture" on public.commandes for select to authenticated using (user_id = (select auth.uid()));

-- Création du profil à l'inscription (email ou Google)
create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  naissance text := m->>'date_naissance';
begin
  insert into public.profils (id, prenom, nom, telephone, date_naissance, ville, pays)
  values (
    new.id,
    left(coalesce(nullif(m->>'prenom', ''), m->>'given_name', split_part(coalesce(m->>'full_name', ''), ' ', 1), ''), 60),
    left(coalesce(nullif(m->>'nom', ''), m->>'family_name', nullif(substr(coalesce(m->>'full_name', ''), length(split_part(coalesce(m->>'full_name', ''), ' ', 1)) + 2), ''), ''), 60),
    left(coalesce(m->>'telephone', ''), 30),
    case when naissance ~ '^\d{4}-\d{2}-\d{2}$' then naissance::date end,
    left(coalesce(m->>'ville', ''), 80),
    left(coalesce(m->>'pays', ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists profil_a_l_inscription on auth.users;
create trigger profil_a_l_inscription after insert on auth.users
  for each row execute function public.creer_profil();

-- Newsletter cochée à l'inscription : ajout à la liste une fois l'email confirmé
create or replace function public.newsletter_a_la_confirmation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null)
     and coalesce(new.raw_user_meta_data->>'newsletter', '') = 'true'
     and new.email is not null then
    insert into public.inscriptions (email, consentement, source)
    values (lower(new.email), true, 'compte')
    on conflict (email) do update set consentement = true;
  end if;
  return new;
end $$;

drop trigger if exists newsletter_confirmation on auth.users;
create trigger newsletter_confirmation after insert or update of email_confirmed_at on auth.users
  for each row execute function public.newsletter_a_la_confirmation();
