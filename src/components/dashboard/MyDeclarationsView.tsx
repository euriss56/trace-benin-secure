import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { declarationStatusClass, declarationStatusLabel, type DeclarationStatus } from '@/lib/status-style';

interface DeclRow {
  id: string;
  reference: string;
  brand: string;
  model: string;
  imei: string;
  quartier: string;
  status: DeclarationStatus;
  created_at: string;
}

export function MyDeclarationsView() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
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
        <CardTitle>{t('dashboard.declarations.title')}</CardTitle>
        <Button asChild size="sm">
          <Link to="/declare"><Plus className="mr-1 h-4 w-4" />{t('dashboard.declarations.newButton')}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('dashboard.declarations.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableRef')}</th>
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableDevice')}</th>
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableImei')}</th>
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableQuartier')}</th>
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableStatus')}</th>
                  <th className="py-2 pr-3">{t('dashboard.declarations.tableDate')}</th>
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
                      {new Date(r.created_at).toLocaleDateString(i18n.language)}
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
