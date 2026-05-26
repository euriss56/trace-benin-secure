import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth, type AppRole } from '@/hooks/useAuth';

export interface Profile {
  id: string;
  prenom: string | null;
  nom: string | null;
  role: AppRole | null;
  avatar_url: string | null;
  niveau_confiance: number;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, prenom, nom, role, avatar_url, niveau_confiance')
      .eq('id', user.id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  return { profile, loading: loading || authLoading, reload: load };
}
