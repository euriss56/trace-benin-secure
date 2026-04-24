import { Link, NavLink } from 'react-router-dom';
import { Shield, LogOut, Map as MapIcon, LayoutDashboard, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS } from '@/i18n';

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('tib-theme') as 'light' | 'dark' | null;
    const initial = stored ?? 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('tib-theme', next);
  };

  const changeLang = (code: string) => {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const currentLang = SUPPORTED_LANGS.find((l) => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGS[0];

  const canSeeMap = role === 'enqueteur' || role === 'admin';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-foreground/70'
    );

  return (
    <>
      <div className="benin-stripe" />
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">TraceIMEI-BJ</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={linkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/verify" className={linkClass}>
              {t('nav.verify')}
            </NavLink>
            {user && (
              <NavLink to="/declare" className={linkClass}>
                {t('nav.declare')}
              </NavLink>
            )}
            {canSeeMap && (
              <NavLink to="/map" className={linkClass}>
                {t('nav.map')}
              </NavLink>
            )}
            <NavLink to="/privacy" className={linkClass}>
              {t('nav.privacy')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('common.language')}
                  className="gap-1.5 px-2"
                >
                  <span aria-hidden>{currentLang.flag}</span>
                  <span className="text-xs font-semibold">{currentLang.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                  <Languages className="h-3.5 w-3.5" />
                  {t('common.language')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUPPORTED_LANGS.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={cn(l.code === currentLang.code && 'bg-accent')}
                  >
                    <span className="mr-2" aria-hidden>{l.flag}</span>
                    <span className="font-semibold mr-2">{l.label}</span>
                    <span className="text-muted-foreground text-xs">{l.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={t('nav.toggleTheme')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {!user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to="/register">{t('nav.register')}</Link>
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-normal text-xs text-muted-foreground">{user.email}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-primary">
                      {role ?? 'particulier'}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  {canSeeMap && (
                    <DropdownMenuItem asChild>
                      <Link to="/map">
                        <MapIcon className="mr-2 h-4 w-4" />
                        {t('nav.map')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
