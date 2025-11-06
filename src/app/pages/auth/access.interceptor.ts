// src/app/pages/auth/access.interceptor.ts
import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BackendURL, LocalStorageFields } from '../../Share/const';
import { EntrepriseService } from '../crud/entreprise/entreprise.service';


// ===== ENDPOINTS PUBLICS (SANS TOKEN) =====
const PUBLIC_API_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/register-candidat',
  '/auth/register-recruteur',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-reset-token',
  '/categories',
  '/pays',
  '/conseils',
];

function isApiUrl(url: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  return url.startsWith(base);
}

// ✅ Vérifier si c'est une offre publique
function isPublicOffreEndpoint(path: string): boolean {
  // /offres ou /offres/ (liste) → PUBLIC
  if (path === '/offres' || path === '/offres/') {
    return true;
  }
  
  // /offres/123 (détail avec ID numérique uniquement) → PUBLIC
  if (/^\/offres\/\d+\/?$/.test(path)) {
    return true;
  }
  
  // Tout le reste (/offres/mes-offres, /offres/search, etc.) → PROTÉGÉ
  return false;
}

function isPublicEndpoint(url: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  const path = url.replace(base, '');
  
  // Vérifier les endpoints standards publics
  const isStandardPublic = PUBLIC_API_ENDPOINTS.some(endpoint => {
    return path === endpoint || path.startsWith(endpoint);
  });
  
  if (isStandardPublic) {
    return true;
  }
  
  // Vérification spécifique pour les offres
  return isPublicOffreEndpoint(path);
}

function getToken(auth: any): string | undefined {
  const svc =
    (typeof auth.getToken === 'function' ? auth.getToken() : undefined) ??
    auth?.accessToken ?? 
    auth?.token ?? 
    undefined;
  if (svc) return svc;

  const keys = [
    LocalStorageFields?.accessToken ?? 'accessToken',
    'access_token',
    'AUTH_TOKEN',
    'token',
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return undefined;
}

// ✅ NOUVELLE FONCTION : Déterminer si on doit ajouter entreprise_id
function shouldAddEntrepriseId(url: string, method: string): boolean {
  const base = String(BackendURL).replace(/\/+$/, '');
  const path = url.replace(base, '');
  
  // NE PAS ajouter entreprise_id pour ces endpoints
  const excludedPaths = [
    '/auth/',
    '/categories',
    '/pays',
    '/conseils',
    '/community/entreprises', // Le CM récupère ses entreprises
    '/profile',
    '/users/'
  ];
  
  // Si l'URL est dans les exclusions, ne pas ajouter entreprise_id
  if (excludedPaths.some(excluded => path.startsWith(excluded))) {
    return false;
  }
  
  // Endpoints qui ont besoin de entreprise_id
  const needsEntrepriseId = [
    '/offres',
    '/candidatures',
    '/publicites',
    '/mon-entreprise'
  ];
  
  // Vérifier si l'URL correspond à un de ces endpoints
  return needsEntrepriseId.some(endpoint => path.startsWith(endpoint));
}

export function accessInterceptor(
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService) as any;
  const entrepriseService = inject(EntrepriseService); // ✅ INJECTION DU SERVICE
  const router = inject(Router);

  console.log('🔄 Interceptor - URL:', req.url);

  // 1) Si URL non-API, laisser passer sans modification
  if (!isApiUrl(req.url)) {
    console.log('  ✅ Non-API, laisse passer');
    return next(req);
  }

  // 2) Si endpoint PUBLIC, laisser passer SANS token
  if (isPublicEndpoint(req.url)) {
    console.log('  ✅ Endpoint public, laisse passer sans token');
    const publicReq = req.clone({
      setHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return next(publicReq);
  }

  // 3) Endpoint PROTÉGÉ : récupérer le token
  const token = getToken(authService);
  console.log('  🔐 Endpoint protégé - Token présent:', !!token);

  // 4) Si pas de token sur endpoint protégé -> erreur
  if (!token) {
    console.warn('  ⚠️ Pas de token pour endpoint protégé');
    
    const currentPath = router.url;
    const publicPaths = ['/', '/connexion', '/register', '/offres', '/suivre-candidature'];
    
    if (!publicPaths.some(p => currentPath.startsWith(p))) {
      console.log('  ↪️ Redirection vers /connexion');
      router.navigateByUrl('/connexion');
    }
    
    return throwError(() => new Error('Token requis pour cette requête'));
  }

  // ✅ 5) NOUVEAU : Ajouter entreprise_id si nécessaire
  let modifiedReq = req;
  const selectedEntrepriseId = entrepriseService.getSelectedEntrepriseId();
  
  // Vérifier si l'utilisateur est CM ou Recruteur
  const userRole = authService.getCurrentUserRole();
  const needsEntrepriseId = userRole && (
    userRole.toLowerCase() === 'community_manager' || 
    userRole.toLowerCase() === 'recruteur'
  );
  
  if (needsEntrepriseId && selectedEntrepriseId && shouldAddEntrepriseId(req.url, req.method)) {
    console.log('  🏢 Ajout entreprise_id:', selectedEntrepriseId);
    
    // Pour GET : ajouter en query param
    if (req.method === 'GET') {
      const url = new URL(req.url);
      if (!url.searchParams.has('entreprise_id')) {
        url.searchParams.set('entreprise_id', selectedEntrepriseId.toString());
        modifiedReq = req.clone({ url: url.toString() });
        console.log('    ✅ Ajouté dans query params');
      }
    } 
    // Pour POST/PUT/PATCH : ajouter dans le body
    else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body instanceof FormData) {
        // FormData : dupliquer et ajouter
        const formData = new FormData();
        (req.body as FormData).forEach((value, key) => {
          formData.append(key, value);
        });
        if (!formData.has('entreprise_id')) {
          formData.append('entreprise_id', selectedEntrepriseId.toString());
          modifiedReq = req.clone({ body: formData });
          console.log('    ✅ Ajouté dans FormData');
        }
      } else if (typeof req.body === 'object' && req.body !== null) {
        // JSON : cloner et ajouter
        const body = { ...req.body } as any;
        if (!body.hasOwnProperty('entreprise_id')) {
          body['entreprise_id'] = selectedEntrepriseId;
          modifiedReq = req.clone({ body });
          console.log('    ✅ Ajouté dans body JSON');
        }
      }
    }
  }

  // 6) Détecter FormData
  const isFormData = modifiedReq.body instanceof FormData;
  
  console.log('  📦 Type de contenu:', isFormData ? 'FormData (fichier)' : 'JSON');

  // 7) Construire les headers selon le type
  const headers: any = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  };

  // NE PAS ajouter Content-Type si FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const cloned = modifiedReq.clone({ setHeaders: headers });

  console.log('  ✅ Requête avec token envoyée');
  if (isFormData) {
    console.log('  🎯 Headers (FormData):', ['Authorization: Bearer ***', 'Accept: application/json']);
  }

  // 8) Gestion centralisée des erreurs
  return next(cloned).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        console.error('❌ Erreur HTTP:', error.status, error.message);
        
        if (error.status === 401) {
          console.log('  🚪 401 - Déconnexion et redirection');
          try { 
            authService.logout?.(); 
          } catch (e) {
            console.error('Erreur lors du logout:', e);
          }
          localStorage.clear();
          router.navigateByUrl('/connexion');
        } else if (error.status === 403) {
          console.log('  🚫 403 - Accès refusé');
          router.navigate(['/acces-refuse']);
        }
      }
      return throwError(() => error);
    })
  );
}