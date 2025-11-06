import { Component, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EntrepriseService } from './entreprise.service';
import { Entreprise, CreateEntrepriseRequest, UpdateEntrepriseRequest } from './entreprise.model';
import { FileUploadModule } from 'primeng/fileupload';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { BackendURL, imageUrl } from '../../../Share/const';
import { forkJoin } from 'rxjs';
import { PaysUtilsService } from '../../../Share/pays-utils/pays-utils.service';
import { Pays } from '../pays/pays.model';
import { PaysDropdownComponent } from '../../../Share/pays-utils/pays-dropdown.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { EntrepriseContextService } from './entreprise-context.service';

@Component({
  selector: 'app-entreprise',
  templateUrl: './entreprise.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DialogModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    ProgressBarModule,
    TooltipModule,
    RadioButtonModule,
    FileUploadModule,
    TagModule,
    DropdownModule,
    PaysDropdownComponent
  ],
  providers: [ConfirmationService, MessageService]
})
export class EntrepriseComponent implements OnInit {
  // Signaux pour la réactivité
  entreprises = signal<Entreprise[]>([]);
  
  // État du composant
  entrepriseDialog = false;
  validationDialog = false;
  rejectionDialog = false;
  submitted = false;
  selectedEntreprises: Entreprise[] = [];
  currentEntreprise: Entreprise | null = null;
  rejectionMotif = '';
  detailEntrepriseDialog = false;

  // ✅ Détection du rôle
  currentUserRole: string = '';
  isCommunityManager: boolean = false;
  
  // Données pour les formulaires
  entreprise: Entreprise = this.getEmptyEntreprise();
  selectedFile: File | null = null;
  previewLogoUrl: string | null = null;
  logoUrlPreview: string | null = null;
  
  // Options pour les dropdowns
  statuts = [
    { label: 'En attente', value: 'en attente' },
    { label: 'Validé', value: 'valide' },
    { label: 'Refusé', value: 'refuse' }
  ];
  
  secteursActivite = [
    { label: 'Primaire', value: 'primaire' },
    { label: 'Secondaire', value: 'secondaire' },
    { label: 'Tertiaire', value: 'tertiaire' },
    { label: 'Quaternaire', value: 'quaternaire' }
  ];
  
  statusFilterOptions = [
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: 'en attente' },
    { label: 'Validé', value: 'valide' },
    { label: 'Refusé', value: 'refuse' }
  ];
 
  users: any[] = [];
  listePays: Pays[] = [];
  selectedStatusFilter = '';
  
  // Pagination
  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 15;
  
  constructor(
    private entrepriseService: EntrepriseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private entrepriseContext: EntrepriseContextService,
    public paysUtils: PaysUtilsService,
    private http: HttpClient,
    private router: Router
  ) {}
  
  ngOnInit() {
    // ✅ IMPORTANT : Détecter le rôle AVANT de charger les entreprises
    this.detectUserRole();
    this.loadEntreprises();
    this.loadPays();
    this.loadUsers();
  }

  get dialogHeader(): string {
    return this.entreprise?.id ? 'Modifier l\'entreprise' : 'Nouvelle entreprise';
  }

  // ========================================
  // ✅ DÉTECTION DU RÔLE
  // ========================================

  /**
   * Détecter le rôle de l'utilisateur connecté
   */
  detectUserRole(): void {
  console.log('🔍 === DÉTECTION DU RÔLE ===');
  
  const userStr = localStorage.getItem('utilisateur');
  console.log('📦 User string brut:', userStr);
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('👤 User parsé:', user);
      console.log('🎭 user.roles:', user.roles);
      console.log('🎭 user.role:', user.role);
      console.log('🎭 Type de user.role:', typeof user.role);
      
      // Essayer plusieurs formats possibles
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        // Si roles est un array d'objets
        if (typeof user.roles[0] === 'object') {
          this.currentUserRole = user.roles[0].nom || user.roles[0];
        } else {
          // Si roles est un array de strings
          this.currentUserRole = user.roles[0];
        }
      } else if (typeof user.role === 'string') {
        this.currentUserRole = user.role;
      } else if (typeof user.roles === 'string') {
        this.currentUserRole = user.roles;
      } else {
        this.currentUserRole = '';
      }
      
      console.log('🎯 currentUserRole AVANT toLowerCase:', this.currentUserRole);
      console.log('🎯 Type:', typeof this.currentUserRole);
      
      // Vérifier si c'est un Community Manager
      const roleToCheck = String(this.currentUserRole).toLowerCase();
      console.log('🔎 roleToCheck après toLowerCase:', roleToCheck);
      console.log('🔎 Contient "community"?:', roleToCheck.includes('community'));
      
      this.isCommunityManager = roleToCheck.includes('community');
      
      console.log('✅ currentUserRole FINAL:', this.currentUserRole);
      console.log('✅ isCommunityManager FINAL:', this.isCommunityManager);
      console.log('✅ Type de isCommunityManager:', typeof this.isCommunityManager);
      console.log('===================');
    } catch (e) {
      console.error('❌ Erreur parsing user:', e);
      this.isCommunityManager = false;
    }
  } else {
    console.warn('⚠️ Aucun utilisateur dans localStorage');
    this.isCommunityManager = false;
  }
}
  // ========================================
  // ✅ MÉTHODES DE PERMISSIONS
  // ========================================

  /**
   * Vérifier si l'utilisateur peut créer des entreprises
   */
  canCreateEntreprise(): boolean {
    return !this.isCommunityManager;
  }

  /**
   * Vérifier si l'utilisateur peut supprimer des entreprises
   */
  canDeleteEntreprise(): boolean {
    return !this.isCommunityManager;
  }

  /**
   * Vérifier si l'utilisateur peut valider/rejeter des entreprises
   */
  canValidateEntreprise(): boolean {
    return !this.isCommunityManager;
  }

  /**
   * Vérifier si l'utilisateur peut modifier une entreprise
   */
  canEditEntreprise(entreprise: Entreprise): boolean {
    // Admin peut tout modifier
    if (!this.isCommunityManager) return true;
    
    // CM peut modifier uniquement ses entreprises assignées
    const myEntreprises = this.entreprises();
    return myEntreprises.some(e => e.id === entreprise.id);
  }

  // ========================================
  // ✅ CHARGEMENT DES ENTREPRISES
  // ========================================

 loadEntreprises() {
  console.log('🔄 === CHARGEMENT ENTREPRISES ===');
  console.log('  currentUserRole:', this.currentUserRole);
  console.log('  Type:', typeof this.currentUserRole);
  console.log('  isCommunityManager:', this.isCommunityManager);
  console.log('  Type:', typeof this.isCommunityManager);
  console.log('  isCommunityManager === true:', this.isCommunityManager === true);
  console.log('  isCommunityManager == true:', this.isCommunityManager == true);
  
  if (this.isCommunityManager === true) {
    console.log('➡️ BRANCHE CM SÉLECTIONNÉE');
    this.loadCommunityManagerEntreprises();
  } else {
    console.log('➡️ BRANCHE ADMIN SÉLECTIONNÉE');
    console.log('  Raison: isCommunityManager =', this.isCommunityManager);
    this.loadAllEntreprises();
  }
  
  console.log('===================');
}

  /**
   * Charger les entreprises du CM
   */
  loadCommunityManagerEntreprises(): void {
    console.log('📋 Chargement des entreprises du CM...');
    
    this.http.get<any>(`${BackendURL}community/entreprises`).subscribe({
      next: (response) => {
        console.log('📦 Réponse API (CM):', response);
        
        if (response.success && response.data) {
          const items = (Array.isArray(response.data) ? response.data : []).map((e: any) => ({
            ...e,
            motif_rejet: this.sanitizeMotif(e.motif_rejet)
          }));
          
          this.entreprises.set(items);
          this.totalRecords = items.length;
          
          console.log('✅ Entreprises CM chargées:', items.length);
        } else {
          this.entreprises.set([]);
          this.totalRecords = 0;
          console.log('ℹ️ Aucune entreprise assignée au CM');
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement entreprises CM:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger vos entreprises'
        });
        this.entreprises.set([]);
        this.totalRecords = 0;
      }
    });
  }

  /**
   * Charger toutes les entreprises (Admin/Recruteur)
   */
  loadAllEntreprises(): void {
    console.log('📋 Chargement de toutes les entreprises...');
    
    this.entrepriseService.getEntreprises({
      page: this.currentPage,
      per_page: this.rowsPerPage,
      status: this.selectedStatusFilter || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const items = (response.data.data || []).map(e => ({
            ...e,
            motif_rejet: this.sanitizeMotif(e.motif_rejet)
          }));
          this.entreprises.set(items);
          this.totalRecords = response.data.total;
          
          console.log('✅ Toutes entreprises chargées:', items.length);
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement entreprises:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des entreprises'
        });
      }
    });
  }

  loadPays() {
    this.entrepriseService.getPays().subscribe({
      next: (response) => {
        if (response) {
          this.listePays = response.map(p => ({ 
            id: p.id,
            nom: p.nom, 
            code: p.code, 
            value: p.id 
          }));
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays:', error);
      }
    });
  }
  
  loadUsers() {
    this.entrepriseService.getUsers().subscribe({
      next: (response) => {
        if (response) {
          this.users = response.map(u => ({ 
            label: `${u.nom} ${u.prenom} (${u.email})`, 
            value: u.id 
          }));
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    });
  }

  // ========================================
  // ✅ ACTIONS AVEC VÉRIFICATIONS
  // ========================================

  openNew() {
    if (!this.canCreateEntreprise()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas créer d\'entreprises',
        life: 3000
      });
      return;
    }
    
    this.entreprise = this.getEmptyEntreprise();
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.logoUrlPreview = null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  editEntreprise(entreprise: Entreprise) {
    if (!this.canEditEntreprise(entreprise)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas modifier cette entreprise',
        life: 3000
      });
      return;
    }
    
    this.entreprise = { ...entreprise };
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.logoUrlPreview = entreprise.logo ? this.getImageUrl(entreprise.logo) : null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  deleteEntreprise(entreprise: Entreprise) {
    if (!this.canDeleteEntreprise()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas supprimer d\'entreprises',
        life: 3000
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer l'entreprise "${entreprise.nom_entreprise}" ?`,
      header: 'Confirmer',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (entreprise.id) {
          this.entrepriseService.deleteEntreprise(entreprise.id).subscribe({
            next: (response) => {
              if (response.success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Succès',
                  detail: 'Entreprise supprimée avec succès'
                });
                this.loadEntreprises();
              }
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de la suppression'
              });
            }
          });
        }
      }
    });
  }
  
  deleteSelectedEntreprises() {
    if (!this.canDeleteEntreprise()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas supprimer d\'entreprises',
        life: 3000
      });
      return;
    }
    
    if (!this.selectedEntreprises?.length) return;

    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer les entreprises sélectionnées ?',
      header: 'Confirmer',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const calls = this.selectedEntreprises
          .filter(e => e.id)
          .map(e => this.entrepriseService.deleteEntreprise(e.id!));

        forkJoin(calls).subscribe({
          next: () => {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Succès', 
              detail: 'Entreprises supprimées avec succès' 
            });
            this.loadEntreprises();
            this.selectedEntreprises = [];
          },
          error: () => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Erreur', 
              detail: 'Erreur lors de la suppression' 
            });
          }
        });
      }
    });
  }

  openValidationDialog(e: Entreprise) {
    if (!this.canValidateEntreprise()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas valider d\'entreprises',
        life: 3000
      });
      return;
    }
    
    this.currentEntreprise = e;
    this.validationDialog = true;
  }

  openRejectionDialog(e: Entreprise) {
    if (!this.canValidateEntreprise()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action non autorisée',
        detail: 'Vous ne pouvez pas rejeter d\'entreprises',
        life: 3000
      });
      return;
    }
    
    this.currentEntreprise = e;
    this.rejectionMotif = '';
    this.rejectionDialog = true;
  }
  
  // ========================================
  // ✅ RESTE DES MÉTHODES (INCHANGÉES)
  // ========================================

  saveEntreprise() {
    this.submitted = true;

    if (!this.entreprise.nom_entreprise?.trim() || !this.entreprise.secteur_activite?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs requis',
        detail: 'Nom de l\'entreprise et secteur d\'activité sont obligatoires.'
      });
      return;
    }

    const formData = new FormData();
    
    formData.append('nom_entreprise', this.entreprise.nom_entreprise);
    formData.append('secteur_activite', this.entreprise.secteur_activite);
    
    if (this.entreprise.description) {
      formData.append('description', this.entreprise.description);
    }
    if (this.entreprise.email) {
      formData.append('email', this.entreprise.email);
    }
    if (this.entreprise.telephone) {
      formData.append('telephone', this.entreprise.telephone);
    }
    if (this.entreprise.site_web) {
      formData.append('site_web', this.entreprise.site_web);
    }
    if (this.entreprise.pays_id) {
      formData.append('pays_id', this.entreprise.pays_id.toString());
    }
    if (this.entreprise.statut) {
      formData.append('statut', this.entreprise.statut);
    }

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile, this.selectedFile.name);
    } else if (this.entreprise.logo?.trim()) {
      formData.append('logo_url', this.entreprise.logo);
    }

    if (this.entreprise.id) {
      formData.append('_method', 'PUT');
      
      this.entrepriseService.updateEntrepriseWithFile(this.entreprise.id, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Entreprise mise à jour avec succès'
            });
            this.loadEntreprises();
            this.hideDialog();
          }
        },
        error: (error) => {
          const msg = error?.error?.message || 'Erreur lors de la mise à jour';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: msg
          });
        }
      });
    } else {
      if (!this.entreprise.user_id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Utilisateur requis',
          detail: 'Veuillez sélectionner un utilisateur propriétaire.'
        });
        return;
      }
      
      formData.append('user_id', this.entreprise.user_id.toString());

      this.entrepriseService.createEntrepriseWithFile(formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Entreprise créée avec succès'
            });
            this.loadEntreprises();
            this.hideDialog();
          }
        },
        error: (error) => {
          const msg = error?.error?.message || 'Erreur lors de la création';
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: msg
          });
        }
      });
    }
  }

  openEntrepriseDetail(e: any) {
    this.currentEntreprise = e;
    this.detailEntrepriseDialog = true;
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'La taille du fichier ne doit pas dépasser 2MB'
      });
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Format invalide',
        detail: 'Seules les images sont acceptées'
      });
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.previewLogoUrl = URL.createObjectURL(file);
    this.entreprise.logo = undefined;
    this.logoUrlPreview = null;
  }

  onLogoUrlChange() {
    if (this.entreprise.logo?.trim()) {
      this.removeSelectedFile();
      this.logoUrlPreview = this.getImageUrl(this.entreprise.logo);
    } else {
      this.logoUrlPreview = null;
    }
  }

  clearLogoUrl() {
    this.entreprise.logo = undefined;
    this.logoUrlPreview = null;
  }

  removeSelectedFile() {
    this.selectedFile = null;
    if (this.previewLogoUrl) {
      URL.revokeObjectURL(this.previewLogoUrl);
    }
    this.previewLogoUrl = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
    this.logoUrlPreview = null;
  }

  hideDialog() {
    this.entrepriseDialog = false;
    this.submitted = false;
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.logoUrlPreview = null;
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    return `${imageUrl}${imagePath}`;
  }
  
  onStatusFilterChange(event: any) {
    this.selectedStatusFilter = event.value;
    this.currentPage = 1;
    this.loadEntreprises();
  }
  
  onGlobalFilter(table: any, event: any) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  
  onPageChange(event: any) {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.rowsPerPage;
    this.currentPage = Math.floor(first / rows) + 1;
    this.rowsPerPage = rows;
    this.loadEntreprises();
  }

  validateEntreprise() {
    if (!this.currentEntreprise?.id) return;
    this.entrepriseService.validateEntreprise(this.currentEntreprise.id).subscribe({
      next: (res) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: res.message || 'Entreprise validée.' 
        });
        this.loadEntreprises();
        this.validationDialog = false;
      },
      error: (error) => {
        const msg = error?.error?.message || 'Erreur lors de la validation';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
      }
    });
  }

  rejectEntreprise() {
    if (!this.currentEntreprise?.id || !this.rejectionMotif.trim()) return;
    this.entrepriseService.rejectEntreprise(this.currentEntreprise.id, this.rejectionMotif.trim()).subscribe({
      next: (res) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: res.message || 'Entreprise rejetée.' 
        });
        this.loadEntreprises();
        this.rejectionDialog = false;
      },
      error: (error) => {
        const msg = error?.error?.message || 'Erreur lors du rejet';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
      }
    });
  }

  revaliderDepuisRefuse(entreprise: Entreprise) {
    if (!entreprise.id) return;
    this.entrepriseService.revalidateEntreprise(entreprise.id).subscribe({
      next: (res) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: res.message || 'Entreprise revalidée.' 
        });
        this.loadEntreprises();
      },
      error: (error) => {
        const msg = error?.error?.message || 'Erreur lors de la revalidation';
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: msg });
      }
    });
  }

  exportCSV() {
    const rows = this.entreprises();
    if (!rows.length) return;

    const headers = ['ID', 'Nom', 'Secteur', 'Email', 'Téléphone', 'Site web', 'Statut', 'Pays', 'Motif rejet'];
    const data = rows.map(e => ([
      e.id ?? '',
      e.nom_entreprise ?? '',
      e.secteur_activite ?? '',
      e.email ?? '',
      e.telephone ?? '',
      e.site_web ?? '',
      e.statut ?? '',
      e.pays?.nom ?? '',
      (this.hasMotif(e.motif_rejet) ? String(e.motif_rejet) : '')
    ]));

    const escape = (v: string) => {
      const s = (v ?? '').toString().replace(/"/g, '""');
      return `"${s}"`;
    };
    const csv = [
      headers.map(escape).join(';'),
      ...data.map(r => r.map(x => escape(String(x))).join(';'))
    ].join('\r\n');

    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entreprises_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  exportPDF() {
    const rows = this.entreprises();
    if (!rows.length) return;

    const htmlRows = rows.map(e => `
      <tr>
        <td>${e.id ?? ''}</td>
        <td>${e.nom_entreprise ?? ''}</td>
        <td>${e.secteur_activite ?? ''}</td>
        <td>${e.email ?? ''}</td>
        <td>${e.telephone ?? ''}</td>
        <td>${e.site_web ?? ''}</td>
        <td>${e.statut ?? ''}</td>
        <td>${e.pays?.nom ?? ''}</td>
        <td>${this.hasMotif(e.motif_rejet) ? String(e.motif_rejet) : ''}</td>
      </tr>
    `).join('');

    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return;

    w.document.write(`
      <html lang="fr"><head>
        <meta charset="utf-8" />
        <title>Export Entreprises</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
          th { background: #f5f5f5; text-align: left; }
        </style>
      </head><body>
        <h1>Export des entreprises</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nom</th><th>Secteur</th><th>Email</th>
              <th>Téléphone</th><th>Site web</th><th>Statut</th><th>Pays</th><th>Motif rejet</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); }<\/script>
      </body></html>
    `);
    w.document.close();
  }
  
  private getEmptyEntreprise(): Entreprise {
    return {
      nom_entreprise: '',
      description: '',
      site_web: '',
      telephone: '',
      email: '',
      secteur_activite: '',
      logo: '',
      pays_id: undefined,
      user_id: undefined,
      statut: 'en attente'
    };
  }
  
  getStatusSeverity(statut: string) {
    switch (statut) {
      case 'valide': return 'success';
      case 'refuse': return 'danger';
      case 'en attente': return 'warn';
      default: return 'info';
    }
  }

  hasMotif(val: unknown): boolean {
    const s = (val ?? '').toString().trim().toLowerCase();
    return !!s && s !== 'null' && s !== 'undefined';
  }

  sanitizeMotif(val: unknown): string | undefined {
    if (val === null || val === undefined) return undefined;
    const s = String(val).trim();
    return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? undefined : s;
  }

 gererEntreprise(entreprise: any): void {
    console.log('🏢 CM gère l\'entreprise:', entreprise);
    console.log('  - ID:', entreprise.id);
    console.log('  - Nom:', entreprise.nom_entreprise);
    console.log('  - user_id:', entreprise.user_id);
    
    // ✅ IMPORTANT : Utiliser selectEntreprise qui notifie les observateurs
    this.entrepriseService.selectEntreprise(entreprise);
    
    // Message de confirmation
    this.messageService.add({
      severity: 'success',
      summary: 'Entreprise sélectionnée',
      detail: `Vous gérez maintenant ${entreprise.nom_entreprise}`,
      life: 3000
    });
    
    // ✅ Attendre un peu avant de rediriger (pour que l'Observable propage)
    setTimeout(() => {
      console.log('➡️ Redirection vers /dashboard');
      this.router.navigate(['/dashboard']);
    }, 100);
  }

}