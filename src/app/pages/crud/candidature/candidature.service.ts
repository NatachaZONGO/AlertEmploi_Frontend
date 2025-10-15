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

  /**
   * Récupère les candidatures selon le rôle de l'utilisateur
   * - Admin : Toutes les candidatures
   * - Candidat : Ses propres candidatures
   * - Recruteur : Candidatures reçues sur ses offres
   */
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

    // Recruteur
    if (userRole === 'recruteur') {
      console.log('💼 Mode Recruteur');
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
    
    return this.http.get(`${this.baseUrl}`, { headers }).pipe(
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
    console.log('📡 Appel getMesCandidatures()');

    if (!headers.get('Authorization')) {
      console.error('❌ Token manquant');
      return of([]);
    }
    
    return this.http.get(`${this.baseUrl}/mes-candidatures`, { headers }).pipe(
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
   * Récupère les candidatures reçues pour le recruteur
   */
  getCandidaturesRecues(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    console.log('📡 Appel getCandidaturesRecues()');
    
    return this.http.get(`${this.baseUrl}/recues`, { headers }).pipe(
      map((response: any) => {
        console.log('📦 Réponse Recruteur:', response);
        const data = response?.data ?? response ?? [];
        return Array.isArray(data) ? data : [];
      }),
      catchError(error => {
        console.error('❌ Erreur Recruteur:', error);
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
   * Mettre à jour le statut d'une candidature
   */
  updateStatut(candidatureId: number, statut: string, motif?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log(`🔄 Mise à jour statut candidature ${candidatureId} vers ${statut}`);
    
    const body: { statut: string; motif_refus?: string } = { statut };
    if (motif) {
      body.motif_refus = motif;
    }
    
    return this.http.put(
      `${this.baseUrl}/${candidatureId}/statut`, 
      body, 
      { headers }
    ).pipe(
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
}