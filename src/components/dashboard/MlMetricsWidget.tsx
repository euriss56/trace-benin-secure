import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Cpu, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { getMlAvailability, pingMlApi, subscribeMlStatus } from "@/services/mlService";
import { cn } from "@/lib/utils";

interface Stats {
  count: number;
  avgScore: number;
  legitimePct: number;
  suspectPct: number;
  volePct: number;
  suspect24hPct: number;
}

const ALERT_THRESHOLD = 0.2;

export function MlMetricsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiUp, setApiUp] = useState<boolean | null>(getMlAvailability());

  useEffect(() => {
    const unsub = subscribeMlStatus(setApiUp);
    pingMlApi();
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function load() {
      // 100 dernières vérifications (toutes confondues)
      const { data: last100 } = await supabase
        .from("verifications")
        .select("status, score, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      const rows = last100 ?? [];
      const count = rows.length;
      const avgScore = count > 0
        ? rows.reduce((s, r: any) => s + (typeof r.score === "number" ? r.score : 0), 0) / count
        : 0;

      const legit = rows.filter((r: any) => r.status === "legitimate" || r.status === "legitime").length;
      const susp = rows.filter((r: any) => r.status === "suspect").length;
      const stol = rows.filter((r: any) => r.status === "stolen" || r.status === "vole").length;

      // Vérifs des 24 dernières heures
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
        legitimePct: count ? legit / count : 0,
        suspectPct: count ? susp / count : 0,
        volePct: count ? stol / count : 0,
        suspect24hPct,
      });
      setLoading(false);
    }

    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Module Machine Learning
          </span>
          {apiUp === true ? (
            <Badge className="gap-1 bg-success text-success-foreground">
              <Activity className="h-3 w-3" /> API connectée
            </Badge>
          ) : apiUp === false ? (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> API déconnectée
            </Badge>
          ) : (
            <Badge variant="outline">Vérification…</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement des métriques…</div>
        ) : !stats || stats.count === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucune vérification enregistrée pour le moment.
          </div>
        ) : (
          <>
            {stats.suspect24hPct > ALERT_THRESHOLD && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerte — Activité suspecte élevée</AlertTitle>
                <AlertDescription>
                  {(stats.suspect24hPct * 100).toFixed(1)}% des vérifications des 24 dernières heures
                  sont marquées comme suspectes (seuil : {ALERT_THRESHOLD * 100}%).
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Score moyen (100 dernières)"
                value={stats.avgScore.toFixed(2)}
                hint={`sur ${stats.count} vérifications`}
              />
              <Stat
                label="Suspect 24h"
                value={`${(stats.suspect24hPct * 100).toFixed(1)}%`}
                hint={`alerte si > ${ALERT_THRESHOLD * 100}%`}
                accent={stats.suspect24hPct > ALERT_THRESHOLD ? "danger" : "default"}
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">Répartition (100 dernières)</div>
              <Distribution
                legitime={stats.legitimePct}
                suspect={stats.suspectPct}
                vole={stats.volePct}
              />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Legend dot="bg-success" label="Légitime" pct={stats.legitimePct} />
                <Legend dot="bg-warning" label="Suspect" pct={stats.suspectPct} />
                <Legend dot="bg-destructive" label="Volé" pct={stats.volePct} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
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
      <div className="bg-success h-full" style={{ width: `${legitime * 100}%` }} />
      <div className="bg-warning h-full" style={{ width: `${suspect * 100}%` }} />
      <div className="bg-destructive h-full" style={{ width: `${vole * 100}%` }} />
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
