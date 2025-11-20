import { Component, OnInit, signal, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { UserService } from './user.service';
import { User } from './user.model';
import { RoleService } from '../role/role.service'; // Ajustez le chemin selon votre structure
import { Role } from '../role/role.model'; // Ajustez le chemin selon votre structure
import { BackendURL, imageUrl } from '../../../Share/const';
import { HttpClient } from '@angular/common/http';
import { EntrepriseService } from '../entreprise/entreprise.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { DividerModule } from 'primeng/divider';

type UiUser = User & { 
  roleLabel?: string; 
  roleId?: number;
  roles?: any[]; 
  selectedRoleIds?: number[]; 
};

@Component({
  selector: 'app-user',
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
    DialogModule,
    TagModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
    MultiSelectModule,
    DividerModule
  ],
  providers: [MessageService, UserService, ConfirmationService, RoleService],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit { // Corrigé le nom de la classe (était "Userr")
  userDialog = false;
  users = signal<UiUser[]>([]);
  user: Partial<UiUser> = { statut: 'actif' }; // Retiré role par défaut
  selectedUsers: UiUser[] = [];
  submitted = false;
  previewPhotoUrl?: string | null;
  userDetailsDialog = false;
  isEditMode: boolean = false;
  selectedUserForDetails: any = null;
  loading = signal(false);
  
  entrepriseAssignmentDialog = false;
  selectedUserForEntreprises: UiUser | null = null;
  assignedEntreprises: any[] = [];
  availableEntreprises: any[] = [];
  allEntreprises: any[] = [];
  selectedEntrepriseToAdd: number | null = null;

  @ViewChild('dt') dt!: Table;

  statuts = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // Rôles chargés dynamiquement depuis l'API
  roles: { label: string; value: number }[] = []; // Changé en number
  
  // Options pour le filtre par rôle
  roleFilterOptions: { label: string; value: string | null }[] = [];
  selectedRoleFilter: string | null = null;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdRef: ChangeDetectorRef,
    private roleService: RoleService,
    private http: HttpClient,
    private entrepriseService: EntrepriseService
  ) {}

  ngOnInit() {
    this.loadRoles(); // Charger les rôles d'abord
    this.loadUsers();
    this.loadAllEntreprises();
  }

  /** Charger les rôles depuis l'API */
 loadRoles() {
  this.roleService.getRoles().subscribe({
    next: (roles: Role[]) => {
      console.log('✅ Rôles chargés depuis l\'API:', roles);
      
      this.roles = roles.map(role => ({
        label: role.nom || '',
        value: Number(role.id) || 0
      }));
      
      console.log('✅ Rôles formatés pour le dropdown:', this.roles); // ← LOG
      
      this.roleFilterOptions = [
        { label: 'Tous les rôles', value: null },
        ...roles.map(role => ({
          label: role.nom || '',
          value: role.nom || ''
        }))
      ];
      
      this.cdRef.detectChanges();
    },
    error: err => {
      console.error('❌ Erreur chargement rôles:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger les rôles',
        life: 3000
      });
    }
  });
}

  /** Récupération users depuis l'API (réponse paginée Laravel) */
  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        console.log('Réponse API:', response);
        
        if (response && response.success && response.data && response.data.data) {
          const users: any[] = response.data.data;
          
          const mapped: UiUser[] = users.map((u: any) => {
            // ✅ Stocker TOUS les rôles
            const userRoles = Array.isArray(u.roles) ? u.roles : [];
            
            return {
              ...u,
              roles: userRoles, // ✅ Tous les rôles
              roleLabel: userRoles.length > 0 
                ? userRoles.map((r: any) => r.nom).join(', ') 
                : 'Aucun rôle',
              roleId: userRoles.length > 0 ? userRoles[0].id : undefined,
              selectedRoleIds: userRoles.map((r: any) => r.id) // ✅ IDs pour le multi-select
            };
          });
          
          console.log('Utilisateurs mappés:', mapped);
          this.users.set(mapped);
          this.cdRef.detectChanges();
        }
      },
      error: err => {
        console.error('Erreur chargement utilisateurs:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les utilisateurs',
          life: 3000
        });
      },
    });
  }
  /**
 * ✅ Charger toutes les entreprises via le service
 */
loadAllEntreprises(): void {
    console.log('🔄 Chargement entreprises...');
    
    this.entrepriseService.getEntreprises({
      page: 1,
      per_page: 1000,
      status: 'valide'
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allEntreprises = response.data.data || [];
          console.log('✅ Entreprises chargées:', this.allEntreprises.length);
          this.cdRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement entreprises:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les entreprises',
          life: 3000
        });
      }
    });
  }

openNew() {
  console.log('🆕 Ouverture en mode CRÉATION');

  this.isEditMode = false;

  this.user = {
    id: undefined,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    statut: 'actif',
    role_id: undefined, // ✅ UN SEUL rôle
    roles: [],
    password: ''
  };

  console.log('📋 Rôles disponibles:', this.roles);

  this.previewPhotoUrl = undefined;
  this.submitted = false;
  this.userDialog = true;
}



 editUser(user: UiUser) {
  console.log('📝 Ouverture en mode MODIFICATION', user);

  this.isEditMode = true;

  // ✅ Récupérer le premier rôle (puisqu'on n'en veut qu'un seul)
  const roleId = user.roles && user.roles.length > 0 
    ? Number(user.roles[0].id) 
    : undefined;

  this.user = {
    ...user,
    role_id: roleId, // ✅ UN SEUL rôle
    photo: typeof user.photo === 'string' ? user.photo : undefined
  };

  console.log('✅ user.role_id:', this.user.role_id);

  this.previewPhotoUrl = undefined;
  this.submitted = false;
  this.userDialog = true;
}

  deleteSelectedUsers() {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const toDelete = [...this.selectedUsers];
        toDelete.forEach(u => {
          if (u.id) {
            this.userService.deleteUser(u.id).subscribe({
              next: () => this.users.set(this.users().filter(x => x.id !== u.id)),
              error: err => console.error('Erreur suppression utilisateur', err),
            });
          }
        });
        this.selectedUsers = [];
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Succès', 
          detail: 'Utilisateurs supprimés', 
          life: 3000 
        });
      },
    });
  }

  deleteUser(user: UiUser) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (user.id) {
          this.userService.deleteUser(user.id).subscribe({
            next: () => {
              this.users.set(this.users().filter(x => x.id !== user.id));
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Succès', 
                detail: 'Utilisateur supprimé', 
                life: 3000 
              });
            },
            error: err => {
              console.error('Erreur suppression utilisateur', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Impossible de supprimer l\'utilisateur',
                life: 3000
              });
            },
          });
        }
      },
    });
  }

  /** ✅ CORRIGÉ : saveUser avec ID dans le payload */
saveUser() {
  this.submitted = true;

  const isEdit = !!this.user.id;

  // ✅ VALIDATION COMMUNE (création ET modification)
  if (!this.user.role_id) {
    console.error('❌ ERREUR : user.role_id est vide !', this.user.role_id);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le rôle est obligatoire',
      life: 3000
    });
    return;
  }

  if (!this.user.statut) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Le statut est obligatoire',
      life: 3000
    });
    return;
  }

  if (isEdit) {
    // ✅ MODE ÉDITION
    const payload: any = {
      id: this.user.id,
      statut: this.user.statut,
      role_id: this.user.role_id // ✅ UN SEUL rôle
    };

    console.log('📤 UPDATE Payload:', payload);

    this.userService.updateUser(payload).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur mis à jour avec succès',
          life: 3000
        });
        this.loadUsers();
        this.hideDialog();
      },
      error: err => {
        console.error('❌ Erreur update:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Erreur lors de la mise à jour',
          life: 3000
        });
      }
    });

  } else {
    // ✅ MODE CRÉATION
    if (!this.user.nom || !this.user.prenom || !this.user.email || !this.user.password) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      });
      return;
    }

    const payload: any = {
      nom: this.user.nom,
      prenom: this.user.prenom,
      email: this.user.email,
      password: this.user.password,
      telephone: this.user.telephone || null,
      statut: this.user.statut,
      role_id: this.user.role_id // ✅ UN SEUL rôle
    };

    console.log('📤 CREATE Payload:', payload);

    this.userService.createUser(payload).subscribe({
      next: (response) => {
        console.log('✅ SUCCÈS:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur créé avec succès !',
          life: 3000
        });
        this.loadUsers();
        this.hideDialog();
      },
      error: err => {
        console.error('❌ ERREUR:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Erreur lors de la création',
          life: 3000
        });
      }
    });
  }
}

  getRoleLabelById(roleId: number): string {
    const role = this.roles.find(r => r.value === roleId);
    return role ? role.label : 'Inconnu';
  }

  /** Nettoyer l'URL de prévisualisation lors de la fermeture du dialog */
  hideDialog() {
  this.userDialog = false;
  this.submitted = false;
  this.isEditMode = false; // ✅ on réinitialise

  if (this.previewPhotoUrl) {
    URL.revokeObjectURL(this.previewPhotoUrl);
    this.previewPhotoUrl = undefined;
  }
}


  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  /** Filtrer par rôle */
  onRoleFilterChange(event: any) {
    const selectedRole = event.value;
    console.log('Filtre par rôle sélectionné:', selectedRole);
    
    if (selectedRole === null || selectedRole === '') {
      // Afficher tous les utilisateurs
      this.dt.filter(null, 'roleLabel', 'equals');
    } else {
      // Filtrer par le rôle sélectionné
      this.dt.filter(selectedRole, 'roleLabel', 'equals');
    }
  }

  /** Export PDF simplifié avec jsPDF */
  exportPDF() {
    // Obtenir les données filtrées du tableau
    const filteredUsers = this.dt.filteredValue || this.users();
    
    if (filteredUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune donnée à exporter',
        life: 3000
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Titre
      doc.setFontSize(16);
      doc.text('Liste des Utilisateurs', 14, 15);
      
      // Date de génération
      doc.setFontSize(10);
      const now = new Date();
      doc.text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, 14, 25);

      // En-têtes du tableau
      const head = [['Nom', 'Prénom', 'Email', 'Téléphone', 'Rôle', 'Statut']];
      
      // Données du tableau
      const body = filteredUsers.map((user: UiUser) => [
        user.nom || '—',
        user.prenom || '—',
        user.email || '—',
        user.telephone || '—',
        user.roleLabel || '—',
        user.statut || '—'
      ]);

      // Générer le tableau
      autoTable(doc, {
        head,
        body,
        startY: 35,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [52, 152, 219], // Bleu
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] // Gris clair alternatif
        }
      });

      // Télécharger le PDF
      doc.save(`utilisateurs_${new Date().getTime()}.pdf`);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'PDF exporté avec succès',
        life: 3000
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible d\'exporter le PDF',
        life: 5000
      });
    }
  }

  getImageUrl(photoPath: unknown): string {
    if (!photoPath) return '';
    
    if (typeof photoPath === 'string') {
      // Si c'est déjà une URL complète
      if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
      }
      // Sinon construire l'URL complète
      return `${imageUrl}/${photoPath}`;
    }
    
    if (photoPath instanceof File) {
      return this.previewPhotoUrl ?? '';
    }
    
    return '';
  }

  onImageError(event: any) {
    console.error('Erreur de chargement de l\'image:', event.target.src);
    // Remplacer par une image par défaut ou masquer
    event.target.style.display = 'none';
    // Optionnel: afficher un placeholder
    const placeholder = event.target.parentElement?.querySelector('.image-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  onFileChange(event: any) {
    const file: File | undefined = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        (this.user as any).photo = file;
        this.previewPhotoUrl = URL.createObjectURL(file);
        console.log('Nouveau fichier sélectionné:', file.name, file.type);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Veuillez sélectionner un fichier image valide',
          life: 3000
        });
        // Reset l'input
        event.target.value = '';
      }
    } else {
      // Si l'input est vidé, nettoyer la prévisualisation
      // mais garder la photo existante si on est en modification
      if (this.previewPhotoUrl) {
        URL.revokeObjectURL(this.previewPhotoUrl);
        this.previewPhotoUrl = undefined;
      }
      
      // Si on était en train de modifier et qu'on supprime la sélection,
      // remettre la photo originale (string)
      if (this.user.id && typeof this.user.photo !== 'string') {
        // Récupérer la photo originale depuis la liste des users
        const originalUser = this.users().find(u => u.id === this.user.id);
        if (originalUser && typeof originalUser.photo === 'string') {
          this.user.photo = originalUser.photo;
        } else {
          // Pas de photo originale
          this.user.photo = undefined;
        }
      }
    }
  }


hideDetailsDialog(): void {
  this.userDetailsDialog = false;
  this.selectedUserForDetails = null;
}

// Actions depuis le dialog
editFromDetails(): void {
  if (this.selectedUserForDetails) {
    this.hideDetailsDialog();
    this.editUser(this.selectedUserForDetails);
  }
}

deleteFromDetails(): void {
  if (this.selectedUserForDetails) {
    this.hideDetailsDialog();
    this.deleteUser(this.selectedUserForDetails);
  }
}

// Actions rapides
sendEmail(user: any): void {
  if (user.email) {
    window.location.href = `mailto:${user.email}`;
  }
}

callUser(user: any): void {
  if (user.telephone) {
    window.location.href = `tel:${user.telephone}`;
  }
}

// Méthode pour activer/désactiver l'utilisateur
toggleUserStatus(user: any): void {
  const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
  
  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir ${newStatus === 'actif' ? 'activer' : 'désactiver'} cet utilisateur ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui',
    rejectLabel: 'Non',
    accept: () => {
      // Appel API pour changer le statut
      this.loading.set(true);
      
      // Remplacez ceci par votre appel API réel
      this.userService.updateUserStatus(user.id, newStatus).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`
          });
          this.loadUsers(); // Recharger la liste
          if (this.selectedUserForDetails) {
            this.selectedUserForDetails.statut = newStatus;
          }
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de modifier le statut'
          });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  });
}

// Méthode pour réinitialiser le mot de passe
resetPassword(user: any): void {
  this.confirmationService.confirm({
    message: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.prenom} ${user.nom} ?`,
    header: 'Réinitialisation du mot de passe',
    icon: 'pi pi-key',
    acceptLabel: 'Confirmer',
    rejectLabel: 'Annuler',
    accept: () => {
      this.loading.set(true);
      
      // Remplacez ceci par votre appel API réel
      this.userService.resetUserPassword(user.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Mot de passe réinitialisé',
            detail: 'Un email de réinitialisation a été envoyé à l\'utilisateur'
          });
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de réinitialiser le mot de passe'
          });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  });
}

// Dans user.component.ts
viewUserDetails(user: User) {
  console.group('🔍 DÉTAILS USER SÉLECTIONNÉ');
  console.log('User complet:', user);
  console.log('last_login:', user.last_login);
  console.log('Type de last_login:', typeof user.last_login);
  console.log('created_at:', user.created_at);
  console.log('updated_at:', user.updated_at);
  console.groupEnd();
  
  this.selectedUserForDetails = user;
  this.userDetailsDialog = true;
}

// Ajoutez aussi cette méthode pour tester
testLastLogin() {
  console.log('=== TEST LAST LOGIN ===');
  const allUsers = this.users();
  console.log('Nombre d\'utilisateurs:', allUsers.length);
  
  allUsers.forEach((user, index) => {
    console.log(`User ${index + 1} (${user.nom}):`, {
      id: user.id,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  });
}

/**
   * Vérifie si l'utilisateur est un CM
   */
  isCommunityManager(user: UiUser): boolean {
    return user.roleLabel?.toLowerCase().includes('community') || false;
  }

  /**
   * Ouvrir le modal d'attribution
   */
  openEntrepriseAssignmentModal(user: UiUser): void {
    this.selectedUserForEntreprises = user;
    this.selectedEntrepriseToAdd = null;
    this.loadCMEntreprises(user.id!);
    this.entrepriseAssignmentDialog = true;
  }

  /**
   * Fermer le modal
   */
  closeEntrepriseAssignmentModal(): void {
    this.entrepriseAssignmentDialog = false;
    this.selectedUserForEntreprises = null;
    this.assignedEntreprises = [];
    this.availableEntreprises = [];
    this.selectedEntrepriseToAdd = null;
  }

  /**
   * Charger les entreprises du CM
   */
  loadCMEntreprises(userId: number): void {
    this.http.get<any>(`${BackendURL}admin/community-managers/${userId}/entreprises`).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignedEntreprises = response.data || [];
          this.updateAvailableEntreprises();
          console.log('✅ Entreprises du CM:', this.assignedEntreprises.length);
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement entreprises CM:', err);
        this.assignedEntreprises = [];
        this.updateAvailableEntreprises();
      }
    });
  }

  /**
   * Mettre à jour les entreprises disponibles
   */
  updateAvailableEntreprises(): void {
  console.log('🔄 Mise à jour des entreprises disponibles...');
  console.log('  📊 Stats:', {
    total: this.allEntreprises.length,
    assignees: this.assignedEntreprises.length
  });
  
  const assignedIds = this.assignedEntreprises.map(e => e.id);
  
  // Filtrer : pas assignées ET valides
  this.availableEntreprises = this.allEntreprises.filter(e => 
    !assignedIds.includes(e.id) && e.statut === 'valide'
  );
  
  console.log('✅ Entreprises disponibles:', this.availableEntreprises.length);
  
  if (this.availableEntreprises.length === 0) {
    console.warn('⚠️ Aucune entreprise disponible !');
    console.log('  - Toutes assignées ?', assignedIds.length === this.allEntreprises.length);
    console.log('  - Statuts:', this.allEntreprises.map(e => e.statut));
  }
  
  this.cdRef.detectChanges();
}

  /**
   * Ajouter une entreprise au CM
   */
  addEntrepriseToCM(): void {
    if (!this.selectedUserForEntreprises || !this.selectedEntrepriseToAdd) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez sélectionner une entreprise',
        life: 3000
      });
      return;
    }

    this.loading.set(true);

    this.http.post<any>(`${BackendURL}admin/community-managers/assign`, {
      user_id: this.selectedUserForEntreprises.id,
      entreprise_id: this.selectedEntrepriseToAdd
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Entreprise assignée avec succès',
            life: 3000
          });
          // Recharger les entreprises
          this.loadCMEntreprises(this.selectedUserForEntreprises!.id!);
          this.selectedEntrepriseToAdd = null;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur assignation:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Impossible d\'assigner l\'entreprise',
          life: 3000
        });
        this.loading.set(false);
      }
    });
  }

  /**
   * Retirer une entreprise du CM
   */
  removeEntrepriseFromCM(entrepriseId: number): void {
    if (!this.selectedUserForEntreprises) {
      return;
    }

    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir retirer cette entreprise ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, retirer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.loading.set(true);

        this.http.post<any>(`${BackendURL}/admin/community-managers/remove`, {
          user_id: this.selectedUserForEntreprises!.id,
          entreprise_id: entrepriseId
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: 'Entreprise retirée avec succès',
                life: 3000
              });
              // Recharger les entreprises
              this.loadCMEntreprises(this.selectedUserForEntreprises!.id!);
            }
            this.loading.set(false);
          },
          error: (err) => {
            console.error('❌ Erreur retrait:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de retirer l\'entreprise',
              life: 3000
            });
            this.loading.set(false);
          }
        });
      }
    });
  }

  /**
   * Récupérer une entreprise par ID
   */
  getEntrepriseById(id: number): any {
    return this.allEntreprises.find(e => e.id === id);
  }

  /**
   * Compter les entreprises valides
   */
  getValidEntreprisesCount(): number {
    return this.assignedEntreprises.filter(e => e.statut === 'valide').length;
  }
}