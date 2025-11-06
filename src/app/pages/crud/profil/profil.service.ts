import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { BackendURL } from '../../../Share/const';


@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${BackendURL.replace(/\/+$/, '')}/profile`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Récupère le profil complet de l'utilisateur connecté
   */
  getProfile(): Observable<any> {
    const token = this.authService.getToken();
    
    console.log('🔑 Token utilisé:', token ? 'Présent' : 'Absent');
    console.log('📡 URL appelée:', this.apiUrl);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      tap(response => {
        console.log('📦 Réponse ProfileService:', response);
      })
    );
  }

}