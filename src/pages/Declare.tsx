import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldAlert, Upload, Copy, CheckCircle2, Loader2, FileImage } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isValidLuhn, sanitizeImei } from "@/lib/luhn";
import { COTONOU_QUARTIERS } from "@/lib/quartiers";
import { generateDeclarationReference } from "@/lib/declaration-ref";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MotionTap, StaggerGroup, StaggerItem } from "@/components/motion/MotionPrimitives";

const errorMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18 },
};

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

// Zod schema relies on i18n keys (resolved at runtime via t() inside component)
const buildSchema = (t: (k: string) => string) =>
  z.object({
    device_brand: z.string().trim().min(1, t("declare.errors.brand")).max(60),
    device_model: z.string().trim().min(1, t("declare.errors.model")).max(80),
    device_reference: z.string().trim().max(80).optional().or(z.literal("")),
    imei: z
      .string()
      .length(15, t("declare.errors.imeiLength"))
      .refine(isValidLuhn, t("declare.errors.imeiLuhn")),
    description: z.string().trim().min(20, t("declare.errors.descriptionMin")).max(2000),
    theft_date: z
      .string()
      .min(1, t("declare.errors.dateRequired"))
      .refine((d) => new Date(d) <= new Date(), t("declare.errors.dateFuture")),
    quartier: z.enum(COTONOU_QUARTIERS, { message: t("declare.errors.quartierRequired") }),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function Declare() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/declare", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      device_brand: "",
      device_model: "",
      device_reference: "",
      imei: "",
      description: "",
      theft_date: new Date().toISOString().slice(0, 10),
      quartier: undefined as unknown as FormValues["quartier"],
    },
  });

  function handlePhotoChange(file: File | null) {
    setPhotoError(null);
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      setPhotoError(t("declare.photoFormatError"));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(t("declare.photoSizeError", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }
    setPhoto(file);
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSubmitting(true);
    try {
      let photo_path: string | null = null;
      const reference = await generateDeclarationReference();

      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${reference}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("device-photos")
          .upload(path, photo, { contentType: photo.type, upsert: false });
        if (upErr) throw new Error(`Upload photo : ${upErr.message}`);
        photo_path = path;
      }

      const { error: insErr } = await supabase.from("declarations").insert({
        reference,
        user_id: user.id,
        device_brand: values.device_brand,
        device_model: values.device_model,
        device_reference: values.device_reference || null,
        imei: values.imei,
        description: values.description,
        theft_date: values.theft_date,
        quartier: values.quartier,
        photo_path,
      });
      if (insErr) throw new Error(insErr.message);

      setCreatedRef(reference);
      form.reset();
      setPhoto(null);
    } catch (err) {
      console.error(err);
      toast({
        title: t("declare.submitErrorTitle"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRef() {
    if (!createdRef) return;
    await navigator.clipboard.writeText(createdRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (authLoading || !user) {
    return (
      <main className="container max-w-2xl py-20 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const imeiValue = form.watch("imei");
  const imeiLuhnOk = imeiValue.length === 15 ? isValidLuhn(imeiValue) : null;

  return (
    <>
      <Helmet>
        <title>{t("declare.metaTitle")}</title>
        <meta name="description" content={t("declare.metaDescription")} />
        <link rel="canonical" href="https://trace-benin-secure.lovable.app/declare" />
        <meta property="og:title" content={t("declare.metaTitle")} />
        <meta property="og:description" content={t("declare.metaDescription")} />
        <meta property="og:url" content="https://trace-benin-secure.lovable.app/declare" />
        <meta property="og:type" content="website" />
      </Helmet>
        <title>{t("declare.metaTitle")}</title>
        <meta name="description" content={t("declare.metaDescription")} />
        <link rel="canonical" href="/declare" />
      </Helmet>

      <main className="container max-w-2xl py-10 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> {t("declare.badge")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("declare.titlePrefix")} <span className="text-gradient-primary">{t("declare.titleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground">{t("declare.subtitle")}</p>
        </header>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t("declare.privacyTitle")}</AlertTitle>
          <AlertDescription>{t("declare.privacyDesc")}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>{t("declare.cardTitle")}</CardTitle>
            <CardDescription>{t("declare.cardDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <StaggerGroup className="space-y-5">
                <StaggerItem>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="device_brand">{t("declare.brand")} *</Label>
                      <Input id="device_brand" placeholder={t("declare.brandPlaceholder")} {...form.register("device_brand")} />
                      <AnimatePresence>
                        {form.formState.errors.device_brand && (
                          <motion.p {...errorMotion} className="text-xs text-destructive">
                            {form.formState.errors.device_brand.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="device_model">{t("declare.model")} *</Label>
                      <Input id="device_model" placeholder={t("declare.modelPlaceholder")} {...form.register("device_model")} />
                      <AnimatePresence>
                        {form.formState.errors.device_model && (
                          <motion.p {...errorMotion} className="text-xs text-destructive">
                            {form.formState.errors.device_model.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem className="space-y-1.5">
                  <Label htmlFor="device_reference">{t("declare.deviceRef")}</Label>
                  <Input
                    id="device_reference"
                    placeholder={t("declare.deviceRefPlaceholder")}
                    {...form.register("device_reference")}
                  />
                </StaggerItem>

                <StaggerItem className="space-y-1.5">
                  <Label htmlFor="imei">{t("declare.imei")} *</Label>
                  <motion.div
                    animate={imeiLuhnOk === false ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <Input
                      id="imei"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder={t("declare.imeiPlaceholder")}
                      className={`font-mono tracking-widest ${
                        imeiLuhnOk === null
                          ? ""
                          : imeiLuhnOk
                            ? "border-success focus-visible:ring-success"
                            : "border-destructive focus-visible:ring-destructive"
                      }`}
                      {...form.register("imei", {
                        onChange: (e) => form.setValue("imei", sanitizeImei(e.target.value), { shouldValidate: true }),
                      })}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {form.formState.errors.imei && (
                      <motion.p {...errorMotion} className="text-xs text-destructive">
                        {form.formState.errors.imei.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </StaggerItem>

                <StaggerItem>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="theft_date">{t("declare.theftDate")} *</Label>
                      <Input
                        id="theft_date"
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        {...form.register("theft_date")}
                      />
                      <AnimatePresence>
                        {form.formState.errors.theft_date && (
                          <motion.p {...errorMotion} className="text-xs text-destructive">
                            {form.formState.errors.theft_date.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quartier">{t("declare.quartier")} *</Label>
                      <Select
                        value={form.watch("quartier")}
                        onValueChange={(v) =>
                          form.setValue("quartier", v as FormValues["quartier"], { shouldValidate: true })
                        }
                      >
                        <SelectTrigger id="quartier">
                          <SelectValue placeholder={t("declare.quartierPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {COTONOU_QUARTIERS.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {form.formState.errors.quartier && (
                          <motion.p {...errorMotion} className="text-xs text-destructive">
                            {form.formState.errors.quartier.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </StaggerItem>

                <StaggerItem className="space-y-1.5">
                  <Label htmlFor="description">{t("declare.description")} *</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder={t("declare.descriptionPlaceholder")}
                    {...form.register("description")}
                  />
                  <AnimatePresence>
                    {form.formState.errors.description && (
                      <motion.p {...errorMotion} className="text-xs text-destructive">
                        {form.formState.errors.description.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </StaggerItem>

                <StaggerItem className="space-y-1.5">
                  <Label htmlFor="photo">{t("declare.photo")}</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="photo"
                      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="h-4 w-4" />
                      {t("declare.chooseFile")}
                    </label>
                    <input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                    />
                    <AnimatePresence>
                      {photo && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <FileImage className="h-4 w-4" />
                          {photo.name} · {(photo.size / 1024).toFixed(0)} Ko
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("declare.photoHelp")}</p>
                  <AnimatePresence>
                    {photoError && (
                      <motion.p {...errorMotion} className="text-xs text-destructive">
                        {photoError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </StaggerItem>

                <StaggerItem>
                  <MotionTap className="w-full" disabled={submitting}>
                    <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
                      {t("declare.submit")}
                    </Button>
                  </MotionTap>
                </StaggerItem>
              </StaggerGroup>
            </form>
          </CardContent>
        </Card>

        <Dialog open={!!createdRef} onOpenChange={(o) => !o && setCreatedRef(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/30">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <DialogTitle className="text-center">{t("declare.successTitle")}</DialogTitle>
              <DialogDescription className="text-center">{t("declare.successDesc")}</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t("declare.officialRef")}
              </div>
              <div className="font-mono text-2xl font-bold tracking-wider">{createdRef}</div>
            </div>
            <DialogFooter className="sm:justify-center gap-2">
              <Button variant="outline" onClick={copyRef}>
                {copied ? <CheckCircle2 className="text-success" /> : <Copy />}
                {copied ? t("declare.copied") : t("declare.copy")}
              </Button>
              <Button onClick={() => navigate("/")}>{t("declare.backHome")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
