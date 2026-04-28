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
import { recordVerification } from "@/lib/verification-history";
import { ResultDialog } from "@/components/verify/ResultDialog";
import { CsvBatchVerify } from "@/components/verify/CsvBatchVerify";
import { MlScoreCard } from "@/components/verify/MlScoreCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MotionTap } from "@/components/motion/MotionPrimitives";
import { Trans, useTranslation } from "react-i18next";

export default function Verify() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const online = useOnlineStatus();
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [open, setOpen] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const isComplete = imei.length === 15;
  const luhnOk = useMemo(() => (isComplete ? isValidLuhn(imei) : null), [imei, isComplete]);

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
            title: t("verify.offlineToastTitle"),
            description: t("verify.offlineToastDesc"),
            variant: "destructive",
          });
        }
        return;
      }

      const r = await verifyImei(imei);
      await cacheResult(r);
      const rec = await recordVerification(r);
      if (!rec.ok && rec.error && rec.error !== 'not-authenticated' && rec.error !== 'supabase-not-configured') {
        toast({
          title: t("verify.saveErrorTitle", { defaultValue: "Sauvegarde impossible" }),
          description: t("verify.saveErrorDesc", {
            defaultValue: "La vérification n'a pas pu être enregistrée. Vérifiez les politiques RLS de la table 'verifications'.",
          }),
          variant: "destructive",
        });
      }
      setResult(r);
      setFromCache(false);
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast({
        title: t("verify.errorToastTitle"),
        description: t("verify.errorToastDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const borderState = !isComplete
    ? "border-input focus-visible:ring-ring"
    : luhnOk
      ? "border-success focus-visible:ring-success"
      : "border-destructive focus-visible:ring-destructive";

  return (
    <>
      <Helmet>
        <title>{t("verify.metaTitle")}</title>
        <meta name="description" content={t("verify.metaDescription")} />
        <link rel="canonical" href="/verify" />
      </Helmet>

      <main className="container max-w-3xl py-10 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t("verify.badge")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("verify.titlePrefix")} <span className="text-gradient-primary">{t("verify.titleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground">{t("verify.subtitle")}</p>
        </header>

        {!online && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>{t("verify.offlineTitle")}</AlertTitle>
            <AlertDescription>{t("verify.offlineDesc")}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("verify.individualTitle")}</CardTitle>
            <CardDescription>
              <Trans
                i18nKey="verify.individualDesc"
                components={{ strong: <span className="font-mono font-semibold" /> }}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imei">{t("verify.imeiLabel")}</Label>
                <motion.div
                  animate={
                    isComplete && luhnOk === false
                      ? { x: [0, -8, 8, -6, 6, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Input
                    id="imei"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={t("verify.imeiPlaceholder")}
                    value={imei}
                    onChange={(e) => setImei(sanitizeImei(e.target.value))}
                    maxLength={15}
                    className={cn("font-mono text-lg tracking-widest h-12", borderState)}
                    aria-invalid={isComplete && !luhnOk}
                    aria-describedby="imei-status"
                  />
                </motion.div>
                <div id="imei-status" className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono">{imei.length} / 15</span>
                  <AnimatePresence mode="wait">
                    {isComplete && (
                      <motion.span
                        key={luhnOk ? "ok" : "ko"}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-center gap-1.5 font-medium",
                          luhnOk ? "text-success" : "text-destructive",
                        )}
                      >
                        {luhnOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {luhnOk ? t("verify.luhnValid") : t("verify.luhnInvalid")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <MotionTap className="w-full" disabled={!isComplete || !luhnOk || loading}>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!isComplete || !luhnOk || loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Search />}
                  {t("verify.verifyButton")}
                </Button>
              </MotionTap>

              {result && fromCache && !online && (
                <Alert>
                  <WifiOff className="h-4 w-4" />
                  <AlertTitle>{t("verify.cachedTitle")}</AlertTitle>
                  <AlertDescription>
                    <Trans
                      i18nKey="verify.cachedDesc"
                      values={{ date: new Date(result.checkedAt).toLocaleString(i18n.language) }}
                      components={{ strong: <strong /> }}
                    />
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        <MlScoreCard imei={imei} enabled={isComplete && !!luhnOk} />

        <CsvBatchVerify />

        <ResultDialog result={result} open={open} onOpenChange={setOpen} fromCache={fromCache} />
      </main>
    </>
  );
}
