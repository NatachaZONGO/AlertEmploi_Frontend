export interface Entreprise {
  id?: number;
  user_id?: number;
  nom_entreprise: string;
  description?: string;
  site_web?: string;
  telephone?: string;
  email?: string;
  secteur_activite?: string;
  logo?: string;
  logoFile?: File;
  pays_id?: number;
  taille_entreprise?: string;
  ville?: string;
  adresse?: string;                    // ✅ AJOUTÉ
  statut?: 'en attente' | 'valide' | 'refuse';
  motif_rejet?: string;
  created_at?: string | Date;
  updated_at?: string | Date;

  // Relations
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  pays?: {
    id: number;
    nom: string;
    code_iso: string;
  };
}

export interface CreateEntrepriseRequest {
  user_id: number;
  nom_entreprise: string;
  description?: string;
  site_web?: string;
  telephone?: string;
  email?: string;
  secteur_activite: string;
  logo?: string;
  logoFile?: File;
  pays_id?: number;
  taille_entreprise?: string;          // ✅ AJOUTÉ
  ville?: string;                      // ✅ AJOUTÉ
  adresse?: string;                    // ✅ AJOUTÉ
  statut?: string;
}

export interface UpdateEntrepriseRequest {
  nom_entreprise?: string;
  description?: string;
  site_web?: string;
  telephone?: string;
  email?: string;
  secteur_activite?: string;
  logo?: string;
  logoFile?: File;
  pays_id?: number;
  taille_entreprise?: string;          // ✅ AJOUTÉ
  ville?: string;                      // ✅ AJOUTÉ
  adresse?: string;                    // ✅ AJOUTÉ
  statut?: string;
  motif_rejet?: string;
}

interface Pays {
  id: number;
  nom: string;
  code: string; 
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}