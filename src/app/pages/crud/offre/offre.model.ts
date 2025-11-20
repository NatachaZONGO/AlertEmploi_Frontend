// offre.model.ts

// --- Unions (meilleure sécurité de type) ---
export type StatutOffre =
  | 'brouillon'
  | 'en_attente_validation'
  | 'validee'
  | 'rejetee'
  | 'publiee'
  | 'fermee'
  | 'expiree';

export type TypeOffre = 'stage' | 'emploi';

export type TypeContrat =
  | 'CDI'
  | 'CDD'
  | 'stage'
  | 'freelance'
  | 'alternance'
  | 'contrat_pro';

// --- Relations légères ---
export interface UserLite {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
}

export interface EntrepriseLite {
  id: number;
  nom_entreprise: string;
}

export interface CategorieLite {
  id: number;
  nom: string;
}

// --- Modèle principal ---
export interface Offre {
  id?: number;

  titre: string;
  description: string;
  experience: string;
  localisation: string;

  type_offre: TypeOffre | null;     // <— autorise null
  type_contrat: TypeContrat | null;
  statut: StatutOffre;

  date_publication: Date | string;
  date_expiration: Date | string;

  salaire: number;           // XOF (ou autre) côté UI on formate
  recruteur_id: number;
  entreprise_id?: number;
  categorie_id?: number;

  motif_rejet?: string;
  date_validation?: Date | string;
  validee_par?: number;

  sponsored_level?: number | null;        // 1,2,3… (intensité/pack)
  featured_until?: Date | string | null;  // fin de mise en avant (optionnelle)
  featured_at?: Date | string | null;     // date de début (optionnelle)
  featured_by?: number | null;

  isFeaturedActive?: boolean;

  // Relations
  recruteur?: UserLite;          // User qui a créé l'offre
  categorie?: CategorieLite;     // Catégorie de l'offre
  entreprise?: EntrepriseLite;   // Entreprise liée
  validateur?: UserLite;         // Admin (validation/rejet)

  // Props d'affichage/calculées
  entrepriseName?: string;
  recruteurName?: string;
  categorieName?: string;
  validateurName?: string;
  isExpired?: boolean;
  isActive?: boolean;
  // created_at, updated_at (non typés ici)
  created_at?: Date | string;
  updated_at?: Date | string;
}

// --- DTO pour création (payload envoyé à l’API) ---
export interface OffreCreateDto {
  titre: string;
  description: string;
  experience?: string;
  localisation?: string;

  type_offre: TypeOffre;
  type_contrat: TypeContrat;

  // par défaut souvent côté backend: 'brouillon'
  statut?: StatutOffre;

  date_publication?: Date | string;   // défaut: now
  date_expiration?: Date | string;    // ex: +30 jours

  salaire?: number;
  recruteur_id: number;
  categorie_id?: number;
}

// --- DTO pour mise à jour (tous champs optionnels) ---
export type OffreUpdateDto = Partial<
  Omit<Offre, 'id' | 'recruteur' | 'categorie' | 'entreprise' | 'validateur'>
>;

// --- Helpers utiles dans tes services/adapters ---

/** Convertit safe en Date (si string valide) sinon renvoie la valeur d’origine */
export function toDateSafe(v: Date | string | undefined | null): Date | string | undefined {
  if (!v) return v ?? undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d;
}

/** Calcule isExpired / isActive et dérive les *Name à partir des relations */
export function enrichOffreForUi(raw: Offre): Offre {
  const now = new Date();
  const dateExp = toDateSafe(raw.date_expiration);
  const datePub = toDateSafe(raw.date_publication);

  const expDate = dateExp instanceof Date ? dateExp : new Date(dateExp as string);
  const pubDate = datePub instanceof Date ? datePub : new Date(datePub as string);

  const isExpired =
    !!raw.date_expiration && expDate instanceof Date && !isNaN(expDate.getTime())
      ? expDate < now
      : false;

  const isActive = raw.statut === 'publiee' && !isExpired;

  return {
    ...raw,
    date_publication: pubDate instanceof Date && !isNaN(pubDate.getTime()) ? pubDate : raw.date_publication,
    date_expiration: expDate instanceof Date && !isNaN(expDate.getTime()) ? expDate : raw.date_expiration,
    entrepriseName: raw.entreprise?.nom_entreprise ?? 'Non renseignée',
    recruteurName: raw.recruteur ? `${raw.recruteur.firstname ?? ''} ${raw.recruteur.lastname ?? ''}`.trim() || 'Non renseigné' : 'Non renseigné',
    categorieName: raw.categorie?.nom ?? 'Non classée',
    validateurName: raw.validateur ? `${raw.validateur.firstname ?? ''} ${raw.validateur.lastname ?? ''}`.trim() || undefined : undefined,
    isExpired,
    isActive
  };
}
