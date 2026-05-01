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
import { imeiStatusVariant, imeiStatusLabel } from '@/lib/status-style';
import { TableSkeleton } from '@/components/ui/loaders';

const LIMIT = 20;

export function RecentVerifications() {
  const { user, role } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const blocked = role === 'enqueteur' || role === 'admin';

  useEffect(() => {
    if (blocked) { setLoading(false); return; }
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
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
  }, [user, blocked]);

  if (blocked) return null;

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
          <TableSkeleton rows={5} columns={4} />
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('dashboard.history.empty')}{' '}
            <Link to="/verify" className="text-primary underline">
              {t('dashboard.history.verifyLink')}
            </Link>
            .
          </div>
        ) : (
          <>
            {/* Tableau desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="pb-2 pr-4 font-medium">IMEI</th>
                    <th className="pb-2 pr-4 font-medium">Statut</th>
                    <th className="pb-2 pr-4 font-medium">Score</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-mono text-xs">{r.imei}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={imeiStatusVariant(r.status)}>
                          {imeiStatusLabel(t, r.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{r.score.toFixed(2)}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(i18n.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="flex flex-col gap-3 sm:hidden">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-foreground truncate">{r.imei}</span>
                    <Badge variant={imeiStatusVariant(r.status)}>
                      {imeiStatusLabel(t, r.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Score : <span className="tabular-nums font-semibold text-foreground">{r.score.toFixed(2)}</span></span>
                    <span>{new Date(r.created_at).toLocaleString(i18n.language)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
