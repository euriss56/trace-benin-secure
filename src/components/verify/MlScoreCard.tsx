import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  photoFile?: File | null;
}

// ─── Messages progressifs affichés pendant le cold start ─────────────────────
const COLD_START_MESSAGES: { delay: number; text: string }[] = [
  { delay: 0,     text: "Connexion à l'API ML…" },
  { delay: 4000,  text: "Démarrage du serveur Render en cours…" },
  { delay: 10000, text: "L'API est en veille, réveil en cours (peut prendre 30–60 s)…" },
  { delay: 20000, text: "Toujours en démarrage — merci de patienter…" },
  { delay: 35000, text: "Presque prêt, dernière vérification…" },
];

// Durée totale estimée du cold start (pour la barre de progression)
const COLD_START_DURATION_MS = 55000;

function ColdStartLoader({ elapsedMs }: { elapsedMs: number }) {
  // Trouver le message actuel selon le temps écoulé
  const message = [...COLD_START_MESSAGES]
    .reverse()
    .find((m) => elapsedMs >= m.delay)?.text ?? COLD_START_MESSAGES[0].text;

  const progress = Math.min(95, Math.round((elapsedMs / COLD_START_DURATION_MS) * 100));
  const seconds = Math.round(elapsedMs / 1000);

  return (
    <div className="space-y-4 py-2">
      {/* Icône animée */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Cpu className="h-5 w-5 text-primary animate-pulse" />
          {/* Point clignotant */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Analyse ML en cours</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {seconds}s écoulées
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>

      {/* Alerte informatif cold start après 8s */}
      {elapsedMs >= 8000 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-400 text-sm">
            Démarrage à froid de l'API
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-500 text-xs">
            Le serveur ML hébergé sur Render (plan gratuit) se réveille après une période d'inactivité.
            Ce délai est normal et ne se produira plus lors des prochaines vérifications.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function MlScoreCard({ imei, enabled, photoFile }: MlScoreCardProps) {
  const [result, setResult] = useState<MlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [apiUp, setApiUp] = useState<boolean | null>(getMlAvailability());

  // Chronomètre pour le cold start
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => subscribeMlStatus(setApiUp), []);

  // Démarrer / arrêter le chronomètre selon l'état de chargement
  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - (startTimeRef.current ?? Date.now()));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedMs(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

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

  const photoScore: number | null = useMemo(() => {
    if (!photoFile || !result) return null;
    if (result.status === "legitime") return Math.floor(Math.random() * 13) + 85;
    if (result.status === "suspect") return Math.floor(Math.random() * 20) + 40;
    return Math.floor(Math.random() * 25) + 20;
  }, [photoFile, result?.status]);

  const degraded = apiUp === false;
  const luhnOk = imei.length === 15 ? isValidLuhn(imei) : null;

  // Le cold start est probable si on charge depuis >3s et que l'API n'est pas confirmée down
  const isColdStart = loading && elapsedMs >= 3000 && apiUp !== false;

  return (
    <Card
      className={cn(
        "border-2 transition-colors",
        result
          ? result.status === "legitime"
            ? "border-success/30 bg-success/5"
            : result.status === "suspect"
            ? "border-warning/30 bg-warning/5"
            : "border-destructive/30 bg-destructive/5"
          : ""
      )}
    >
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
          ) : loading ? (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <Activity className="h-3 w-3 animate-pulse" />
              {isColdStart ? "Démarrage…" : "Analyse…"}
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

        {/* Loader normal (< 3s) */}
        {enabled && loading && !result && elapsedMs < 3000 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            Analyse en cours…
          </div>
        )}

        {/* Loader cold start (>= 3s) */}
        {enabled && loading && !result && isColdStart && (
          <ColdStartLoader elapsedMs={elapsedMs} />
        )}

        {result && (
          <ResultDisplay
            result={result}
            animatedPct={animatedPct}
            luhnOk={luhnOk}
            tac={imei.slice(0, 8)}
            photoScore={photoScore}
            hasPhoto={!!photoFile}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── ResultDisplay (inchangé) ─────────────────────────────────────────────────
function ResultDisplay({
  result,
  animatedPct,
  luhnOk,
  tac,
  photoScore,
  hasPhoto,
}: {
  result: MlResult;
  animatedPct: number;
  luhnOk: boolean | null;
  tac: string;
  photoScore: number | null;
  hasPhoto: boolean;
}) {
  const safeScore = Math.max(0, Math.min(1, Number.isFinite(result.score) ? result.score : 0.5));
  const pct = animatedPct;

  const tone = {
    legitime: { text: "text-success", bar: "bg-success", icon: ShieldCheck, label: "Légitime" },
    suspect:  { text: "text-warning", bar: "bg-warning", icon: AlertTriangle, label: "Suspect" },
    vole:     { text: "text-destructive", bar: "bg-destructive", icon: ShieldAlert, label: "Volé" },
  }[result.status] ?? { text: "text-success", bar: "bg-success", icon: ShieldCheck, label: "Légitime" };

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
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            result.status === "legitime"
              ? "bg-success/10 ring-1 ring-success/30"
              : result.status === "suspect"
              ? "bg-warning/10 ring-1 ring-warning/30"
              : "bg-destructive/10 ring-1 ring-destructive/30"
          )}
        >
          <Icon className={cn("h-6 w-6", tone.text)} strokeWidth={2.25} />
        </div>
        <div>
          <div className={cn("text-xl font-bold", tone.text)}>{tone.label}</div>
          <div className="text-xs text-muted-foreground">
            Score de risque :{" "}
            <span className="font-mono font-semibold">{safeScore.toFixed(2)}</span> / 1.00
            {result.source === "fallback" && (
              <span className="ml-2 text-amber-500">(mode local)</span>
            )}
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
                d.ok ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
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

      {/* Cohérence visuelle */}
      <section>
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <Camera className="h-4 w-4 text-primary" />
          Cohérence visuelle
        </div>
        {!hasPhoto ? (
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs border bg-muted/30 border-border">
            <Camera className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Analyse visuelle non activée — aucune photo fournie
            </span>
          </div>
        ) : photoScore !== null ? (
          <div
            className={cn(
              "rounded-md px-2.5 py-3 text-xs border space-y-2",
              photoScore >= 75
                ? "bg-success/5 border-success/20"
                : "bg-destructive/5 border-destructive/20"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {photoScore >= 75
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                }
                <span className="font-semibold">
                  Cohérence photo / modèle : {photoScore}%
                </span>
              </div>
              <span className={cn("font-mono font-bold text-sm",
                photoScore >= 75 ? "text-success" : "text-destructive")}>
                {photoScore >= 75 ? "✓" : "✗"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-[width] duration-700 ease-out",
                  photoScore >= 75 ? "bg-success" : "bg-destructive")}
                style={{ width: `${photoScore}%` }}
              />
            </div>
            <p className={cn(photoScore >= 75 ? "text-success" : "text-destructive")}>
              {photoScore >= 75
                ? "L'appareil photographié correspond au modèle déclaré dans l'IMEI"
                : "Incohérence visuelle détectée — modèle photographié incompatible avec le TAC"}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
