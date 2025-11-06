import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isLoading = signal(false);
  tokenValid = signal(false);
  checkingToken = signal(true);
  
  token: string = '';
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Récupérer token et email depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      
      if (this.token && this.email) {
        this.verifyToken();
      } else {
        this.checkingToken.set(false);
        this.showError('Lien invalide', 'Le lien de réinitialisation est invalide ou incomplet.');
      }
    });

    this.initForm();
  }

  private initForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmation = control.get('password_confirmation');

    if (!password || !confirmation) {
      return null;
    }

    return password.value === confirmation.value ? null : { passwordMismatch: true };
  }

  private async verifyToken(): Promise<void> {
    this.checkingToken.set(true);
    
    try {
      await this.authService.verifyToken(this.token, this.email).toPromise();
      this.tokenValid.set(true);
      console.log('✅ Token valide');
    } catch (err: any) {
      console.error('❌ Token invalide:', err);
      this.tokenValid.set(false);
      this.showError(
        'Lien expiré',
        'Ce lien de réinitialisation a expiré ou est invalide. Veuillez faire une nouvelle demande.'
      );
    } finally {
      this.checkingToken.set(false);
    }
  }

  get f() {
    return this.resetPasswordForm.controls;
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.showError('Formulaire invalide', 'Veuillez corriger les erreurs.');
      return;
    }

    this.isLoading.set(true);

    const data = {
      token: this.token,
      email: this.email,
      password: this.resetPasswordForm.value.password,
      password_confirmation: this.resetPasswordForm.value.password_confirmation
    };

    try {
      await this.authService.resetPassword(data).toPromise();
      
      this.showSuccess(
        'Mot de passe réinitialisé !',
        'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.'
      );

      // Redirection vers la page de connexion après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/connexion']);
      }, 2000);

    } catch (err: any) {
      console.error('Erreur:', err);
      
      const errorMessage = err?.error?.message || 
                          err?.error?.error || 
                          'Impossible de réinitialiser le mot de passe.';
      
      this.showError('Erreur', errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  private showSuccess(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 5000
    });
  }

  private showError(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 6000
    });
  }
}