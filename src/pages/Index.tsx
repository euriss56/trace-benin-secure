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

const stats = [
  { value: '10.9M', label: 'Abonnés mobiles', sub: '(ARCEP 2025)' },
  { value: 'Luhn', label: 'Validation IMEI standard' },
  { value: '< 2s', label: 'Temps de réponse moyen' },
  { value: 'Open', label: 'Modèle apprenant en continu' },
];

const steps = [
  {
    icon: Smartphone,
    label: 'ÉTAPE 1',
    title: 'Saisissez l\'IMEI',
    desc: 'Composez *#06# sur le téléphone pour obtenir le numéro IMEI à 15 chiffres.',
  },
  {
    icon: Search,
    label: 'ÉTAPE 2',
    title: 'Analyse transparente',
    desc: 'Validation Luhn, lookup TAC, croisement avec les signalements de vol — chaque règle est expliquée.',
  },
  {
    icon: CheckCircle2,
    label: 'ÉTAPE 3',
    title: 'Résultat instantané',
    desc: 'Statut tricolore (vert/orange/rouge) avec score 0–100 et explications détaillées.',
  },
];

const actors = [
  {
    icon: Store,
    title: 'Dealer / Revendeur',
    desc: 'Vérifiez l\'historique d\'un téléphone en 2 secondes avant l\'achat. Évitez les appareils volés.',
  },
  {
    icon: Wrench,
    title: 'Atelier de réparation',
    desc: 'Détectez les téléphones suspects avant intervention. Protégez votre business et vos clients.',
  },
  {
    icon: Scale,
    title: 'Forces de l\'ordre',
    desc: 'Accès enquêteur dédié pour consulter les signalements et coordonner les enquêtes.',
  },
];

const features = [
  { icon: Lock, title: 'Données chiffrées', desc: 'Authentification sécurisée et stockage chiffré.' },
  { icon: Brain, title: 'Score ML', desc: 'Algorithme apprenant en continu.' },
  { icon: Database, title: 'Lookup TAC', desc: 'Identification précise du modèle.' },
  { icon: MapPin, title: '100% Bénin', desc: 'Conçu pour le marché béninois.' },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-medium text-success">
              <Shield className="h-4 w-4" />
              <span>Authentifier · Protéger · Tracer</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              TraceIMEI-BJ —{' '}
              <span className="text-gradient-primary">Protégez vos téléphones</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              La première plateforme ML pour traquer les téléphones volés au Bénin. Pour les
              dealers, ateliers de réparation et forces de l'ordre.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-primary shadow-elegant hover:bg-primary/90">
                <Link to="/verify">
                  Vérifier un IMEI gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">Créer un compte</Link>
              </Button>
            </div>

            {/* Stats */}
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
              Processus simple
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Comment ça marche ?
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
              Conçu pour vous
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Une plateforme pour chaque acteur
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
              Pourquoi TraceIMEI-BJ ?
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
              Rejoignez la communauté
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Prêt à sécuriser le marché du téléphone au Bénin ?
            </h2>
            <p className="mt-4 text-base opacity-90">
              Inscription gratuite. Aucune carte bancaire requise.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Créer mon compte</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/verify">
                  Essayer maintenant
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
