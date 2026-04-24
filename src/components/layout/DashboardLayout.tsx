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
} from 'lucide-react';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { to: '/dashboard/history', label: 'Mes vérifications', icon: History, roles: ['particulier', 'dealer', 'technicien'] },
  { to: '/dashboard/declarations', label: 'Mes déclarations', icon: Smartphone, roles: ['particulier', 'dealer', 'technicien'] },
  { to: '/dashboard/cases', label: 'Signalements', icon: ShieldCheck, roles: ['enqueteur', 'admin'] },
  { to: '/dashboard/map', label: 'Carte', icon: MapIcon, roles: ['enqueteur', 'admin'] },
  { to: '/dashboard/users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { to: '/dashboard/metrics', label: 'Métriques ML', icon: BarChart3, roles: ['admin'] },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const items = NAV.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <nav className="rounded-lg border border-border bg-card p-2 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
