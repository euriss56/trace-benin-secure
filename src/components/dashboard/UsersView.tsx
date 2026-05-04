import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
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
import { useDebounce } from '@/hooks/useDebounce';

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
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const debouncedSearch = useDebounce(search, 300);

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

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!q) return true;
      return r.user_id.toLowerCase().includes(q);
    });
  }, [rows, roleFilter, debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Toolbar sticky pour rester accessible pendant le scroll. */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:mx-0 sm:rounded-2xl sm:border sm:px-4 sm:shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold sm:text-lg">{t('dashboard.users.title')}</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.users.searchPlaceholder', { defaultValue: 'Rechercher un User ID…' })}
                className="h-9 pl-8"
                inputMode="search"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | 'all')}>
              <SelectTrigger className="h-9 w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.users.filterAll', { defaultValue: 'Tous les rôles' })}</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('dashboard.users.empty')}</div>
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableHeaderCell>{t('dashboard.users.tableUserId')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.users.tableCurrentRole')}</DataTableHeaderCell>
                <DataTableHeaderCell>{t('dashboard.users.tableEdit')}</DataTableHeaderCell>
              </DataTableHeader>
              <DataTableBody>
                {filtered.map((r) => (
                  <DataTableRow key={r.user_id}>
                    <DataTableCell className="max-w-[160px] font-mono text-xs sm:max-w-none">
                      <span className="block break-all">{r.user_id}</span>
                      {r.user_id === me?.id && <Badge variant="outline" className="mt-1">{t('dashboard.users.you')}</Badge>}
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
                        <SelectTrigger className="h-8 w-full min-w-[140px] text-xs sm:w-[160px]"><SelectValue /></SelectTrigger>
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
    </div>
  );
}
