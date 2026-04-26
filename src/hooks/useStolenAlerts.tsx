import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Subscribe enquêteurs / admins to real-time INSERTs on the `declarations`
 * (stolen phones) table and surface a toast notification.
 */
export function useStolenAlerts() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    if (role !== 'enqueteur' && role !== 'admin') return;

    // Avoid alerting on the very first session load (only new events after mount)
    const mountedAt = Date.now();

    const channel = supabase
      .channel('stolen-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'declarations' },
        (payload) => {
          const row = payload.new as {
            imei?: string;
            brand?: string;
            model?: string;
            city?: string;
            created_at?: string;
          };
          // Defensive: ignore replays older than mount
          if (row.created_at && new Date(row.created_at).getTime() < mountedAt - 60_000) return;

          const imei = row.imei ? `IMEI ${row.imei.slice(0, 6)}…${row.imei.slice(-2)}` : 'IMEI inconnu';
          const device = [row.brand, row.model].filter(Boolean).join(' ') || 'Appareil non renseigné';
          const where = row.city ? ` · ${row.city}` : '';

          toast.error('Nouveau vol signalé', {
            description: `${device} — ${imei}${where}`,
            icon: <ShieldAlert className="h-4 w-4" />,
            duration: 8000,
            action: {
              label: 'Voir',
              onClick: () => navigate('/dashboard/cases'),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, navigate]);
}
