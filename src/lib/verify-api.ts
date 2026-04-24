/**
 * Client de l'API ML de vérification IMEI.
 * Si VITE_ML_API_URL n'est pas configuré (ou que l'API est indisponible),
 * on bascule sur un mock déterministe pour permettre le développement.
 */
import { extractTac, isValidLuhn } from "./luhn";

export type VerificationStatus = "legitimate" | "suspect" | "stolen";

export interface VerificationResult {
  imei: string;
  status: VerificationStatus;
  score: number; // 0.0 à 1.0
  responseTimeMs: number;
  luhnValid: boolean;
  tac: string;
  reasons: string[];
  checkedAt: number; // timestamp ms
  source: "api" | "mock" | "cache";
}

const ML_API_URL = import.meta.env.VITE_ML_API_URL as string | undefined;
const PLACEHOLDER_HOSTS = ["placeholder.com", "your-flask-api.com"];

function isPlaceholderUrl(url?: string): boolean {
  if (!url) return true;
  try {
    const host = new URL(url).hostname;
    return PLACEHOLDER_HOSTS.some((p) => host.endsWith(p));
  } catch {
    return true;
  }
}

/**
 * Mock déterministe : utilise les 3 derniers chiffres pour répartir les statuts.
 * Permet de tester l'UI sans API en ligne.
 */
function mockVerify(imei: string, started: number): VerificationResult {
  const luhnValid = isValidLuhn(imei);
  const tail = parseInt(imei.slice(-3), 10) || 0;
  const reasons: string[] = [];

  let status: VerificationStatus = "legitimate";
  let score = 0.05;

  if (!luhnValid) {
    status = "suspect";
    score = 0.65;
    reasons.push("Échec de la validation Luhn — IMEI mathématiquement invalide.");
  } else if (tail % 17 === 0) {
    status = "stolen";
    score = 0.92;
    reasons.push("IMEI présent dans la base des appareils signalés volés.");
    reasons.push("Plusieurs déclarations enregistrées dans le quartier d'origine.");
  } else if (tail % 7 === 0) {
    status = "suspect";
    score = 0.55;
    reasons.push("TAC inconnu de la base GSMA.");
    reasons.push("Activité réseau atypique détectée.");
  } else {
    reasons.push("Validation Luhn réussie.");
    reasons.push("TAC reconnu — appareil officiellement homologué.");
    reasons.push("Aucun signalement actif sur cet IMEI.");
  }

  return {
    imei,
    status,
    score,
    responseTimeMs: Math.max(1, Date.now() - started),
    luhnValid,
    tac: extractTac(imei),
    reasons,
    checkedAt: Date.now(),
    source: "mock",
  };
}

export async function verifyImei(imei: string, signal?: AbortSignal): Promise<VerificationResult> {
  const started = Date.now();

  if (isPlaceholderUrl(ML_API_URL)) {
    // Petite latence simulée pour ressembler à un vrai appel.
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
    return mockVerify(imei, started);
  }

  try {
    const res = await fetch(`${ML_API_URL!.replace(/\/$/, "")}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imei }),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      imei,
      status: (data.status as VerificationStatus) ?? "suspect",
      score: typeof data.score === "number" ? data.score : 0.5,
      responseTimeMs: Math.max(1, Date.now() - started),
      luhnValid: isValidLuhn(imei),
      tac: extractTac(imei),
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      checkedAt: Date.now(),
      source: "api",
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    console.warn("[verifyImei] API indisponible, fallback mock", err);
    return mockVerify(imei, started);
  }
}
