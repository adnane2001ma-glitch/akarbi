-- À coller dans Supabase : SQL Editor → New query → Run
-- Nom affiché sur la carte de la collection, et ordre propre à l'onglet Femme
alter table public.produits add column if not exists nom_carte text not null default '';
alter table public.produits add column if not exists ordre_femme integer;
