import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { VerificationResult } from './verify-api';

/**
 * Persiste une vérification IMEI pour l'utilisateur courant (silencieux si offline ou non connecté).
 */
export async function recordVerification(result: VerificationResult): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('verifications').insert({
    user_id: user.id,
    imei: result.imei,
    status: result.status,
    score: result.score,
    response_time_ms: result.responseTimeMs,
    luhn_valid: result.luhnValid,
    tac: result.tac,
    source: result.source,
  });
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
