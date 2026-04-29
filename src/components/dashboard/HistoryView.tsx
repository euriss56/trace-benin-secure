import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function HistoryView() {
  const { user, role } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Garde-fou frontend : enquêteur/admin n'ont pas d'historique IMEI personnel.
  const blocked = role === 'enqueteur' || role === 'admin';

  useEffect(() => {
    if (blocked) { setLoading(false); return; }
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
  }, [user, blocked]);

  if (blocked) return <Navigate to="/dashboard" replace />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t('dashboard.history.empty')} <a href="/verify" className="text-primary underline">{t('dashboard.history.verifyLink')}</a>.
          </div>
        ) : (
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell>{t('dashboard.history.tableImei')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableStatus')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableScore')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.history.tableTime')}</DataTableHeaderCell>
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
                  <DataTableCell className="tabular-nums text-xs text-muted-foreground">{r.response_time_ms} ms</DataTableCell>
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
