import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, History, Smartphone, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface Stats {
  monthCount: number;
  totalCount: number;
  declarationCount: number;
  stolenHits: number;
}

export function OverviewView() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<Stats>({ monthCount: 0, totalCount: 0, declarationCount: 0, stolenHits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    Promise.all([
      supabase.from('verifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('verifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase.from('declarations').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase.from('verifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'stolen'),
    ]).then(([m, t, d, s]) => {
      setStats({
        monthCount: m.count ?? 0,
        totalCount: t.count ?? 0,
        declarationCount: d.count ?? 0,
        stolenHits: s.count ?? 0,
      });
      setLoading(false);
    });
  }, [user]);

  const isPro = role === 'dealer' || role === 'technicien';
  const certified = isPro && stats.monthCount >= 20;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue {user?.email?.split('@')[0]} —{' '}
          <span className="uppercase text-xs tracking-wide text-primary">{role ?? 'particulier'}</span>
        </p>
      </div>

      {certified && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <div className="font-semibold flex items-center gap-2">
                Dealer Certifié
                <Badge className="bg-primary text-primary-foreground">Actif</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Vous avez vérifié {stats.monthCount} IMEI ce mois-ci (seuil 20). Ce badge est public.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Vérifications ce mois" value={loading ? '…' : stats.monthCount} />
        <StatCard icon={History} label="Total vérifications" value={loading ? '…' : stats.totalCount} />
        <StatCard icon={Smartphone} label="Mes déclarations" value={loading ? '…' : stats.declarationCount} />
        <StatCard icon={ShieldCheck} label="IMEI signalés volés" value={loading ? '…' : stats.stolenHits} accent />
      </div>

      {isPro && !certified && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progression badge Dealer Certifié</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              {stats.monthCount} / 20 vérifications ce mois — encore {Math.max(0, 20 - stats.monthCount)} pour décrocher le badge.
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (stats.monthCount / 20) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Award;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Icon className={`h-5 w-5 ${accent ? 'text-destructive' : 'text-primary'}`} />
          <span className="text-2xl font-bold tabular-nums">{value}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
