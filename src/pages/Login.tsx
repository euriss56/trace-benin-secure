import { useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: t('auth.loginFailTitle'), description: error, variant: 'destructive' });
      return;
    }
    toast({ title: t('auth.welcomeTitle'), description: t('auth.welcomeDesc') });
    navigate(from, { replace: true });
  };

  const handleReset = async () => {
    if (!email) {
      toast({ title: t('auth.emailRequiredTitle'), description: t('auth.emailRequiredDesc') });
      return;
    }
    const { error } = await resetPassword(email);
    if (error) toast({ title: t('common.error'), description: error, variant: 'destructive' });
    else toast({ title: t('auth.resetSentTitle'), description: t('auth.resetSentDesc') });
  };

  return (
    <div className="container flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loginLoading') : t('auth.loginSubmit')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth.registerLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
