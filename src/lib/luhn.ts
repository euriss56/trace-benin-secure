/**
 * Validation Luhn d'un numéro IMEI (15 chiffres).
 * Retourne true si l'IMEI est mathématiquement valide.
 */
export function isValidLuhn(imei: string): boolean {
  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;
  // On parcourt de droite à gauche, on commence par doubler le 2e chiffre depuis la droite.
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[14 - i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Garde uniquement les chiffres et tronque à 15 caractères.
 */
export function sanitizeImei(input: string): string {
  return input.replace(/\D/g, "").slice(0, 15);
}

/**
 * Extrait le TAC (Type Allocation Code) — les 8 premiers chiffres.
 */
export function extractTac(imei: string): string {
  return imei.slice(0, 8);
}
