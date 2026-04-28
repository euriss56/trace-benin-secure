import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { VerificationRow } from '@/lib/verification-history';
import { useTranslation } from 'react-i18next';
import { imeiStatusClass, imeiStatusLabel } from '@/lib/status-style';

const LIMIT = 20;

export function RecentVerifications() {
  const { user, role } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Garde-fou : enquêteur/admin n'ont pas d'historique IMEI personnel.
  const blocked = role === 'enqueteur' || role === 'admin';

  useEffect(() => {
    if (blocked) { setLoading(false); return; }
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = () => {
      supabase
        .from('verifications')
        .select('id,imei,status,score,response_time_ms,luhn_valid,tac,source,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(LIMIT)
        .then(({ data }) => {
          if (cancelled) return;
          setRows((data ?? []) as VerificationRow[]);
          setLoading(false);
        });
    };

    load();

    const channel = supabase
      .channel(`recent-verifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'verifications', filter: `user_id=eq.${user.id}` },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          {t('dashboard.recent.title', { defaultValue: '20 derniers IMEI vérifiés' })}
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/history">
            {t('dashboard.recent.viewAll', { defaultValue: 'Tout voir' })}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('dashboard.history.empty')}{' '}
            <Link to="/verify" className="text-primary underline">
              {t('dashboard.history.verifyLink')}
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">{t('dashboard.history.tableImei')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableStatus')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableScore')}</th>
                  <th className="py-2 pr-3">{t('dashboard.history.tableDate')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{r.imei}</td>
                    <td className="py-2 pr-3">
                      <Badge className={imeiStatusClass(r.status)}>{imeiStatusLabel(t, r.status)}</Badge>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{r.score.toFixed(2)}</td>
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
