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
import { PRIME_NG_CONFIG, PrimeNG } from 'primeng/config';
import { DropdownModule } from 'primeng/dropdown';
import { imageUrl } from '../../../Share/const';
import { forkJoin } from 'rxjs';
import { PaysUtilsService } from '../../../Share/pays-utils/pays-utils.service';
import { Pays } from '../pays/pays.model';
import { PaysDropdownComponent } from '../../../Share/pays-utils/pays-dropdown.component';

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

   hasMotif(val: unknown): boolean {
  const s = (val ?? '').toString().trim().toLowerCase();
  return !!s && s !== 'null' && s !== 'undefined';
}

sanitizeMotif(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  // on renvoie UNDEFINED (pas null) pour rester compatible avec l’interface
  return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? undefined : s;
}

  
 
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
    public paysUtils: PaysUtilsService
  ) {}
  
  ngOnInit() {
    this.loadEntreprises();
    this.loadPays();
    this.loadUsers();
  }
  

  get dialogHeader(): string {
    return this.entreprise?.id ? 'Modifier l\'entreprise' : 'Nouvelle entreprise';
  }
  loadEntreprises() {
    this.entrepriseService.getEntreprises({
      page: this.currentPage,
      per_page: this.rowsPerPage,
      status: this.selectedStatusFilter || undefined
    }).subscribe({
      next: (response) => {
  if (response.success && response.data) {
  const items = (response.data.data || []).map(e => ({
    ...e,
    motif_rejet: this.sanitizeMotif((e as any).motif_rejet)
  }));
  this.entreprises.set(items); // plus d'erreur TS
  this.totalRecords = response.data.total;
}
},

      error: (error) => {
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
  
  openNew() {
    this.entreprise = this.getEmptyEntreprise();
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.logoUrlPreview = null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  editEntreprise(entreprise: Entreprise) {
    this.entreprise = { ...entreprise };
    this.selectedFile = null;
    this.previewLogoUrl = null;
    this.logoUrlPreview = entreprise.logo ? this.getImageUrl(entreprise.logo) : null;
    this.submitted = false;
    this.entrepriseDialog = true;
  }
  
  deleteEntreprise(entreprise: Entreprise) {
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
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Entreprises supprimées avec succès' });
          this.loadEntreprises();
          this.selectedEntreprises = [];
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression' });
        }
      });
    }
  });
}
  
  
 saveEntreprise() {
    this.submitted = true;

    // Validation minimale
    if (!this.entreprise.nom_entreprise?.trim() || !this.entreprise.secteur_activite?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs requis',
        detail: 'Nom de l\'entreprise et secteur d\'activité sont obligatoires.'
      });
      return;
    }

    // Préparer les données avec FormData pour supporter l'upload de fichier
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

    // Gérer le logo : priorité au fichier uploadé
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile, this.selectedFile.name);
    } else if (this.entreprise.logo?.trim()) {
      formData.append('logo_url', this.entreprise.logo);
    }

    if (this.entreprise.id) {
      // Mise à jour
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
      // Création
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

  // ouvre le dialog
openEntrepriseDetail(e: any) {
  this.currentEntreprise = e;
  this.detailEntrepriseDialog = true;
}
  

  
onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérification de la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'La taille du fichier ne doit pas dépasser 2MB'
      });
      event.target.value = ''; // Reset input
      return;
    }

    // Vérification du type
    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Format invalide',
        detail: 'Seules les images sont acceptées'
      });
      event.target.value = ''; // Reset input
      return;
    }

    this.selectedFile = file;
    this.previewLogoUrl = URL.createObjectURL(file);
    
    // Effacer l'URL si on upload un fichier
    this.entreprise.logo = undefined;
    this.logoUrlPreview = null;
  }

  onLogoUrlChange() {
    // Si l'utilisateur saisit une URL, effacer le fichier uploadé
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
    this.previewLogoUrl = null;
    if (this.previewLogoUrl) {
      URL.revokeObjectURL(this.previewLogoUrl);
    }
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
  // Si c’est une URL complète, on l’utilise telle quelle
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  // Sinon on préfixe par le storage Laravel
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
  // event.first = index du 1er enregistrement (0, 15, 30, …)
  // event.rows  = nombre de lignes par page
  const first = event.first ?? 0;
  const rows  = event.rows  ?? this.rowsPerPage;
  this.currentPage = Math.floor(first / rows) + 1;
  this.rowsPerPage = rows;
  this.loadEntreprises();
}
  
  // Actions de validation
  openValidationDialog(e: Entreprise) {
  this.currentEntreprise = e;
  this.validationDialog = true;
}

openRejectionDialog(e: Entreprise) {
  this.currentEntreprise = e;
  this.rejectionMotif = '';
  this.rejectionDialog = true;
}
  validateEntreprise() {
  if (!this.currentEntreprise?.id) return;
  this.entrepriseService.validateEntreprise(this.currentEntreprise.id).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise validée.' });
      this.loadEntreprises();
      this.validationDialog = false;
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors de la validation';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}

rejectEntreprise() {
  if (!this.currentEntreprise?.id || !this.rejectionMotif.trim()) return;
  this.entrepriseService.rejectEntreprise(this.currentEntreprise.id, this.rejectionMotif.trim()).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise rejetée.' });
      this.loadEntreprises();
      this.rejectionDialog = false;
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors du rejet';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}

revaliderDepuisRefuse(entreprise: Entreprise) {
  if (!entreprise.id) return;
  this.entrepriseService.revalidateEntreprise(entreprise.id).subscribe({
    next: (res) => {
      this.messageService.add({ severity:'success', summary:'Succès', detail: res.message || 'Entreprise revalidée.' });
      this.loadEntreprises();
    },
    error: (error) => {
      const msg = error?.error?.message || 'Erreur lors de la revalidation';
      this.messageService.add({ severity:'error', summary:'Erreur', detail: msg });
    }
  });
}


  
  exportCSV() {
  const rows = this.entreprises();
  if (!rows.length) return;

  // Sélectionne les colonnes à exporter
  const headers = ['ID','Nom','Secteur','Email','Téléphone','Site web','Statut','Pays','Motif rejet'];
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

  // CSV simple avec ; pour Excel FR
  const escape = (v: string) => {
    const s = (v ?? '').toString().replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = [
    headers.map(escape).join(';'),
    ...data.map(r => r.map(x => escape(String(x))).join(';'))
  ].join('\r\n');

  // Ajoute BOM pour caractères accentués sous Excel
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `entreprises_${new Date().toISOString().slice(0,10)}.csv`;
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




}