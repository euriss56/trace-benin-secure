# Plan — TraceIMEI-BJ dans Lovable

## Contexte

- Le repo `benin-trace-refresh` est en **TanStack Router + Tailwind v4 + Cloudflare** : incompatible avec la stack imposée par Lovable (React Router + Tailwind v3 + structure `src/pages`).
- Décision validée : **reproduire le design 1:1** (mêmes couleurs, mêmes layouts, même typographie, même bandeau drapeau du Bénin) mais en **réécrivant le code dans la stack Lovable**.
- Backend : on **réutilise votre Supabase existant** (clés via variables d'env). ⚠️ Vos clés actuelles sont publiques sur GitHub (`.env` commit) — pensez à régénérer la clé `anon`.
- On commence par **l'auth + les rôles + la navbar conditionnelle**, puis on enchaîne par paliers.

---

## Phase 0 — Préparation Vercel & secrets (immédiat)

- Créer `vercel.json` à la racine avec rewrites SPA :
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- S'assurer que `package.json` expose `build` et `preview` (déjà OK).
- Créer `.env.example` à la racine :
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJxxx...
  VITE_ML_API_URL=https://votre-api-flask.com
  ```
- Mettre à jour `.gitignore` pour exclure `.env`, `.env.local`.
- Ajouter Supabase JS via dépendance.
- Vous me fournirez : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ML_API_URL` (en chat, je les ajoute en variables d'env Lovable).

## Phase 1 — Design system Bénin (reproduction fidèle)

- Réécrire `src/index.css` avec **les mêmes valeurs colorimétriques** que le repo source, traduites de `oklch` Tailwind v4 vers `hsl` Tailwind v3 :
  - `--benin-green` (#008751), `--benin-yellow` (#FCD116), `--benin-red` (#E8112D)
  - `--primary` = vert Bénin, `--accent` = jaune, `--destructive` = rouge
  - `--success`, `--warning` (manquants dans le shadcn Lovable par défaut)
  - Gradients : `--gradient-flag` (bandeau drapeau), `--gradient-hero`, `--gradient-primary`
  - Shadows : `--shadow-elegant`, `--shadow-glow`
- Étendre `tailwind.config.ts` : ajouter `success`, `warning`, `benin-green/yellow/red`, classes utilitaires `.benin-stripe`, `.gradient-hero`, `.text-gradient-primary`, `.shadow-elegant`.
- Variantes `dark` correspondantes.
- Police : Inter (déjà chargeable) + feature settings `cv11`, `ss01` comme dans le repo source.

## Phase 2 — Layout global (Navbar + Footer + bandeau drapeau)

- Créer `src/components/layout/Navbar.tsx` reproduisant la barre du site déployé :
  - Logo bouclier vert + texte "TraceIMEI-BJ"
  - Liens : Accueil, Vérifier IMEI, Confidentialité
  - Boutons "Connexion" et "S'inscrire" (visibles seulement déconnecté)
  - Bouton "Déconnexion" + avatar (visible connecté)
  - Sélecteur langue FR/EN (UI seulement pour l'instant) + toggle thème clair/sombre
  - Bandeau drapeau 4px en haut (`.benin-stripe`)
- Créer `src/components/layout/Footer.tsx` (mention loi 2017-20).
- Créer `src/components/layout/AppLayout.tsx` qui enveloppe les routes publiques.

## Phase 3 — Authentification Supabase + rôles

- Créer `src/integrations/supabase/client.ts` (lit `import.meta.env.VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).
- Créer `src/hooks/useAuth.tsx` :
  - Provider global avec `onAuthStateChange` listener
  - Expose `user`, `session`, `role`, `loading`, `signIn`, `signUp`, `signOut`
  - Charge le rôle depuis la table `user_roles` (existante dans votre Supabase)
- Pages :
  - `src/pages/Login.tsx` (route `/login`) — email + password, lien "mot de passe oublié"
  - `src/pages/Register.tsx` (route `/register`) — email + password + sélection rôle (particulier/dealer/technicien) ; les rôles `enqueteur` et `admin` sont attribués manuellement côté admin
  - `src/pages/ResetPassword.tsx` (route `/reset-password`)
- Composant `src/components/auth/ProtectedRoute.tsx` avec prop `roles?: string[]` pour gating.
- Mise à jour `App.tsx` : ajout des routes, du `AuthProvider`, navbar conditionnelle.
- Mise à jour `src/pages/NotFound.tsx` au design du site.

## Phase 4 — Page d'accueil (`/`) — pixel-perfect

Reproduire exactement la home `geo-hugger-hub.lovable.app` :
- Hero avec badge "Authenticate · Protect · Trace", titre "TraceIMEI-BJ — Protégez vos téléphones" avec gradient drapeau sur "Protégez vos téléphones".
- Sous-titre, 2 CTA (vert + outline blanc).
- Bloc 4 stats (10.9M, Luhn, < 2s, Open).
- Section "Comment ça marche ?" — 3 étapes en cartes.
- Section "Une plateforme pour chaque acteur" — 3 cartes (Dealer, Réparateur, Forces de l'ordre).
- Section "Pourquoi TraceIMEI-BJ ?" — 4 features.
- CTA final "Prêt à sécuriser ?".

## Phase 5 — Page `/verify` (vérification IMEI)

- Champ IMEI 15 chiffres (input numérique uniquement, rejet lettres/symboles).
- **Validation Luhn temps réel** : bordure verte si valide, rouge sinon, message en dessous.
- Bouton "Vérifier" → POST vers `VITE_ML_API_URL` (avec fallback mock si non disponible).
- Modale résultat tricolore :
  - 🟢 LÉGITIME, 🟠 SUSPECT, 🔴 SIGNALÉ VOLÉ
  - Score ML 0.0 à 1.0 (barre + valeur)
  - Temps de réponse en ms
  - Détail explication (validation Luhn, TAC, signalements)
- Bouton "Importer CSV (max 50 IMEI)" → traitement batch, table résultats, export CSV.
- **Rate limiting client** : 100 req/h via `localStorage` (timestamp + compteur).
- **Mode hors-ligne** : cache IndexedDB des 50 derniers résultats. Si offline → affiche dernier résultat connu avec bandeau "Mode hors-ligne — résultat du [date]".

## Phase 6 — Page `/declare` (déclaration de vol)

- Formulaire : référence appareil, marque, modèle, IMEI (validation Luhn), description du vol, date.
- **Liste déroulante quartiers de Cotonou** (constante en dur) : Missèbo, Dantokpa, Cadjehoun, Vèdoko, Akpakpa, Fidjrossè, Agla, Houéyiho, Sainte-Rita, Zogbo, Godomey.
- **Upload photo** (input file) : JPG/PNG/WebP, max 5 Mo, validation client avant upload.
- Upload vers Supabase Storage bucket `device-photos` (à créer si absent).
- Validation zod sur tous les champs.
- À la soumission : insertion dans table `declarations` Supabase, génération **référence `BJ-2026-XXXXX`** (5 chiffres aléatoires + check unicité).
- Modale de confirmation affichant la référence, bouton copier.

## Phase 7 — Page `/map` (carte) — rôles enqueteur + admin

- Installation `react-leaflet` + `leaflet`.
- Carte centrée Cotonou (lat 6.3654, lng 2.4183, zoom 13).
- **Centroïdes par quartier en dur** (objet `{ quartier: { lat, lng } }`) — aucune coord GPS exacte stockée ni affichée.
- Marqueurs rouges groupés : un marqueur par quartier avec compteur de signalements.
- Filtres : période (7j/30j/90j/tout), statut (déclaré/résolu/en cours), quartier.
- Bouton "Exporter CSV" des résultats filtrés.
- Bandeau légal en bas : conformité loi 2017-20.
- Route protégée par `ProtectedRoute roles={['enqueteur', 'admin']}`.

## Phase 8 — Tableaux de bord `/dashboard` (par rôle)

Layout commun `DashboardLayout` (sidebar + main). Routes selon rôle :
- **`/dashboard/particulier`** — historique personnel des IMEI vérifiés et signalés.
- **`/dashboard/dealer`** ou **`/dashboard/technicien`** — compteur du mois, 20 derniers IMEI vérifiés, badge "Dealer Certifié" auto si ≥ 20 vérifs/mois.
- **`/dashboard/enqueteur`** — liste signalements, accès `/map`, export PDF/CSV.
- **`/dashboard/admin`** — stats globales (utilisateurs, déclarations, vérifications), gestion utilisateurs (changer rôle), métriques ML (AUC-ROC, alerte si < 0.85).
- Route `/dashboard` (index) redirige selon rôle.

## Phase 9 — Page `/privacy` (conformité légale)

- Page statique reprenant les sections du repo source.
- Inclusion **textuelle** :
  > Conforme à la loi béninoise n° 2017-20 portant code du numérique. Aucune coordonnée GPS exacte n'est collectée ni stockée. Les données de localisation sont limitées au niveau quartier uniquement.

## Phase 10 — PWA + offline (production uniquement)

- Installer `vite-plugin-pwa`.
- Configurer avec `devOptions.enabled: false` (pas activé dans le preview Lovable).
- Ajouter `public/manifest.json` : `name: "TraceIMEI-BJ"`, `theme_color: "#008751"`, icônes (placeholder à fournir).
- Garde anti-iframe dans `main.tsx` : pas d'enregistrement SW si `window.self !== window.top` ou hostname Lovable preview.
- Cache stratégie : network-first pour API, cache-first pour assets.
- ⚠️ Vous serez prévenu que la PWA ne fonctionnera **que sur Vercel publié**, pas dans le preview Lovable.

## Phase 11 — Sécurité finale & QA

- Validation zod sur tous les formulaires.
- Inputs IMEI : `inputMode="numeric"` + filtre regex `\d`.
- Upload : double check (taille + MIME) avant envoi, rejet côté Supabase via policy.
- Rate limit visible côté UI (compteur restant).
- Test build : `npm run build` doit passer sans erreur TS.
- Test routing : refresh sur `/verify`, `/map`, `/declare` doit charger la bonne page sur Vercel.

---

## Livraison de cette session (Phase 0 → Phase 3)

À l'approbation de ce plan, j'implémente d'un trait :
- Phase 0 : `vercel.json`, `.env.example`, `.gitignore`, `package.json` mis à jour, dépendance Supabase.
- Phase 1 : design system Bénin complet dans `index.css` + `tailwind.config.ts`.
- Phase 2 : Navbar + Footer + AppLayout reproduisant le visuel.
- Phase 3 : auth Supabase complète (login, register, reset-password, AuthProvider, ProtectedRoute, navbar conditionnelle, déconnexion).
- Page d'accueil minimale (Phase 4 mini) pour valider visuellement le design.

Phases 5 à 11 dans des sessions suivantes pour garder des changements review-ables.

## Ce dont j'ai besoin de vous après approbation

1. `VITE_SUPABASE_URL` (l'URL de votre projet Supabase, format `https://xxxxx.supabase.co`)
2. `VITE_SUPABASE_ANON_KEY` (clé anon, la régénérer d'abord car la précédente est publique sur GitHub)
3. `VITE_ML_API_URL` (URL de votre API Flask, ou "skip" si vous voulez du mock pour l'instant)
4. Confirmation que la table `user_roles` existe dans votre Supabase (sinon je crée la migration).

Vous me les donnez en chat, je les pousse en variables d'env Lovable (jamais dans le code).
