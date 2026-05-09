import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Smartphone,
  Search,
  CheckCircle2,
  Store,
  Wrench,
  Scale,
  User,
  Lock,
  Brain,
  Database,
  MapPin,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Users,
      value: '10.9M',
      label: t('home.stats.subscribers'),
      sub: t('home.stats.subscribersSub'),
      tint: 'bg-primary/10 text-primary',
    },
    {
      icon: ShieldCheck,
      value: 'Luhn',
      label: t('home.stats.luhn'),
      tint: 'bg-accent/30 text-accent-foreground',
    },
    {
      icon: Zap,
      value: '< 2s',
      label: t('home.stats.responseTime'),
      tint: 'bg-warning/15 text-warning',
    },
    {
      icon: Globe,
      value: 'Open',
      label: t('home.stats.openModel'),
      tint: 'bg-success/15 text-success',
    },
  ];

  const steps = [
    { icon: Smartphone, label: t('home.how.step1Label'), title: t('home.how.step1Title'), desc: t('home.how.step1Desc') },
    { icon: Search, label: t('home.how.step2Label'), title: t('home.how.step2Title'), desc: t('home.how.step2Desc') },
    { icon: CheckCircle2, label: t('home.how.step3Label'), title: t('home.how.step3Title'), desc: t('home.how.step3Desc') },
  ];

  const actors = [
    { icon: Store, title: t('home.actors.dealerTitle'), desc: t('home.actors.dealerDesc'), to: '/register' },
    { icon: Wrench, title: t('home.actors.repairTitle'), desc: t('home.actors.repairDesc'), to: '/register' },
    { icon: Scale, title: t('home.actors.policeTitle'), desc: t('home.actors.policeDesc'), to: '/register' },
    { icon: User, title: 'Particulier', desc: "Vérifiez l'IMEI d'un téléphone avant achat ou après un vol. Protégez-vous en quelques secondes.", to: '/verify' },
  ];

  const features = [
    { icon: Lock, title: t('home.features.encryptedTitle'), desc: t('home.features.encryptedDesc') },
    { icon: Brain, title: t('home.features.mlTitle'), desc: t('home.features.mlDesc') },
    { icon: Database, title: t('home.features.tacTitle'), desc: t('home.features.tacDesc') },
    { icon: MapPin, title: t('home.features.beninTitle'), desc: t('home.features.beninDesc') },
  ];

  return (
    <div>
      {/* Hero — two columns */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-16 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left col */}
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
                <Shield className="h-4 w-4" />
                <span>{t('home.badge')}</span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                {t('home.titlePrefix')}{' '}
                <span className="text-gradient-primary">{t('home.titleHighlight')}</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl lg:mx-0 mx-auto">
                {t('home.subtitle')}
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center">
                <Button asChild size="lg" className="shadow-elegant">
                  <Link to="/verify">
                    {t('home.ctaVerify')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register">{t('home.ctaRegister')}</Link>
                </Button>
              </div>
            </div>

            {/* Right col — IMEI verification mockup */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Decorative blobs */}
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" aria-hidden />
              <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-full bg-accent/30 blur-3xl" aria-hidden />

              <Card className="relative glass border-border/60 shadow-elegant animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Vérification IMEI
                    </div>
                    <Badge variant="legitimate" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Légitime
                    </Badge>
                  </div>

                  <div className="mt-5 rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="text-xs text-muted-foreground">IMEI</div>
                    <div className="mt-1 font-mono text-xl font-semibold tracking-wider">
                      35-209900-176148-1
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Brain className="h-4 w-4 text-primary" />
                        Score ML
                      </span>
                      <span className="font-semibold text-success">94 / 100</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-success to-primary-glow"
                        style={{ width: '94%' }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">TAC</div>
                      <div className="mt-0.5 font-semibold">Samsung</div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                      <div className="text-xs text-muted-foreground">Statut</div>
                      <div className="mt-0.5 font-semibold text-success">Non volé</div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                    Vérifié en 1.4s · Modèle ML v2
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — icon cards */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight md:text-4xl">{s.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                    {s.sub && <div className="text-xs opacity-80">{s.sub}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — numbered steps with dotted line */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('home.how.kicker')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.how.title')}
            </h2>
          </div>

          <div className="relative">
            {/* Dotted connector (desktop only) */}
            <div
              className="absolute left-0 right-0 top-16 hidden border-t-2 border-dashed border-border md:block"
              aria-hidden
            />

            <div className="relative grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <Card
                  key={step.title}
                  className="relative overflow-hidden border-border/60 bg-card"
                >
                  {/* Big background number */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-2 -top-4 select-none text-[110px] font-extrabold leading-none text-primary/5"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <CardContent className="relative p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {step.label}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Actors — 2x2 grid */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('home.actors.kicker')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.actors.title')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {actors.map((a) => (
              <Card
                key={a.title}
                className="group border-border/60 transition-all hover:border-primary/50"
              >
                <CardContent className="flex h-full flex-col p-8">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant">
                    <a.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.desc}</p>
                  <Link
                    to={a.to}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary story-link"
                  >
                    En savoir plus
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features — 2-col list, no cards */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.features.title')}
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-x-12 gap-y-8 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — full width */}
      <section className="relative w-full overflow-hidden bg-primary py-20 text-primary-foreground md:py-24">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-glow blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="container relative text-center">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
            {t('home.cta.kicker')}
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            {t('home.cta.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
            {t('home.cta.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base">
              <Link to="/register">{t('home.cta.createAccount')}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-primary-foreground/40 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/verify">
                {t('home.cta.tryNow')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/80">
            Aucune carte bancaire · Gratuit · 100% Bénin
          </p>
        </div>
      </section>
    </div>
  );
}
