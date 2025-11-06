import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { AuthService } from '../../auth/auth.service';
import { Entreprise } from '../entreprise/entreprise.model';

interface EntrepriseStats {
  total_offres: number;
  offres_actives: number;
  offres_brouillon: number;
  total_publicites: number;
  publicites_actives: number;
  candidatures_recues: number;
}

@Injectable({
  providedIn: 'root'
})
export class MonEntrepriseService {
  private apiUrl = `${BackendURL}mon-entreprise`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * ✅ NOUVEAU : Récupérer une entreprise spécifique (pour CM)
   */
  getEntrepriseById(id: number): Observable<Entreprise> {
    console.log('📡 Appel getEntrepriseById:', id);
    return this.http.get<any>(`${BackendURL}entreprises/${id}`, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse getEntrepriseById:', res);
        return res?.data || res;
      })
    );
  }
  /**
   * ✅ NOUVEAU : Récupérer les stats d'une entreprise spécifique (pour CM)
   */
  getStatistiquesEntreprise(entrepriseId: number): Observable<EntrepriseStats> {
    console.log('📡 Appel getStatistiquesEntreprise:', entrepriseId);
    return this.http.get<any>(`${BackendURL}entreprises/${entrepriseId}/stats`, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse stats entreprise:', res);
        return res?.data || res;
      })
    );
  }

  // Récupérer les informations de mon entreprise (recruteur)
  getMonEntreprise(): Observable<Entreprise> {
    console.log('📡 Appel getMonEntreprise()');
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse getMonEntreprise:', res);
        return res?.data || res;
      })
    );
  }

  // Récupérer les statistiques de mon entreprise (recruteur)
  getStatistiques(): Observable<EntrepriseStats> {
    console.log('📡 Appel getStatistiques()');
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse stats:', res);
        return res?.data || res;
      })
    );
  }

  updateMonEntreprise(data: Partial<Entreprise>): Observable<Entreprise> {
    console.log('📡 Appel updateMonEntreprise()');
    return this.http.put<any>(this.apiUrl, data, { headers: this.getHeaders() }).pipe(
      map(res => {
        console.log('📦 Réponse update:', res);
        return res?.data || res;
      })
    );
  }

  uploadLogo(file: File): Observable<any> {
    console.log('📤 Upload logo - Démarrage');
    const formData = new FormData();
    formData.append('logo', file);

    const url = `${this.apiUrl}/logo`;
    console.log('📡 Envoi vers:', url);

    return this.http.post(url, formData).pipe(
      map((res: any) => {
        console.log('✅ Réponse upload logo:', res);
        return res?.data || res;
      })
    );
  }
}