import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DialogModule } from 'primeng/dialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { Divider } from "primeng/divider";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from "primeng/progressbar";

import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import { imageUrl } from '../../../Share/const';

@Component({
  selector: 'app-profil',
  standalone: true,
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    FloatLabelModule,
    DialogModule,
    ConfirmPopupModule,
    PasswordModule,
    CheckboxModule,
    Divider,
    ProgressSpinnerModule,
    ProgressBarModule
  ]
})
export class ProfilComponent implements OnInit {
  user: User | null = null;
  roles: Array<{ id?: number; nom: string }> = [];

  users = signal<User[]>([]);
  isLoading = signal(false);
  showFormulaire = signal(false);
  changePassword = signal(false);

  // ✅ NOUVEAU : Fichier photo sélectionné
  selectedPhotoFile: File | null = null;
  photoPreviewUrl: string | null = null;

  userForm!: FormGroup<{
    id: FormControl<number | null>;
    nom: FormControl<string>;
    prenom: FormControl<string>;
    email: FormControl<string>;
    telephone: FormControl<string>;
    currentPassword: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messages: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  get f() {
    return this.userForm.controls;
  }

  private initForm(): void {
    this.userForm = new FormGroup(
      {
        id: new FormControl<number | null>(null),
        nom: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        prenom: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        telephone: new FormControl<string>('', { nonNullable: true }),
        currentPassword: new FormControl<string>('', { nonNullable: true }),
        password: new FormControl<string>('', { nonNullable: true }),
        confirmPassword: new FormControl<string>('', { nonNullable: true })
      },
      { validators: ProfilComponent.passwordMatchValidator }
    );
  }

  loadUserProfile(): void {
    console.log('📡 Chargement du profil...');
    this.userService.getProfile().subscribe({
      next: (user) => {
        console.log('✅ Profil chargé:', user);
        this.user = user;
        if (this.user) {
          this.userForm.patchValue({
            id: this.user.id ?? null,
            nom: this.user.nom,
            prenom: this.user.prenom,
            email: this.user.email,
            telephone: this.user.telephone
          });
          this.loadUserRoles();
        }
      },
      error: (err) => {
        console.error('❌ Erreur profil:', err);
        this.messages.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Impossible de charger le profil' 
        });
      }
    });
  }

  loadUserRoles(): void {
    if (this.user?.roles) {
      this.roles = Array.isArray(this.user.roles) ? this.user.roles : [this.user.roles];
    } else if (this.user?.role) {
      this.roles = [{ nom: this.user.role }];
    }
  }

  openDialog(user: User): void {
    this.userForm.reset({
      id: user.id ?? null,
      nom: user.nom ?? '',
      prenom: user.prenom ?? '',
      email: user.email ?? '',
      telephone: user.telephone ?? '',
      currentPassword: '',
      password: '',
      confirmPassword: ''
    });
    this.onToggleChangePassword(false);
    
    // Réinitialiser la photo sélectionnée
    this.selectedPhotoFile = null;
    this.photoPreviewUrl = null;
    
    this.showFormulaire.set(true);
  }

  // ===== GESTION DE LA PHOTO =====

  /**
   * ✅ Gérer le changement de fichier (upload photo)
   */
  onFileChange(event: any): void {
    const file = event.target.files?.[0];
    
    console.log('📁 Fichier sélectionné:', file);
    
    if (!file) {
      console.warn('⚠️ Aucun fichier sélectionné');
      return;
    }

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      console.error('❌ Type de fichier invalide:', file.type);
      this.messages.add({
        severity: 'error',
        summary: 'Format invalide',
        detail: 'Utilisez JPG, PNG ou GIF.'
      });
      return;
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('❌ Fichier trop volumineux:', file.size);
      this.messages.add({
        severity: 'error',
        summary: 'Fichier trop volumineux',
        detail: `Maximum 5MB. Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
      return;
    }

    // ✅ Stocker le fichier pour l'upload
    this.selectedPhotoFile = file;
    
    // ✅ Créer une preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoPreviewUrl = e.target.result;
      console.log('✅ Preview créée');
    };
    reader.readAsDataURL(file);

    console.log('✅ Photo prête pour l\'upload');
    this.messages.add({
      severity: 'success',
      summary: 'Photo sélectionnée',
      detail: 'La photo sera uploadée lors de l\'enregistrement.'
    });
  }

  /**
   * ✅ Uploader la photo vers le backend
   */
  private async uploadPhoto(): Promise<boolean> {
    if (!this.selectedPhotoFile) {
      return true; // Pas de photo = succès (rien à faire)
    }

    console.log('📤 Upload de la photo...');
    
    try {
      await this.userService.uploadProfilePhoto(this.selectedPhotoFile).toPromise();
      console.log('✅ Photo uploadée avec succès');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur upload photo:', err);
      const detail = err?.error?.message || 'Impossible d\'uploader la photo';
      this.messages.add({ 
        severity: 'error', 
        summary: 'Erreur photo', 
        detail 
      });
      return false;
    }
  }

  // ===== SAUVEGARDE DU PROFIL =====

  /**
   * ✅ Sauvegarde complète (infos + photo + mot de passe)
   */
  async save(): Promise<void> {
    console.log('💾 Sauvegarde du profil...');
    
    if (this.userForm.invalid) {
      Object.values(this.userForm.controls).forEach((c) => c.markAsTouched());
      this.messages.add({
        severity: 'warn',
        summary: 'Formulaire invalide',
        detail: 'Veuillez corriger les erreurs.'
      });
      return;
    }

    const data = this.userForm.getRawValue();

    // Validation mot de passe
    if (this.changePassword()) {
      if (!data.currentPassword) {
        this.messages.add({ 
          severity: 'warn', 
          summary: 'Mot de passe actuel requis', 
          detail: 'Saisissez votre mot de passe actuel.' 
        });
        return;
      }
      if (!data.password || data.password.length < 8) {
        this.messages.add({ 
          severity: 'warn', 
          summary: 'Nouveau mot de passe invalide', 
          detail: 'Minimum 8 caractères requis.' 
        });
        return;
      }
      if (data.password !== data.confirmPassword) {
        this.messages.add({ 
          severity: 'warn', 
          summary: 'Mots de passe différents', 
          detail: 'Les mots de passe ne correspondent pas.' 
        });
        return;
      }
    }

    this.isLoading.set(true);
    
    try {
      // ✅ 1) Uploader la photo (si sélectionnée)
      if (this.selectedPhotoFile) {
        console.log('📤 Étape 1: Upload photo');
        const photoSuccess = await this.uploadPhoto();
        if (!photoSuccess) {
          this.isLoading.set(false);
          return; // Arrêter si l'upload photo échoue
        }
      }

      // ✅ 2) Mettre à jour les informations du profil
      console.log('📝 Étape 2: Mise à jour des infos');
      await this.userService.updateProfileDetails({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone
      }).toPromise();

      // ✅ 3) Changer le mot de passe (si demandé)
      if (this.changePassword()) {
        console.log('🔒 Étape 3: Changement de mot de passe');
        await this.userService.changePassword(
          data.currentPassword,
          data.password,
          data.confirmPassword
        ).toPromise();
      }

      // ✅ 4) Recharger le profil pour afficher les nouvelles données
      console.log('🔄 Étape 4: Rechargement du profil');
      const updatedUser = await this.userService.getProfile().toPromise();
      if (updatedUser) {
        this.user = updatedUser;
      }

      // ✅ 5) Message de succès
      this.messages.add({ 
        severity: 'success', 
        summary: 'Profil mis à jour', 
        detail: 'Vos modifications ont été enregistrées avec succès.' 
      });

      // ✅ 6) Fermer le dialog
      this.closeForm();

    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde:', err);
      const detail = err?.error?.message || 'Mise à jour impossible.';
      this.messages.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail 
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  closeForm(): void {
    this.userForm.reset();
    this.selectedPhotoFile = null;
    this.photoPreviewUrl = null;
    this.showFormulaire.set(false);
  }

  // ===== GESTION DES IMAGES =====

  /**
   * ✅ Obtenir l'URL complète de l'image
   */
  getImageUrl(photoPath?: string | File): string {
    // Si on a une preview (nouvelle photo)
    if (this.photoPreviewUrl) {
      return this.photoPreviewUrl;
    }
    
    if (!photoPath) {
      return '';
    }
    
    // Si c'est un objet File (cas rare ici)
    if (photoPath instanceof File) {
      return URL.createObjectURL(photoPath);
    }
    
    // Si c'est un chemin string
    if (typeof photoPath === 'string') {
      // URL complète
      if (photoPath.startsWith('http')) {
        return photoPath;
      }
      // Chemin relatif
      return `${imageUrl}${photoPath}`;
    }
    
    return '';
  }

  /**
   * ✅ Gérer les erreurs de chargement d'image
   */
  onImageError(event: any): void {
    console.warn('⚠️ Erreur chargement image');
    // Masquer l'image pour afficher le placeholder
    event.target.style.display = 'none';
  }

  // ===== GESTION DU MOT DE PASSE =====

  onToggleChangePassword(checked: boolean): void {
    this.changePassword.set(checked);
    const cur = this.userForm.get('currentPassword');
    const pwd = this.userForm.get('password');
    const cfm = this.userForm.get('confirmPassword');

    if (checked) {
      cur?.setValidators([Validators.required]);
      pwd?.setValidators([Validators.required, Validators.minLength(8)]);
      cfm?.setValidators([Validators.required]);
    } else {
      cur?.clearValidators();
      pwd?.clearValidators();
      cfm?.clearValidators();
      cur?.setValue('');
      pwd?.setValue('');
      cfm?.setValue('');
    }
    
    cur?.updateValueAndValidity();
    pwd?.updateValueAndValidity();
    cfm?.updateValueAndValidity();
    this.userForm.updateValueAndValidity();
  }

  private static passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value ?? '';
    const confirm = group.get('confirmPassword')?.value ?? '';
    if (!pass && !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  // ===== DÉCONNEXION =====

  logout(): void {
    this.authService.logout();
  }
}