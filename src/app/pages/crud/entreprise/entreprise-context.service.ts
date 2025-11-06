import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { EntrepriseService } from './entreprise.service';

@Injectable({
  providedIn: 'root'
})
export class EntrepriseContextService {
  private currentContextSubject = new BehaviorSubject<{
    entrepriseId: number | null;
    mode: 'recruteur' | 'community_manager';
  }>({
    entrepriseId: null,
    mode: 'recruteur'
  });

  public currentContext$ = this.currentContextSubject.asObservable();

  constructor(
    private authService: AuthService,
    private entrepriseService: EntrepriseService
  ) {
    this.initializeContext();
  }

  /**
   * ✅ Initialiser le contexte au démarrage
   */
  private initializeContext(): void {
    const isCM = this.authService.hasRole('community_manager');
    
    if (isCM) {
      // Pour CM : vérifier s'il y a une entreprise sélectionnée
      const selectedId = this.entrepriseService.getSelectedEntrepriseId();
      this.currentContextSubject.next({
        entrepriseId: selectedId,
        mode: 'community_manager'
      });
    } else {
      // Pour Recruteur : utiliser son entreprise (backend le gère)
      this.currentContextSubject.next({
        entrepriseId: null, // Le backend utilisera l'entreprise du recruteur
        mode: 'recruteur'
      });
    }
  }

  /**
   * ✅ Définir l'entreprise active (pour CM)
   */
  setActiveEntreprise(entrepriseId: number): void {
    console.log('🏢 Contexte entreprise activé:', entrepriseId);
    
    // Stocker dans le service entreprise
    this.entrepriseService.selectEntreprise(entrepriseId);
    
    // Mettre à jour le contexte
    this.currentContextSubject.next({
      entrepriseId: entrepriseId,
      mode: 'community_manager'
    });
  }

  /**
   * ✅ Récupérer l'ID de l'entreprise active
   */
  getActiveEntrepriseId(): number | null {
    return this.currentContextSubject.value.entrepriseId;
  }

  /**
   * ✅ Vérifier si on est en mode CM
   */
  isCommunityManagerMode(): boolean {
    return this.currentContextSubject.value.mode === 'community_manager';
  }

  /**
   * ✅ Réinitialiser le contexte (retour à la liste)
   */
  clearContext(): void {
    this.entrepriseService.clearSelection();
    this.initializeContext();
  }
}