import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { 
  Entreprise, 
  CreateEntrepriseRequest, 
  UpdateEntrepriseRequest, 
  ApiResponse, 
  PaginatedResponse 
} from './entreprise.model';
import { BackendURL } from '../../../Share/const';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseService {
  private apiUrl = BackendURL.replace(/\/+$/, ''); 

  private pickArray(res: any): any[] {
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data))       return res.data;
    if (Array.isArray(res?.content))    return res.content;
    if (Array.isArray(res))             return res;
    return [];
  }

  constructor(private http: HttpClient) {}


 private readonly allowedKeys = [
  'nom_entreprise','description','site_web','telephone','email',
  'secteur_activite','logo','pays_id','statut','motif_rejet'
];

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
    // (laisse comme tu l’avais si ça marche)
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
    (entreprise as any).logo instanceof File; // sécurité si on t’oublie

  if (hasFile) {
    const fd = this.buildFormData(entreprise);
    fd.append('_method', 'PUT'); // ✅ méthode spoof pour Laravel
    return this.http.post<ApiResponse<Entreprise>>(
      `${this.apiUrl}/entreprises/${id}`,
      fd
    );
  }

  // ✅ Pas de fichier => JSON PUT (permet aussi d’effacer: logo: "")
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

  // Et pour la liste des en attente :
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

  // -- LOGO: fichier prioritaire
  const file = (data as any).logoFile || (data as any).logo;
  if (file instanceof File) {
    fd.append('logo', file); // ✅ fichier
  } else {
    const logoVal = (data as any).logo;
    if (logoVal === '') {
      // ✅ effacement explicite
      fd.append('logo', '');
    } else if (typeof logoVal === 'string' && /^https?:\/\//i.test(logoVal)) {
      // ✅ URL absolue
      fd.append('logo', logoVal);
    }
    // Note: si c’est un chemin relatif existant (ex: "logos/xxx.jpg"), on NE l’envoie pas
    // pour ne pas l’écraser inutilement côté back.
  }

  // -- autres champs whitelistés
  const payload = this.buildJsonPayload(data);
  delete payload.logo; // déjà traité ci-dessus
  delete (payload as any).logoFile;

  for (const [k, v] of Object.entries(payload)) {
  if (k === 'motif_rejet') {
    const s = v == null ? '' : String(v).trim().toLowerCase();
    if (!s || s === 'null' || s === 'undefined') continue; // n'envoie pas
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
}