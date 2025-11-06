// publicite.service.ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BackendURL, imageUrl } from '../../../Share/const';
import { Publicite } from './publicite.model';
import { AuthService } from '../../auth/auth.service';

export interface ActivationRequest {
  publicite_id: number;
  duree: string;
  date_debut: Date;
  moyen_paiement: string;
  montant: number;
}

export interface ActivationResponse {
  success: boolean;
  payment_code: string;
  transaction_id: string;
  message: string;
}

export interface CodeValidationRequest {
  publicite_id: number;
  activation_code: string;
  transaction_id?: string;
}

export interface CodeValidationResponse {
  success: boolean;
  message: string;
  publicite?: any;
}

export interface PricingTier {
  duree: string;
  prix: number;
  label: string;
  reduction?: number;
}

export interface PaymentMethod {
  label: string;
  value: string;
  icon: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class Publiciteservice {
  private apiUrl = `${BackendURL}publicites`;
  private activationUrl = `${BackendURL}publicites/activation`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ===============================
  // HELPER: Headers avec token
  // ===============================
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('🔑 Token utilisé (publicite):', token ? 'Présent (longueur: ' + token.length + ')' : 'ABSENT');
    
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private resolveMedia(u?: string): string | undefined {
    if (!u) return undefined;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('/storage/')) {
      const origin = BackendURL.replace(/\/api\/?$/, '');
      return origin + u;
    }
    return imageUrl + u.replace(/^\/+/, '');
  }

  // ===============================
  // MÉTHODES CRUD
  // ===============================

  /** 
   * ✅ ADMIN - Toutes les publicités 
   */
  getPublicites(): Observable<Publicite[]> {
    console.log('📡 Appel getPublicites() (ADMIN) - endpoint:', this.apiUrl);
    
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse getPublicites:', res);
        return Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
      })
    );
  }

  /** 
   * ✅ RECRUTEUR/CM - Mes publicités (avec filtre entreprise optionnel)
   * @param entrepriseId (optionnel) - Pour filtrer par entreprise spécifique
   */
  getMesPublicites(entrepriseId?: number): Observable<Publicite[]> {
    const userRole = this.authService.getCurrentUserRole()?.toLowerCase();
    
    // ✅ Construire l'URL avec entreprise_id si fourni
    let url = `${this.apiUrl}/mes-publicites`;
    if (entrepriseId) {
      url += `?entreprise_id=${entrepriseId}`;
      console.log('🔍 Filtrage par entreprise:', entrepriseId);
    }
    
    console.log('📡 Appel getMesPublicites() pour rôle:', userRole, '- endpoint:', url);
    
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse getMesPublicites:', res);
        
        // ✅ Gérer la pagination
        if (res?.data?.data) {
          // Format paginé : { data: { data: [...], meta: {...} } }
          return res.data.data;
        } else if (res?.data) {
          // Format simple : { data: [...] }
          return Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res)) {
          // Format direct : [...]
          return res;
        }
        
        return [];
      }),
      map((rows: any[]) => {
        // ✅ Log pour debug
        const msg = entrepriseId 
          ? `pour entreprise ${entrepriseId}` 
          : 'pour toutes les entreprises';
        console.log(`✅ ${rows.length} publicités chargées ${msg}`);
        
        // ✅ Résoudre les URLs des médias
        return rows.map(p => ({
          ...p,
          image: this.resolveMedia(p.image_url || p.image),
          video: this.resolveMedia(p.video_url || p.video),
        }));
      })
    );
  }

  /**
   * ✅ NOUVEAU : Récupérer les publicités selon le rôle
   * @param entrepriseId (optionnel) - Pour CM : filtrer par entreprise
   */
  getPublicitesByRole(entrepriseId?: number): Observable<Publicite[]> {
    const userRole = this.authService.getCurrentUserRole()?.toLowerCase();
    console.log('🔍 Récupération publicités pour rôle:', userRole);

    // Administrateur
    if (userRole === 'administrateur' || userRole === 'admin') {
      console.log('📋 Mode Admin');
      return this.getPublicites();
    }

    // ✅ Recruteur OU Community Manager (avec entrepriseId optionnel)
    if (userRole === 'recruteur' || userRole === 'community_manager') {
      console.log('💼 Mode Recruteur/CM');
      return this.getMesPublicites(entrepriseId);
    }

    // Rôle non reconnu
    console.warn('⚠️ Rôle non reconnu:', userRole);
    return of([]);
  }

  private isFormData(x: any): x is FormData {
    return typeof FormData !== 'undefined' && x instanceof FormData;
  }

  private toYMD(d?: string | Date): string | undefined {
    if (!d) return undefined;
    if (d instanceof Date) return d.toISOString().slice(0,10);
    return d;
  }

  private buildBody(p: Publicite): FormData | any {
    const hasFiles = !!(p.imageFile || p.videoFile);
    const mediaReq = p.media_request ?? (p.video || p.videoFile ? 'video' : 'image');

    if (hasFiles) {
      const fd = new FormData();
      fd.append('titre', p.titre ?? '');
      fd.append('description', p.description ?? '');
      if (p.lien_externe) fd.append('lien_externe', p.lien_externe);
      fd.append('type', p.type ?? 'banniere');
      fd.append('media_request', mediaReq);
      if (p.entreprise_id) fd.append('entreprise_id', String(p.entreprise_id));

      if (p.duree) fd.append('duree', String(p.duree));
      if (p.date_debut) fd.append('date_debut', p.date_debut instanceof Date ? p.date_debut.toISOString().slice(0,10) : p.date_debut);

      if (p.imageFile) fd.append('image', p.imageFile);
      else if (p.image) fd.append('image', p.image);
      if (p.videoFile) fd.append('video', p.videoFile);
      else if (p.video) fd.append('video', p.video);
      return fd;
    }

    return {
      titre: p.titre ?? '',
      description: p.description ?? '',
      image: p.image ?? null,
      video: p.video ?? null,
      lien_externe: p.lien_externe ?? null,
      type: p.type ?? 'banniere',
      media_request: mediaReq,
      entreprise_id: p.entreprise_id,
      duree: p.duree,
      date_debut: p.date_debut instanceof Date ? p.date_debut.toISOString().slice(0,10) : p.date_debut
    };
  }

  createPublicite(pOrBody: Publicite | FormData | any): Observable<any> {
    const body = this.isFormData(pOrBody) || typeof pOrBody !== 'object' ? pOrBody : this.buildBody(pOrBody);
    
    const headers = this.isFormData(body) 
      ? new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
      : this.getHeaders();
    
    return this.http.post(this.apiUrl, body, { headers });
  }

  updatePublicite(id: number, pOrBody: Publicite | FormData | any): Observable<any> {
    const body = this.isFormData(pOrBody) || typeof pOrBody !== 'object' ? pOrBody : this.buildBody(pOrBody);
    
    const headers = this.isFormData(body)
      ? new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` })
      : this.getHeaders();
    
    return this.http.put(`${this.apiUrl}/${id}`, body, { headers });
  }

  updatePubliciteRaw(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deletePublicite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // ===============================
  // SYSTÈME D'ACTIVATION
  // ===============================

  getPricingTiers(): PricingTier[] {
    return [
      { duree: '3', prix: 5000, label: '3 jours - 5 000 FCFA' },
      { duree: '7', prix: 10000, label: '7 jours - 10 000 FCFA', reduction: 5 },
      { duree: '14', prix: 18000, label: '14 jours - 18 000 FCFA', reduction: 10 },
      { duree: '30', prix: 35000, label: '30 jours - 35 000 FCFA', reduction: 15 },
      { duree: '60', prix: 65000, label: '60 jours - 65 000 FCFA', reduction: 20 },
      { duree: '90', prix: 90000, label: '90 jours - 90 000 FCFA', reduction: 25 }
    ];
  }

  calculatePrice(duree: string): number {
    const tier = this.getPricingTiers().find(t => t.duree === duree);
    return tier ? tier.prix : 0;
  }

  getPaymentMethods(): PaymentMethod[] {
    return [
      { label: 'Orange Money', value: 'orange', icon: 'pi pi-mobile', color: '#FF6600', description: 'Paiement via Orange Money' },
      { label: 'Moov Money', value: 'moov', icon: 'pi pi-mobile', color: '#0066CC', description: 'Paiement via Moov Money' },
      { label: 'Wave', value: 'wave', icon: 'pi pi-credit-card', color: '#00D4AA', description: 'Transfert d\'argent Wave' },
      { label: 'Coris Bank', value: 'coris', icon: 'pi pi-building', color: '#8B0000', description: 'Paiement via Coris Bank Mobile' },
      { label: 'Ecobank', value: 'ecobank', icon: 'pi pi-building', color: '#005AA0', description: 'Paiement via Ecobank Mobile' }
    ];
  }

  generatePaymentCode(operator: string, amount: number, merchantNumber: string = '71000000'): string {
    const codes = {
      'orange': `*144*2*${merchantNumber}*${amount}#`,
      'moov': `*555*2*${merchantNumber}*${amount}#`,
      'wave': `Envoyez ${amount} FCFA au ${merchantNumber.substring(0,2)} ${merchantNumber.substring(2,4)} ${merchantNumber.substring(4,6)} ${merchantNumber.substring(6,8)}`,
      'coris': `*880*1*${merchantNumber}*${amount}#`,
      'ecobank': `*770*${merchantNumber}*${amount}#`
    } as const;
    return (codes as any)[operator] || `Code non disponible pour ${operator}`;
  }

  requestActivation(data: ActivationRequest): Observable<ActivationResponse> {
    return this.http.post<ActivationResponse>(`${this.activationUrl}/request`, data, { headers: this.getHeaders() });
  }

  validateActivationCode(data: CodeValidationRequest): Observable<CodeValidationResponse> {
    return this.http.post<CodeValidationResponse>(`${this.activationUrl}/validate`, data, { headers: this.getHeaders() });
  }

  checkPaymentStatus(transactionId: string): Observable<any> {
    return this.http.get(`${this.activationUrl}/status/${transactionId}`, { headers: this.getHeaders() });
  }

  activatePublicite(publiciteId: number, activationCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${publiciteId}/activate`, { activation_code: activationCode }, { headers: this.getHeaders() });
  }

  activateByStatusChange(publiciteId: number, duree: string, dateDebut: Date | string): Observable<any> {
    const toYMD = (d: Date | string) =>
      typeof d === 'string' ? d : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10);

    const payload = {
      statut: 'active',
      payment_status: 'paid',
      duree: String(duree),
      date_debut: toYMD(dateDebut)
    };
    return this.updatePubliciteRaw(publiciteId, payload);
  }

  activatePubliciteV2(id: number, duree: string, dateDebut: Date | string) {
    const date_ymd = dateDebut instanceof Date
      ? dateDebut.toISOString().slice(0,10)
      : dateDebut;

    return this.http.put(`${this.apiUrl}/${id}/activer`, {
      duree,
      date_debut: date_ymd,
      payment_status: 'paid'
    }, { headers: this.getHeaders() });
  }

  // ===============================
  // STATISTIQUES
  // ===============================

  /**
   * ✅ NOUVEAU : Récupérer les statistiques des publicités
   * - Admin : Globales
   * - Recruteur/CM : Personnelles (filtrées par entreprises)
   */
  getStatistiques(): Observable<any> {
    const headers = this.getHeaders();
    console.log('📊 Récupération statistiques publicités');
    
    return this.http.get<any>(`${this.apiUrl}/statistiques`, { headers }).pipe(
      map(response => {
        console.log('📦 Stats reçues:', response);
        return response?.data ?? response ?? {};
      })
    );
  }

  // ===============================
  // DIVERS
  // ===============================

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  }

  calculateEndDate(startDate: Date, duration: string): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(duration));
    return endDate;
  }

  canActivate(publicite: Publicite): boolean {
    const inactive = ['brouillon', 'en_attente', 'rejetee', 'expiree'];
    return inactive.includes(publicite.statut || 'brouillon');
  }

  getStatusColor(statut?: string): 'success' | 'warn' | 'secondary' | 'danger' | 'contrast' {
    switch (statut) {
      case 'active': return 'success';
      case 'en_attente': return 'warn';
      case 'brouillon': return 'secondary';
      case 'rejetee': return 'danger';
      case 'expiree': return 'contrast';
      default: return 'secondary';
    }
  }

  simulateActivationCodeReceived(publiciteId: number): Observable<string> {
    const code = `PUB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(code);
        observer.complete();
      }, 3000);
    });
  }

  getActivationHistory(publiciteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.activationUrl}/history/${publiciteId}`, { headers: this.getHeaders() });
  }

  getRevenueStats(): Observable<any> {
    return this.http.get(`${this.activationUrl}/stats/revenue`, { headers: this.getHeaders() });
  }

  getPublicitesByStatus(status: string): Observable<Publicite[]> {
    return this.http.get<any>(`${this.apiUrl}?status=${status}`, { headers: this.getHeaders() }).pipe(
      map(res => Array.isArray(res?.data?.data) ? res.data.data
            : Array.isArray(res?.data) ? res.data
            : Array.isArray(res) ? res : []),
      map((rows: any[]) => rows.map(p => ({
        ...p,
        image: this.resolveMedia(p.image_url || p.image),
        video: this.resolveMedia(p.video_url || p.video),
      })))
    );
  }

  getCommunityManagerPublicites(entrepriseId?: number): Observable<any> {
    let params = new HttpParams();
    
    if (entrepriseId) {
      params = params.set('entreprise_id', entrepriseId.toString());
    }
    
    return this.http.get<any>(`${this.apiUrl}/community/publicites`, { params });
  }
}