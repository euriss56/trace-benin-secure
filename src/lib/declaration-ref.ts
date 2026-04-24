/**
 * Génère une référence unique de déclaration au format BJ-AAAA-XXXXX.
 * Vérifie l'unicité contre la table `declarations`.
 */
import { supabase } from "@/integrations/supabase/client";

function randomSuffix(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function generateDeclarationReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = `BJ-${year}-${randomSuffix()}`;
    const { data, error } = await supabase
      .from("declarations")
      .select("reference")
      .eq("reference", ref)
      .maybeSingle();
    if (error) {
      console.warn("[reference] check error", error);
      // En cas d'erreur réseau, on retourne quand même une référence — l'unique constraint côté DB protégera.
      return ref;
    }
    if (!data) return ref;
  }
  // Garde-fou : suffixe étendu si collisions répétées (très improbable).
  return `BJ-${year}-${Date.now().toString().slice(-6)}`;
}
