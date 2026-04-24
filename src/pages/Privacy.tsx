import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, MapPin, Database, FileText, AlertCircle } from 'lucide-react';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Confidentialité — TraceIMEI-BJ</title>
        <meta
          name="description"
          content="Politique de confidentialité de TraceIMEI-BJ — conforme à la loi béninoise n° 2017-20 portant code du numérique."
        />
        <link rel="canonical" href="/privacy" />
      </Helmet>

      <main className="container max-w-4xl py-10 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" /> Politique de confidentialité
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Vos données, <span className="text-gradient-primary">vos droits</span>
          </h1>
          <p className="text-muted-foreground">
            TraceIMEI-BJ traite vos données dans le strict respect de la loi béninoise
            n° 2017-20 du 20 avril 2018 portant code du numérique en République du Bénin.
          </p>
        </header>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">
              <strong>Engagement géolocalisation : </strong>
              Conforme à la loi béninoise n° 2017-20 portant code du numérique. Aucune coordonnée GPS exacte
              n'est collectée ni stockée. Les données de localisation sont limitées au niveau
              <strong> quartier uniquement</strong>.
            </p>
          </CardContent>
        </Card>

        <Section icon={Database} title="Données que nous collectons">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Compte :</strong> adresse e-mail, mot de passe haché, rôle attribué (particulier, dealer, technicien, enquêteur, admin).</li>
            <li><strong>Vérifications IMEI :</strong> numéro IMEI vérifié, statut retourné, score ML, horodatage.</li>
            <li><strong>Déclarations de vol :</strong> marque, modèle, IMEI, description, quartier, date du vol, photo facultative.</li>
            <li><strong>Aucune coordonnée GPS exacte</strong> n'est demandée, collectée ni stockée.</li>
          </ul>
        </Section>

        <Section icon={MapPin} title="Données de localisation">
          <p className="text-sm leading-relaxed">
            La localisation des signalements est strictement limitée à la liste fermée des quartiers de Cotonou
            (Akpakpa, Cadjehoun, Dantokpa, Fidjrossè, Godomey, Houéyiho, Missèbo, Sainte-Rita, Vèdoko, Zogbo, Agla).
            Sur la carte des enquêteurs, les marqueurs sont affichés au centroïde approximatif du quartier
            (~500 m de précision) — jamais à une adresse précise.
          </p>
        </Section>

        <Section icon={Lock} title="Sécurité & accès">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Mots de passe stockés sous forme hachée (jamais en clair).</li>
            <li>Accès aux données protégé par <em>Row-Level Security</em> (RLS) côté base de données.</li>
            <li>Les rôles sont stockés dans une table dédiée — impossible d'élever ses propres privilèges.</li>
            <li>La carte des signalements n'est accessible qu'aux rôles <strong>enquêteur</strong> et <strong>admin</strong>.</li>
            <li>Connexion chiffrée TLS sur l'ensemble du parcours utilisateur.</li>
          </ul>
        </Section>

        <Section icon={FileText} title="Vos droits">
          <p className="text-sm leading-relaxed mb-2">
            Conformément aux articles 391 et suivants du code du numérique, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Droit d'accès</strong> à vos données personnelles.</li>
            <li><strong>Droit de rectification</strong> en cas de données erronées.</li>
            <li><strong>Droit à l'effacement</strong> (« droit à l'oubli »).</li>
            <li><strong>Droit d'opposition</strong> au traitement.</li>
            <li><strong>Droit à la portabilité</strong> de vos données.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            Pour exercer ces droits, contactez-nous à l'adresse indiquée en pied de page.
            Une réponse vous sera apportée sous 30 jours.
          </p>
        </Section>

        <Section icon={Shield} title="Conservation">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Vérifications IMEI : <strong>12 mois</strong> glissants.</li>
            <li>Déclarations de vol : conservées tant que le statut n'est pas <em>résolu</em>, puis 24 mois.</li>
            <li>Compte : conservé tant que vous l'utilisez. Suppression définitive sur demande.</li>
          </ul>
        </Section>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </div>
      </main>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}
