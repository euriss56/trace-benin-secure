import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface DeclRow {
  id: string;
  reference: string;
  brand: string;
  model: string;
  imei: string;
  quartier: string;
  status: 'declared' | 'in_progress' | 'resolved';
  created_at: string;
}

const statusLabel: Record<DeclRow['status'], string> = {
  declared: 'Déclaré',
  in_progress: 'En cours',
  resolved: 'Résolu',
};
const statusClass: Record<DeclRow['status'], string> = {
  declared: 'bg-destructive text-destructive-foreground',
  in_progress: 'bg-warning text-warning-foreground',
  resolved: 'bg-success text-success-foreground',
};

export function MyDeclarationsView() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DeclRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from('declarations')
      .select('id, reference, brand, model, imei, quartier, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as DeclRow[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mes déclarations de vol</CardTitle>
        <Button asChild size="sm">
          <Link to="/declare"><Plus className="mr-1 h-4 w-4" />Nouvelle</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune déclaration enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Référence</th>
                  <th className="py-2 pr-3">Appareil</th>
                  <th className="py-2 pr-3">IMEI</th>
                  <th className="py-2 pr-3">Quartier</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{r.reference}</td>
                    <td className="py-2 pr-3">{r.brand} {r.model}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.imei}</td>
                    <td className="py-2 pr-3">{r.quartier}</td>
                    <td className="py-2 pr-3">
                      <Badge className={statusClass[r.status]}>{statusLabel[r.status]}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
