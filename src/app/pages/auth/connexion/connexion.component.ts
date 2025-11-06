import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserConnexion } from './userconnexion.model';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.component.html',
  standalone: true,
  providers: [MessageService],
  imports: [
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    CheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    ToastModule,
  ]
})
export class ConnexionComponent implements OnInit {
  formulaireconnexion!: FormGroup;
  isLoading = false;
  showPasswordcon = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    // Déjà connecté ? -> Dashboard
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.initForm();
    this.loadRememberedEmail();
  }

  private initForm(): void {
    this.formulaireconnexion = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberme: [false],
    });
  }

  private loadRememberedEmail(): void {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      this.formulaireconnexion.patchValue({
        email: rememberedEmail,
        rememberme: true,
      });
    }
  }

  async connexion(): Promise<void> {
    if (this.formulaireconnexion.invalid) {
      this.markFormGroupTouched(this.formulaireconnexion);
      this.showErrorMessage(
        'Formulaire incomplet',
        'Veuillez remplir tous les champs obligatoires.'
      );
      return;
    }

    this.isLoading = true;
    try {
      const creds: UserConnexion = {
        email: this.formulaireconnexion.value.email,
        password: this.formulaireconnexion.value.password,
      };

      // Connexion
      await this.auth.connexion(creds);

      // Se souvenir de moi
      this.handleRememberMe();

      // ✅ Message de succès personnalisé
      const user = this.auth.getCurrentUser();
      const userName = user?.prenom || user?.nom || 'Utilisateur';
      
      this.showSuccessMessage(
        'Connexion réussie !',
        `Bienvenue ${userName} ! Redirection en cours...`
      );

      // Redirection selon le rôle après 1.5s
      setTimeout(() => {
        const role = this.auth.getCurrentUserRole()?.toLowerCase();
        
        if (role === 'administrateur' || role === 'recruteur') {
          this.router.navigate(['/dashboard']);
        } else if (role === 'candidat') {
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/']);
        }
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);
      this.handleLoginError(error);
    } finally {
      this.isLoading = false;
    }
  }

  // ===== GESTION AMÉLIORÉE DES ERREURS =====
  // ===== GESTION AMÉLIORÉE DES ERREURS =====
private handleLoginError(error: any): void {
  const errorResponse = error?.error;
  const errorMessage = errorResponse?.message || error?.message || '';
  const errorStatus = error?.status || 0;

  console.log('📝 Erreur détaillée:', {
    status: errorStatus,
    message: errorMessage,
    fullError: error,
    response: errorResponse
  });

  // ✅ CORRECTION : Normaliser le message
  const normalizedMessage = errorMessage.toLowerCase().trim();
  
  // ===== 1. DÉTECTION SPÉCIFIQUE : "Compte en attente de validation" (EN PREMIER!) =====
  const validationPhrases = [
    'compte en attente de validation',
    'compte en attente',
    'attente de validation',
    'en attente de validation',
    'compte non validé',
    'compte non activé',
    'not validated',
    'not verified',
    'waiting for validation',
    'account pending validation',
    'pending validation',
    'en cours de validation'
  ];

  const isValidationPending = validationPhrases.some(phrase => 
    normalizedMessage.includes(phrase)
  );

  if (isValidationPending) {
    this.showWarningMessage(
      '⏳ Compte en attente de validation',
      'Votre compte est actuellement en cours de vérification par nos équipes. Vous recevrez un email de confirmation dès que votre compte sera activé. Cette opération prend généralement entre 24 et 48 heures.',
      12000
    );
    return;
  }

  // ===== 2. Vérification email non confirmé =====
  if (normalizedMessage.includes('email') && 
      !normalizedMessage.includes('connexion') && // ← AJOUT: Exclure si contient "connexion"
      (normalizedMessage.includes('vérif') || 
       normalizedMessage.includes('confirm') ||
       normalizedMessage.includes('non vérifié'))) {
    this.showWarningMessage(
      '📧 Email non vérifié',
      'Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation que nous vous avons envoyé lors de votre inscription.',
      8000
    );
    return;
  }

  // ===== 3. Compte bloqué/suspendu =====
  if (normalizedMessage.includes('bloqué') || 
      normalizedMessage.includes('suspendu') ||
      normalizedMessage.includes('désactivé') ||
      normalizedMessage.includes('banned') ||
      normalizedMessage.includes('suspended')) {
    this.showErrorMessage(
      '🚫 Compte bloqué',
      'Votre compte a été temporairement bloqué. Veuillez contacter notre support à support@alerteemploi.com pour obtenir de l\'aide.',
      12000
    );
    return;
  }

  // ===== 4. Compte rejeté =====
  if (normalizedMessage.includes('rejeté') || 
      normalizedMessage.includes('refusé') ||
      normalizedMessage.includes('rejected')) {
    this.showErrorMessage(
      '❌ Compte refusé',
      'Votre demande d\'inscription a été refusée. Veuillez contacter notre équipe pour plus d\'informations.',
      10000
    );
    return;
  }

  // ===== 5. Identifiants incorrects (401) =====
  if (errorStatus === 401 || 
      normalizedMessage.includes('identifiant') ||
      normalizedMessage.includes('credentials') ||
      (normalizedMessage.includes('incorrect') && !normalizedMessage.includes('validation')) || // ← AJOUT
      normalizedMessage.includes('invalid email') ||
      normalizedMessage.includes('invalid password') ||
      normalizedMessage.includes('mot de passe incorrect')) {
    this.showErrorMessage(
      '🔐 Identifiants incorrects',
      'L\'email ou le mot de passe que vous avez saisi est incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.',
      6000
    );
    return;
  }

  // ===== 6. Accès refusé (403) - MAIS pas si validation =====
  if (errorStatus === 403 && !isValidationPending) {
    this.showErrorMessage(
      '🚫 Accès refusé',
      errorMessage || 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
      6000
    );
    return;
  }

  // ===== 7. Erreurs de validation (422) =====
  if (errorStatus === 422) {
    const validationErrors = this.formatValidationErrors(errorResponse?.errors);
    this.showErrorMessage(
      '⚠️ Données invalides',
      validationErrors || 'Veuillez vérifier les informations saisies et réessayer.',
      6000
    );
    return;
  }

  // ===== 8. Trop de tentatives (429) =====
  if (errorStatus === 429 || 
      normalizedMessage.includes('tentative') ||
      normalizedMessage.includes('too many') ||
      normalizedMessage.includes('rate limit')) {
    this.showErrorMessage(
      '⏱️ Trop de tentatives',
      'Vous avez effectué trop de tentatives de connexion. Veuillez patienter 5 minutes avant de réessayer.',
      10000
    );
    return;
  }

  // ===== 9. Erreur serveur (500+) =====
  if (errorStatus >= 500) {
    this.showErrorMessage(
      '⚠️ Erreur serveur',
      'Une erreur technique est survenue sur nos serveurs. Nos équipes techniques ont été notifiées. Veuillez réessayer dans quelques instants.',
      8000
    );
    return;
  }

  // ===== 10. Problème de connexion (0) - SEULEMENT si status = 0 =====
  if (errorStatus === 0 || 
      (normalizedMessage.includes('network') && !isValidationPending) ||
      (normalizedMessage.includes('failed to fetch') && !isValidationPending)) {
    this.showErrorMessage(
      '📡 Problème de connexion',
      'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet et réessayer.',
      6000
    );
    return;
  }

  // ===== 11. Message par défaut =====
  this.showErrorMessage(
    '❌ Erreur de connexion',
    errorMessage || 'Une erreur inattendue s\'est produite. Si le problème persiste, contactez notre support.',
    6000
  );
}

  // ===== MÉTHODES D'AFFICHAGE DES MESSAGES =====
  private showSuccessMessage(title: string, message: string, life: number = 5000): void {
    this.toast.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: life,
      styleClass: 'custom-toast-success'
    });
  }

  private showErrorMessage(title: string, message: string, life: number = 6000): void {
    this.toast.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: life,
      styleClass: 'custom-toast-error'
    });
  }

  private showWarningMessage(title: string, message: string, life: number = 6000): void {
    this.toast.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: life,
      styleClass: 'custom-toast-warning'
    });
  }

  private showInfoMessage(title: string, message: string, life: number = 5000): void {
    this.toast.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: life,
      styleClass: 'custom-toast-info'
    });
  }

  // ===== MÉTHODE MANQUANTE : getToastIcon() =====
  getToastIcon(severity: string): string {
    const icons: Record<string, string> = {
      success: 'pi pi-check-circle',
      error: 'pi pi-times-circle',
      warn: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle'
    };
    return icons[severity] || 'pi pi-info-circle';
  }

  // ===== MÉTHODES UTILITAIRES =====
  private handleRememberMe(): void {
    const rememberMe = this.formulaireconnexion.value.rememberme;
    const email = this.formulaireconnexion.value.email;

    if (rememberMe) {
      localStorage.setItem('remembered_email', email);
    } else {
      localStorage.removeItem('remembered_email');
    }
  }

  private formatValidationErrors(errors: any): string {
    if (!errors) return '';
    const messages = Object.values(errors)
      .flat()
      .join(', ');
    return messages;
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      const ctrl = form.get(key);
      ctrl?.markAsTouched();
      if (ctrl instanceof FormGroup) {
        this.markFormGroupTouched(ctrl);
      }
    });
  }

  // ===== VALIDATION DES CHAMPS =====
  isFieldInvalid(fieldName: string): boolean {
    const field = this.formulaireconnexion.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.formulaireconnexion.get(fieldName);
    if (field?.hasError('required')) return 'Ce champ est requis';
    if (field?.hasError('email')) return 'Email invalide';
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    return '';
  }

  // ===== NAVIGATION =====
  onForgotPassword(): void {
    this.router.navigateByUrl('/forgot-password');
     
  }

  navigateToRegister(): void {
    this.router.navigateByUrl('/register');
  }
}