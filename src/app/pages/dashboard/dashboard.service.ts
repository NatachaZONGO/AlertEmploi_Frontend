// src/app/pages/dashboard/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../Share/const';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${BackendURL.replace(/\/+$/, '')}/dashboard/stats`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * ✅ Récupère les statistiques du dashboard
   * @param entrepriseId (optionnel) - Pour filtrer par entreprise (CM)
   */
  getStats(entrepriseId?: number): Observable<any> {
    let params = new HttpParams();
    
    // ✅ Ajouter entreprise_id si fourni
    if (entrepriseId) {
      params = params.set('entreprise_id', entrepriseId.toString());
      console.log('📊 Stats filtrées par entreprise:', entrepriseId);
    }
    
    return this.http
      .get<any>(this.apiUrl, { 
        headers: { Accept: 'application/json' },
        params 
      })
      .pipe(map(res => res?.data ?? res)); 
  }

  
}