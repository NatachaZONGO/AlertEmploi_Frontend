import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard - URL:', state.url);

  // ===== VÉRIFICATION 1 : Utilisateur connecté ? =====
  const isAuthenticated = authService.isAuthenticated();
  
  console.log('  - Authentifié:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('  ❌ Non authentifié - Redirection vers /connexion');
    
    // Rediriger vers connexion avec returnUrl
    router.navigate(['/connexion'], { 
      queryParams: { 
        returnUrl: state.url 
      }
    });
    return false;
  }

  console.log('  ✅ Utilisateur authentifié');

  // ===== VÉRIFICATION 2 : Rôles requis ? =====
  const requiredRoles = route.data['roles'] as string[] | undefined;
  
  if (!requiredRoles || requiredRoles.length === 0) {
    console.log('  ✅ Aucun rôle requis');
    return true;
  }

  console.log('  - Rôles requis:', requiredRoles);

  const userRole = authService.getCurrentUserRole();
  console.log('  - Rôle utilisateur:', userRole);

  if (!userRole) {
    console.log('  ❌ Aucun rôle trouvé');
    router.navigate(['/acces-refuse']);
    return false;
  }

  // Normaliser pour comparaison
  const normalizedUserRole = userRole.toLowerCase().trim();
  const normalizedRequiredRoles = requiredRoles.map(r => r.toLowerCase().trim());

  const hasRole = normalizedRequiredRoles.includes(normalizedUserRole);

  if (!hasRole) {
    console.log('  ❌ Rôle insuffisant');
    router.navigate(['/acces-refuse']);
    return false;
  }

  console.log('  ✅ Accès autorisé');
  return true;
};