import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  checkIMEI,
  getMlAvailability,
  subscribeMlStatus,
  type MlResult,
} from "@/services/mlService";
import { isValidLuhn } from "@/lib/luhn";
import { cn } from "@/lib/utils";

interface MlScoreCardProps {
  imei: string;
  enabled: boolean;
}

export function MlScoreCard({ imei, enabled }: MlScoreCardProps) {
  const [result, setResult] = useState<MlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [apiUp, setApiUp] = useState<boolean | null>(getMlAvailability());

  useEffect(() => subscribeMlStatus(setApiUp), []);

  useEffect(() => {
    if (!enabled || imei.length !== 15) {
      setResult(null);
      setAnimatedPct(0);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    checkIMEI(imei, ctrl.signal)
      .then((r) => {
        setResult(r);
        setAnimatedPct(0);
        requestAnimationFrame(() =>
          setAnimatedPct(Math.round(Math.max(0, Math.min(1, r.score)) * 100))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [imei, enabled]);

  const degraded = apiUp === false;

  const luhnOk = imei.length === 15 ? isValidLuhn(imei) : null;
  const tac = imei.slice(0, 8);

  return (
    <Card className={cn(
      "border-2 transition-colors",
      result
        ? result.status === "legitime"
          ? "border-success/30 bg-success/5"
          : result.status === "suspect"
          ? "border-warning/30 bg-warning/5"
          : "border-destructive/30 bg-destructive/5"
        : ""
    )}>
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

      <CardContent className="space-y-5">
        {degraded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mode dégradé — ML indisponible</AlertTitle>
            <AlertDescription>
              Score calculé localement. Précision réduite.
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

        {result && (
          <ResultDisplay
            result={result}
            animatedPct={animatedPct}
            luhnOk={luhnOk}
            tac={tac}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ResultDisplay({
  result,
  animatedPct,
  luhnOk,
  tac,
}: {
  result: MlResult;
  animatedPct: number;
  luhnOk: boolean | null;
  tac: string;
}) {
  const safeScore = Math.max(0, Math.min(1, Number.isFinite(result.score) ? result.score : 0.5));
  const pct = animatedPct;

  const tone = {
    legitime: {
      text: "text-success",
      bar: "bg-success",
      icon: ShieldCheck,
      label: "Légitime",
    },
    suspect: {
      text: "text-warning",
      bar: "bg-warning",
      icon: AlertTriangle,
      label: "Suspect",
    },
    vole: {
      text: "text-destructive",
      bar: "bg-destructive",
      icon: ShieldAlert,
      label: "Volé",
    },
  }[result.status] ?? {
    text: "text-success",
    bar: "bg-success",
    icon: ShieldCheck,
    label: "Légitime",
  };

  const Icon = tone.icon;

  const details = [
    {
      ok: luhnOk === true,
      text: luhnOk ? "Format IMEI valide (Luhn OK)" : "Format IMEI invalide (Luhn KO)",
    },
    {
      ok: result.status !== "vole",
      text: result.status === "vole" ? "Appareil signalé volé" : "Appareil non blacklisté",
    },
    {
      ok: result.status === "legitime",
      text: result.status === "legitime" ? "Activité normale" : "Activité anormale détectée",
    },
    {
      ok: result.manufacturer !== "Inconnu",
      text: result.manufacturer !== "Inconnu"
        ? `TAC reconnu — ${result.manufacturer}`
        : "TAC inconnu — fabricant non identifié",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Label principal */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          result.status === "legitime" ? "bg-success/10 ring-1 ring-success/30"
          : result.status === "suspect" ? "bg-warning/10 ring-1 ring-warning/30"
          : "bg-destructive/10 ring-1 ring-destructive/30"
        )}>
          <Icon className={cn("h-6 w-6", tone.text)} strokeWidth={2.25} />
        </div>
        <div>
          <div className={cn("text-xl font-bold", tone.text)}>{tone.label}</div>
          <div className="text-xs text-muted-foreground">
            Score de risque :{" "}
            <span className="font-mono font-semibold">{safeScore.toFixed(2)}</span> / 1.00
          </div>
        </div>
      </div>

      {/* Barre de score */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 text-muted-foreground">
          <span>Score ML</span>
          <span className="font-mono font-semibold">{pct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full transition-[width] duration-700 ease-out", tone.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Légitime</span>
          <span>Suspect</span>
          <span>Volé</span>
        </div>
      </div>

      {/* Détails */}
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Détails
        </div>
        <ul className="space-y-1.5">
          {details.map((d, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs border",
                d.ok
                  ? "bg-success/5 border-success/20"
                  : "bg-destructive/5 border-destructive/20"
              )}
            >
              {d.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              }
              <span>{d.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
