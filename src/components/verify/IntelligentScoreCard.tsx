import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Smartphone,
  Globe2,
  SimCard,
  KeyRound,
  Activity,
  Clock,
  BarChart3,
  ListChecks,
  Cpu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scoreImei, type ImeiScoreResult, type ImeiLabel } from "@/lib/imei-scoring";
import { cn } from "@/lib/utils";

interface IntelligentScoreCardProps {
  imei: string;
  enabled: boolean;
  blacklist?: boolean;
  activiteSuspecte?: boolean;
}

/**
 * Carte UI consommant scoreImei() — affiche score, raisons, probabilités
 * et features analysées avec animations légères et couleurs dynamiques.
 */
export function IntelligentScoreCard({
  imei,
  enabled,
  blacklist,
  activiteSuspecte,
}: IntelligentScoreCardProps) {
  const result = useMemo<ImeiScoreResult | null>(() => {
    if (!enabled || imei.length !== 15) return null;
    return scoreImei({ imei, blacklist, activiteSuspecte });
  }, [imei, enabled, blacklist, activiteSuspecte]);

  // Animation barre de score (0 → score)
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    if (!result) {
      setAnimatedPct(0);
      return;
    }
    setAnimatedPct(0);
    const id = requestAnimationFrame(() =>
      setAnimatedPct(Math.round(result.score * 100)),
    );
    return () => cancelAnimationFrame(id);
  }, [result]);

  if (!enabled) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Analyse intelligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Saisissez un IMEI valide à 15 chiffres pour lancer l'analyse intelligente.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const tone = toneFor(result.color);
  const Icon = iconFor(result.icon);

  return (
    <Card
      className={cn(
        "animate-fade-in border-2 transition-colors",
        tone.border,
        tone.bgSoft,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Analyse intelligente
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {result.marque} · TAC {result.tac}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* En-tête : label + score */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full ring-1",
              tone.bg,
              tone.ring,
            )}
          >
            <Icon className={cn("h-6 w-6", tone.text)} strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-xl font-bold leading-tight", tone.text)}>
              {labelText(result.label)}
            </div>
            <div className="text-xs text-muted-foreground">
              Score de risque :{" "}
              <span className="font-mono font-semibold">
                {result.score.toFixed(2)}
              </span>{" "}
              / 1.00
            </div>
          </div>
        </div>

        {/* Barre de score animée */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 text-muted-foreground">
            <span>Niveau de risque</span>
            <span className="font-mono font-semibold">{animatedPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full transition-[width] duration-700 ease-out", tone.bar)}
              style={{ width: `${animatedPct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Légitime</span>
            <span>Suspect</span>
            <span>Volé</span>
          </div>
        </div>

        {/* Raisons */}
        <section>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Explications
          </div>
          <ul className="space-y-1.5">
            {result.reason.map((r, i) => {
              const positive =
                r.toLowerCase().includes("aucun") ||
                r.toLowerCase().includes("conforme");
              const RIcon = positive ? CheckCircle2 : AlertTriangle;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs border",
                    positive
                      ? "bg-success/5 border-success/20 text-foreground"
                      : "bg-destructive/5 border-destructive/20 text-foreground",
                  )}
                >
                  <RIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 mt-0.5",
                      positive ? "text-success" : "text-destructive",
                    )}
                  />
                  <span className="leading-snug">{r}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Probabilités */}
        <section>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Probabilités
          </div>
          <div className="space-y-2">
            <ProbabilityBar
              label="Légitime"
              value={result.probabilities.LEGITIME}
              tone="green"
            />
            <ProbabilityBar
              label="Suspect"
              value={result.probabilities.SUSPECT}
              tone="orange"
            />
            <ProbabilityBar
              label="Volé"
              value={result.probabilities.VOLE}
              tone="red"
            />
          </div>
        </section>

        {/* Features analysées */}
        <section>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Activity className="h-4 w-4 text-primary" />
            Analyse technique
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FeatureTile
              icon={SimCard}
              label="Changements SIM"
              value={String(result.features.nbSimChanges)}
            />
            <FeatureTile
              icon={Globe2}
              label="Pays différents"
              value={String(result.features.nbPaysDifferents)}
            />
            <FeatureTile
              icon={Clock}
              label="Fréquence"
              value={result.features.frequenceConnexion}
            />
            <FeatureTile
              icon={KeyRound}
              label="Tentatives déblocage"
              value={String(result.features.tentativesDeblocage)}
            />
            <FeatureTile
              icon={Smartphone}
              label="Âge appareil"
              value={`${result.features.ageAppareil} mois`}
              span2
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

/* ---------------- helpers ---------------- */

function labelText(l: ImeiLabel): string {
  return l === "LEGITIME" ? "Légitime" : l === "SUSPECT" ? "Suspect" : "Volé";
}

function iconFor(icon: ImeiScoreResult["icon"]) {
  if (icon === "shield") return ShieldCheck;
  if (icon === "warning") return AlertTriangle;
  return ShieldAlert;
}

interface Tone {
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  bar: string;
}

function toneFor(color: ImeiScoreResult["color"]): Tone {
  if (color === "green") {
    return {
      text: "text-success",
      bg: "bg-success/10",
      bgSoft: "bg-success/5",
      border: "border-success/30",
      ring: "ring-success/30",
      bar: "bg-success",
    };
  }
  if (color === "orange") {
    return {
      text: "text-warning",
      bg: "bg-warning/10",
      bgSoft: "bg-warning/5",
      border: "border-warning/30",
      ring: "ring-warning/30",
      bar: "bg-warning",
    };
  }
  return {
    text: "text-destructive",
    bg: "bg-destructive/10",
    bgSoft: "bg-destructive/5",
    border: "border-destructive/30",
    ring: "ring-destructive/30",
    bar: "bg-destructive",
  };
}

function ProbabilityBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "orange" | "red";
}) {
  const pct = Math.round(value * 100);
  const t = toneFor(tone);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-semibold", t.text)}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-[width] duration-700 ease-out", t.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  label,
  value,
  span2,
}: {
  icon: typeof Smartphone;
  label: string;
  value: string;
  span2?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2",
        span2 && "col-span-2",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}
