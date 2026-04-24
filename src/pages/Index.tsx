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
  Lock,
  Brain,
  Database,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t } = useTranslation();

  const stats = [
    { value: '10.9M', label: t('home.stats.subscribers'), sub: t('home.stats.subscribersSub') },
    { value: 'Luhn', label: t('home.stats.luhn') },
    { value: '< 2s', label: t('home.stats.responseTime') },
    { value: 'Open', label: t('home.stats.openModel') },
  ];

  const steps = [
    { icon: Smartphone, label: t('home.how.step1Label'), title: t('home.how.step1Title'), desc: t('home.how.step1Desc') },
    { icon: Search, label: t('home.how.step2Label'), title: t('home.how.step2Title'), desc: t('home.how.step2Desc') },
    { icon: CheckCircle2, label: t('home.how.step3Label'), title: t('home.how.step3Title'), desc: t('home.how.step3Desc') },
  ];

  const actors = [
    { icon: Store, title: t('home.actors.dealerTitle'), desc: t('home.actors.dealerDesc') },
    { icon: Wrench, title: t('home.actors.repairTitle'), desc: t('home.actors.repairDesc') },
    { icon: Scale, title: t('home.actors.policeTitle'), desc: t('home.actors.policeDesc') },
  ];

  const features = [
    { icon: Lock, title: t('home.features.encryptedTitle'), desc: t('home.features.encryptedDesc') },
    { icon: Brain, title: t('home.features.mlTitle'), desc: t('home.features.mlDesc') },
    { icon: Database, title: t('home.features.tacTitle'), desc: t('home.features.tacDesc') },
    { icon: MapPin, title: t('home.features.beninTitle'), desc: t('home.features.beninDesc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
              <Shield className="h-4 w-4" />
              <span>{t('home.badge')}</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              {t('home.titlePrefix')}{' '}
              <span className="text-gradient-primary">{t('home.titleHighlight')}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t('home.subtitle')}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-primary shadow-elegant hover:bg-primary/90">
                <Link to="/verify">
                  {t('home.ctaVerify')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">{t('home.ctaRegister')}</Link>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-foreground md:text-4xl">{s.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                    {s.sub && <div className="text-xs">{s.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/20 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('home.how.kicker')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.how.title')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="border-border/60 transition-shadow hover:shadow-elegant">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
      </section>

      {/* Actors */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('home.actors.kicker')}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.actors.title')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {actors.map((a) => (
              <Card key={a.title} className="border-border/60 transition-all hover:border-primary/50 hover:shadow-elegant">
                <CardContent className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
                    <a.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/20 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.features.title')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-elegant"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-3xl bg-primary p-12 text-center text-primary-foreground shadow-elegant">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
              {t('home.cta.kicker')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t('home.cta.title')}
            </h2>
            <p className="mt-4 text-base opacity-90">
              {t('home.cta.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">{t('home.cta.createAccount')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/verify">
                  {t('home.cta.tryNow')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
