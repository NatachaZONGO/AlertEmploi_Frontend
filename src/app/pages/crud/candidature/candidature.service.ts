import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { Candidature } from './candidature.model';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class CandidatureService {
  private readonly baseUrl = `${BackendURL}candidatures`;

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  // ================== UTILS ==================

  /**
   * Récupère le token d'authentification
   */
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

  /**
   * Construit les headers avec Authorization
   */
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

  // ================== LECTURE PAR RÔLE ==================

  
  getCandidaturesByRole(): Observable<any[]> {
  const userRole = this.authService.getCurrentUserRole()?.toLowerCase();
  console.log('🔍 Récupération candidatures pour rôle:', userRole);

  // Administrateur
  if (userRole === 'administrateur' || userRole === 'admin') {
    console.log('📋 Mode Admin');
    return this.getAllCandidatures();
  }

  // Candidat
  if (userRole === 'candidat') {
    console.log('👤 Mode Candidat');
    return this.getMesCandidatures();
  }

  // Recruteur OU Community Manager
  if (userRole === 'recruteur' || userRole === 'community_manager') {
    console.log('💼 Mode Recruteur/CM');
    return this.getCandidaturesRecues();
  }

  // Rôle non reconnu
  console.warn('⚠️ Rôle non reconnu:', userRole);
  return of([]);
}

  /**
   * Récupère toutes les candidatures (Admin uniquement)
   */
  getAllCandidatures(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  console.log('📡 Appel getAllCandidatures()');
  console.log('📍 URL:', this.baseUrl);
  
  // ✅ baseUrl = BackendURL + "candidatures"
  // URL finale : http://api.com/candidatures
  return this.http.get(this.baseUrl, { headers }).pipe(
    map((response: any) => {
      console.log('📦 Réponse Admin:', response);
      const data = response?.data ?? response ?? [];
      return Array.isArray(data) ? data : [];
    }),
    catchError(error => {
      console.error('❌ Erreur Admin:', error);
      return of([]);
    })
  );
}

  /**
   * Récupère les candidatures du candidat connecté
   */
  getMesCandidatures(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  const url = `${BackendURL}candidatures/mes-candidatures`; 
  
  console.log('📡 Appel getMesCandidatures()');
  console.log('📍 URL:', url);

  if (!headers.get('Authorization')) {    console.error('❌ Token manquant');
    return of([]);
  }
  
  // ✅ URL finale : http://api.com/mes-candidatures
  return this.http.get(url, { headers }).pipe(
    map((response: any) => {
      console.log('📦 Réponse Candidat:', response);
      const data = response?.data ?? response ?? [];
      return Array.isArray(data) ? data : [];
    }),
    catchError(error => {
      console.error('❌ Erreur Candidat:', error);
      return of([]);
    })
  );
}

  /**
   * Alias pour compatibilité (utilise getMesCandidatures)
   */
  getMine(): Observable<any[]> {
    return this.getMesCandidatures();
  }

  /**
   * ✅ Récupère les candidatures reçues pour le recruteur ET community manager
   * Le backend filtre automatiquement selon les entreprises gérables
   */
  getCandidaturesRecues(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  const userRole = this.authService.getCurrentUserRole()?.toLowerCase();
  const url = `${BackendURL}candidatures/recues`; // ✅ AVEC "candidatures"
  
  console.log('📡 Appel getCandidaturesRecues() pour rôle:', userRole);
  console.log('📍 URL:', url);
  
  // ✅ URL finale : http://api.com/candidatures/recues
  return this.http.get(url, { headers }).pipe(
    map((response: any) => {
      console.log('📦 Réponse Recruteur/CM:', response);
      
      // Gérer la pagination
      if (response?.data?.data) {
        return response.data.data;
      } else if (response?.data) {
        return Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    }),
    tap(data => {
      console.log(`✅ ${data.length} candidatures chargées pour ${userRole}`);
    }),
    catchError(error => {
      console.error('❌ Erreur Recruteur/CM:', error);
      return of([]);
    })
  );
}

  // ================== AUTRES LECTURES ==================

  /**
   * Liste avec filtres optionnels
   */
  getAll(params?: { offre_id?: number | string }): Observable<Candidature[]> {
    let httpParams = new HttpParams();
    if (params?.offre_id != null) {
      httpParams = httpParams.set('offre_id', String(params.offre_id));
    }
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(this.baseUrl, { params: httpParams, headers }).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Candidatures par offre
   */
  getByOffre(offreId: number): Observable<Candidature[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.baseUrl}?offre_id=${offreId}`, { headers }).pipe(
      map(response => response?.data ?? response ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * ✅ NOUVEAU : Récupérer les candidatures d'une offre spécifique (avec vérification des droits backend)
   */
  getCandidaturesByOffre(offreId: number): Observable<Candidature[]> {
    const headers = this.getAuthHeaders();
    console.log(`📡 Récupération candidatures pour offre ${offreId}`);
    
    return this.http.get<any>(`${this.baseUrl}/offre/${offreId}`, { headers }).pipe(
      map(response => {
        console.log('📦 Réponse:', response);
        return response?.data ?? response ?? [];
      }),
      catchError(error => {
        console.error('❌ Erreur:', error);
        return of([]);
      })
    );
  }

  /**
   * Détail d'une candidature
   */
  getOne(id: number): Observable<Candidature> {
    const headers = this.getAuthHeaders();
    return this.http.get<Candidature>(`${this.baseUrl}/${id}`, { headers });
  }

  /**
   * Liste des offres pour dropdown
   */
  getOffresLight(): Observable<{ id: number; titre: string }[]> {
    return this.http.get<any>(`${BackendURL}offres`).pipe(
      map(response => {
        let offres: any[] = [];
        if (Array.isArray(response)) {
          offres = response;
        } else if (response?.data?.data) {
          offres = response.data.data;
        } else if (response?.data) {
          offres = response.data;
        }
        return (offres || []).map((o: any) => ({ 
          id: o.id, 
          titre: o.titre 
        }));
      }),
      catchError(() => of([]))
    );
  }

  // ================== CRÉATION / MODIFICATION ==================

  /**
   * Créer une candidature (candidat connecté)
   */
  create(formData: FormData): Observable<Candidature> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.post<any>(this.baseUrl, formData, { headers }).pipe(
      map(response => response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Créer une candidature invité (sans compte)
   */
  createGuest(formData: FormData): Observable<Candidature> {
    const headers = new HttpHeaders({ 
      'Accept': 'application/json' 
    });
    
    return this.http.post<any>(`${this.baseUrl}/guest`, formData, { headers }).pipe(
      map(response => response?.data ?? response),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * ✅ Mettre à jour le statut d'une candidature (Recruteur ET CM)
   */
  updateStatut(candidatureId: number, statut: string, messageStatut?: string): Observable<any> {
  const headers = this.getAuthHeaders();
  const url = `${this.baseUrl}/${candidatureId}/statut`;
  
  console.log(`🔄 Mise à jour statut candidature ${candidatureId} vers ${statut}`);
  console.log('📍 URL:', url);
  
  const body: { statut: string; message_statut?: string } = { statut };
  if (messageStatut) {
    body.message_statut = messageStatut;
  }
  
  // ✅ Utiliser PATCH (pas PUT)
  return this.http.patch(url, body, { headers }).pipe(
    tap(() => console.log('✅ Statut mis à jour')),
    catchError(error => {
      console.error('❌ Erreur updateStatut:', error);
      return throwError(() => error);
    })
  );
}

  /**
   * Supprimer une candidature
   */
  delete(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.baseUrl}/${id}`, { headers });
  }

  // ================== STATISTIQUES ==================

  /**
   * ✅ NOUVEAU : Récupérer les statistiques des candidatures
   * - Admin : Globales
   * - Recruteur/CM : Personnelles (filtrées par entreprises)
   */
  getStatistiques(): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('📊 Récupération statistiques candidatures');
    
    return this.http.get<any>(`${this.baseUrl}/statistiques`, { headers }).pipe(
      map(response => {
        console.log('📦 Stats reçues:', response);
        return response?.data ?? response ?? {};
      }),
      catchError(error => {
        console.error('❌ Erreur stats:', error);
        return of({
          total: 0,
          en_attente: 0,
          acceptees: 0,
          refusees: 0,
          nouvelles_7j: 0,
          nouvelles_30j: 0
        });
      })
    );
  }

  // ================== SUIVI CANDIDATURE ==================

  /**
   * Rechercher une candidature par code de suivi
   */
  findByCode(code: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/suivi/${code}`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          const d = response.data;
          return {
            id: d.id,
            code: d.code_suivi,
            fullName: `${d.candidat?.prenom ?? ''} ${d.candidat?.nom ?? ''}`.trim(),
            email: d.candidat?.email || '',
            telephone: d.candidat?.telephone || '',
            offreTitre: d.offre?.titre,
            entreprise: d.offre?.entreprise,
            lieu: d.offre?.lieu,
            type_contrat: d.offre?.type_contrat,
            statut: d.statut,
            message_statut: d.message_statut,
            created_at: d.date_candidature,
            updated_at: d.date_mise_a_jour,
          };
        }
        throw new Error('Format de réponse invalide');
      }),
      catchError((error) => throwError(() => ({
        message: error.error?.message || 'Erreur lors de la recherche',
        status: error.status
      })))
    );
  }

  /**
   * Renvoyer l'email de confirmation
   */
  resendEmail(codesuivi: string): Observable<any> {
    const headers = new HttpHeaders({ 
      'Content-Type': 'application/json', 
      'Accept': 'application/json' 
    });
    
    return this.http.post<any>(
      `${this.baseUrl}/renvoyer-email`, 
      { code_suivi: codesuivi }, 
      { headers }
    ).pipe(
      map((response) => {
        if (response?.success) {
          return { 
            success: true, 
            message: response.message || 'Email envoyé avec succès' 
          };
        }
        throw new Error(response?.message || 'Erreur lors de l\'envoi');
      }),
      catchError((error) => throwError(() => ({
        message: error.error?.message || 'Impossible d\'envoyer l\'email',
        status: error.status
      })))
    );
  }

  // ================== TÉLÉCHARGEMENTS ==================

  /**
   * Télécharger le CV
   */
  downloadCVById(candidatureId: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.get(
      `${this.baseUrl}/${candidatureId}/download/cv`, 
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Télécharger la lettre de motivation
   */
  downloadLMById(candidatureId: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
    
    return this.http.get(
      `${this.baseUrl}/${candidatureId}/download/lm`, 
      { headers, responseType: 'blob' }
    );
  }

  getCommunityManagerCandidatures(entrepriseId?: number): Observable<any> {
    let params = new HttpParams();
    
    if (entrepriseId) {
      params = params.set('entreprise_id', entrepriseId.toString());
    }
    
    return this.http.get<any>(`${this.baseUrl}/community/candidatures`, { params });
  }
}