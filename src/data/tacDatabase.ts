/**
 * Base de données locale des TAC (Type Allocation Code) — 8 premiers chiffres de l'IMEI.
 * Couvre les 20 marques/séries les plus courantes au Bénin.
 * Source : agrégation publique GSMA + observations terrain.
 */
export interface TacEntry {
  tac: string;
  manufacturer: string;
  model_series: string;
}

export const TAC_DATABASE: TacEntry[] = [
  // Samsung (très répandu)
  { tac: "35328211", manufacturer: "Samsung", model_series: "Galaxy A14" },
  { tac: "35674811", manufacturer: "Samsung", model_series: "Galaxy A05" },
  { tac: "35989510", manufacturer: "Samsung", model_series: "Galaxy A24" },
  // Tecno (leader Afrique de l'Ouest)
  { tac: "86891005", manufacturer: "Tecno", model_series: "Spark 10" },
  { tac: "86234504", manufacturer: "Tecno", model_series: "Camon 20" },
  { tac: "86412305", manufacturer: "Tecno", model_series: "Pop 7" },
  // Itel (entrée de gamme dominante)
  { tac: "86555102", manufacturer: "Itel", model_series: "A60" },
  { tac: "86777304", manufacturer: "Itel", model_series: "Vision 3" },
  // Infinix
  { tac: "86998812", manufacturer: "Infinix", model_series: "Hot 30" },
  { tac: "86112207", manufacturer: "Infinix", model_series: "Smart 8" },
  // iPhone (Apple)
  { tac: "35328110", manufacturer: "Apple", model_series: "iPhone 13" },
  { tac: "35690511", manufacturer: "Apple", model_series: "iPhone 14" },
  { tac: "35234112", manufacturer: "Apple", model_series: "iPhone 15" },
  // Nokia (HMD Global)
  { tac: "35712310", manufacturer: "Nokia", model_series: "G22" },
  // Huawei
  { tac: "86891212", manufacturer: "Huawei", model_series: "Nova 11" },
  // Xiaomi / Redmi
  { tac: "86099010", manufacturer: "Xiaomi", model_series: "Redmi Note 12" },
  { tac: "86777712", manufacturer: "Xiaomi", model_series: "Redmi 13C" },
  // Oppo
  { tac: "86345609", manufacturer: "Oppo", model_series: "A78" },
  // Vivo
  { tac: "86567808", manufacturer: "Vivo", model_series: "Y17s" },
  // Realme
  { tac: "86223411", manufacturer: "Realme", model_series: "C55" },
];

/**
 * Recherche un TAC dans la base locale.
 * Retourne le constructeur et la série si trouvé, sinon "Inconnu".
 */
export function lookupTac(tac: string): { manufacturer: string; model_series: string; known: boolean } {
  const entry = TAC_DATABASE.find((e) => e.tac === tac);
  if (entry) return { manufacturer: entry.manufacturer, model_series: entry.model_series, known: true };
  return { manufacturer: "Inconnu", model_series: "—", known: false };
}
