import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendURL } from '../../../Share/const';
import { Pays } from './pays.model';

@Injectable({
  providedIn: 'root'
})
export class PaysService {
  private apiUrl = `${BackendURL}pays`; 

  constructor(private http: HttpClient) {}

  getPays(): Observable<{ success: boolean; data: Pays[] }> {
    return this.http.get<{ success: boolean; data: Pays[] }>(this.apiUrl);
  }

  getPaysById(id: string): Observable<{ success: boolean; data: Pays }> {
    return this.http.get<{ success: boolean; data: Pays }>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ CRÉER un pays (FormData)
   * NE PAS ajouter de headers Content-Type ! Angular gère ça automatiquement
   */
  createPays(formData: FormData): Observable<{ success: boolean; data: Pays }> {
    console.log('🌐 POST:', this.apiUrl);
    return this.http.post<{ success: boolean; data: Pays }>(
      this.apiUrl, 
      formData
      // ⚠️ PAS DE HEADERS ICI !
    );
  }

  /**
   * ✅ METTRE À JOUR un pays (FormData avec _method=PUT)
   */
  updatePays(id: string, formData: FormData): Observable<{ success: boolean; data: Pays }> {
    console.log('🌐 POST (spoof PUT):', `${this.apiUrl}/${id}`);
    return this.http.post<{ success: boolean; data: Pays }>(
      `${this.apiUrl}/${id}`, 
      formData
      // ⚠️ PAS DE HEADERS ICI !
    );
  }

  /**
   * ✅ SUPPRIMER un pays
   */
  deletePays(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }
}