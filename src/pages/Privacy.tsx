import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, MapPin, Database, FileText, AlertCircle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('privacy.metaTitle')}</title>
        <meta name="description" content={t('privacy.metaDescription')} />
        <link rel="canonical" href="https://trace-benin-secure.lovable.app/privacy" />
        <meta property="og:title" content={t('privacy.metaTitle')} />
        <meta property="og:description" content={t('privacy.metaDescription')} />
        <meta property="og:url" content="https://trace-benin-secure.lovable.app/privacy" />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="container max-w-4xl py-10 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" /> {t('privacy.badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('privacy.titlePrefix')} <span className="text-gradient-primary">{t('privacy.titleHighlight')}</span>
          </h1>
          <p className="text-muted-foreground">{t('privacy.intro')}</p>
        </header>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">
              <strong>{t('privacy.geoCommitment')} </strong>
              <Trans i18nKey="privacy.geoText" components={{ strong: <strong /> }} />
            </p>
          </CardContent>
        </Card>

        <Section icon={Database} title={t('privacy.dataTitle')}>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><Trans i18nKey="privacy.data1" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.data2" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.data3" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.data4" components={{ strong: <strong /> }} /></li>
          </ul>
        </Section>

        <Section icon={MapPin} title={t('privacy.geoSectionTitle')}>
          <p className="text-sm leading-relaxed">{t('privacy.geoSectionText')}</p>
        </Section>

        <Section icon={Lock} title={t('privacy.securityTitle')}>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>{t('privacy.sec1')}</li>
            <li><Trans i18nKey="privacy.sec2" components={{ em: <em /> }} /></li>
            <li>{t('privacy.sec3')}</li>
            <li><Trans i18nKey="privacy.sec4" components={{ strong: <strong /> }} /></li>
            <li>{t('privacy.sec5')}</li>
          </ul>
        </Section>

        <Section icon={FileText} title={t('privacy.rightsTitle')}>
          <p className="text-sm leading-relaxed mb-2">{t('privacy.rightsIntro')}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><Trans i18nKey="privacy.right1" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.right2" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.right3" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.right4" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.right5" components={{ strong: <strong /> }} /></li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">{t('privacy.rightsContact')}</p>
        </Section>

        <Section icon={Shield} title={t('privacy.retentionTitle')}>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><Trans i18nKey="privacy.ret1" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="privacy.ret2" components={{ em: <em /> }} /></li>
            <li>{t('privacy.ret3')}</li>
          </ul>
        </Section>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          {t('privacy.lastUpdate', {
            date: new Date().toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }),
          })}
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
