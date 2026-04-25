import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Cpu, Gauge, RefreshCw, ShieldCheck, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { getMlAvailability, pingMlApi, subscribeMlStatus } from "@/services/mlService";
import { cn } from "@/lib/utils";

interface Stats {
  count: number;
  avgScore: number;
  medianScore: number;
  legitimePct: number;
  suspectPct: number;
  volePct: number;
  suspect24hPct: number;
  total24h: number;
  highRiskCount: number;       // score >= 0.8 sur 100 dernières
  lastCheckAt: string | null;
}

const ALERT_THRESHOLD = 0.2;

export function MlMetricsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiUp, setApiUp] = useState<boolean | null>(getMlAvailability());
  const [pingMs, setPingMs] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeMlStatus(setApiUp);
    handlePing();
    return () => { unsub(); };
  }, []);

  async function handlePing() {
    const t0 = performance.now();
    await pingMlApi();
    setPingMs(Math.round(performance.now() - t0));
  }

  async function loadStats() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data: last100 } = await supabase
      .from("verifications")
      .select("status, score, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const rows = last100 ?? [];
    const count = rows.length;
    const scores = rows
      .map((r: any) => (typeof r.score === "number" ? r.score : null))
      .filter((s): s is number => s !== null);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const medianScore = sorted.length
      ? sorted[Math.floor(sorted.length / 2)]
      : 0;

    const legit = rows.filter((r: any) => r.status === "legitimate" || r.status === "legitime").length;
    const susp = rows.filter((r: any) => r.status === "suspect").length;
    const stol = rows.filter((r: any) => r.status === "stolen" || r.status === "vole").length;
    const highRisk = scores.filter((s) => s >= 0.8).length;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: last24h } = await supabase
      .from("verifications")
      .select("status")
      .gte("created_at", since);
    const r24 = last24h ?? [];
    const susp24 = r24.filter((r: any) => r.status === "suspect").length;
    const suspect24hPct = r24.length > 0 ? susp24 / r24.length : 0;

    setStats({
      count,
      avgScore,
      medianScore,
      legitimePct: count ? legit / count : 0,
      suspectPct: count ? susp / count : 0,
      volePct: count ? stol / count : 0,
      suspect24hPct,
      total24h: r24.length,
      highRiskCount: highRisk,
      lastCheckAt: rows[0]?.created_at ?? null,
    });
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadStats(), handlePing()]);
    setRefreshing(false);
  }

  const alert = stats && stats.suspect24hPct > ALERT_THRESHOLD;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Module Machine Learning
          </span>
          <div className="flex items-center gap-2">
            <ApiBadge apiUp={apiUp} pingMs={pingMs} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Rafraîchir"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement des métriques…</div>
        ) : !stats || stats.count === 0 ? (
          <EmptyState />
        ) : (
          <>
            {alert && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Activité suspecte élevée — 24 dernières heures</AlertTitle>
                <AlertDescription>
                  {(stats.suspect24hPct * 100).toFixed(1)}% des {stats.total24h} vérifications
                  enregistrées dépassent le seuil critique ({ALERT_THRESHOLD * 100}%).
                  Vérifier les logs investigateur.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="text-xs">
                  <Gauge className="h-3.5 w-3.5 mr-1.5" /> Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Distribution
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label="Score moyen"
                    value={stats.avgScore.toFixed(2)}
                    hint={`médiane ${stats.medianScore.toFixed(2)} · n=${stats.count}`}
                  />
                  <Stat
                    label="Suspect 24h"
                    value={`${(stats.suspect24hPct * 100).toFixed(1)}%`}
                    hint={`${stats.total24h} vérifs · seuil ${ALERT_THRESHOLD * 100}%`}
                    accent={alert ? "danger" : "default"}
                  />
                  <Stat
                    label="Risque élevé"
                    value={String(stats.highRiskCount)}
                    hint="score ≥ 0.80 (100 dernières)"
                    accent={stats.highRiskCount > 20 ? "danger" : "default"}
                  />
                  <Stat
                    label="Dernière vérif"
                    value={stats.lastCheckAt
                      ? new Date(stats.lastCheckAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—"
                    }
                    hint={stats.lastCheckAt
                      ? new Date(stats.lastCheckAt).toLocaleDateString("fr-FR")
                      : "Aucune"
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-3 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2">
                    Répartition des statuts (100 dernières vérifications)
                  </div>
                  <Distribution
                    legitime={stats.legitimePct}
                    suspect={stats.suspectPct}
                    vole={stats.volePct}
                  />
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <Legend dot="bg-success" label="Légitime" pct={stats.legitimePct} />
                    <Legend dot="bg-warning" label="Suspect" pct={stats.suspectPct} />
                    <Legend dot="bg-destructive" label="Volé" pct={stats.volePct} />
                  </div>
                </div>

                <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Lecture du score
                  </div>
                  <div className="text-muted-foreground leading-relaxed">
                    Tous les scores sont garantis dans l'intervalle [0.00 – 1.00].
                    En cas d'indisponibilité de l'API, un calcul local par heuristiques
                    (Luhn, motifs, TAC) prend le relais, marqué « fallback » dans les détails.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ApiBadge({ apiUp, pingMs }: { apiUp: boolean | null; pingMs: number | null }) {
  if (apiUp === true) {
    return (
      <Badge className="gap-1 bg-success text-success-foreground">
        <Activity className="h-3 w-3" />
        API connectée{pingMs !== null ? ` · ${pingMs}ms` : ""}
      </Badge>
    );
  }
  if (apiUp === false) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" /> Mode dégradé
      </Badge>
    );
  }
  return <Badge variant="outline">Vérification…</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <Cpu className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="text-sm font-medium">Aucune vérification enregistrée</div>
      <div className="text-xs text-muted-foreground mt-1">
        Les métriques apparaîtront dès la première vérification effectuée.
      </div>
    </div>
  );
}

function Stat({
  label, value, hint, accent = "default",
}: {
  label: string; value: string; hint?: string; accent?: "default" | "danger";
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold tabular-nums", accent === "danger" && "text-destructive")}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function Distribution({ legitime, suspect, vole }: { legitime: number; suspect: number; vole: number }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
      <div className="bg-success h-full transition-all" style={{ width: `${legitime * 100}%` }} />
      <div className="bg-warning h-full transition-all" style={{ width: `${suspect * 100}%` }} />
      <div className="bg-destructive h-full transition-all" style={{ width: `${vole * 100}%` }} />
    </div>
  );
}

function Legend({ dot, label, pct }: { dot: string; label: string; pct: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono font-semibold">{(pct * 100).toFixed(0)}%</span>
    </div>
  );
}
