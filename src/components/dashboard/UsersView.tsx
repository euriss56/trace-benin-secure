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
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/ui/data-table';
import { TableSkeleton } from '@/components/ui/loaders';

interface UserRoleRow {
  user_id: string;
  role: AppRole;
}

const ROLES: AppRole[] = ['particulier', 'dealer', 'technicien', 'enqueteur', 'admin'];

export function UsersView() {
  const { user: me } = useAuth();
  const { t } = useTranslation();
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from('user_roles')
      .select('user_id, role')
      .order('user_id')
      .then(({ data, error }) => {
        if (error) toast.error(t('common.error'), { description: error.message });
        setRows((data ?? []) as UserRoleRow[]);
        setLoading(false);
      });
  }, [t]);

  const changeRole = async (userId: string, newRole: AppRole) => {
    const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (delErr) { toast.error(t('dashboard.users.updateError'), { description: delErr.message }); return; }
    const { error: insErr } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
    if (insErr) { toast.error(t('dashboard.users.updateError'), { description: insErr.message }); return; }
    toast.success(t('dashboard.users.updateSuccess'));
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role: newRole } : r)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.users.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('dashboard.users.empty')}</div>
        ) : (
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell>{t('dashboard.users.tableUserId')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.users.tableCurrentRole')}</DataTableHeaderCell>
              <DataTableHeaderCell>{t('dashboard.users.tableEdit')}</DataTableHeaderCell>
            </DataTableHeader>
            <DataTableBody>
              {rows.map((r) => (
                <DataTableRow key={r.user_id}>
                  <DataTableCell className="font-mono text-xs">
                    <span className="break-all">{r.user_id}</span>
                    {r.user_id === me?.id && <Badge variant="outline" className="ml-2">{t('dashboard.users.you')}</Badge>}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="secondary" className="uppercase tracking-wide">{r.role}</Badge>
                  </DataTableCell>
                  <DataTableCell>
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
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{t('dashboard.users.selfWarn')}</p>
      </CardContent>
    </Card>
  );
}
