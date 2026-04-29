import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { declarationStatusVariant, declarationStatusLabel, type DeclarationStatus } from '@/lib/status-style';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/ui/loaders';

interface DeclRow {
  id: string;
  reference: string;
  brand: string;
  model: string;
  imei: string;
  quartier: string;
  status: DeclarationStatus;
  created_at: string;
}

export function MyDeclarationsView() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<DeclRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from('declarations')
      .select('id, reference, brand, model, imei, quartier, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as DeclRow[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard.declarations.title')}</CardTitle>
        <Button asChild size="sm">
          <Link to="/declare"><Plus className="mr-1 h-4 w-4" />{t('dashboard.declarations.newButton')}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('dashboard.declarations.empty')}</div>
        ) : (
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell>{t('dashboard.declarations.tableRef')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.declarations.tableDevice')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.declarations.tableImei')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.declarations.tableQuartier')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.declarations.tableStatus')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.declarations.tableDate')}</DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {rows.map((r) => (
                <DataTableRow key={r.id}>
                  <DataTableCell className="font-mono text-xs">{r.reference}</DataTableCell>
                  <DataTableCell>{r.brand} {r.model}</DataTableCell>
                  <DataTableCell className="font-mono text-xs">{r.imei}</DataTableCell>
                  <DataTableCell>{r.quartier}</DataTableCell>
                  <DataTableCell>
                    <Badge variant={declarationStatusVariant(r.status)}>{declarationStatusLabel(t, r.status)}</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString(i18n.language)}
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
