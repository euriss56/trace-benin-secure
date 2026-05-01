import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { VerificationResult } from './verify-api';

export async function recordVerification(
  result: VerificationResult,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'supabase-not-configured' };

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    console.info('[recordVerification] utilisateur non connecté — vérification non sauvegardée');
    return { ok: false, error: 'not-authenticated' };
  }

  // Vérifier si une entrée récente existe déjà (moins d'1 heure)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('verifications')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('imei', result.imei)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.info('[recordVerification] vérification ignorée — même IMEI vérifié il y a moins d\'1h');
    return { ok: true };
  }

  const { error } = await supabase.from('verifications').insert({
    user_id: user.id,
    imei: result.imei,
    status: result.status,
    score: result.score,
    response_time_ms: result.responseTimeMs,
    luhn_valid: result.luhnValid,
    tac: result.tac,
    source: result.source,
  });

  if (error) {
    console.error('[recordVerification] échec INSERT verifications:', error.message, error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export interface VerificationRow {
  id: string;
  imei: string;
  status: 'legitimate' | 'suspect' | 'stolen';
  score: number;
  response_time_ms: number;
  luhn_valid: boolean;
  tac: string;
  source: string;
  created_at: string;
}
