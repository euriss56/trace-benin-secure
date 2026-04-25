/**
 * Service ML — communication avec l'API VITE_ML_API_URL.
 * - checkIMEI : vérification unitaire
 * - batchCheckIMEI : vérification en lot
 * - Fallback local déterministe si l'API est indisponible
 * - Statut de disponibilité de l'API (mlStatus)
 */
import { computeImeiFeatures, type ImeiFeatures } from "@/utils/imeiFeatures";
import { lookupTac } from "@/data/tacDatabase";

export type MlStatus = "legitime" | "suspect" | "vole";

export interface MlResult {
  imei: string;
  score: number;                     // 0..1, plus élevé = plus suspect
  status: MlStatus;
  manufacturer: string;
  model_series: string;
  details: Record<string, unknown>;
  response_time_ms: number;
  source: "api" | "fallback";
}

const ML_API_URL = (import.meta.env.VITE_ML_API_URL as string | undefined)?.replace(/\/$/, "");
const PLACEHOLDER_HOSTS = ["placeholder.com", "your-flask-api.com", "example.com"];

function isPlaceholder(url?: string): boolean {
  if (!url) return true;
  try {
    const host = new URL(url).hostname;
    return PLACEHOLDER_HOSTS.some((p) => host.endsWith(p));
  } catch {
    return true;
  }
}

// === Statut global de l'API ML (observable par les composants) ===
type Listener = (available: boolean) => void;
let mlAvailable: boolean | null = isPlaceholder(ML_API_URL) ? false : null;
const listeners = new Set<Listener>();

export function getMlAvailability(): boolean | null {
  return mlAvailable;
}

export function subscribeMlStatus(cb: Listener): () => void {
  listeners.add(cb);
  if (mlAvailable !== null) cb(mlAvailable);
  return () => listeners.delete(cb);
}

function setAvailable(v: boolean) {
  if (mlAvailable !== v) {
    mlAvailable = v;
    listeners.forEach((cb) => cb(v));
  }
}

// === Fallback local ===
function statusFromScore(score: number): MlStatus {
  if (score >= 0.8) return "vole";
  if (score >= 0.5) return "suspect";
  return "legitime";
}

function fallbackScore(features: ImeiFeatures): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0.1;

  if (features.known_test_imei) {
    score = Math.max(score, 0.99);
    reasons.push("IMEI de test connu");
  }
  if (!features.luhn_valid) {
    score = Math.max(score, 0.95);
    reasons.push("Échec Luhn");
  }
  if (features.all_same_digits) {
    score = Math.max(score, 0.9);
    reasons.push("Chiffres tous identiques");
  }
  if (features.sequential_digits) {
    score = Math.max(score, 0.85);
    reasons.push("Chiffres séquentiels");
  }
  if (!features.imei_length_valid) {
    score = Math.max(score, 0.8);
    reasons.push("Longueur invalide");
  }
  if (reasons.length === 0) reasons.push("Aucune anomalie locale détectée");

  return { score, reasons };
}

function fallbackResult(imei: string, started: number): MlResult {
  const features = computeImeiFeatures(imei);
  const tacInfo = lookupTac(features.tac_code);
  const { score, reasons } = fallbackScore(features);
  return {
    imei,
    score,
    status: statusFromScore(score),
    manufacturer: tacInfo.manufacturer,
    model_series: tacInfo.model_series,
    details: { features, reasons, mode: "local-fallback" },
    response_time_ms: Math.max(1, Date.now() - started),
    source: "fallback",
  };
}

// === API calls ===
async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${ML_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface ApiCheckResponse {
  score: number;
  status: MlStatus | string;
  details?: Record<string, unknown>;
  response_time_ms?: number;
}

export async function checkIMEI(imei: string, signal?: AbortSignal): Promise<MlResult> {
  const started = Date.now();
  const features = computeImeiFeatures(imei);
  const tacInfo = lookupTac(features.tac_code);

  if (isPlaceholder(ML_API_URL)) {
    setAvailable(false);
    return fallbackResult(imei, started);
  }

  try {
    const data = await postJson<ApiCheckResponse>("/api/check-imei", { imei, features }, signal);
    setAvailable(true);
    const score = typeof data.score === "number" ? data.score : 0.5;
    const status = (["legitime", "suspect", "vole"].includes(String(data.status))
      ? data.status
      : statusFromScore(score)) as MlStatus;
    return {
      imei,
      score,
      status,
      manufacturer: tacInfo.manufacturer,
      model_series: tacInfo.model_series,
      details: data.details ?? {},
      response_time_ms: data.response_time_ms ?? Math.max(1, Date.now() - started),
      source: "api",
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    console.warn("[mlService] API ML indisponible — fallback local", err);
    setAvailable(false);
    return fallbackResult(imei, started);
  }
}

export async function batchCheckIMEI(imeis: string[], signal?: AbortSignal): Promise<MlResult[]> {
  const started = Date.now();
  if (isPlaceholder(ML_API_URL)) {
    setAvailable(false);
    return imeis.map((i) => fallbackResult(i, started));
  }
  try {
    const data = await postJson<{ results: ApiCheckResponse[] }>("/api/batch-check", { imeis }, signal);
    setAvailable(true);
    return imeis.map((imei, idx) => {
      const r = data.results?.[idx];
      const tacInfo = lookupTac(imei.slice(0, 8));
      const score = typeof r?.score === "number" ? r.score : 0.5;
      const status = (r && ["legitime", "suspect", "vole"].includes(String(r.status))
        ? r.status
        : statusFromScore(score)) as MlStatus;
      return {
        imei,
        score,
        status,
        manufacturer: tacInfo.manufacturer,
        model_series: tacInfo.model_series,
        details: r?.details ?? {},
        response_time_ms: r?.response_time_ms ?? Math.max(1, Date.now() - started),
        source: "api",
      };
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    console.warn("[mlService] batch API indisponible — fallback", err);
    setAvailable(false);
    return imeis.map((i) => fallbackResult(i, started));
  }
}

/**
 * Ping passif : tente un check sur un IMEI factice valide pour rafraîchir le statut.
 * À appeler depuis le dashboard pour afficher l'état temps réel.
 */
export async function pingMlApi(): Promise<boolean> {
  if (isPlaceholder(ML_API_URL)) {
    setAvailable(false);
    return false;
  }
  try {
    const res = await fetch(`${ML_API_URL}/api/health`, { method: "GET" });
    const ok = res.ok;
    setAvailable(ok);
    return ok;
  } catch {
    setAvailable(false);
    return false;
  }
}
