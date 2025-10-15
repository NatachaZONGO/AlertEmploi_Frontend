// offre.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Offre } from './offre.model';
import { BackendURL } from '../../../Share/const'; // <= TA constante: "http://127.0.0.1:8000/api/"
import { AuthService } from '../../auth/auth.service';

interface ApiResponse<T> { success: boolean; data: T; message?: string; }
interface Pagination<T> {
  current_page: number; data: T[]; first_page_url: string; from: number;
  last_page: number; last_page_url: string; links: any[]; next_page_url: string | null;
  path: string; per_page: number; prev_page_url: string | null; to: number; total: number;
}

@Injectable({ providedIn: 'root' })
export class OffreService {
  private api = BackendURL + 'offres'.replace(/\/$/, ''); // "http://127.0.0.1:8000/api"
  private json = { headers: { Accept: 'application/json' } }; // force JSON

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** ADMIN – lister toutes les offres (paginées) */
  getAdminOffres(): Observable<Offre[]> {
  return this.http
    .get<{ success: boolean; data: any }>(`${this.api}`, { headers: { Accept: 'application/json' } })
    .pipe(map(r => r?.data?.data ?? [])); // <-- prend la pagination Laravel
}

getMesOffres(): Observable<Offre[]> {
  return this.http
    .get<{ success: boolean; data: any }>(`${this.api}/mes-offres`, { headers: { Accept: 'application/json' } })
    .pipe(map(r => r?.data?? []));
}


  getOffreById(id: number): Observable<Offre> {
    const url = `${this.api}/${id}`;
    return this.http.get<ApiResponse<Offre>>(url, this.json).pipe(map(r => r.data));
  }

  createOffre(offre: Offre): Observable<Offre> {
    const url = `${this.api}`;
    return this.http.post<ApiResponse<Offre>>(url, offre, this.json).pipe(map(r => r.data));
  }

  updateOffre(id: number, offre: Offre): Observable<Offre> {
    const url = `${this.api}/${id}`;
    return this.http.put<ApiResponse<Offre>>(url, offre, this.json).pipe(map(r => r.data));
  }

  deleteOffre(id: number): Observable<void> {
    const url = `${this.api}/${id}`;
    return this.http.delete<ApiResponse<any>>(url, this.json).pipe(map(() => void 0));
  }

  // --- Workflow (aligné avec tes routes/verbes) ---
  soumettreValidation(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/soumettre-validation`, {}, this.json);
  }
  validerOffre(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/valider`, {}, this.json);
  }
  rejeterOffre(id: number, motif: string): Observable<any> {
  // Changer le nom du champ de 'motif' vers 'motif_rejet'
  return this.http.patch(`${this.api}/${id}/rejeter`, { 
    motif_rejet: motif  // ← Changé de 'motif' vers 'motif_rejet'
  });
}
  publierOffre(id: number): Observable<any> {
    return this.http.post(`${this.api}/${id}/publier`, {}, this.json);
  }
  fermerOffre(id: number): Observable<any> {
    // OffreController -> POST /offres/{id}/fermer
    return this.http.patch(`${this.api}/${id}/fermer`, {}, this.json);
  }

  // Catégories (si endpoint public /api/categories)
  getCategories(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${BackendURL}categories`, this.json)
      .pipe(map(r => (Array.isArray(r.data) ? r.data : [])));
  }

  /** Marquer en vedette (body: { sponsored_level, duration_days? } ou { sponsored_level, featured_until? }) */
  featureOffre(
    id: number,
    payload: { sponsored_level: number; duration_days?: number; featured_until?: string }
  ): Observable<any> {
    return this.http.post(`${this.api}/${id}/feature`, payload, this.json);
  }

  /** Retirer la mise en vedette */
  unfeatureOffre(id: number): Observable<any> {
    return this.http.post(`${this.api}/${id}/unfeature`, {}, this.json);
  }

  /** (optionnel) Récupérer uniquement les offres vedettes actives */
  getFeatured(): Observable<Offre[]> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.api}/featured`, { headers: { Accept: 'application/json' } })
      .pipe(map(r => r?.data ?? []));
  }

  getOffresByRole(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    if (this.authService.hasRole('Administrateur')) {
        // Admin voit toutes les offres
        return this.http.get(`${BackendURL}offres`, { headers });
    } else if (this.authService.hasRole('Recruteur')) {
        // Recruteur voit uniquement ses offres
        return this.http.get(`${BackendURL}mes-offres`, { headers });
    }

    // Aucun rôle autorisé
    return of({ success: false, data: [], message: 'Accès non autorisé' });
}

}
