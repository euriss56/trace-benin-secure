import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  Map as MapIcon,
  Users,
  BarChart3,
  History,
  UserCircle2,
} from 'lucide-react';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { useStolenAlerts } from '@/hooks/useStolenAlerts';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard.nav.overview', icon: LayoutDashboard },
  { to: '/dashboard/history', labelKey: 'dashboard.nav.history', icon: History, roles: ['particulier', 'dealer', 'technicien'] },
  { to: '/dashboard/declarations', labelKey: 'dashboard.nav.declarations', icon: Smartphone, roles: ['particulier', 'dealer', 'technicien'] },
  { to: '/dashboard/cases', labelKey: 'dashboard.nav.cases', icon: ShieldCheck, roles: ['enqueteur', 'admin'] },
  { to: '/dashboard/map', labelKey: 'dashboard.nav.map', icon: MapIcon, roles: ['enqueteur', 'admin'] },
  { to: '/dashboard/users', labelKey: 'dashboard.nav.users', icon: Users, roles: ['admin'] },
  { to: '/dashboard/metrics', labelKey: 'dashboard.nav.metrics', icon: BarChart3, roles: ['admin'] },
  { to: '/dashboard/profile', labelKey: 'dashboard.nav.profile', icon: UserCircle2 },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const { t } = useTranslation();
  useStolenAlerts();
  const items = NAV.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="rounded-2xl border border-border/70 bg-card p-2 shadow-soft space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground hover:translate-x-0.5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
