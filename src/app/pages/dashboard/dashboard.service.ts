// src/app/pages/dashboard/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BackendURL } from '../../Share/const';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Endpoint back qu'on crée plus bas
  private apiUrl = `${BackendURL.replace(/\/+$/, '')}/dashboard/stats`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http
      .get<any>(this.apiUrl, { headers: { Accept: 'application/json' } })
      .pipe(map(res => res?.data ?? res)); 
  }
}
