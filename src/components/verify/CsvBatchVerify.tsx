import { useRef, useState } from "react";
import { Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { sanitizeImei } from "@/lib/luhn";
import { verifyImei, type VerificationResult } from "@/lib/verify-api";
import { cacheResult } from "@/lib/imei-cache";
import { useTranslation } from "react-i18next";

const MAX_BATCH = 50;

const STATUS_VARIANT: Record<VerificationResult["status"], "default" | "secondary" | "destructive" | "outline"> = {
  legitimate: "default",
  suspect: "secondary",
  stolen: "destructive",
};

export function CsvBatchVerify() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const statusLabel = (s: VerificationResult["status"]) =>
    s === "legitimate" ? t("verify.status.legitimate")
    : s === "suspect" ? t("verify.status.suspect")
    : t("verify.status.stolenShort");

  async function handleFile(file: File) {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => sanitizeImei(l.split(/[,;\t]/)[0] ?? ""))
      .filter((l) => l.length === 15);

    if (lines.length === 0) {
      toast({
        title: t("verify.batch.invalidTitle"),
        description: t("verify.batch.invalidDesc"),
        variant: "destructive",
      });
      return;
    }
    if (lines.length > MAX_BATCH) {
      toast({
        title: t("verify.batch.limitTitle"),
        description: t("verify.batch.limitDesc", { max: MAX_BATCH }),
      });
    }

    const batch = lines.slice(0, MAX_BATCH);
    setRunning(true);
    setResults([]);
    setProgress(0);

    const acc: VerificationResult[] = [];
    for (let i = 0; i < batch.length; i++) {
      try {
        const r = await verifyImei(batch[i]);
        acc.push(r);
        await cacheResult(r);
      } catch (err) {
        console.warn("Erreur batch", err);
      }
      setProgress(Math.round(((i + 1) / batch.length) * 100));
      setResults([...acc]);
    }
    setRunning(false);
    toast({
      title: t("verify.batch.doneTitle"),
      description: t("verify.batch.doneDesc", { count: acc.length }),
    });
  }

  function downloadCsv() {
    const header = "imei,statut,score,luhn,tac,temps_ms,verifie_le\n";
    const rows = results
      .map(
        (r) =>
          [
            r.imei,
            r.status,
            r.score.toFixed(3),
            r.luhnValid ? "OK" : "KO",
            r.tac,
            r.responseTimeMs,
            new Date(r.checkedAt).toISOString(),
          ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traceimei-resultats-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("verify.batch.title")}</CardTitle>
        <CardDescription>
          {t("verify.batch.description", { max: MAX_BATCH })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={running}
            variant="outline"
          >
            {running ? <Loader2 className="animate-spin" /> : <Upload />}
            {t("verify.batch.import")}
          </Button>
          <Button
            onClick={downloadCsv}
            disabled={results.length === 0 || running}
            variant="secondary"
          >
            <Download />
            {t("verify.batch.exportResults", { count: results.length })}
          </Button>
        </div>

        {running && <Progress value={progress} className="h-2" />}

        {results.length > 0 && (
          <div className="rounded-md border max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("verify.batch.tableImei")}</TableHead>
                  <TableHead>{t("verify.batch.tableStatus")}</TableHead>
                  <TableHead className="text-right">{t("verify.batch.tableScore")}</TableHead>
                  <TableHead className="text-right">{t("verify.batch.tableTime")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.imei}>
                    <TableCell className="font-mono text-xs">{r.imei}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{statusLabel(r.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.score.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {r.responseTimeMs} ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
