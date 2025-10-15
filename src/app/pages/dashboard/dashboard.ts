// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../auth/auth.service';
import { CanSeeDirective } from "../../Share/can_see/can_see.directive";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, TableModule, CanSeeDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // ✅ Détection du rôle
  isRecruteur = false;
  isCandidatUser = false;
  isAdmin = false;

  // Cartes "stats"
  totalUsers = 0;
  usersOnline = 0;
  totalEntreprises = 0;
  
  totalOffres = 0;
  offresPubliees = 0;
  offresEnAttente = 0;
  offresBrouillon = 0;
  
  totalPublicites = 0;  // ✅ AJOUTÉ pour le recruteur
  
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
    private authService: AuthService  // ✅ AJOUTÉ
  ) {}
  
  ngOnInit() {
    // ✅ Détection du rôle
    this.isRecruteur = this.authService.hasRole('Recruteur');
    this.isCandidatUser = this.authService.hasRole('Candidat');
    this.isAdmin = this.authService.hasRole('Administrateur');

    console.log('🔍 Rôle détecté:', {
      isRecruteur: this.isRecruteur,
      isCandidatUser: this.isCandidatUser,
      isAdmin: this.isAdmin
    });

    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    
    this.dashboard.getStats().subscribe({
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
        
        this.totalPublicites  = data.total_publicites ?? 0;  // ✅ AJOUTÉ
        
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
}
