import { Link, NavLink } from 'react-router-dom';
import { Shield, LogOut, Map as MapIcon, LayoutDashboard, Moon, Sun, Languages, Phone, Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const currentLang = SUPPORTED_LANGS.find((l) => l.code === i18n.resolvedLanguage) ?? SUPPORTED_LANGS[0];
  const canSeeMap = role === 'enqueteur' || role === 'admin';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-foreground/70'
    );

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block px-4 py-3 text-base font-medium border-b border-border transition-colors hover:text-primary hover:bg-primary/10',
      isActive ? 'text-primary bg-primary/5' : 'text-foreground/70'
    );

  return (
    <>
      <div className="benin-stripe" />
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-2">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">TraceIMEI-BJ</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" end className={linkClass}>{t('nav.home')}</NavLink>
            <NavLink to="/verify" className={linkClass}>{t('nav.verify')}</NavLink>
            {user && (
              <NavLink to="/declare" className={linkClass}>{t('nav.declare')}</NavLink>
            )}
            {canSeeMap && (
              <NavLink to="/map" className={linkClass}>{t('nav.map')}</NavLink>
            )}
            <NavLink to="/contacts-police" className={linkClass}>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Contacts Police
              </span>
            </NavLink>
            <NavLink to="/privacy" className={linkClass}>{t('nav.privacy')}</NavLink>
          </nav>

          {/* Actions droite */}
          <div className="flex items-center gap-1">
            {/* Langue */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={t('common.language')} className="gap-1.5 px-2">
                  <span aria-hidden>{currentLang.flag}</span>
                  <span className="text-xs font-semibold hidden sm:inline">{currentLang.label}</span>
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

            {/* Thème */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('nav.toggleTheme')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* User desktop */}
            {!user ? (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to="/register">{t('nav.register')}</Link>
                </Button>
              </div>
            ) : (
              <div className="hidden md:block">
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
              </div>
            )}

            {/* Hamburger mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background fixed top-16 left-0 right-0 bottom-0 z-50 overflow-y-auto">
            <nav className="flex flex-col">
              <NavLink to="/" end className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/verify" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.verify')}
              </NavLink>
              {user && (
                <NavLink to="/declare" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  {t('nav.declare')}
                </NavLink>
              )}
              {canSeeMap && (
                <NavLink to="/map" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  {t('nav.map')}
                </NavLink>
              )}
              <NavLink to="/contacts-police" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contacts Police
                </span>
              </NavLink>
              <NavLink to="/privacy" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.privacy')}
              </NavLink>

              {/* Auth mobile */}
              <div className="p-4 border-t border-border">
                {!user ? (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>{t('nav.login')}</Link>
                    </Button>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link to="/register" onClick={() => setMobileOpen(false)}>{t('nav.register')}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    <div className="text-xs uppercase tracking-wide text-primary font-semibold">
                      {role ?? 'particulier'}
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t('nav.dashboard')}
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { signOut(); setMobileOpen(false); }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('nav.logout')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
