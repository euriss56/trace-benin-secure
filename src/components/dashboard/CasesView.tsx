import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
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
import { useDebounce } from '@/hooks/useDebounce';

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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

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

  // Filtrage 100% client + memoisé : aucun re-fetch quand l'utilisateur tape ou change le statut.
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.reference?.toLowerCase().includes(q) ||
        r.imei?.toLowerCase().includes(q) ||
        r.brand?.toLowerCase().includes(q) ||
        r.model?.toLowerCase().includes(q) ||
        r.quartier?.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, debouncedSearch]);

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

      <div className="space-y-4">
        {/* Toolbar sticky : reste accessible pendant le scroll, surtout sur mobile. */}
        <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold sm:text-lg">{t('dashboard.cases.title')}</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-[220px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('dashboard.cases.searchPlaceholder', { defaultValue: 'Rechercher IMEI, réf…' })}
                  className="h-9 pl-8"
                  inputMode="search"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as Status | 'all')}>
                <SelectTrigger className="h-9 w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.cases.filterAll')}</SelectItem>
                  <SelectItem value="declared">{t('dashboard.cases.statusDeclared')}</SelectItem>
                  <SelectItem value="in_progress">{t('dashboard.cases.statusInProgress')}</SelectItem>
                  <SelectItem value="resolved">{t('dashboard.cases.statusResolved')}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportCsv} variant="outline" size="sm" className="h-9 w-full sm:w-auto">
                <Download className="mr-1 h-4 w-4" />CSV
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
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
                          <SelectTrigger className="h-8 w-full min-w-[140px] text-xs sm:w-[150px]"><SelectValue /></SelectTrigger>
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
    </div>
  );
}
