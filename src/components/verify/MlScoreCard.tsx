import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Cpu, ShieldAlert, Smartphone, Timer, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkIMEI, getMlAvailability, subscribeMlStatus, type MlResult } from "@/services/mlService";
import { cn } from "@/lib/utils";

interface MlScoreCardProps {
  imei: string;          // IMEI complet (15 chiffres)
  enabled: boolean;      // Lance le calcul quand passe à true
}

/**
 * Carte affichant le score ML + fabricant + temps de réponse + statut API.
 * Barre tricolore : 0-50% vert, 50-80% orange, 80-100% rouge.
 */
export function MlScoreCard({ imei, enabled }: MlScoreCardProps) {
  const [result, setResult] = useState<MlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUp, setApiUp] = useState<boolean | null>(getMlAvailability());

  useEffect(() => subscribeMlStatus(setApiUp), []);

  useEffect(() => {
    if (!enabled || imei.length !== 15) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    checkIMEI(imei, ctrl.signal)
      .then((r) => setResult(r))
      .catch(() => { /* abort silencieux */ })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [imei, enabled]);

  const degraded = apiUp === false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Analyse Machine Learning
          </span>
          {degraded ? (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> Mode dégradé
            </Badge>
          ) : apiUp ? (
            <Badge variant="default" className="gap-1 bg-success text-success-foreground">
              <Activity className="h-3 w-3" /> ML actif
            </Badge>
          ) : (
            <Badge variant="outline">En attente…</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {degraded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mode dégradé — ML indisponible</AlertTitle>
            <AlertDescription>
              Score calculé localement (Luhn + heuristiques). Précision réduite par rapport au modèle complet.
            </AlertDescription>
          </Alert>
        )}

        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Saisissez un IMEI valide à 15 chiffres pour lancer l'analyse.
          </p>
        )}

        {enabled && loading && !result && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            Analyse en cours…
          </div>
        )}

        {result && <ScoreDisplay result={result} />}
      </CardContent>
    </Card>
  );
}

function ScoreDisplay({ result }: { result: MlResult }) {
  const pct = Math.round(result.score * 100);
  // Couleurs : 0-50% vert, 50-80% orange, 80-100% rouge
  const color =
    pct < 50 ? "bg-success" : pct < 80 ? "bg-warning" : "bg-destructive";
  const textColor =
    pct < 50 ? "text-success" : pct < 80 ? "text-warning" : "text-destructive";

  const StatusIcon =
    result.status === "legitime" ? CheckCircle2
    : result.status === "suspect" ? AlertTriangle
    : ShieldAlert;

  const statusLabel =
    result.status === "legitime" ? "Légitime"
    : result.status === "suspect" ? "Suspect"
    : "Volé";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn("h-8 w-8", textColor)} strokeWidth={2.25} />
        <div>
          <div className={cn("text-xl font-bold", textColor)}>{statusLabel}</div>
          <div className="text-xs text-muted-foreground">
            Score de risque : <span className="font-mono font-semibold">{result.score.toFixed(2)}</span> / 1.00
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 text-muted-foreground">
          <span>Score ML</span>
          <span className="font-mono font-semibold">{pct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Légitime</span>
          <span>Suspect</span>
          <span>Volé</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Smartphone className="h-3.5 w-3.5" /> Fabricant
          </div>
          <div className="font-semibold leading-tight">{result.manufacturer}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{result.model_series}</div>
        </div>
        <div className="rounded-md border bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Timer className="h-3.5 w-3.5" /> Temps de réponse
          </div>
          <div className="font-mono font-semibold">{result.response_time_ms} ms</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Source : {result.source === "api" ? "API ML" : "fallback local"}
          </div>
        </div>
      </div>
    </div>
  );
}
