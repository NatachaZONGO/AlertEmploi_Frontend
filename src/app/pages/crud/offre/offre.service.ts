// offre.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Offre } from './offre.model';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class OffreService {
  private api = `${BackendURL}offres`;

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  // ✅ Méthode pour récupérer le token
  private getToken(): string | null {
    const svc: any = this.authService;
    return (
      (typeof svc.getToken === 'function' ? svc.getToken() : undefined) ??
      svc.accessToken ??
      localStorage.getItem('access_token') ??
      localStorage.getItem('accessToken') ??
      null
    );
  }

  // ✅ Construire les headers avec Authorization
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: any = { 
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  // ================== MÉTHODES AVEC AUTH ==================

  /** ADMIN – lister toutes les offres (paginées) */
  getAdminOffres(): Observable<Offre[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<{ success: boolean; data: any }>(`${this.api}`, { headers })
      .pipe(map(r => r?.data?.data ?? r?.data ?? []));
  }

  /** Mes offres (Recruteur uniquement) */
  getMesOffres(): Observable<Offre[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<{ success: boolean; data: any }>(`${this.api}/mes-offres`, { headers })
      .pipe(map(r => r?.data ?? []));
  }

  /**
   * ✅ CORRIGÉ : Récupérer les offres pour Community Manager
   * Avec filtre optionnel par entreprise_id
   */
  getCommunityManagerOffres(entrepriseId?: number): Observable<Offre[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    
    if (entrepriseId) {
      params = params.set('entreprise_id', entrepriseId.toString());
    }
    
    // ✅ CORRECTION : Utiliser BackendURL directement, pas this.api
    const url = `${BackendURL}community/offres`;
    
    console.log('📡 CM Offres - URL:', url);
    console.log('📡 CM Offres - Params:', params.toString());
    console.log('📡 CM Offres - Headers:', headers);
    
    return this.http
      .get<{ success: boolean; data: any }>(url, { headers, params })
      .pipe(
        map(r => {
          console.log('📦 CM Offres - Réponse:', r);
          return r?.data ?? [];
        })
      );
  }

  /** Offre par ID */
  getOffreById(id: number): Observable<Offre> {
    const headers = this.getAuthHeaders();
    const url = `${this.api}/${id}`;
    return this.http.get<ApiResponse<Offre>>(url, { headers }).pipe(map(r => r.data));
  }

  /** Créer une offre */
  createOffre(offre: Offre): Observable<Offre> {
    const headers = this.getAuthHeaders();
    console.log('📤 Création offre');
    console.log('  - URL:', this.api);
    console.log('  - Payload:', offre);
    
    return this.http.post<ApiResponse<Offre>>(this.api, offre, { headers }).pipe(
      map(r => {
        console.log('✅ Réponse:', r);
        return r.data;
      })
    );
  }

  /** Mettre à jour une offre */
  updateOffre(id: number, offre: Offre): Observable<Offre> {
    const headers = this.getAuthHeaders();
    const url = `${this.api}/${id}`;
    return this.http.put<ApiResponse<Offre>>(url, offre, { headers }).pipe(map(r => r.data));
  }

  /** Supprimer une offre */
  deleteOffre(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    const url = `${this.api}/${id}`;
    return this.http.delete<ApiResponse<any>>(url, { headers }).pipe(map(() => void 0));
  }

  // ================== WORKFLOW ==================

  soumettreValidation(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.api}/${id}/soumettre-validation`, {}, { headers });
  }

  validerOffre(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.api}/${id}/valider`, {}, { headers });
  }

  rejeterOffre(id: number, motif: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.api}/${id}/rejeter`, { 
      motif_rejet: motif
    }, { headers });
  }

  publierOffre(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.api}/${id}/publier`, {}, { headers });
  }

  fermerOffre(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.api}/${id}/fermer`, {}, { headers });
  }

  // ================== AUTRES ==================

  /** Catégories (public, pas besoin de token) */
  getCategories(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${BackendURL}categories`, { 
        headers: { 'Accept': 'application/json' }
      })
      .pipe(map(r => (Array.isArray(r.data) ? r.data : [])));
  }

  /** Mettre en vedette */
  featureOffre(
    id: number,
    payload: { sponsored_level: number; duration_days?: number; featured_until?: string }
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.api}/${id}/feature`, payload, { headers });
  }

  /** Retirer la mise en vedette */
  unfeatureOffre(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.api}/${id}/unfeature`, {}, { headers });
  }

  /** Offres vedettes (public) */
  getFeatured(): Observable<Offre[]> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.api}/featured`, { 
        headers: { 'Accept': 'application/json' }
      })
      .pipe(map(r => r?.data ?? []));
  }

  /** Offres par rôle */
  getOffresByRole(): Observable<any> {
    const headers = this.getAuthHeaders();

    if (this.authService.hasRole('Administrateur')) {
      return this.http.get(`${BackendURL}offres`, { headers });
    } else if (this.authService.hasRole('Recruteur') || this.authService.hasRole('community_manager')) {
      return this.http.get(`${BackendURL}mes-offres`, { headers });
    }

    return of({ success: false, data: [], message: 'Accès non autorisé' });
  }
}