-- =====================================================================
-- TraceIMEI-BJ — Politiques RLS pour les INSERT (à exécuter UNE FOIS)
--
-- 👉 SQL Editor Supabase : https://supabase.com/dashboard/project/_/sql/new
--
-- Symptômes corrigés :
--   • verifications : 0 lignes alors que /verify est utilisé
--   • declarations  : 0 lignes alors que /declare est utilisé
--
-- Cause : RLS active sans policy INSERT → toutes les insertions sont
-- silencieusement bloquées par PostgREST.
-- =====================================================================

-- 1) Activer RLS (idempotent, ne casse rien si déjà activé)
alter table public.verifications enable row level security;
alter table public.declarations  enable row level security;

-- =============================
-- TABLE : verifications
-- =============================

-- INSERT : un utilisateur connecté ne peut insérer que pour lui-même
drop policy if exists "Users can insert their own verifications" on public.verifications;
create policy "Users can insert their own verifications"
  on public.verifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- SELECT : un utilisateur lit ses propres vérifications ; admin/enquêteur lisent tout
drop policy if exists "Users can read their own verifications" on public.verifications;
create policy "Users can read their own verifications"
  on public.verifications
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'enqueteur')
  );

-- =============================
-- TABLE : declarations
-- =============================

-- INSERT : un utilisateur connecté ne peut déclarer un vol que pour lui-même
drop policy if exists "Users can insert their own declarations" on public.declarations;
create policy "Users can insert their own declarations"
  on public.declarations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- SELECT : propriétaire + admin + enquêteur
drop policy if exists "Users can read their own declarations" on public.declarations;
create policy "Users can read their own declarations"
  on public.declarations
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'enqueteur')
  );

-- =============================
-- VÉRIFICATION
-- =============================
-- Après exécution, contrôlez les policies actives :
--
-- select tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where tablename in ('verifications','declarations')
-- order by tablename, cmd;
