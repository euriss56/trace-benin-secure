/**
 * Scoring IMEI enrichi — simulation d'un système de détection de fraude.
 *
 * - 100% frontend, sans dépendance externe.
 * - Déterministe par défaut (même IMEI + mêmes flags ⇒ même score),
 *   avec une petite variation pseudo-aléatoire dérivée de l'IMEI
 *   pour éviter des résultats "trop parfaits" tout en restant reproductibles.
 * - Compatibilité totale avec l'ancienne signature :
 *     scoreImei({ imei, blacklist, activiteSuspecte })
 *   Les nouvelles features sont optionnelles ; si non fournies,
 *   elles sont simulées de façon réaliste à partir de l'IMEI.
 */

import { isValidLuhn } from "./luhn";

export type ImeiLabel = "LEGITIME" | "SUSPECT" | "VOLE";
export type FrequenceConnexion = "faible" | "moyenne" | "élevée";

export interface ImeiScoreInput {
  imei: string;
  blacklist?: boolean;
  activiteSuspecte?: boolean;
  // Nouvelles features (optionnelles — simulées si absentes)
  nbSimChanges?: number;          // 0–10
  nbPaysDifferents?: number;      // 0–5
  frequenceConnexion?: FrequenceConnexion;
  tentativesDeblocage?: number;   // 0–5
  ageAppareil?: number;           // en mois
}

export interface ImeiScoreFeatures {
  nbSimChanges: number;
  nbPaysDifferents: number;
  frequenceConnexion: FrequenceConnexion;
  tentativesDeblocage: number;
  ageAppareil: number;
}

export interface ImeiScoreResult {
  imei: string;
  tac: string;
  marque: string;
  validiteFormat: boolean;
  label: ImeiLabel;
  score: number;                              // risque [0..1]
  probabilities: Record<ImeiLabel, number>;
  reason: string[];
  features: ImeiScoreFeatures;
  color: "green" | "orange" | "red";
  icon: "shield" | "warning" | "alert";
}

/* ----------------------------- TAC database ----------------------------- */

const TAC_BY_BRAND: Record<string, string[]> = {
  Apple: ["35328110","35690511","35234112","35332811","35384910","35672108","35982410","35915209","35347410","35672510"],
  Samsung: ["35328211","35674811","35989510","35425410","35135010","35846110","35712410","35099110","35562711","35880710"],
  Huawei: ["86891212","86723410","86345112","86521209","86998510","86112310","86440710","86667812"],
  Xiaomi: ["86099010","86777712","86234510","86556710","86890110","86332210","86445510"],
  Tecno: ["86891005","86234504","86412305","86109810","86778210","86553410"],
  Itel: ["86555102","86777304","86223110","86909810"],
  Infinix: ["86998812","86112207","86445110","86660910"],
  Nokia: ["35712310","35489510","35223410"],
  Oppo: ["86345609","86778510","86119910"],
  Vivo: ["86567808","86990110","86445510"],
  Realme: ["86223411","86556610"],
};
const TAC_TO_BRAND: Record<string, string> = {};
for (const [brand, tacs] of Object.entries(TAC_BY_BRAND)) {
  for (const t of tacs) TAC_TO_BRAND[t] = brand;
}

/* ------------------------- Pseudo-aléatoire stable ----------------------- */

/** Hash 32-bit déterministe (FNV-1a) → utilisé comme seed depuis l'IMEI. */
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32 — séquence reproductible à partir d'un seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ----------------------- Simulation des features ------------------------ */

function simulateFeatures(imei: string, rnd: () => number): ImeiScoreFeatures {
  const freqRoll = rnd();
  const frequenceConnexion: FrequenceConnexion =
    freqRoll < 0.55 ? "moyenne" : freqRoll < 0.85 ? "faible" : "élevée";

  return {
    nbSimChanges: Math.floor(rnd() * 4),          // 0–3 typique
    nbPaysDifferents: Math.floor(rnd() * 3),      // 0–2 typique
    frequenceConnexion,
    tentativesDeblocage: Math.floor(rnd() * 3),   // 0–2 typique
    ageAppareil: 3 + Math.floor(rnd() * 45),      // 3–47 mois
  };
}

/* ------------------------------ Scoring -------------------------------- */

export function scoreImei(input: ImeiScoreInput): ImeiScoreResult {
  const imei = input.imei.trim();
  const blacklist = !!input.blacklist;
  const activite = !!input.activiteSuspecte;

  const tac = imei.slice(0, 8);
  const marque = TAC_TO_BRAND[tac] ?? "Inconnu";
  const validite = isValidLuhn(imei);
  const tacInconnu = marque === "Inconnu";

  // PRNG dérivé de l'IMEI + flags ⇒ même entrée = même sortie
  const seed = hashSeed(`${imei}|${blacklist ? 1 : 0}|${activite ? 1 : 0}`);
  const rnd = mulberry32(seed);

  // Features : valeurs fournies par l'appelant ou simulées
  const sim = simulateFeatures(imei, rnd);
  const features: ImeiScoreFeatures = {
    nbSimChanges: input.nbSimChanges ?? sim.nbSimChanges,
    nbPaysDifferents: input.nbPaysDifferents ?? sim.nbPaysDifferents,
    frequenceConnexion: input.frequenceConnexion ?? sim.frequenceConnexion,
    tentativesDeblocage: input.tentativesDeblocage ?? sim.tentativesDeblocage,
    ageAppareil: input.ageAppareil ?? sim.ageAppareil,
  };

  // Logique pondérée + collecte des explications
  const reason: string[] = [];
  let risk = 0.02;

  if (blacklist) { risk += 0.70; reason.push("Appareil blacklisté (signalé volé)"); }
  if (!validite) { risk += 0.30; reason.push("IMEI invalide (échec Luhn)"); }
  if (activite)  { risk += 0.25; reason.push("Activité inhabituelle détectée"); }
  if (tacInconnu){ risk += 0.20; reason.push("TAC inconnu — modèle non identifié"); }
  if (features.nbSimChanges > 3)      { risk += 0.15; reason.push(`Trop de changements de SIM (${features.nbSimChanges})`); }
  if (features.nbPaysDifferents > 2)  { risk += 0.15; reason.push(`Connexions depuis ${features.nbPaysDifferents} pays différents`); }
  if (features.tentativesDeblocage > 2){ risk += 0.20; reason.push(`Tentatives de déblocage suspectes (${features.tentativesDeblocage})`); }
  if (features.frequenceConnexion === "élevée") { risk += 0.10; reason.push("Fréquence de connexion élevée"); }

  // Petite variation reproductible (±0.03) pour un rendu plus "naturel"
  const jitter = (rnd() - 0.5) * 0.06;
  risk = Math.min(1, Math.max(0, risk + jitter));

  if (reason.length === 0) reason.push("Aucun signal de risque détecté");

  // Probabilités douces dérivées du score
  const probabilities = softProbabilities(risk);
  const label: ImeiLabel =
    risk > 0.75 ? "VOLE" : risk >= 0.4 ? "SUSPECT" : "LEGITIME";

  const color = label === "LEGITIME" ? "green" : label === "SUSPECT" ? "orange" : "red";
  const icon  = label === "LEGITIME" ? "shield" : label === "SUSPECT" ? "warning" : "alert";

  return {
    imei,
    tac,
    marque,
    validiteFormat: validite,
    label,
    score: Number(risk.toFixed(4)),
    probabilities,
    reason,
    features,
    color,
    icon,
  };
}

/** Distribution douce (somme = 1) en fonction du risque. */
function softProbabilities(risk: number): Record<ImeiLabel, number> {
  // Centres : LEGITIME ≈ 0.1, SUSPECT ≈ 0.55, VOLE ≈ 0.9
  const legit = Math.exp(-Math.pow((risk - 0.10) / 0.20, 2));
  const susp  = Math.exp(-Math.pow((risk - 0.55) / 0.18, 2));
  const vole  = Math.exp(-Math.pow((risk - 0.90) / 0.20, 2));
  const sum = legit + susp + vole || 1;
  return {
    LEGITIME: Number((legit / sum).toFixed(4)),
    SUSPECT:  Number((susp  / sum).toFixed(4)),
    VOLE:     Number((vole  / sum).toFixed(4)),
  };
}
