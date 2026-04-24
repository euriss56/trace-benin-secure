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
import { useTranslation } from "react-i18next";

interface ResultDialogProps {
  result: VerificationResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromCache?: boolean;
}

const STATUS_VISUAL: Record<
  VerificationStatus,
  { icon: typeof CheckCircle2; color: string; bg: string; ring: string }
> = {
  legitimate: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", ring: "ring-success/30" },
  suspect: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/30" },
  stolen: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", ring: "ring-destructive/30" },
};

export function ResultDialog({ result, open, onOpenChange, fromCache }: ResultDialogProps) {
  const { t, i18n } = useTranslation();
  if (!result) return null;
  const visual = STATUS_VISUAL[result.status];
  const Icon = visual.icon;
  const scorePct = Math.round(result.score * 100);

  const statusLabel =
    result.status === "legitimate" ? t("verify.status.legitimate")
    : result.status === "suspect" ? t("verify.status.suspect")
    : t("verify.status.stolen");

  const statusDesc =
    result.status === "legitimate" ? t("verify.result.legitimateDesc")
    : result.status === "suspect" ? t("verify.result.suspectDesc")
    : t("verify.result.stolenDesc");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("verify.result.title")}</DialogTitle>
          <DialogDescription className="font-mono text-xs tracking-wider">
            IMEI {result.imei} · TAC {result.tac}
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl ${visual.bg} ring-1 ${visual.ring} p-5 flex items-center gap-4`}>
          <Icon className={`h-12 w-12 ${visual.color}`} strokeWidth={2.25} />
          <div>
            <div className={`text-2xl font-bold ${visual.color}`}>{statusLabel}</div>
            <div className="text-sm text-muted-foreground">{statusDesc}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-4 w-4" /> {t("verify.result.scoreLabel")}
              </span>
              <span className="font-mono font-semibold">{result.score.toFixed(2)} / 1.00</span>
            </div>
            <Progress value={scorePct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> {t("verify.result.responseTime")}
              </div>
              <div className="font-mono font-semibold">{result.responseTimeMs} ms</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Database className="h-3.5 w-3.5" /> {t("verify.result.source")}
              </div>
              <div className="font-semibold">
                {fromCache
                  ? t("verify.result.sourceCache")
                  : result.source === "api"
                    ? t("verify.result.sourceApi")
                    : t("verify.result.sourceMock")}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={result.luhnValid ? "default" : "destructive"} className="font-mono">
              {t("verify.result.luhn")} {result.luhnValid ? "OK" : "KO"}
            </Badge>
            <Badge variant="outline">
              {t("verify.result.checkedOn", { date: new Date(result.checkedAt).toLocaleString(i18n.language) })}
            </Badge>
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
