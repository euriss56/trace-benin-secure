-- =====================================================================
-- TraceIMEI-BJ — Garde-fou backend : historique IMEI strictement privé
--
-- 👉 SQL Editor Supabase : https://supabase.com/dashboard/project/_/sql/new
--
-- Objectif :
--   L'historique IMEI personnel (table `verifications`) ne doit JAMAIS
--   être lisible par les rôles enqueteur/admin via une simple requête
--   table — même en bypassant le frontend (URL /dashboard/history,
--   appels REST directs, etc.).
--
--   Les enquêteurs/admin gardent l'accès aux **agrégats** via les
--   fonctions SECURITY DEFINER (cf. db/aggregations.sql) qui ne
--   renvoient pas les IMEI individuels.
-- =====================================================================

alter table public.verifications enable row level security;

-- Remplace la policy SELECT large par une policy strictement propriétaire.
drop policy if exists "Users can read their own verifications" on public.verifications;

create policy "Owner only can read verifications"
  on public.verifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- (INSERT inchangée : auth.uid() = user_id — déjà créée par
--  db/rls_insert_policies.sql)

-- =============================
-- VÉRIFICATION
-- =============================
-- select policyname, cmd, qual
-- from pg_policies
-- where tablename = 'verifications';
--
-- Attendu :
--   • "Owner only can read verifications" | SELECT | (auth.uid() = user_id)
--   • "Users can insert their own verifications" | INSERT | check (auth.uid() = user_id)
