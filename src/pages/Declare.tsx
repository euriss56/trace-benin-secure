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

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

const schema = z.object({
  device_brand: z.string().trim().min(1, "Marque requise").max(60),
  device_model: z.string().trim().min(1, "Modèle requis").max(80),
  device_reference: z.string().trim().max(80).optional().or(z.literal("")),
  imei: z
    .string()
    .length(15, "L'IMEI doit contenir exactement 15 chiffres")
    .refine(isValidLuhn, "Format Luhn invalide"),
  description: z
    .string()
    .trim()
    .min(20, "Décrivez les circonstances du vol (20 caractères min)")
    .max(2000),
  theft_date: z
    .string()
    .min(1, "Date requise")
    .refine((d) => new Date(d) <= new Date(), "La date ne peut pas être dans le futur"),
  quartier: z.enum(COTONOU_QUARTIERS, { message: "Sélectionnez un quartier" }),
});

type FormValues = z.infer<typeof schema>;

export default function Declare() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Garde d'authentification
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/declare", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
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
      setPhotoError("Format non supporté — utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Limite : 5 Mo.`);
      return;
    }
    setPhoto(file);
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSubmitting(true);
    try {
      // 1. Upload photo (optionnelle) dans le bucket {user_id}/{ref}.{ext}
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

      // 2. Insertion en base
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
        title: "Échec de la déclaration",
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
        <title>Déclarer un vol — TraceIMEI-BJ</title>
        <meta
          name="description"
          content="Déclarez le vol de votre téléphone au Bénin : marque, modèle, IMEI, quartier de Cotonou, photo. Référence officielle générée."
        />
        <link rel="canonical" href="/declare" />
      </Helmet>

      <main className="container max-w-2xl py-10 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Déclaration de vol
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Signaler un appareil <span className="text-gradient-primary">volé</span>
          </h1>
          <p className="text-muted-foreground">
            Remplissez ce formulaire pour enregistrer la déclaration auprès de TraceIMEI-BJ. Une référence
            officielle vous sera remise.
          </p>
        </header>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Confidentialité</AlertTitle>
          <AlertDescription>
            Aucune coordonnée GPS exacte n'est collectée — la localisation est limitée au quartier (loi n° 2017-20).
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Informations sur l'appareil</CardTitle>
            <CardDescription>Tous les champs marqués sont obligatoires.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="device_brand">Marque *</Label>
                  <Input id="device_brand" placeholder="Samsung, Apple, Tecno…" {...form.register("device_brand")} />
                  {form.formState.errors.device_brand && (
                    <p className="text-xs text-destructive">{form.formState.errors.device_brand.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="device_model">Modèle *</Label>
                  <Input id="device_model" placeholder="Galaxy S22, iPhone 13…" {...form.register("device_model")} />
                  {form.formState.errors.device_model && (
                    <p className="text-xs text-destructive">{form.formState.errors.device_model.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="device_reference">Référence appareil (optionnel)</Label>
                <Input
                  id="device_reference"
                  placeholder="Numéro de série, code interne…"
                  {...form.register("device_reference")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imei">IMEI (15 chiffres) *</Label>
                <Input
                  id="imei"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="123456789012345"
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
                {form.formState.errors.imei && (
                  <p className="text-xs text-destructive">{form.formState.errors.imei.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="theft_date">Date du vol *</Label>
                  <Input
                    id="theft_date"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    {...form.register("theft_date")}
                  />
                  {form.formState.errors.theft_date && (
                    <p className="text-xs text-destructive">{form.formState.errors.theft_date.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quartier">Quartier (Cotonou) *</Label>
                  <Select
                    value={form.watch("quartier")}
                    onValueChange={(v) =>
                      form.setValue("quartier", v as FormValues["quartier"], { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="quartier">
                      <SelectValue placeholder="Sélectionnez…" />
                    </SelectTrigger>
                    <SelectContent>
                      {COTONOU_QUARTIERS.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.quartier && (
                    <p className="text-xs text-destructive">{form.formState.errors.quartier.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Circonstances du vol *</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Lieu précis, heure approximative, témoins éventuels…"
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="photo">Photo de l'appareil (optionnel)</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="photo"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    Choisir un fichier
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  />
                  {photo && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileImage className="h-4 w-4" />
                      {photo.name} · {(photo.size / 1024).toFixed(0)} Ko
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Maximum 5 Mo.</p>
                {photoError && <p className="text-xs text-destructive">{photoError}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
                Enregistrer la déclaration
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={!!createdRef} onOpenChange={(o) => !o && setCreatedRef(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/30">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <DialogTitle className="text-center">Déclaration enregistrée</DialogTitle>
              <DialogDescription className="text-center">
                Conservez précieusement cette référence — elle sera demandée par les forces de l'ordre.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-muted p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Référence officielle
              </div>
              <div className="font-mono text-2xl font-bold tracking-wider">{createdRef}</div>
            </div>
            <DialogFooter className="sm:justify-center gap-2">
              <Button variant="outline" onClick={copyRef}>
                {copied ? <CheckCircle2 className="text-success" /> : <Copy />}
                {copied ? "Copié !" : "Copier la référence"}
              </Button>
              <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
