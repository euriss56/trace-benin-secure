import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserRoleRow {
  user_id: string;
  role: AppRole;
}

const ROLES: AppRole[] = ['particulier', 'dealer', 'technicien', 'enqueteur', 'admin'];

export function UsersView() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from('user_roles')
      .select('user_id, role')
      .order('user_id')
      .then(({ data, error }) => {
        if (error) toast.error('Erreur', { description: error.message });
        setRows((data ?? []) as UserRoleRow[]);
        setLoading(false);
      });
  }, []);

  const changeRole = async (userId: string, newRole: AppRole) => {
    // Replace strategy: delete then insert (table has UNIQUE(user_id, role))
    const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (delErr) { toast.error('Échec', { description: delErr.message }); return; }
    const { error: insErr } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
    if (insErr) { toast.error('Échec', { description: insErr.message }); return; }
    toast.success('Rôle mis à jour');
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role: newRole } : r)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des utilisateurs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucun utilisateur.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">User ID</th>
                  <th className="py-2 pr-3">Rôle actuel</th>
                  <th className="py-2 pr-3">Modifier</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">
                      {r.user_id}
                      {r.user_id === me?.id && <Badge variant="outline" className="ml-2">vous</Badge>}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="secondary" className="uppercase tracking-wide">{r.role}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Select
                        value={r.role}
                        onValueChange={(v) => changeRole(r.user_id, v as AppRole)}
                        disabled={r.user_id === me?.id}
                      >
                        <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Vous ne pouvez pas modifier votre propre rôle pour éviter de vous verrouiller hors de l'admin.
        </p>
      </CardContent>
    </Card>
  );
}
