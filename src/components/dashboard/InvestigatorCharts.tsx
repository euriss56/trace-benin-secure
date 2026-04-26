import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface DeclRow {
  quartier: string | null;
  created_at: string;
}

const BLUE_DARK = '#1A3A6B';
const BLUE_LIGHT = '#4A90D9';

function lerpColor(a: string, b: string, t: number) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function InvestigatorCharts() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<DeclRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    async function load() {
      const { data } = await supabase
        .from('declarations')
        .select('quartier, created_at')
        .order('created_at', { ascending: true });
      if (cancelled) return;
      setRows((data ?? []) as DeclRow[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('investigator-charts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declarations' },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const byQuartier = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const q = (r.quartier ?? '').trim();
      if (!q) continue;
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }
    const arr = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const max = arr.length;
    return arr.map((d, i) => ({ ...d, color: lerpColor(BLUE_DARK, BLUE_LIGHT, max <= 1 ? 0 : i / (max - 1)) }));
  }, [rows]);

  const monthly = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; count: number }>();
    const now = new Date();
    const fmt = new Intl.DateTimeFormat(i18n.language, { month: 'short', year: '2-digit' });
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { key, label: fmt.format(d), count: 0 });
    }
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key);
      if (b) b.count++;
    }
    return Array.from(buckets.values());
  }, [rows, i18n.language]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.charts.investigatorByQuartierTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : byQuartier.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('dashboard.charts.empty')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byQuartier} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, t('dashboard.charts.reports')]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {byQuartier.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.charts.investigatorTrendTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[360px]">
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE_LIGHT} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={BLUE_DARK} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, t('dashboard.charts.reports')]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={BLUE_DARK}
                  strokeWidth={2}
                  fill="url(#trendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
