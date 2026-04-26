import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

type Status = 'legitimate' | 'suspect' | 'stolen';

interface VerifRow {
  status: Status;
  created_at: string;
}

const COLOR_LEGIT = '#22c55e';
const COLOR_SUSPECT = '#f97316';
const COLOR_STOLEN = '#ef4444';

interface DailyBucket {
  day: string;
  legitimate: number;
  suspect: number;
  stolen: number;
}

function buildLast30Days(rows: VerifRow[]): DailyBucket[] {
  const buckets = new Map<string, DailyBucket>();
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: key.slice(5), legitimate: 0, suspect: 0, stolen: 0 });
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    if (r.status === 'legitimate') b.legitimate++;
    else if (r.status === 'suspect') b.suspect++;
    else if (r.status === 'stolen') b.stolen++;
  }
  return Array.from(buckets.values());
}

export function DealerCharts() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [rows30, setRows30] = useState<VerifRow[]>([]);
  const [rowsAll, setRowsAll] = useState<VerifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    async function load() {
      const [r30, rAll] = await Promise.all([
        supabase
          .from('verifications')
          .select('status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: true }),
        supabase
          .from('verifications')
          .select('status, created_at')
          .eq('user_id', user.id),
      ]);
      if (cancelled) return;
      setRows30((r30.data ?? []) as VerifRow[]);
      setRowsAll((rAll.data ?? []) as VerifRow[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const daily = useMemo(() => buildLast30Days(rows30), [rows30]);

  const distribution = useMemo(() => {
    const counts = { legitimate: 0, suspect: 0, stolen: 0 };
    for (const r of rowsAll) {
      if (r.status in counts) counts[r.status]++;
    }
    return [
      { name: t('dashboard.charts.legitimate'), value: counts.legitimate, color: COLOR_LEGIT },
      { name: t('dashboard.charts.suspect'), value: counts.suspect, color: COLOR_SUSPECT },
      { name: t('dashboard.charts.stolen'), value: counts.stolen, color: COLOR_STOLEN },
    ];
  }, [rowsAll, t]);

  const totalAll = distribution.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.charts.dealerMonthTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="legitimate" stackId="a" name={t('dashboard.charts.legitimate')} fill={COLOR_LEGIT} />
                <Bar dataKey="suspect" stackId="a" name={t('dashboard.charts.suspect')} fill={COLOR_SUSPECT} />
                <Bar dataKey="stolen" stackId="a" name={t('dashboard.charts.stolen')} fill={COLOR_STOLEN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.charts.dealerDistributionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : totalAll === 0 ? (
            <div className="text-sm text-muted-foreground">{t('dashboard.charts.empty')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(e) => `${Math.round((e.value / totalAll) * 100)}%`}
                  labelLine={false}
                >
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
