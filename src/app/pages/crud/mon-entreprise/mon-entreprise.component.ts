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
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.loading = true;
    
    forkJoin({
      entreprise: this.monEntrepriseService.getMonEntreprise(),
      stats: this.monEntrepriseService.getStatistiques(),
      pays: this.entrepriseService.getPays()
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: ({ entreprise, stats, pays }) => {
        this.entreprise = entreprise;
        console.log('✅ Entreprise chargée:', entreprise);
        
        this.stats = [
          {
            title: 'Offres d\'emploi',
            value: stats.total_offres || 0,
            icon: 'pi pi-briefcase',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            route: '/gestion/offres'
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
            route: '/gestion/publicites'
          },
          {
            title: 'Candidatures',
            value: stats.candidatures_recues || 0,
            icon: 'pi pi-users',
            color: '#8b5cf6',
            bgColor: '#f5f3ff'
          }
        ];
        console.log('✅ Statistiques chargées:', stats);
        
        this.paysList = pays;
        console.log('✅ Pays chargés:', pays.length, 'pays');
      },
      error: (err) => {
        console.error('❌ Erreur chargement données:', err);
        this.showError('Impossible de charger les données');
      }
    });
  }

  openEditDialog(): void {
    this.editForm = { ...this.entreprise };
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
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showWarn('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showWarn('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    this.loading = true;
    this.monEntrepriseService.uploadLogo(file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (res) => {
          this.showSuccess('Logo mis à jour avec succès');
          this.loadInitialData();
        },
        error: (err) => {
          console.error('❌ Erreur upload logo:', err);
          this.showError('Erreur lors de l\'upload du logo');
        }
      });
  }

  getLogoUrl(): string {
    if (this.entreprise?.logo) {
      if (this.entreprise.logo.startsWith('http')) {
        return this.entreprise.logo;
      }
      if (this.entreprise.logo.startsWith('logos/')) {
        return imageUrl + this.entreprise.logo;
      }
      if (this.entreprise.logo.startsWith('/storage/')) {
        return 'http://127.0.0.1:8000' + this.entreprise.logo;
      }
      return imageUrl + this.entreprise.logo;
    }
    return 'assets/default-company.png';
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/default-company.png';
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
}