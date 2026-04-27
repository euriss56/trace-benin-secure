import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { VerificationResult } from './verify-api';

/**
 * Persiste une vérification IMEI pour l'utilisateur courant.
 * Reste silencieux si non connecté (préférence projet).
 * Les erreurs Supabase sont loggées en console pour faciliter le diagnostic
 * (typiquement un échec d'INSERT signifie une policy RLS manquante).
 */
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
