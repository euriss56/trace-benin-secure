import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Loader2, WifiOff, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isValidLuhn, sanitizeImei } from "@/lib/luhn";
import { verifyImei, type VerificationResult } from "@/lib/verify-api";
import { cacheResult, getCachedResult } from "@/lib/imei-cache";
import { ResultDialog } from "@/components/verify/ResultDialog";
import { CsvBatchVerify } from "@/components/verify/CsvBatchVerify";
import { cn } from "@/lib/utils";

export default function Verify() {
  const { toast } = useToast();
  const online = useOnlineStatus();
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [open, setOpen] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const isComplete = imei.length === 15;
  const luhnOk = useMemo(() => (isComplete ? isValidLuhn(imei) : null), [imei, isComplete]);

  // Si on tape un IMEI déjà connu, on précharge le cache pour proposer un résultat hors-ligne instantané.
  useEffect(() => {
    if (!isComplete) return;
    let cancelled = false;
    getCachedResult(imei).then((cached) => {
      if (!cancelled && cached && !online) {
        setResult({ ...cached, source: "cache" });
        setFromCache(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imei, isComplete, online]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete || !luhnOk) return;

    setLoading(true);
    try {
      if (!online) {
        const cached = await getCachedResult(imei);
        if (cached) {
          setResult({ ...cached, source: "cache" });
          setFromCache(true);
          setOpen(true);
        } else {
          toast({
            title: "Hors-ligne",
            description: "Aucun résultat en cache pour cet IMEI. Reconnectez-vous pour vérifier.",
            variant: "destructive",
          });
        }
        return;
      }

      const r = await verifyImei(imei);
      await cacheResult(r);
      setResult(r);
      setFromCache(false);
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "La vérification a échoué. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Bordure dynamique : neutre / vert si Luhn OK / rouge si KO
  const borderState = !isComplete
    ? "border-input focus-visible:ring-ring"
    : luhnOk
      ? "border-success focus-visible:ring-success"
      : "border-destructive focus-visible:ring-destructive";

  return (
    <>
      <Helmet>
        <title>Vérifier un IMEI — TraceIMEI-BJ</title>
        <meta
          name="description"
          content="Vérifiez en moins de 2 secondes la légitimité d'un téléphone via son IMEI : validation Luhn, score ML, signalements."
        />
        <link rel="canonical" href="/verify" />
      </Helmet>

      <main className="container max-w-3xl py-10 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Vérification IMEI
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Vérifiez un téléphone <span className="text-gradient-primary">en moins de 2 secondes</span>
          </h1>
          <p className="text-muted-foreground">
            Saisissez les 15 chiffres de l'IMEI. La validation Luhn est exécutée en temps réel pendant la frappe.
          </p>
        </header>

        {!online && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Mode hors-ligne</AlertTitle>
            <AlertDescription>
              Vous êtes déconnecté du réseau. Seuls les 50 derniers IMEI vérifiés sont accessibles depuis le cache local.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vérification individuelle</CardTitle>
            <CardDescription>
              Trouvez votre IMEI en composant <span className="font-mono font-semibold">*#06#</span> sur le téléphone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imei">Numéro IMEI (15 chiffres)</Label>
                <Input
                  id="imei"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="123456789012345"
                  value={imei}
                  onChange={(e) => setImei(sanitizeImei(e.target.value))}
                  maxLength={15}
                  className={cn("font-mono text-lg tracking-widest h-12", borderState)}
                  aria-invalid={isComplete && !luhnOk}
                  aria-describedby="imei-status"
                />
                <div id="imei-status" className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono">{imei.length} / 15</span>
                  {isComplete && (
                    <span
                      className={cn(
                        "flex items-center gap-1.5 font-medium",
                        luhnOk ? "text-success" : "text-destructive",
                      )}
                    >
                      {luhnOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {luhnOk ? "Format Luhn valide" : "Format Luhn invalide"}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isComplete || !luhnOk || loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                Vérifier cet IMEI
              </Button>

              {result && fromCache && !online && (
                <Alert>
                  <WifiOff className="h-4 w-4" />
                  <AlertTitle>Résultat en cache</AlertTitle>
                  <AlertDescription>
                    Mode hors-ligne — résultat du{" "}
                    <strong>{new Date(result.checkedAt).toLocaleString("fr-FR")}</strong>.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        <CsvBatchVerify />

        <ResultDialog result={result} open={open} onOpenChange={setOpen} fromCache={fromCache} />
      </main>
    </>
  );
}
