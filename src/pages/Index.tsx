import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Smartphone,
  Search,
  CheckCircle2,
  Brain,
  Lock,
  Database,
  MapPin,
  Sparkles,
  ArrowRight,
  Store,
  Wrench,
  Scale,
  User,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ImeiVerifyForm } from "@/components/verify/ImeiVerifyForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <PublicLayout>
      <Hero />
      <Stats />
      <HowItWorks />
      <Actors />
      <Features />
      <CTA />
    </PublicLayout>
  );
}

/* ================= HERO ================= */

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-32">

        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3 w-3" />
            {t("home.badge", "Authentifier · Protéger · Tracer")}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight lg:text-6xl">
            {t("home.heroTitle", "L'authenticité de chaque IMEI,")}{" "}
            <span className="text-gradient-primary">
              {t("home.heroAccent", "en quelques secondes.")}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-muted-foreground">
            {t(
              "home.heroDesc",
              "Plateforme nationale pour vérifier et tracer les téléphones au Bénin."
            )}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-elegant">
              <Link to="/verify">
                Vérifier un IMEI <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="glass rounded-3xl p-6 shadow-elevated">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Vérification IMEI instantanée
            </div>

            <div className="mt-4">
              <ImeiVerifyForm />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

/* ================= STATS ================= */

function Stats() {
  const items = [
    { v: "10.9M", l: "Abonnés", s: "Marché national" },
    { v: "Luhn", l: "Validation", s: "Algorithme officiel" },
    { v: "< 2s", l: "Réponse", s: "Ultra rapide" },
    { v: "ML", l: "IA", s: "Détection fraude" },
  ];

  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="bg-background p-6">
            <div className="text-3xl font-bold">{it.v}</div>
            <div className="text-sm font-medium">{it.l}</div>
            <div className="text-xs text-muted-foreground">{it.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= CTA ================= */

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div
        className="relative rounded-3xl p-12 text-center text-white shadow-elevated"
        style={{ background: "var(--gradient-primary)" }}
      >
        <h2 className="text-3xl font-bold">
          Sécurisez le marché mobile au Bénin
        </h2>

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/register">Créer un compte</Link>
          </Button>

          <Button asChild variant="outline">
            <Link to="/verify">Vérifier IMEI</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* PLACEHOLDERS (inchangés) */
function HowItWorks() {
  return null;
}
function Actors() {
  return null;
}
function Features() {
  return null;
}
