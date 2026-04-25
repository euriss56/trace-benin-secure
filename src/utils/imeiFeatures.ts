/**
 * Calcul des features IMEI envoyées au modèle ML.
 * Toutes ces features sont calculables côté client (déterministes).
 */
import { isValidLuhn } from "@/lib/luhn";
import { lookupTac } from "@/data/tacDatabase";

export interface ImeiFeatures {
  luhn_valid: boolean;
  tac_code: string;
  manufacturer: string;
  imei_length_valid: boolean;
  all_same_digits: boolean;
  sequential_digits: boolean;
  known_test_imei: boolean;
}

const KNOWN_TEST_IMEIS = new Set<string>([
  "000000000000000",
  "123456789012345",
  "111111111111111",
  "999999999999999",
  "012345678901234",
]);

export function isAllSameDigits(imei: string): boolean {
  return /^(\d)\1{14}$/.test(imei);
}

export function isSequentialDigits(imei: string): boolean {
  if (imei.length !== 15) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < imei.length; i++) {
    const prev = parseInt(imei[i - 1], 10);
    const cur = parseInt(imei[i], 10);
    if (cur !== (prev + 1) % 10) asc = false;
    if (cur !== (prev - 1 + 10) % 10) desc = false;
  }
  return asc || desc;
}

export function computeImeiFeatures(imei: string): ImeiFeatures {
  const tac = imei.slice(0, 8);
  const { manufacturer } = lookupTac(tac);
  return {
    luhn_valid: isValidLuhn(imei),
    tac_code: tac,
    manufacturer,
    imei_length_valid: imei.length === 15 && /^\d+$/.test(imei),
    all_same_digits: isAllSameDigits(imei),
    sequential_digits: isSequentialDigits(imei),
    known_test_imei: KNOWN_TEST_IMEIS.has(imei),
  };
}
