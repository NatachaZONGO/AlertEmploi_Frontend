export interface Pays {
  id?: number;
  nom: string;
  code: string;           // Frontend utilise "code"
  code_iso?: string;      // ✅ AJOUTÉ pour compatibilité backend
  indicatif_tel?: string;
  flagImage?: string;     // Frontend
  flag?: string;          // ✅ AJOUTÉ pour compatibilité backend
  isActive?: boolean;     // Frontend
  is_active?: boolean;    // ✅ AJOUTÉ pour compatibilité backend
}