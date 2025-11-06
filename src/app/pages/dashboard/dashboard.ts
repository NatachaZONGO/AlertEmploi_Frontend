// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { CanSeeDirective } from "../../Share/can_see/can_see.directive";
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { EntrepriseService } from '../crud/entreprise/entreprise.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    TableModule, 
    DropdownModule,
    ButtonModule,
    FormsModule,
    CanSeeDirective
  ],
  templateUrl: './dashboard.component.html',
  providers: [
    MessageService
  ]
})
export class DashboardComponent implements OnInit {
  // ✅ Détection du rôle
  isRecruteur = false;
  isCommunityManager = false;
  isCandidatUser = false;
  isAdmin = false;

  // ✅ NOUVEAU : Gestion de l'entreprise pour CM
  selectedEntreprise: any = null;
  entreprisesGerables: any[] = [];
  entrepriseNom: string = '';

  // Cartes "stats"
  totalUsers = 0;
  usersOnline = 0;
  totalEntreprises = 0;
  
  totalOffres = 0;
  offresPubliees = 0;
  offresEnAttente = 0;
  offresBrouillon = 0;
  
  totalPublicites = 0;
  
  totalCandidatures = 0;
  candidaturesEnCours = 0;
  candidaturesAcceptees = 0;
  candidaturesRefusees = 0;
  
  // Listes
  recentOffres: any[] = [];
  topEntreprises: any[] = [];
  
  // Charts
  offersChartData: any;
  candidaturesChartData: any;
  chartOptions: any = { 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  loading = true;
  
  constructor(
    private dashboard: DashboardService,
    private authService: AuthService,
    private entrepriseService: EntrepriseService,
    private messageService: MessageService

  ) {}
  
  ngOnInit() {
    // ✅ Détection du rôle
    this.isRecruteur = this.authService.hasRole('Recruteur');
    this.isCommunityManager = this.authService.hasRole('community_manager');
    this.isCandidatUser = this.authService.hasRole('Candidat');
    this.isAdmin = this.authService.hasRole('Administrateur');

    console.log('🔍 Rôle détecté:', {
      isRecruteur: this.isRecruteur,
      isCommunityManager: this.isCommunityManager,
      isCandidatUser: this.isCandidatUser,
      isAdmin: this.isAdmin
    });

    // ✅ Si CM, charger les entreprises gérables
    if (this.isCommunityManager) {
      this.loadEntreprisesGerables();
    } else {
      this.loadStats();
    }
  }

  
  /**
   * ✅ NOUVEAU : Changer d'entreprise
   */
  onEntrepriseChange() {
    if (this.selectedEntreprise) {
      console.log('🔄 Changement d\'entreprise:', this.selectedEntreprise.nom_entreprise);
      
      // Sauvegarder l'entreprise sélectionnée
      this.entrepriseService.setSelectedEntrepriseId(this.selectedEntreprise.id);
      this.entrepriseNom = this.selectedEntreprise.nom_entreprise;
      
      // Recharger les stats
      this.loadStats();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Entreprise changée',
        detail: `Affichage des données de : ${this.entrepriseNom}`,
        life: 3000
      });
    }
  }

  loadStats() {
    this.loading = true;
    
    // ✅ Récupérer l'entreprise_id sélectionnée (pour CM)
    const entrepriseId = this.isCommunityManager 
      ? this.entrepriseService.getSelectedEntrepriseId() 
      : undefined;
    
    if (this.isCommunityManager && entrepriseId) {
      console.log('🏢 Stats filtrées par entreprise:', entrepriseId);
    }

    this.dashboard.getStats(entrepriseId ?? undefined).subscribe({
      next: (data) => {
        this.loading = false;
        
        console.log('📊 Stats reçues:', data);
        
        // Compteurs
        this.totalUsers       = data.total_users ?? 0;
        this.usersOnline      = data.users_online ?? 0;
        this.totalEntreprises = data.total_entreprises ?? 0;
        
        this.totalOffres      = data.total_offres ?? 0;
        this.offresPubliees   = data.offres_publiees ?? 0;
        this.offresEnAttente  = data.offres_en_attente ?? 0;
        this.offresBrouillon  = data.offres_brouillon ?? 0;
        
        this.totalPublicites  = data.total_publicites ?? 0;
        
        this.totalCandidatures      = data.total_candidatures ?? 0;
        this.candidaturesEnCours    = data.candidatures_en_cours ?? 0;
        this.candidaturesAcceptees  = data.candidatures_acceptees ?? 0;
        this.candidaturesRefusees   = data.candidatures_refusees ?? 0;
        
        // Listes
        this.recentOffres   = Array.isArray(data.recent_offres) ? data.recent_offres : [];
        this.topEntreprises = Array.isArray(data.top_entreprises) ? data.top_entreprises : [];
        
        // Charts
        this.offersChartData = {
          labels: ['Publiées', 'En attente', 'Brouillons'],
          datasets: [{
            data: [this.offresPubliees, this.offresEnAttente, this.offresBrouillon],
            backgroundColor: ['#22c55e', '#f59e0b', '#94a3b8'],
          }]
        };
        
        this.candidaturesChartData = {
          labels: ['En cours', 'Acceptées', 'Refusées'],
          datasets: [{
            data: [this.candidaturesEnCours, this.candidaturesAcceptees, this.candidaturesRefusees],
            backgroundColor: ['#3b82f6', '#16a34a', '#ef4444'],
          }]
        };
      },
      error: (e) => {
        console.error('❌ Erreur stats dashboard:', e);
        this.loading = false;
      }
    });
  }
  
  // ✅ Méthode pour le style du statut
  getStatutClass(statut: string): string {
    const classes = 'px-2 py-1 rounded text-xs font-medium ';
    switch(statut?.toLowerCase()) {
      case 'publiee':
      case 'publiée':
        return classes + 'bg-green-100 text-green-800';
      case 'en_attente_validation':
      case 'en attente':
        return classes + 'bg-amber-100 text-amber-800';
      case 'brouillon':
        return classes + 'bg-gray-100 text-gray-800';
      case 'expiree':
      case 'expirée':
        return classes + 'bg-red-100 text-red-800';
      default:
        return classes + 'bg-blue-100 text-blue-800';
    }
  }

  loadEntreprisesGerables() {
  console.log('🔄 Chargement des entreprises gérées...');
  
  this.entrepriseService.getMesEntreprisesGerees().subscribe({
    next: (entreprises) => {
      this.entreprisesGerables = entreprises;
      
      console.log('🏢 Entreprises gérées:', this.entreprisesGerables);
      console.log('📊 Nombre d\'entreprises:', this.entreprisesGerables.length);
      
      // ✅ Afficher chaque entreprise pour debug
      this.entreprisesGerables.forEach((e, index) => {
        console.log(`  ${index + 1}. ${e.nom_entreprise} (ID: ${e.id})`);
      });
      
      // ✅ Récupérer l'entreprise sélectionnée
      const entrepriseId = this.entrepriseService.getSelectedEntrepriseId();
      
      if (entrepriseId) {
        this.selectedEntreprise = this.entreprisesGerables.find(e => e.id === entrepriseId);
        console.log('✅ Entreprise sélectionnée (depuis storage):', this.selectedEntreprise?.nom_entreprise);
      }
      
      // ✅ Si aucune sélection, prendre la première
      if (!this.selectedEntreprise && this.entreprisesGerables.length > 0) {
        this.selectedEntreprise = this.entreprisesGerables[0];
        this.entrepriseService.setSelectedEntrepriseId(this.selectedEntreprise.id);
        console.log('✅ Entreprise sélectionnée (par défaut):', this.selectedEntreprise.nom_entreprise);
      }
      
      if (this.selectedEntreprise) {
        this.entrepriseNom = this.selectedEntreprise.nom_entreprise;
      }
      
      this.loadStats();
    },
    error: (err) => {
      console.error('❌ Erreur chargement entreprises:', err);
      console.error('Détails:', err.error);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger vos entreprises',
        life: 5000
      });
      
      this.loadStats();
    }
  });
}

onEntrepriseChangeSimple(event: any) {
  if (this.selectedEntreprise) {
    console.log('🔄 Changement d\'entreprise:', this.selectedEntreprise.nom_entreprise);
    
    // Sauvegarder l'entreprise sélectionnée
    this.entrepriseService.setSelectedEntrepriseId(this.selectedEntreprise.id);
    this.entrepriseNom = this.selectedEntreprise.nom_entreprise;
    
    // Recharger les stats
    this.loadStats();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Entreprise changée',
      detail: `Affichage des données de : ${this.entrepriseNom}`,
      life: 3000
    });
  }
}
}