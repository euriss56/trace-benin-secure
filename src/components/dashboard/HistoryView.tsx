import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { VerificationRow } from '@/lib/verification-history';
import { useTranslation } from 'react-i18next';

export function HistoryView() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const statusLabel = (s: string) =>
    s === 'legitimate' ? t('dashboard.history.statusLegitimate')
    : s === 'suspect' ? t('dashboard.history.statusSuspect')
    : t('dashboard.history.statusStolen');

  const statusClass = (s: string) =>
    s === 'legitimate' ? 'bg-success text-success-foreground'
    : s === 'suspect' ? 'bg-warning text-warning-foreground'
    : 'bg-destructive text-destructive-foreground';

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from('verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows((data ?? []) as VerificationRow[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('dashboard.history.empty')} <a href="/verify" className="text-primary underline">{t('dashboard.history.verifyLink')}</a>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">{t('dashboard.history.tableImei')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableStatus')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableScore')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableTime')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableDate')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{r.imei}</td>
                    <td className="py-2 pr-3">
                      <Badge className={statusClass(r.status)}>{statusLabel(r.status)}</Badge>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{r.score.toFixed(2)}</td>
                    <td className="py-2 pr-3 tabular-nums text-xs text-muted-foreground">{r.response_time_ms} ms</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString(i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
