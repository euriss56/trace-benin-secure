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
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/ui/data-table';
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
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell>{t('dashboard.history.tableImei')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableStatus')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableScore')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableDate')}</DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {rows.map((r) => (
                <DataTableRow key={r.id}>
                  <DataTableCell className="font-mono text-xs">{r.imei}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={imeiStatusVariant(r.status)}>{imeiStatusLabel(t, r.status)}</Badge>
                  </DataTableCell>
                  <DataTableCell className="tabular-nums">{r.score.toFixed(2)}</DataTableCell>
                  <DataTableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString(i18n.language)}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}
