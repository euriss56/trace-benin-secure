-- =====================================================================
-- TraceIMEI-BJ — Fonctions d'agrégation à exécuter dans Supabase
--
-- 👉 À exécuter UNE SEULE FOIS dans le SQL Editor Supabase :
--    https://supabase.com/dashboard/project/_/sql/new
--
-- Ces fonctions déplacent les GROUP BY côté base de données pour
-- réduire la quantité de données transférées au navigateur et accélérer
-- le rendu des dashboards.
--
-- Sécurité : SECURITY INVOKER → la RLS de chaque table reste appliquée
-- avec l'identité (auth.uid()) de l'utilisateur connecté.
-- =====================================================================

-- 1) Vérifications par jour de l'utilisateur courant (N derniers jours)
create or replace function public.verifications_daily_by_status(days int default 30)
returns table (
  day date,
  legitimate bigint,
  suspect bigint,
  stolen bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    date_trunc('day', v.created_at)::date as day,
    count(*) filter (where v.status = 'legitimate') as legitimate,
    count(*) filter (where v.status = 'suspect')    as suspect,
    count(*) filter (where v.status = 'stolen')     as stolen
  from public.verifications v
  where v.user_id = auth.uid()
    and v.created_at >= (now() - make_interval(days => days))
  group by 1
  order by 1;
$$;

-- 2) Distribution globale des statuts (utilisateur courant)
create or replace function public.verifications_status_distribution()
returns table (
  status text,
  count  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select v.status::text, count(*)::bigint
  from public.verifications v
  where v.user_id = auth.uid()
  group by v.status;
$$;

-- 3) Métriques ML agrégées sur les N dernières vérifications
create or replace function public.ml_recent_metrics(sample int default 100)
returns table (
  count_total      bigint,
  avg_score        numeric,
  median_score     numeric,
  high_risk_count  bigint,
  legit_count      bigint,
  suspect_count    bigint,
  stolen_count     bigint,
  last_check_at    timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with last_n as (
    select status, score, created_at
    from public.verifications
    order by created_at desc
    limit greatest(sample, 1)
  )
  select
    count(*)::bigint                                                    as count_total,
    coalesce(avg(score)::numeric, 0)                                    as avg_score,
    coalesce(percentile_cont(0.5) within group (order by score), 0)     as median_score,
    count(*) filter (where score >= 0.8)::bigint                        as high_risk_count,
    count(*) filter (where status in ('legitimate','legitime'))::bigint as legit_count,
    count(*) filter (where status = 'suspect')::bigint                  as suspect_count,
    count(*) filter (where status in ('stolen','vole'))::bigint         as stolen_count,
    max(created_at)                                                     as last_check_at
  from last_n;
$$;

-- 4) % "suspect" sur les dernières 24h
create or replace function public.ml_suspect_24h()
returns table (
  total_24h    bigint,
  suspect_24h  bigint,
  suspect_pct  numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with r as (
    select status from public.verifications
    where created_at >= now() - interval '24 hours'
  )
  select
    count(*)::bigint                                   as total_24h,
    count(*) filter (where status = 'suspect')::bigint as suspect_24h,
    case when count(*) = 0 then 0::numeric
         else (count(*) filter (where status = 'suspect'))::numeric / count(*)::numeric
    end                                                as suspect_pct
  from r;
$$;

-- 5) Top quartiers (déclarations de vol)
create or replace function public.declarations_by_quartier(limit_count int default 12)
returns table (
  quartier text,
  count    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(nullif(trim(d.quartier), ''), 'Inconnu') as quartier,
         count(*)::bigint                                  as count
  from public.declarations d
  where d.quartier is not null
  group by 1
  order by 2 desc
  limit greatest(limit_count, 1);
$$;

-- 6) Tendance déclarations par mois (N derniers mois)
create or replace function public.declarations_monthly(months int default 6)
returns table (
  month date,
  count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select date_trunc('month', d.created_at)::date as month,
         count(*)::bigint                         as count
  from public.declarations d
  where d.created_at >= date_trunc('month', now()) - make_interval(months => months - 1)
  group by 1
  order by 1;
$$;

-- Droits d'exécution
grant execute on function public.verifications_daily_by_status(int)  to anon, authenticated;
grant execute on function public.verifications_status_distribution() to anon, authenticated;
grant execute on function public.ml_recent_metrics(int)              to anon, authenticated;
grant execute on function public.ml_suspect_24h()                    to anon, authenticated;
grant execute on function public.declarations_by_quartier(int)       to anon, authenticated;
grant execute on function public.declarations_monthly(int)           to anon, authenticated;
