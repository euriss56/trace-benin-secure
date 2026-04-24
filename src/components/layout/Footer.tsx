import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-bold">TraceIMEI-BJ</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Authentifier · Protéger · Tracer.
              <br />
              La plateforme béninoise contre le vol de téléphones.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Plateforme</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/verify" className="hover:text-primary">Vérifier IMEI</Link></li>
              <li><Link to="/declare" className="hover:text-primary">Déclarer un vol</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Confidentialité</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Conformité légale</h4>
            <p className="text-xs text-muted-foreground">
              Conforme à la loi béninoise n° 2017-20 portant code du numérique.
              Aucune coordonnée GPS exacte n'est collectée ni stockée.
              Les données de localisation sont limitées au niveau quartier uniquement.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} TraceIMEI-BJ. Tous droits réservés.</p>
          <div className="benin-stripe w-32" />
        </div>
      </div>
    </footer>
  );
}
