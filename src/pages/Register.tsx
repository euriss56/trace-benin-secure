import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('particulier');
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    email: z.string().trim().email(t('auth.emailInvalid')).max(255),
    password: z.string().min(8, t('auth.passwordMin')).max(72),
    role: z.enum(['particulier', 'dealer', 'technicien']),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, role });
    if (!parsed.success) {
      toast({
        title: t('auth.validationTitle'),
        description: parsed.error.issues[0]?.message ?? '',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.role);
    setLoading(false);
    if (error) {
      toast({ title: t('auth.registerFailTitle'), description: error, variant: 'destructive' });
      return;
    }
    toast({
      title: t('auth.createdTitle'),
      description: t('auth.createdDesc'),
    });
    navigate('/dashboard');
  };

  return (
    <div className="container flex min-h-[calc(100vh-12rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">{t('auth.registerTitle')}</h1>
          <CardDescription>{t('auth.registerDesc')}</CardDescription>
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
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('auth.iAm')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particulier">{t('auth.rolePart')}</SelectItem>
                  <SelectItem value="dealer">{t('auth.roleDealer')}</SelectItem>
                  <SelectItem value="technicien">{t('auth.roleTech')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('auth.rolesNote')}</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.registerLoading') : t('auth.registerSubmit')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.loginLink')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
