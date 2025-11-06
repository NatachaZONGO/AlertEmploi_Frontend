import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';

import { MonEntrepriseService } from './mon-entreprise.service';
import { EntrepriseService } from '../entreprise/entreprise.service';
import { Entreprise } from '../entreprise/entreprise.model';
import { Pays } from '../pays/pays.model';  
import { imageUrl } from '../../../Share/const';
import { PaysDropdownComponent } from '../../../Share/pays-utils/pays-dropdown.component';
import { PaysUtilsService } from '../../../Share/pays-utils/pays-utils.service';
import { AuthService } from '../../auth/auth.service';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  route?: string;
}

@Component({
  selector: 'app-mon-entreprise',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    DividerModule,
    SkeletonModule,
    TooltipModule,
    AvatarModule,
    ChipModule,
    PaysDropdownComponent
  ],
  templateUrl: './mon-entreprise.component.html',
  styleUrls: ['./mon-entreprise.component.css'],
  providers: [MessageService]
})
export class MonEntrepriseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  entreprise?: Entreprise;
  loading = false;
  editDialog = false;
  submitted = false;
  isCommunityManager = false;
  entrepriseSelectionnee: Entreprise | null = null;
  // Données du formulaire d'édition
  editForm: Partial<Entreprise> = {};
  // Statistiques
  stats: StatCard[] = [];
  // Liste des pays
  paysList: Pays[] = []; 
  // Options pour les dropdowns
  secteursActivite = [
    'Primaire', 
    'Secondaire', 
    'Tertiaire', 
    'Quaternaire'
  ];

  taillesEntreprise = [
    { label: '1-10 employés', value: '1-10' },
    { label: '11-50 employés', value: '11-50' },
    { label: '51-200 employés', value: '51-200' },
    { label: '201-500 employés', value: '51-200' },
    { label: '201-500 employés', value: '201-500' },
    { label: '500+ employés', value: '500+' }
  ];

  constructor(
    private monEntrepriseService: MonEntrepriseService,
    private entrepriseService: EntrepriseService,
    public paysUtils: PaysUtilsService, 
    private messageService: MessageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // ✅ Détecter le rôle
    this.isCommunityManager = this.authService.hasRole('community_manager');
    console.log('🎯 Est CM:', this.isCommunityManager);

    // ✅ Si CM, écouter les changements d'entreprise sélectionnée
    if (this.isCommunityManager) {
      this.entrepriseService.selectedEntrepriseId$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(id => {
        console.log('🔄 Entreprise sélectionnée changée:', id);
        this.loadInitialData();
      });
    }

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.loading = true;
    
    // ✅ Déterminer quelle entreprise charger
    const entrepriseId = this.isCommunityManager 
      ? this.entrepriseService.getSelectedEntrepriseId()
      : null;

    console.log('📋 Chargement données:', {
      isCM: this.isCommunityManager,
      entrepriseId: entrepriseId
    });

    // ✅ Requêtes adaptées au rôle
    const entreprise$ = this.isCommunityManager && entrepriseId
      ? this.monEntrepriseService.getEntrepriseById(entrepriseId)
      : this.monEntrepriseService.getMonEntreprise();

    const stats$ = this.isCommunityManager && entrepriseId
      ? this.monEntrepriseService.getStatistiquesEntreprise(entrepriseId)
      : this.monEntrepriseService.getStatistiques();

    forkJoin({
      entreprise: entreprise$,
      stats: stats$,
      pays: this.entrepriseService.getPays()
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: ({ entreprise, stats, pays }) => {
        // Normaliser le pays_id
        if (entreprise) {
          const paysData = entreprise.pays;
          if (paysData && typeof paysData === 'object' && 'id' in paysData) {
            (entreprise as any).pays_id = paysData.id;
          } else if (typeof paysData === 'number') {
            (entreprise as any).pays_id = paysData;
          }
        }
        
        this.entreprise = entreprise;
        console.log('✅ Entreprise chargée:', entreprise);
        
        this.stats = [
          {
            title: 'Offres d\'emploi',
            value: stats.total_offres || 0,
            icon: 'pi pi-briefcase',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            route: '/admin/gestion/offres'
          },
          {
            title: 'Offres actives',
            value: stats.offres_actives || 0,
            icon: 'pi pi-check-circle',
            color: '#10b981',
            bgColor: '#ecfdf5'
          },
          {
            title: 'Publicités',
            value: stats.total_publicites || 0,
            icon: 'pi pi-megaphone',
            color: '#f59e0b',
            bgColor: '#fffbeb',
            route: '/admin/gestion/publicites'
          },
          {
            title: 'Candidatures',
            value: stats.candidatures_recues || 0,
            icon: 'pi pi-users',
            color: '#8b5cf6',
            bgColor: '#f5f3ff'
          }
        ];
        
        this.paysList = pays;
      },
      error: (err) => {
        console.error('❌ Erreur chargement données:', err);
        
        // ✅ Message adapté pour CM sans entreprise sélectionnée
        if (this.isCommunityManager && !this.entrepriseService.getSelectedEntrepriseId()) {
          this.showError('Veuillez sélectionner une entreprise à gérer');
        } else {
          this.showError('Impossible de charger les données');
        }
      }
    });
  }

  openEditDialog(): void {
  // Copier toutes les données de l'entreprise
  this.editForm = { ...this.entreprise };
  
  // ✅ S'assurer que pays_id est bien défini
  if (this.entreprise) {
    const paysData = this.entreprise.pays;
    
    // Si pays est un objet avec id
    if (paysData && typeof paysData === 'object' && 'id' in paysData) {
      this.editForm.pays_id = paysData.id;
    }
    // Si pays est déjà un nombre
    else if (typeof paysData === 'number') {
      this.editForm.pays_id = paysData;
    }
    // Si pays_id est déjà défini dans entreprise
    else if ((this.entreprise as any).pays_id) {
      this.editForm.pays_id = (this.entreprise as any).pays_id;
    }
  }
  
  console.log('📝 Formulaire d\'édition ouvert:', this.editForm);
  console.log('  - pays_id:', this.editForm.pays_id);
  
  this.submitted = false;
  this.editDialog = true;
}

  hideEditDialog(): void {
    this.editDialog = false;
    this.submitted = false;
  }

  saveEntreprise(): void {
    this.submitted = true;

    if (!this.editForm.nom_entreprise?.trim()) {
      this.showWarn('Le nom de l\'entreprise est obligatoire');
      return;
    }

    this.loading = true;
    this.monEntrepriseService.updateMonEntreprise(this.editForm)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.entreprise = data;
          this.showSuccess('Informations mises à jour avec succès');
          this.hideEditDialog();
        },
        error: (err) => {
          console.error('❌ Erreur mise à jour:', err);
          this.showError('Erreur lors de la mise à jour');
        }
      });
  }

  // ✅ AJOUTÉ : Callback optionnel pour le changement de pays
  onPaysChange(paysId: number | null): void {
    console.log('Pays sélectionné:', paysId);
    // Tu peux ajouter de la logique ici si nécessaire
  }

  onLogoSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  console.log('📁 Fichier sélectionné:', file);
  
  if (!file) {
    console.warn('⚠️ Aucun fichier sélectionné');
    return;
  }

  // Vérification du type
  if (!file.type.startsWith('image/')) {
    console.error('❌ Type de fichier incorrect:', file.type);
    this.showWarn('Veuillez sélectionner une image (JPG, PNG, GIF...)');
    return;
  }

  // Vérification de la taille (2 MB max)
  const maxSize = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxSize) {
    console.error('❌ Fichier trop volumineux:', file.size, 'bytes');
    this.showWarn(`L'image ne doit pas dépasser 2 MB (taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    return;
  }

  console.log('✅ Fichier valide, envoi en cours...');
  this.loading = true;
  
  this.monEntrepriseService.uploadLogo(file)
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        // Réinitialiser l'input pour permettre de réuploader la même image
        input.value = '';
      })
    )
    .subscribe({
      next: (res) => {
        console.log('✅ Logo uploadé avec succès:', res);
        this.showSuccess('Logo mis à jour avec succès');
        // Recharger les données
        this.loadInitialData();
      },
      error: (err) => {
        console.error('❌ Erreur upload logo:', err);
        console.error('  Status:', err.status);
        console.error('  Message:', err.error?.message || err.message);
        console.error('  Errors:', err.error?.errors);
        
        // Message d'erreur détaillé
        let errorMessage = 'Erreur lors de l\'upload du logo';
        if (err.error?.message) {
          errorMessage += ': ' + err.error.message;
        }
        if (err.error?.errors?.logo) {
          errorMessage += ' - ' + err.error.errors.logo.join(', ');
        }
        
        this.showError(errorMessage);
      }
    });
}


  private showSuccess(detail: string): void {
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail, 
      life: 3000 
    });
  }

  private showError(detail: string): void {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail, 
      life: 5000 
    });
  }

  private showWarn(detail: string): void {
    this.messageService.add({ 
      severity: 'warn', 
      summary: 'Attention', 
      detail, 
      life: 4000 
    });
  }

    getPaysDisplay(): string {
    if (!this.entreprise?.pays) {
      return 'Non renseigné';
    }

    const pays = this.entreprise.pays;

    // Cas 1 : pays est un objet avec nom
    if (typeof pays === 'object' && pays !== null) {
      if ('nom' in pays && pays.nom) {
        return pays.nom;
      }
      // Si objet mais pas de nom, chercher par ID
      if ('id' in pays && pays.id) {
        return this.findPaysNomById(pays.id);
      }
    }

    // Cas 2 : pays est un nombre (ID)
    if (typeof pays === 'number') {
      return this.findPaysNomById(pays);
    }

    // Cas 3 : pays est une string
    if (typeof pays === 'string') {
      return pays;
    }

    return 'Non renseigné';
  }

/**
 * Trouve le nom d'un pays par son ID dans la liste
 */
  private findPaysNomById(paysId: number): string {
    const pays = this.paysList.find(p => p.id === paysId);
    return pays?.nom || `Pays ID: ${paysId}`;
  }
/**
 * Retourne l'URL du logo avec fallback
 */
getLogoUrl(): string {
  if (this.entreprise?.logo) {
    // Si le logo commence par http/https
    if (this.entreprise.logo.startsWith('http')) {
      return this.entreprise.logo;
    }
    // Si le logo commence par logos/
    if (this.entreprise.logo.startsWith('logos/')) {
      return imageUrl + this.entreprise.logo;
    }
    // Si le logo commence par /storage/
    if (this.entreprise.logo.startsWith('/storage/')) {
      return 'http://127.0.0.1:8000' + this.entreprise.logo;
    }
    // Sinon, ajouter imageUrl
    return imageUrl + this.entreprise.logo;
  }
  // ✅ Placeholder avec le nom de l'entreprise
  const name = this.entreprise?.nom_entreprise || 'Entreprise';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=3b82f6&color=fff&bold=true`;
}
/**
 * Gestion de l'erreur de chargement d'image
 */
onImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  const name = this.entreprise?.nom_entreprise || 'Entreprise';
  imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6366f1&color=fff&bold=true`;
}
}