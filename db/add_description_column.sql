-- Fix : la colonne `description` est utilisée par le formulaire /declare
-- (src/pages/Declare.tsx → supabase.from('declarations').insert({ description, ... }))
-- mais elle est absente de la table `declarations` dans Supabase.
--
-- À exécuter dans Supabase → SQL Editor :

ALTER TABLE public.declarations
  ADD COLUMN IF NOT EXISTS description text;

-- (Optionnel) garantir une longueur minimale cohérente avec la validation Zod côté client :
-- ALTER TABLE public.declarations
--   ADD CONSTRAINT declarations_description_min_length
--   CHECK (char_length(description) >= 20);
