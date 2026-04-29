import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { InvestigatorCharts } from './InvestigatorCharts';
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

type Status = DeclarationStatus;

interface CaseRow {
  id: string;
  reference: string;
  brand: string;
  model: string;
  imei: string;
  quartier: string;
  description: string | null;
  status: Status;
  stolen_at: string;
  created_at: string;
  user_id: string;
}

export function CasesView() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const load = () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('declarations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) toast.error(t('dashboard.cases.loadError'), { description: error.message });
        setRows((data ?? []) as CaseRow[]);
        setLoading(false);
      });
  };

  useEffect(load, [t]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from('declarations').update({ status }).eq('id', id);
    if (error) {
      toast.error(t('dashboard.cases.updateError'), { description: error.message });
      return;
    }
    toast.success(t('dashboard.cases.updateSuccess'));
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const exportCsv = () => {
    if (filtered.length === 0) { toast.info(t('dashboard.cases.nothingToExport')); return; }
    const header = ['reference', 'imei', 'brand', 'model', 'quartier', 'status', 'stolen_at', 'created_at'];
    const csv = [
      header.join(','),
      ...filtered.map((r) =>
        header.map((k) => JSON.stringify((r as unknown as Record<string, unknown>)[k] ?? '')).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceimei-bj-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <InvestigatorCharts />
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t('dashboard.cases.title')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as Status | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.cases.filterAll')}</SelectItem>
                <SelectItem value="declared">{t('dashboard.cases.statusDeclared')}</SelectItem>
                <SelectItem value="in_progress">{t('dashboard.cases.statusInProgress')}</SelectItem>
                <SelectItem value="resolved">{t('dashboard.cases.statusResolved')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCsv} variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('dashboard.cases.empty')}</div>
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableHeaderCell>{t('dashboard.cases.tableRef')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.cases.tableImei')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.cases.tableDevice')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.cases.tableQuartier')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.cases.tableStatus')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.cases.tableAction')}</DataTableHeaderCell>
              </DataTableHeader>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.id}>
                    <DataTableCell className="font-mono text-xs">{r.reference}</DataTableCell>
                    <DataTableCell className="font-mono text-xs">{r.imei}</DataTableCell>
                    <DataTableCell>{r.brand} {r.model}</DataTableCell>
                    <DataTableCell>{r.quartier}</DataTableCell>
                    <DataTableCell>
                      <Badge variant={declarationStatusVariant(r.status)}>{declarationStatusLabel(t, r.status)}</Badge>
                    </DataTableCell>
                    <DataTableCell>
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Status)}>
                        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="declared">{t('dashboard.cases.statusDeclared')}</SelectItem>
                          <SelectItem value="in_progress">{t('dashboard.cases.statusInProgress')}</SelectItem>
                          <SelectItem value="resolved">{t('dashboard.cases.statusResolved')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
