import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, tap, throwError } from 'rxjs';
import { UserConnexion } from './connexion/userconnexion.model';
import { BackendURL, LocalStorageFields } from '../../Share/const';
import { RegisterCandidat, RegisterRecruteur } from './register/user.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  accessToken?: string;
  private _entreprises: any[] = [];
  private entreprisesSubject = new BehaviorSubject<any[]>([]);
  public entreprises$: Observable<any[]> = this.entreprisesSubject.asObservable();

  /** Liste des noms de rôles (ex: ["Administrateur", "Recruteur"]) */
  private _rolesNames: string[] = [];

  private utilisateurConnecteSubject = new BehaviorSubject<any>(null);
  utilisateurConnecte$: Observable<any> = this.utilisateurConnecteSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeFromStorage();
  }

  // ================== INITIALISATION ==================

  /**
   * Initialise les données depuis le localStorage
   */
  private initializeFromStorage(): void {
  // Token
  this.accessToken = localStorage.getItem(LocalStorageFields.accessToken) ?? undefined;

  // Rôles
  const rolesJson = localStorage.getItem(LocalStorageFields.roles_name);
  const singleRole = localStorage.getItem(LocalStorageFields.userRole);
  
  if (rolesJson) {
    try {
      this._rolesNames = JSON.parse(rolesJson) ?? [];
    } catch {
      this._rolesNames = [];
    }
  } else if (singleRole) {
    this._rolesNames = [singleRole];
    localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
    localStorage.removeItem(LocalStorageFields.userRole);
  }

  // User
  const utilisateur = localStorage.getItem('utilisateur');
  if (utilisateur) {
    try {
      const user = JSON.parse(utilisateur);
      this.utilisateurConnecteSubject.next(user);
      
      if (user?.role && !this._rolesNames.length) {
        this._rolesNames = [user.role];
        localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
      }
    } catch {
      this.utilisateurConnecteSubject.next(null);
    }
  }

  // ✅ NOUVEAU : Charger les entreprises
  this.loadEntreprisesFromStorage();
}
  // ================== INSCRIPTION ==================

  /**
   * Inscription candidat
   */
  registerCandidat(payload: RegisterCandidat): Promise<any> {
    return firstValueFrom(
      this.http.post(`${BackendURL}auth/register-candidat`, payload).pipe(
        tap((res: any) => this.persistAuthAfterRegister(res)),
        catchError(err => {
          console.error('❌ Erreur registerCandidat:', err);
          return throwError(() => err);
        })
      )
    );
  }

  /**
   * Inscription recruteur
   */
  registerRecruteur(payload: RegisterRecruteur): Promise<any> {
    return firstValueFrom(
      this.http.post(`${BackendURL}auth/register-recruteur`, payload).pipe(
        tap((res: any) => this.persistAuthAfterRegister(res)),
        catchError(err => {
          console.error('❌ Erreur registerRecruteur:', err);
          return throwError(() => err);
        })
      )
    );
  }

  /**
   * Persiste les données après inscription
   */
  private persistAuthAfterRegister(res: any): void {
    const token = res?.data?.token;
    const user = res?.data?.user;
    
    if (token) {
      this.accessToken = token;
      localStorage.setItem(LocalStorageFields.accessToken, token);
    }
    
    if (user) {
      localStorage.setItem('utilisateur', JSON.stringify(user));
      this.utilisateurConnecteSubject.next(user);
      
      // Extraire le rôle
      if (user.role) {
        this._rolesNames = [user.role];
        localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
      }
    }
  }

  // ================== CONNEXION ==================

  /**
   * Connexion utilisateur
   */
  connexion(userConnexion: UserConnexion): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${BackendURL}auth/login`, userConnexion, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }).pipe(
        tap((res) => {
          console.log('📦 Réponse connexion:', res);
          
          // ---- Extract token
          const token: string | undefined = 
            res?.access_token ?? 
            res?.data?.token ?? 
            res?.token;

          if (!token) {
            console.error('❌ Token manquant dans la réponse');
            throw new Error('Token manquant');
          }

          this.accessToken = token;
          localStorage.setItem(LocalStorageFields.accessToken, token);

          // ---- Extract user
          const user = res?.user ?? res?.data?.user ?? null;
          
          if (user) {
            localStorage.setItem('utilisateur', JSON.stringify(user));
            this.utilisateurConnecteSubject.next(user);
          } else {
            console.warn('⚠️ Utilisateur manquant dans la réponse');
          }

          // ---- Extract roles
          let rolesNames: string[] = [];

          // Cas 1: roles séparés [{nom: 'admin'}]
          if (Array.isArray(res?.roles)) {
            rolesNames = res.roles
              .map((r: any) => r?.nom ?? r?.name)
              .filter(Boolean);
          }

          // Cas 2: user.roles
          if (!rolesNames.length && Array.isArray(user?.roles)) {
            rolesNames = user.roles
              .map((r: any) => r?.nom ?? r?.name)
              .filter(Boolean);
          }

          // Cas 3: user.role (string simple)
          if (!rolesNames.length && typeof user?.role === 'string') {
            rolesNames = [user.role];
          }

          this._rolesNames = rolesNames;
          localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
          localStorage.removeItem(LocalStorageFields.userRole); // Nettoyage legacy

          console.log('✅ Rôles en session:', this._rolesNames);
        }),
        catchError((error) => {
          console.error('❌ Erreur connexion:', error);
          return throwError(() => new Error('Erreur lors de la connexion'));
        })
      )
    );
  }

  /**
 * ✅ NOUVEAU : Récupère les entreprises gérables
 */
getEntreprises(): any[] {
  return this._entreprises;
}

/**
 * ✅ NOUVEAU : Met à jour les entreprises
 */
private setEntreprises(entreprises: any[]): void {
  this._entreprises = entreprises || [];
  localStorage.setItem('entreprises', JSON.stringify(this._entreprises));
  this.entreprisesSubject.next(this._entreprises);
  console.log('📍 Entreprises stockées:', this._entreprises.length);
}

/**
 * ✅ NOUVEAU : Charge les entreprises depuis localStorage
 */
private loadEntreprisesFromStorage(): void {
  const stored = localStorage.getItem('entreprises');
  if (stored) {
    try {
      this._entreprises = JSON.parse(stored);
      this.entreprisesSubject.next(this._entreprises);
    } catch {
      this._entreprises = [];
    }
  }
}

  // ================== RÉINITIALISATION MOT DE PASSE ==================

  /**
   * ✅ Demander la réinitialisation du mot de passe
   * Envoie un email avec un lien de réinitialisation
   */
  forgotPassword(email: string): Observable<any> {
    console.log('📧 Demande de réinitialisation pour:', email);
    
    return this.http.post(`${BackendURL}auth/forgot-password`, { email }).pipe(
      tap(res => {
        console.log('✅ Email de réinitialisation envoyé:', res);
      }),
      catchError(err => {
        console.error('❌ Erreur forgot-password:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Réinitialiser le mot de passe avec le token
   */
  resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<any> {
    console.log('🔐 Réinitialisation du mot de passe');
    console.log('  - Email:', data.email);
    console.log('  - Token:', data.token.substring(0, 20) + '...');
    
    return this.http.post(`${BackendURL}auth/reset-password`, data).pipe(
      tap(res => {
        console.log('✅ Mot de passe réinitialisé avec succès:', res);
      }),
      catchError(err => {
        console.error('❌ Erreur reset-password:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        console.error('  Errors:', err.error?.errors);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Vérifier si un token de réinitialisation est valide
   * (Optionnel mais utile pour l'UX)
   */
  verifyToken(token: string, email: string): Observable<any> {
    console.log('🔍 Vérification du token de réinitialisation');
    console.log('  - Email:', email);
    console.log('  - Token:', token.substring(0, 20) + '...');
    
    return this.http.post(`${BackendURL}auth/verify-reset-token`, { token, email }).pipe(
      tap(res => {
        console.log('✅ Token valide:', res);
      }),
      catchError(err => {
        console.error('❌ Token invalide ou expiré:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        return throwError(() => err);
      })
    );
  }

  // ================== DÉCONNEXION ==================

  /**
   * Déconnexion utilisateur
   */
  logout(): void {
  this.accessToken = undefined;
  this._rolesNames = [];
  this._entreprises = []; // ✅ NOUVEAU
  
  localStorage.removeItem(LocalStorageFields.accessToken);
  localStorage.removeItem(LocalStorageFields.roles_name);
  localStorage.removeItem(LocalStorageFields.userRole);
  localStorage.removeItem('utilisateur');
  localStorage.removeItem('entreprises'); // ✅ NOUVEAU
  localStorage.removeItem('selected_entreprise_id'); // ✅ NOUVEAU
  
  this.utilisateurConnecteSubject.next(null);
  this.entreprisesSubject.next([]); // ✅ NOUVEAU
  
  console.log('👋 Déconnexion effectuée');
}

  // ================== INFORMATIONS UTILISATEUR ==================

  /**
   * Récupère les infos complètes de l'utilisateur connecté
   */
  getCurrentUserInfos(): Observable<{ user: any; roles: Array<{id?: number; nom: string}> }> {
    const token = this.getToken();
    
    if (!token) {
      return throwError(() => new Error('Aucun token trouvé'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.get<any>(`${BackendURL}auth/me`, { headers }).pipe(
      map((res) => {
        const data = res?.data ?? res;
        const rawUser = data.user ?? data;
        const rawRoles = data.roles ?? rawUser.roles ?? [];

        // Normalise user
        const user = {
          ...rawUser,
          nom: rawUser.nom ?? rawUser.lastname ?? rawUser.last_name ?? '',
          prenom: rawUser.prenom ?? rawUser.firstname ?? rawUser.first_name ?? '',
          email: rawUser.email ?? ''
        };

        // Normalise roles
        const roles: Array<{id?: number; nom: string}> = Array.isArray(rawRoles)
          ? rawRoles.map((r: any) => {
              if (typeof r === 'string') {
                return { nom: r };
              }
              return { 
                id: r?.id, 
                nom: r?.nom ?? r?.name ?? '' 
              };
            })
          : [];

        return { user, roles };
      })
    );
  }

  /**
   * Récupère l'utilisateur actuel depuis le localStorage
   */
  getCurrentUser(): any {
    const userStr = localStorage.getItem('utilisateur');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return user && user.id ? user : null;
    } catch {
      return null;
    }
  }

  /**
   * Récupère l'ID de l'utilisateur actuel
   */
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id ?? null;
  }

  /**
   * Récupère le rôle principal de l'utilisateur
   * (le premier rôle dans la liste)
   */
  getCurrentUserRole(): string | null {
    // Priorité 1: Rôles en mémoire
    if (this._rolesNames.length > 0) {
      return this._rolesNames[0];
    }

    // Priorité 2: Rôle dans l'user localStorage
    const user = this.getCurrentUser();
    if (user?.role) {
      this._rolesNames = [user.role];
      localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
      return user.role;
    }

    // Priorité 3: Ancien système
    const singleRole = localStorage.getItem(LocalStorageFields.userRole);
    if (singleRole) {
      this._rolesNames = [singleRole];
      localStorage.setItem(LocalStorageFields.roles_name, JSON.stringify(this._rolesNames));
      localStorage.removeItem(LocalStorageFields.userRole);
      return singleRole;
    }

    return null;
  }

  /**
   * Alias pour compatibilité (utilise getCurrentUserRole)
   */
  getUserRole(): string | null {
    return this.getCurrentUserRole();
  }

  /**
   * Récupère le token d'authentification
   */
  getToken(): string | null {
    const token = localStorage.getItem(LocalStorageFields.accessToken);
    
    if (token) {
      console.log('🔑 Token trouvé:', token.substring(0, 30) + '...');
      return token;
    }
    
    console.warn('⚠️ Aucun token trouvé !');
    return null;
  }

  /**
   * Expose la liste des rôles
   */
  rolesNames(): string[] {
    return this._rolesNames;
  }

  // ================== VÉRIFICATIONS ==================

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Alias pour isLoggedIn
   */
   isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    const isAuth = !!(token && user);
    
    console.log('🔐 isAuthenticated:', isAuth);
    console.log('  - Token présent:', !!token);
    console.log('  - User présent:', !!user);
    
    return isAuth;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const normalizedRole = role.toLowerCase();
    return this._rolesNames.some(r => r.toLowerCase() === normalizedRole);
  }

  /**
   * Vérifie si l'utilisateur a au moins un des rôles
   */
  hasAnyRole(roles: string[]): boolean {
    const normalizedRoles = roles.map(r => r.toLowerCase());
    return this._rolesNames.some(r => normalizedRoles.includes(r.toLowerCase()));
  }

  /**
   * Vérifie si l'utilisateur a tous les rôles
   */
  hasAllRoles(roles: string[]): boolean {
    const normalizedRoles = roles.map(r => r.toLowerCase());
    const userRoles = this._rolesNames.map(r => r.toLowerCase());
    return normalizedRoles.every(r => userRoles.includes(r));
  }
}