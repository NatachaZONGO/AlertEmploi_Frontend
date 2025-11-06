import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { 
  Entreprise, 
  CreateEntrepriseRequest, 
  UpdateEntrepriseRequest, 
  ApiResponse, 
  PaginatedResponse 
} from './entreprise.model';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {
  private apiUrl = BackendURL.replace(/\/+$/, ''); 

  // ✅ AJOUTÉ : Observable pour notifier les changements d'entreprise sélectionnée
  private selectedEntrepriseSubject = new BehaviorSubject<any>(null);
  public selectedEntreprise$ = this.selectedEntrepriseSubject.asObservable();

  // Gestion de l'entreprise sélectionnée pour CM/Recruteur
  private selectedEntrepriseIdSubject = new BehaviorSubject<number | null>(null);
  public selectedEntrepriseId$: Observable<number | null> = this.selectedEntrepriseIdSubject.asObservable();

  private entreprisesSubject = new BehaviorSubject<Entreprise[]>([]);
  public entreprises$: Observable<Entreprise[]> = this.entreprisesSubject.asObservable();

  private readonly allowedKeys = [
    'nom_entreprise','description','site_web','telephone','email',
    'secteur_activite','logo','pays_id','statut','motif_rejet'
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
   ) {
    this.initializeFromStorage();
  }

  // ==================== GESTION ENTREPRISE SÉLECTIONNÉE ====================

  /**
   * ✅ MODIFIÉ : Initialise l'entreprise sélectionnée depuis le localStorage
   */
  private initializeFromStorage(): void {
    // ✅ Charger l'objet entreprise complet
    const storedEntreprise = localStorage.getItem('selected_entreprise_full');
    if (storedEntreprise) {
      try {
        const entreprise = JSON.parse(storedEntreprise);
        this.selectedEntrepriseSubject.next(entreprise);
        this.selectedEntrepriseIdSubject.next(entreprise.id);
        console.log('🏢 Entreprise chargée depuis localStorage:', entreprise.nom_entreprise);
      } catch (e) {
        console.error('Erreur parsing entreprise:', e);
      }
    }

    // Charger la liste des entreprises
    const storedEntreprises = localStorage.getItem('entreprises');
    if (storedEntreprises) {
      try {
        const entreprises = JSON.parse(storedEntreprises);
        if (Array.isArray(entreprises)) {
          this.entreprisesSubject.next(entreprises);
          console.log('📍 Entreprises chargées:', entreprises.length);
        }
      } catch (e) {
        console.error('Erreur parsing entreprises:', e);
      }
    }
  }

  /**
   * ✅ MODIFIÉ : Sélectionne une entreprise (objet complet) et notifie les observateurs
   */
  selectEntreprise(entreprise: any): void {
    console.log('🏢 Sélection entreprise:', entreprise.nom_entreprise);
    
    // Sauvegarder l'objet complet dans localStorage
    localStorage.setItem('selected_entreprise_full', JSON.stringify(entreprise));
    
    // Sauvegarder aussi l'ID (pour compatibilité)
    localStorage.setItem('selected_entreprise_id', entreprise.id.toString());
    
    // Notifier tous les composants qui écoutent
    this.selectedEntrepriseSubject.next(entreprise);
    this.selectedEntrepriseIdSubject.next(entreprise.id);
  }

  /**
   * ✅ AJOUTÉ : Obtenir l'entreprise sélectionnée (valeur actuelle)
   */
  getSelectedEntreprise(): any {
    return this.selectedEntrepriseSubject.value;
  }

  /**
   * ✅ Récupère l'ID de l'entreprise actuellement sélectionnée
   */
  getSelectedEntrepriseId(): number | null {
    return this.selectedEntrepriseIdSubject.value;
  }

  /**
   * ✅ Récupère toutes les entreprises depuis la mémoire
   */
  getEntreprisesFromMemory(): Entreprise[] {
    return this.entreprisesSubject.value;
  }

  /**
   * ✅ Met à jour la liste des entreprises en mémoire
   */
  setEntreprisesInMemory(entreprises: Entreprise[]): void {
    this.entreprisesSubject.next(entreprises);
    localStorage.setItem('entreprises', JSON.stringify(entreprises));
    console.log('📍 Entreprises mises à jour:', entreprises.length);
  }

  /**
   * ✅ Vérifie si l'utilisateur a plusieurs entreprises
   */
  hasMultipleEntreprises(): boolean {
    return this.getEntreprisesFromMemory().length > 1;
  }

  /**
   * ✅ Sélectionne automatiquement la première entreprise si aucune n'est sélectionnée
   */
  autoSelectFirstIfNeeded(): void {
    if (this.getSelectedEntrepriseId()) {
      console.log('✅ Entreprise déjà sélectionnée');
      return;
    }

    const entreprises = this.getEntreprisesFromMemory();
    if (entreprises.length === 0) {
      console.log('⚠️ Aucune entreprise disponible');
      return;
    }

    const firstEntreprise = entreprises[0];
    if (!firstEntreprise || !firstEntreprise.id) {
      console.warn('⚠️ Première entreprise invalide');
      return;
    }

    // ✅ Sélectionner la première entreprise (objet complet)
    this.selectEntreprise(firstEntreprise);
    console.log('🎯 Auto-sélection de la première entreprise:', firstEntreprise.nom_entreprise);
  }

  /**
   * ✅ MODIFIÉ : Réinitialise la sélection
   */
  clearSelectedEntreprise(): void {
    localStorage.removeItem('selected_entreprise_full');
    localStorage.removeItem('selected_entreprise_id');
    this.selectedEntrepriseSubject.next(null);
    this.selectedEntrepriseIdSubject.next(null);
    console.log('🗑️ Entreprise désélectionnée');
  }

  /**
   * ✅ RENOMMÉ : Réinitialise la sélection (alias)
   */
  clearSelection(): void {
    this.clearSelectedEntreprise();
  }

  /**
   * ✅ Réinitialise tout (sélection + liste)
   */
  clearAll(): void {
    this.clearSelectedEntreprise();
    localStorage.removeItem('entreprises');
    this.entreprisesSubject.next([]);
    console.log('🗑️ Toutes les données entreprise effacées');
  }

  // ==================== MÉTHODES API EXISTANTES ====================

  private pickArray(res: any): any[] {
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data))       return res.data;
    if (Array.isArray(res?.content))    return res.content;
    if (Array.isArray(res))             return res;
    return [];
  }

  private buildJsonPayload(data: any): any {
    const out: any = {};
    for (const k of this.allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(data, k)) out[k] = (data as any)[k];
    }
    return out;
  }

  /**
   * Récupérer toutes les entreprises avec pagination et filtres
   */
  getEntreprises(params?: { page?: number; per_page?: number; status?: string; search?: string; })
    : Observable<{ success: boolean; data: { data: Entreprise[]; total: number } }> {
    let httpParams = new HttpParams();
    if (params?.page)     httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
    if (params?.status)   httpParams = httpParams.set('status', params.status);
    if (params?.search)   httpParams = httpParams.set('search', params.search);
    return this.http.get<{ success:boolean; data:{ data:Entreprise[]; total:number } }>(
      `${this.apiUrl}/entreprises`, { params: httpParams }
    );
  }

  /**
   * Récupérer une entreprise par ID
   */
  getEntreprise(id: number): Observable<ApiResponse<Entreprise>> {
    return this.http.get<ApiResponse<Entreprise>>(`${this.apiUrl}/entreprises/${id}`);
  }

  /**
   * Créer une nouvelle entreprise
   */
  createEntreprise(entreprise: CreateEntrepriseRequest) {
    const hasFile = (entreprise as any).logoFile instanceof File;
    if (hasFile) {
      return this.http.post<ApiResponse<Entreprise>>(
        `${this.apiUrl}/entreprises`,
        this.buildFormData(entreprise)
      );
    }
    return this.http.post<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises`,
      this.buildJsonPayload(entreprise)
    );
  }

  /**
   * Mettre à jour une entreprise
   */
  updateEntreprise(id: number, entreprise: UpdateEntrepriseRequest) {
    const hasFile =
      (entreprise as any).logoFile instanceof File ||
      (entreprise as any).logo instanceof File;

    if (hasFile) {
      const fd = this.buildFormData(entreprise);
      fd.append('_method', 'PUT');
      return this.http.post<ApiResponse<Entreprise>>(
        `${this.apiUrl}/entreprises/${id}`,
        fd
      );
    }

    return this.http.put<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises/${id}`,
      this.buildJsonPayload(entreprise)
    );
  }

  /**
   * Supprimer une entreprise
   */
  deleteEntreprise(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/entreprises/${id}`);
  }

  /**
   * Valider une entreprise
   */
  validateEntreprise(entrepriseId: number) {
    return this.http.put<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises/${entrepriseId}/validate`, {}
    );
  }

  rejectEntreprise(entrepriseId: number, motif: string) {
    return this.http.put<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises/${entrepriseId}/reject`, { motif }
    );
  }

  revalidateEntreprise(entrepriseId: number) {
    return this.http.put<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises/${entrepriseId}/revalidate`, {}
    );
  }

  getPendingEntreprises(): Observable<ApiResponse<{ entreprises: Entreprise[], total: number }>> {
    return this.http.get<ApiResponse<{ entreprises: Entreprise[], total: number }>>(
      `${this.apiUrl}/entreprises/pending`
    );
  }

  /**
   * Construire FormData pour les requêtes avec fichiers
   */
  private buildFormData(data: any): FormData {
    const fd = new FormData();

    // LOGO: fichier prioritaire
    const file = (data as any).logoFile || (data as any).logo;
    if (file instanceof File) {
      fd.append('logo', file);
    } else {
      const logoVal = (data as any).logo;
      if (logoVal === '') {
        fd.append('logo', '');
      } else if (typeof logoVal === 'string' && /^https?:\/\//i.test(logoVal)) {
        fd.append('logo', logoVal);
      }
    }

    // Autres champs whitelistés
    const payload = this.buildJsonPayload(data);
    delete payload.logo;
    delete (payload as any).logoFile;

    for (const [k, v] of Object.entries(payload)) {
      if (k === 'motif_rejet') {
        const s = v == null ? '' : String(v).trim().toLowerCase();
        if (!s || s === 'null' || s === 'undefined') continue;
      }
      if (v !== undefined) fd.append(k, String(v));
    }

    return fd;
  }

  /**
   * Récupérer la liste des pays (pour le dropdown)
   */
  getPays(): Observable<Array<{ id:number; nom:string; code:string }>> {
    return this.http.get<any>(`${this.apiUrl}/pays`).pipe(
      map(res => this.pickArray(res).map((p:any) => ({ id: p.id, nom: p.nom, code: p.code })))
    );
  }

  /**
   * Récupérer la liste des utilisateurs (pour le dropdown)
   */
  getUsers(): Observable<Array<{ id:number; nom:string; prenom:string; email:string }>> {
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      map(res => this.pickArray(res).map((u:any) => ({
        id: u.id, nom: u.nom, prenom: u.prenom, email: u.email
      })))
    );
  }

  createEntrepriseWithFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/entreprises`, formData);
  }

  updateEntrepriseWithFile(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/entreprises/${id}`, formData);
  }

  getCommunityManagerEntreprises(): Observable<ApiResponse<Entreprise[]>> {
    return this.http.get<ApiResponse<Entreprise[]>>(
      `${this.apiUrl}/community/entreprises`
    ).pipe(
      map(response => {
        // Si succès, mettre en mémoire
        if (response.success && response.data) {
          const entreprises = Array.isArray(response.data) ? response.data : [];
          this.setEntreprisesInMemory(entreprises);
          
          // Auto-sélectionner la première si aucune sélectionnée
          if (entreprises.length > 0) {
            this.autoSelectFirstIfNeeded();
          }
          
          console.log('✅ Entreprises CM chargées:', entreprises.length);
        }
        return response;
      })
    );
  }

  /**
   * ✅ Charger les entreprises selon le rôle de l'utilisateur
   */
  loadEntreprisesByRole(userRole: string): Observable<any> {
    const isCM = userRole.toLowerCase().includes('community');
    
    if (isCM) {
      // Charger les entreprises du CM
      return this.getCommunityManagerEntreprises();
    } else {
      // Charger toutes les entreprises (avec pagination pour admin)
      return this.getEntreprises({ page: 1, per_page: 1000 }).pipe(
        map(response => {
          if (response.success && response.data?.data) {
            this.setEntreprisesInMemory(response.data.data);
          }
          return response;
        })
      );
    }
  }

  setSelectedEntrepriseId(entrepriseId: number): void {
    localStorage.setItem('selected_entreprise_id', entrepriseId.toString());
    console.log('💾 Entreprise sélectionnée sauvegardée:', entrepriseId);
  }

  getMesEntreprisesGerees(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Accept': 'application/json'
    });
    
    console.log('📡 Récupération des entreprises gérées par le CM');
    
    return this.http.get<any>(`${this.apiUrl}/entreprises/mes-entreprises`, { headers }).pipe(
      map(response => {
        console.log('📦 Réponse mes-entreprises:', response);
        const data = response?.data ?? response ?? [];
        return Array.isArray(data) ? data : [];
      })
    );
  }
}