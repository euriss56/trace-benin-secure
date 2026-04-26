import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, Users, Search, FileWarning, Target, WifiOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { MlMetricsWidget } from './MlMetricsWidget';
import { pingMlApi } from '@/services/mlService';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Globals {
  totalUsers: number;
  totalVerifs: number;
  totalDecls: number;
  stolenCount: number;
  suspectCount: number;
  legitimateCount: number;
}

const ML_TARGET = 0.85;

export function MetricsView() {
  const { t } = useTranslation();
  const [g, setG] = useState<Globals>({
    totalUsers: 0, totalVerifs: 0, totalDecls: 0,
    stolenCount: 0, suspectCount: 0, legitimateCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [aucRoc, setAucRoc] = useState<number | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from('user_roles').select('user_id', { count: 'exact', head: true }),
      supabase.from('verifications').select('id', { count: 'exact', head: true }),
      supabase.from('declarations').select('id', { count: 'exact', head: true }),
      supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'stolen'),
      supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'suspect'),
      supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'legitimate'),
    ]).then(([u, v, d, s, su, l]) => {
      setG({
        totalUsers: u.count ?? 0,
        totalVerifs: v.count ?? 0,
        totalDecls: d.count ?? 0,
        stolenCount: s.count ?? 0,
        suspectCount: su.count ?? 0,
        legitimateCount: l.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  // Fetch real AUC-ROC from /api/health
  useEffect(() => {
    let cancelled = false;
    pingMlApi().then((h) => {
      if (cancelled) return;
      setApiOk(h.ok);
      setAucRoc(h.auc_roc);
      setApiLatency(h.response_time_ms);
    });
    return () => { cancelled = true; };
  }, []);

  const hasAuc = aucRoc !== null;
  const aucDisplay = hasAuc ? aucRoc! : 0;
  const belowTarget = hasAuc ? aucRoc! < ML_TARGET : false;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.metrics.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('dashboard.metrics.subtitle')}</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Activity className="h-3 w-3" />
          Données temps réel
        </Badge>
      </header>

      {/* KPIs principaux */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Activité globale
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Kpi
            icon={Users}
            label={t('dashboard.metrics.users')}
            value={loading ? '…' : g.totalUsers.toLocaleString('fr-FR')}
            tone="primary"
          />
          <Kpi
            icon={Search}
            label={t('dashboard.metrics.verifications')}
            value={loading ? '…' : g.totalVerifs.toLocaleString('fr-FR')}
            tone="success"
          />
          <Kpi
            icon={FileWarning}
            label={t('dashboard.metrics.declarations')}
            value={loading ? '…' : g.totalDecls.toLocaleString('fr-FR')}
            tone="warning"
          />
        </div>
      </section>

      {/* Module ML — composant dédié */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Détection IA
        </h2>
        <MlMetricsWidget />
      </section>

      {/* Performance modèle */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Performance du modèle
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {t('dashboard.metrics.mlTitle')}
              </span>
              <div className="flex items-center gap-2">
                {apiOk === true ? (
                  <Badge className="gap-1 bg-success text-success-foreground">
                    <Activity className="h-3 w-3" />
                    API connectée ✅{apiLatency !== null ? ` · ${apiLatency}ms` : ''}
                  </Badge>
                ) : apiOk === false ? (
                  <Badge variant="destructive" className="gap-1">
                    <WifiOff className="h-3 w-3" /> API non connectée
                  </Badge>
                ) : (
                  <Badge variant="outline">Vérification…</Badge>
                )}
                {hasAuc && (
                  <Badge
                    variant={belowTarget ? 'destructive' : 'default'}
                    className={cn(!belowTarget && 'bg-success text-success-foreground')}
                  >
                    {belowTarget ? "Sous l'objectif" : 'Objectif atteint'}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium">{t('dashboard.metrics.auc')}</span>
                <span className="tabular-nums font-bold text-lg">
                  {hasAuc ? aucDisplay.toFixed(3) : '—'}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-500 ${belowTarget ? 'bg-destructive' : 'bg-success'}`}
                  style={{ width: `${aucDisplay * 100}%` }}
                />
                {/* Marqueur de cible */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/40"
                  style={{ left: `${ML_TARGET * 100}%` }}
                  aria-label={`Objectif ${ML_TARGET}`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>0.00</span>
                <span className="font-medium">↑ Cible {ML_TARGET}</span>
                <span>1.00</span>
              </div>
            </div>

            {!hasAuc && apiOk === false && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertTitle>API ML indisponible</AlertTitle>
                <AlertDescription>
                  L'AUC-ROC sera affiché dès que l'endpoint <code>/api/health</code> répondra.
                </AlertDescription>
              </Alert>
            )}

            {hasAuc && belowTarget && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('dashboard.metrics.belowTitle')}</AlertTitle>
                <AlertDescription>
                  {t('dashboard.metrics.belowDesc', { value: ML_TARGET })}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2">
              <Mini label={t('dashboard.metrics.legitimate')} value={g.legitimateCount} color="bg-success" />
              <Mini label={t('dashboard.metrics.suspect')} value={g.suspectCount} color="bg-warning" />
              <Mini label={t('dashboard.metrics.stolen')} value={g.stolenCount} color="bg-destructive" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success' ? 'text-success bg-success/10'
    : tone === 'warning' ? 'text-warning bg-warning/10'
    : 'text-primary bg-primary/10';
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">{label}</div>
          </div>
          <div className={cn('rounded-lg p-2', toneClass)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value.toLocaleString('fr-FR')}</div>
    </div>
  );
}
