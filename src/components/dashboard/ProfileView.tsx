import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Loader2, KeyRound, Camera, ShieldCheck, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AnimatedInput } from '@/components/motion/AnimatedInput';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { StaggerGroup, StaggerItem, fadeUp } from '@/components/motion/MotionPrimitives';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  admin:      'bg-destructive/10 text-destructive border-destructive/30',
  enqueteur:  'bg-warning/15 text-warning border-warning/30',
  dealer:     'bg-primary/10 text-primary border-primary/30',
  technicien: 'bg-accent/40 text-accent-foreground border-accent/40',
  particulier:'bg-muted text-muted-foreground border-border',
};

export function ProfileView() {
  const { user, role } = useAuth();
  const { profile, loading, reload } = useProfile();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom]       = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd]   = useState(false);
  const [invalidPwd, setInvalidPwd] = useState<{ new?: boolean; confirm?: boolean }>({});

  useEffect(() => {
    if (profile) {
      setPrenom(profile.prenom ?? '');
      setNom(profile.nom ?? '');
    }
    if (profile?.avatar_url) setAvatarPreview(profile.avatar_url);
  }, [profile]);

  const saveInfo = async () => {
    if (!user || !isSupabaseConfigured) return;
    setSavingInfo(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        prenom: prenom.trim().slice(0, 80) || null,
        nom:    nom.trim().slice(0, 80)    || null,
      });
    setSavingInfo(false);
    if (error) {
      toast({ title: t('profile.saveError'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('profile.saveSuccess') });
      reload();
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!user || !isSupabaseConfigured) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('profile.avatarTooBig'), variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: t('profile.avatarError'), description: upErr.message, variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from('profiles').upsert({ id: user.id, avatar_url: url });
    setAvatarPreview(url);
    setUploadingAvatar(false);
    toast({ title: t('profile.avatarSuccess') });
    reload();
  };

  const savePwd = async () => {
    const next = { new: newPwd.length < 8, confirm: confirmPwd !== newPwd };
    if (next.new || next.confirm) {
      setInvalidPwd(next);
      setTimeout(() => setInvalidPwd({}), 500);
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) {
      toast({ title: t('profile.pwdError'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('profile.pwdSuccess') });
      setNewPwd('');
      setConfirmPwd('');
    }
  };

  const initials = (() => {
    const p = prenom || profile?.prenom || '';
    const n = nom    || profile?.nom    || '';
    if (p && n) return (p[0] + n[0]).toUpperCase();
    if (p)      return p.slice(0, 2).toUpperCase();
    return (user?.email?.[0] ?? '?').toUpperCase();
  })();

  if (loading) return <ProfileSkeleton />;

  return (
    <StaggerGroup>
      <StaggerItem>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('profile.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('profile.subtitle')}</p>
          </div>
        </div>
      </StaggerItem>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <StaggerItem>
          <Card className="border-border/70 shadow-soft">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={t('profile.avatarAlt')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className={cn(
                    'absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full',
                    'bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110',
                    uploadingAvatar && 'opacity-60 cursor-not-allowed',
                  )}
                  aria-label={t('profile.changeAvatar')}
                >
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); }}
                />
              </div>

              <div className="space-y-1">
                <p className="text-lg font-semibold leading-tight">
                  {[profile?.prenom, profile?.nom].filter(Boolean).join(' ') || '—'}
                </p>
                <Badge variant="outline" className={cn('capitalize text-xs', ROLE_COLORS[role ?? 'particulier'])}>
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {t(`auth.role${(role ?? 'particulier').charAt(0).toUpperCase() + (role ?? 'particulier').slice(1)}`)}
                </Badge>
              </div>

              <div className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>

              {profile?.niveau_confiance !== undefined && (
                <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t('profile.trustLevel')}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">{profile.niveau_confiance}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <div className="space-y-6">
          <StaggerItem>
            <motion.div variants={fadeUp}>
              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-primary" />
                    {t('profile.infoTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="prenom">{t('profile.firstName')}</Label>
                      <AnimatedInput id="prenom" value={prenom} maxLength={80} placeholder={t('profile.firstNamePlaceholder')} onChange={(e) => setPrenom(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nom">{t('profile.lastName')}</Label>
                      <AnimatedInput id="nom" value={nom} maxLength={80} placeholder={t('profile.lastNamePlaceholder')} onChange={(e) => setNom(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={saveInfo} disabled={savingInfo} className="gap-2">
                      {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {t('common.save')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div variants={fadeUp}>
              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <KeyRound className="h-4 w-4 text-primary" />
                    {t('profile.pwdTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPwd">{t('profile.newPwd')}</Label>
                    <AnimatedInput id="newPwd" type="password" value={newPwd} invalid={invalidPwd.new} placeholder="••••••••" onChange={(e) => setNewPwd(e.target.value)} />
                    {invalidPwd.new && <p className="text-xs text-destructive">{t('profile.pwdMinLength')}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPwd">{t('profile.confirmPwd')}</Label>
                    <AnimatedInput id="confirmPwd" type="password" value={confirmPwd} invalid={invalidPwd.confirm} placeholder="••••••••" onChange={(e) => setConfirmPwd(e.target.value)} />
                    {invalidPwd.confirm && <p className="text-xs text-destructive">{t('profile.pwdMismatch')}</p>}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={savePwd} disabled={savingPwd} variant="outline" className="gap-2">
                      {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      {t('profile.pwdSubmit')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </div>
      </div>
    </StaggerGroup>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
