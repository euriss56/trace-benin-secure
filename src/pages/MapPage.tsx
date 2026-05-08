import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, MapPin, Filter, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import {
  COTONOU_QUARTIERS,
  QUARTIER_CENTROIDS,
  type Quartier,
} from '@/lib/quartiers';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Period = '7' | '30' | '90' | 'all';
type Status = 'all' | 'declared' | 'in_progress' | 'resolved';

interface DeclarationRow {
  id: string;
  reference: string;
  brand: string;
  model: string;
  imei: string;
  quartier: string;
  status: 'declared' | 'in_progress' | 'resolved';
  stolen_at: string;
  created_at: string;
}

const COTONOU_CENTER: [number, number] = [6.3654, 2.4183];

export default function MapPage() {
  const { user, role, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<DeclarationRow[]>([]);
  const [period, setPeriod] = useState<Period>('30');
  const [status, setStatus] = useState<Status>('all');
  const [quartier, setQuartier] = useState<Quartier | 'all'>('all');
  const [fetching, setFetching] = useState(false);

  const canSee = role === 'enqueteur' || role === 'admin';

  useEffect(() => {
    if (!user || !canSee || !isSupabaseConfigured) return;
    setFetching(true);
    supabase
      .from('declarations')
      .select('id, reference, brand, model, imei, quartier, status, stolen_at, created_at')
      .order('created_at', { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (error) {
          toast.error(t('map.loadError'), { description: error.message });
        } else {
          setRows((data ?? []) as DeclarationRow[]);
        }
        setFetching(false);
      });
  }, [user, canSee, t]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = period === 'all' ? 0 : now - parseInt(period, 10) * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (quartier !== 'all' && r.quartier !== quartier) return false;
      if (period !== 'all') {
        const ts = new Date(r.created_at).getTime();
        if (ts < cutoff) return false;
      }
      return true;
    });
  }, [rows, period, status, quartier]);

  const grouped = useMemo(() => {
    const map = new Map<string, DeclarationRow[]>();
    for (const r of filtered) {
      if (!QUARTIER_CENTROIDS[r.quartier as Quartier]) continue;
      const arr = map.get(r.quartier) ?? [];
      arr.push(r);
      map.set(r.quartier, arr);
    }
    return map;
  }, [filtered]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.info(t('map.nothingToExport'));
      return;
    }
    const header = ['reference', 'imei', 'brand', 'model', 'quartier', 'status', 'stolen_at', 'created_at'];
    const lines = [
      header.join(','),
      ...filtered.map((r) =>
        header.map((k) => JSON.stringify((r as unknown as Record<string, unknown>)[k] ?? '')).join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceimei-bj-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!canSee) return <Navigate to="/" replace />;

  const statusColor = (s: DeclarationRow['status']) =>
    s === 'resolved' ? 'bg-success text-success-foreground'
    : s === 'in_progress' ? 'bg-warning text-warning-foreground'
    : 'bg-destructive text-destructive-foreground';

  const statusText = (s: DeclarationRow['status']) =>
    s === 'declared' ? t('map.statusDeclared')
    : s === 'in_progress' ? t('map.statusInProgress')
    : t('map.statusResolved');

  return (
    <>
      <Helmet>
        <title>{t('map.metaTitle')}</title>
        <meta name="description" content={t('map.metaDescription')} />
      </Helmet>

      <div className="container py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />
              {t('map.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('map.subtitle')}</p>
          </div>
          <Button onClick={exportCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('map.exportCsv', { count: filtered.length })}
          </Button>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('map.filters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('map.period')}</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('map.period7')}</SelectItem>
                  <SelectItem value="30">{t('map.period30')}</SelectItem>
                  <SelectItem value="90">{t('map.period90')}</SelectItem>
                  <SelectItem value="all">{t('map.periodAll')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('map.statusLabel')}</label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('map.statusAll')}</SelectItem>
                  <SelectItem value="declared">{t('map.statusDeclared')}</SelectItem>
                  <SelectItem value="in_progress">{t('map.statusInProgress')}</SelectItem>
                  <SelectItem value="resolved">{t('map.statusResolved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('map.quartierLabel')}</label>
              <Select value={quartier} onValueChange={(v) => setQuartier(v as Quartier | 'all')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('map.quartierAll')}</SelectItem>
                  {COTONOU_QUARTIERS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden isolate relative z-0">
          <CardContent className="p-0">
            <div className="h-[60vh] w-full relative z-0">
              <MapContainer
                center={COTONOU_CENTER}
                zoom={13}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {Array.from(grouped.entries()).map(([q, items]) => {
                  const c = QUARTIER_CENTROIDS[q as Quartier];
                  if (!c) return null;
                  const radius = Math.min(8 + items.length * 2, 32);
                  return (
                    <CircleMarker
                      key={q}
                      center={[c.lat, c.lng]}
                      radius={radius}
                      pathOptions={{
                        color: 'hsl(var(--destructive))',
                        fillColor: 'hsl(var(--destructive))',
                        fillOpacity: 0.5,
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                        <strong>{q}</strong> — {t('map.tooltipReports', { count: items.length })}
                      </Tooltip>
                      <Popup maxHeight={200}>
                        <div className="text-sm">
                          <div className="font-semibold mb-1">{q}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {t('map.tooltipReports', { count: items.length })}
                          </div>
                          <ul className="space-y-1 max-h-32 overflow-auto">
                            {items.slice(0, 8).map((it) => (
                              <li key={it.id} className="text-xs">
                                <span className="font-mono">{it.reference}</span> · {it.brand} {it.model}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('map.detail', { count: filtered.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('map.noResults')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">{t('map.tableRef')}</th>
                      <th className="py-2 pr-3">{t('map.tableDevice')}</th>
                      <th className="py-2 pr-3">{t('map.tableQuartier')}</th>
                      <th className="py-2 pr-3">{t('map.tableStatus')}</th>
                      <th className="py-2 pr-3">{t('map.tableDeclaredOn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 100).map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs">{r.reference}</td>
                        <td className="py-2 pr-3">{r.brand} {r.model}</td>
                        <td className="py-2 pr-3">{r.quartier}</td>
                        <td className="py-2 pr-3">
                          <Badge className={statusColor(r.status)}>{statusText(r.status)}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString(i18n.language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 100 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {t('map.limitNotice')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          <p>{t('map.legalNotice')}</p>
        </div>
      </div>
    </>
  );
}
