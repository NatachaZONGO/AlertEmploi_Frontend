import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = signal(false);
  emailSent = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.showError('Email invalide', 'Veuillez saisir une adresse email valide.');
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotPasswordForm.value.email;

    try {
      await this.authService.forgotPassword(email).toPromise();
      
      this.emailSent.set(true);
      this.showSuccess(
        'Email envoyé !',
        'Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception.'
      );
      
      // Réinitialiser le formulaire
      this.forgotPasswordForm.reset();
      
    } catch (err: any) {
      console.error('Erreur:', err);
      
      const errorMessage = err?.error?.message || 
                          err?.error?.error || 
                          'Impossible d\'envoyer l\'email de réinitialisation.';
      
      this.showError('Erreur', errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin(): void {
    this.router.navigate(['/connexion']);
  }

  private showSuccess(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 6000
    });
  }

  private showError(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }
}