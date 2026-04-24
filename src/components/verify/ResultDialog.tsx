import { CheckCircle2, AlertTriangle, ShieldAlert, Clock, Cpu, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { VerificationResult, VerificationStatus } from "@/lib/verify-api";

interface ResultDialogProps {
  result: VerificationResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromCache?: boolean;
}

const STATUS_META: Record<
  VerificationStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string; ring: string }
> = {
  legitimate: {
    label: "LÉGITIME",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    ring: "ring-success/30",
  },
  suspect: {
    label: "SUSPECT",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    ring: "ring-warning/30",
  },
  stolen: {
    label: "SIGNALÉ VOLÉ",
    icon: ShieldAlert,
    color: "text-destructive",
    bg: "bg-destructive/10",
    ring: "ring-destructive/30",
  },
};

export function ResultDialog({ result, open, onOpenChange, fromCache }: ResultDialogProps) {
  if (!result) return null;
  const meta = STATUS_META[result.status];
  const Icon = meta.icon;
  const scorePct = Math.round(result.score * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Résultat de la vérification</DialogTitle>
          <DialogDescription className="font-mono text-xs tracking-wider">
            IMEI {result.imei} · TAC {result.tac}
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl ${meta.bg} ring-1 ${meta.ring} p-5 flex items-center gap-4`}>
          <Icon className={`h-12 w-12 ${meta.color}`} strokeWidth={2.25} />
          <div>
            <div className={`text-2xl font-bold ${meta.color}`}>{meta.label}</div>
            <div className="text-sm text-muted-foreground">
              {result.status === "legitimate" && "Aucun signalement détecté."}
              {result.status === "suspect" && "Signaux atypiques — vigilance recommandée."}
              {result.status === "stolen" && "Cet appareil est répertorié comme volé."}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-4 w-4" /> Score ML
              </span>
              <span className="font-mono font-semibold">{result.score.toFixed(2)} / 1.00</span>
            </div>
            <Progress value={scorePct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Temps de réponse
              </div>
              <div className="font-mono font-semibold">{result.responseTimeMs} ms</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Database className="h-3.5 w-3.5" /> Source
              </div>
              <div className="font-semibold capitalize">
                {fromCache ? "Cache local" : result.source === "api" ? "API ML" : "Mock dev"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={result.luhnValid ? "default" : "destructive"} className="font-mono">
              Luhn {result.luhnValid ? "OK" : "KO"}
            </Badge>
            <Badge variant="outline">Vérifié le {new Date(result.checkedAt).toLocaleString("fr-FR")}</Badge>
          </div>
          <ul className="text-sm space-y-1.5 mt-2">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
