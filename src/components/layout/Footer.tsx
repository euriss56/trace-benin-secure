import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
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
              {t('footer.tagline')}
              <br />
              {t('footer.subtitle')}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/verify" className="hover:text-primary">{t('nav.verify')}</Link></li>
              <li><Link to="/declare" className="hover:text-primary">{t('nav.declare')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">{t('nav.privacy')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">{t('footer.compliance')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('footer.complianceText')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="benin-stripe w-32" />
        </div>
      </div>
    </footer>
  );
}
