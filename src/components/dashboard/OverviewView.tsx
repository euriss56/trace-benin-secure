import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, History, Smartphone, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { DealerCharts } from './DealerCharts';
import { RecentVerifications } from './RecentVerifications';

const CERTIF_THRESHOLD = 20;

interface Stats {
  monthCount: number;
  totalCount: number;
  declarationCount: number;
  stolenHits: number;
}

export function OverviewView() {
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ monthCount: 0, totalCount: 0, declarationCount: 0, stolenHits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startISO = startOfMonth.toISOString();
    let cancelled = false;

    async function loadStats() {
      const [m, tt, d, s] = await Promise.all([
        supabase.from('verifications').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startISO),
        supabase.from('verifications').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase.from('declarations').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase.from('verifications').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'stolen'),
      ]);
      if (cancelled) return;
      setStats({
        monthCount: m.count ?? 0,
        totalCount: tt.count ?? 0,
        declarationCount: d.count ?? 0,
        stolenHits: s.count ?? 0,
      });
      setLoading(false);
    }

    loadStats();

    // Realtime: refresh counters when user's verifications/declarations change
    const channel = supabase
      .channel(`dashboard-overview-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verifications', filter: `user_id=eq.${user.id}` },
        () => loadStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declarations', filter: `user_id=eq.${user.id}` },
        () => loadStats()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isPro = role === 'dealer' || role === 'technicien';
  const isStaff = role === 'enqueteur' || role === 'admin';
  const showHistory = !isStaff;
  const certified = isPro && stats.monthCount >= CERTIF_THRESHOLD;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.overview.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.overview.welcome', { name: user?.email?.split('@')[0] ?? '' })}{' '}
          <span className="uppercase text-xs tracking-wide text-primary">{role ?? 'particulier'}</span>
        </p>
      </div>

      {certified && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold flex items-center gap-2">
                {t('dashboard.overview.certifiedTitle')}
                <Badge className="bg-primary text-primary-foreground">{t('dashboard.overview.certifiedActive')}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('dashboard.overview.certifiedDesc', { count: stats.monthCount })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.overview.monthVerifs')}
          value={loading ? '…' : stats.monthCount}
          tone="success"
        />
        <StatCard
          icon={History}
          label={t('dashboard.overview.totalVerifs')}
          value={loading ? '…' : stats.totalCount}
          tone="info"
        />
        <StatCard
          icon={Smartphone}
          label={t('dashboard.overview.myDeclarations')}
          value={loading ? '…' : stats.declarationCount}
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label={t('dashboard.overview.stolenHits')}
          value={loading ? '…' : stats.stolenHits}
          tone="danger"
        />
      </div>

      {isPro && !certified && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.overview.progressTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              {t('dashboard.overview.progressDesc', {
                count: stats.monthCount,
                remaining: Math.max(0, CERTIF_THRESHOLD - stats.monthCount),
              })}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (stats.monthCount / CERTIF_THRESHOLD) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isPro && <DealerCharts />}

      {showHistory && <RecentVerifications />}
    </div>
  );
}

type StatTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<StatTone, string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'info',
}: {
  icon: typeof Award;
  label: string;
  value: number | string;
  tone?: StatTone;
}) {
  return (
    <div className="group relative w-full overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${TONE_STYLES[tone]}`}
        >
          <Icon className="h-6 w-6" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
