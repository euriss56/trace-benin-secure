/**
 * Liste exhaustive des quartiers de Cotonou utilisés dans l'app.
 * Aucune coordonnée GPS exacte — on travaille au niveau quartier uniquement,
 * conformément à la loi béninoise n° 2017-20 sur le code du numérique.
 */
export const COTONOU_QUARTIERS = [
  "Akpakpa",
  "Agla",
  "Cadjehoun",
  "Dantokpa",
  "Fidjrossè",
  "Godomey",
  "Houéyiho",
  "Missèbo",
  "Sainte-Rita",
  "Vèdoko",
  "Zogbo",
] as const;

export type Quartier = (typeof COTONOU_QUARTIERS)[number];

/**
 * Centroïdes approximatifs (au niveau quartier, ~500m de précision)
 * pour l'affichage cartographique uniquement. Aucune adresse exacte stockée.
 */
export const QUARTIER_CENTROIDS: Record<Quartier, { lat: number; lng: number }> = {
  Akpakpa: { lat: 6.3654, lng: 2.4495 },
  Agla: { lat: 6.3719, lng: 2.3742 },
  Cadjehoun: { lat: 6.3613, lng: 2.3856 },
  Dantokpa: { lat: 6.3702, lng: 2.4277 },
  Fidjrossè: { lat: 6.3539, lng: 2.3651 },
  Godomey: { lat: 6.3892, lng: 2.3424 },
  Houéyiho: { lat: 6.3677, lng: 2.3920 },
  Missèbo: { lat: 6.3683, lng: 2.4231 },
  "Sainte-Rita": { lat: 6.3585, lng: 2.4040 },
  Vèdoko: { lat: 6.3754, lng: 2.4080 },
  Zogbo: { lat: 6.3640, lng: 2.4150 },
};
