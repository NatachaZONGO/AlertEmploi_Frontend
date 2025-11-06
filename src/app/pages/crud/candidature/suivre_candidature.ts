import { TopbarWidget } from './../../landing/components/topbarwidget.component';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { CandidatureService } from './candidature.service';
import { Candidature } from './candidature.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FooterWidget } from '../../landing/components/footerwidget';

// Service

@Component({
  selector: 'app-suivi-candidature',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    RippleModule,
    TopbarWidget,
    FooterWidget
  ],
  providers: [MessageService],
  template: `
    <topbar-widget></topbar-widget>

    <p-toast></p-toast>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-overlay"></div>
      </div>
      
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Suivre ma candidature</h1>
          <p class="hero-subtitle">
            Entrez votre code de candidature pour consulter l'état d'avancement de votre dossier
            et recevoir les dernières informations de nos recruteurs.
          </p>
          <div class="hero-info">
            <div class="info-item">
              <i class="pi pi-search info-icon"></i>
              <span>Recherche instantanée</span>
            </div>
            <div class="info-item">
              <i class="pi pi-clock info-icon"></i>
              <span>Suivi en temps réel</span>
            </div>
            <div class="info-item">
              <i class="pi pi-shield info-icon"></i>
              <span>Données sécurisées</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Search Section -->
      <section class="search-section">
        <div class="search-container">
          <h2 class="search-title">Rechercher ma candidature</h2>
          <p class="search-subtitle">Le code de candidature vous a été envoyé par email lors de votre postulation</p>
          
          <form class="search-form" (ngSubmit)="searchCandidature()" #searchForm="ngForm">
            <div class="search-input-group">
              <label for="candidatureCode" class="input-label">Code de candidature *</label>
              <div class="input-container">
                <i class="pi pi-key input-icon"></i>
                <input 
                  id="candidatureCode"
                  pInputText 
                  type="text" 
                  [(ngModel)]="searchCode" 
                  name="searchCode"
                  placeholder="Ex: CAND-2025-ABC123" 
                  class="search-input"
                  required
                  maxlength="20"
                  #codeInput="ngModel"
                />
              </div>
              <small class="input-help" *ngIf="!codeInput.valid && codeInput.touched">
                Le code de candidature est obligatoire
              </small>
            </div>
            
            <button 
              pButton 
              pRipple 
              type="submit" 
              label="Rechercher ma candidature" 
              icon="pi pi-search"
              class="search-btn"
              [loading]="searching"
              [disabled]="!searchForm.valid">
            </button>
          </form>
        </div>
      </section>

      <!-- Results Section -->
      <section class="results-section" *ngIf="candidatureResult">
        <div class="results-container">
          <div class="candidature-card">
            <!-- Header avec statut -->
            <div class="card-header">
              <div class="candidature-info">
                <h3 class="candidature-title">{{ candidatureResult.offreTitre || candidatureResult.offre?.titre }}</h3>
                <div class="candidature-meta">
                  <span class="candidate">{{ candidatureResult.fullName }}</span>
                  <span class="separator">•</span>
                  <span class="email">{{ candidatureResult.email }}</span>
                </div>
              </div>
              <div class="status-badge" [ngClass]="getStatusClass(candidatureResult.statut)">
                <i [class]="getStatusIcon(candidatureResult.statut)"></i>
                <span>{{ getStatusLabel(candidatureResult.statut) }}</span>
              </div>
            </div>

            <!-- Timeline du processus -->
            <div class="timeline-section">
              <h4 class="timeline-title">Suivi de votre candidature</h4>
              <div class="timeline">
                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('en_attente', candidatureResult.statut)"
                     [class.current]="isStepCurrent('en_attente', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-send"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Candidature envoyée</h5>
                    <p>Votre dossier a été reçu avec succès</p>
                    <small>{{ candidatureResult.created_at | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('en_cours', candidatureResult.statut)"
                     [class.current]="isStepCurrent('en_cours', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-eye"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Examen du dossier</h5>
                    <p>Nos recruteurs analysent votre profil</p>
                    <small *ngIf="candidatureResult.dateExamen">{{ candidatureResult.dateExamen | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('entretien', candidatureResult.statut)"
                     [class.current]="isStepCurrent('entretien', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Entretien</h5>
                    <p>Rencontre avec l'équipe de recrutement</p>
                    <small *ngIf="candidatureResult.dateEntretien">{{ candidatureResult.dateEntretien | date:'medium' }}</small>
                  </div>
                </div>

                <div class="timeline-item" 
                     [class.completed]="isStepCompleted('acceptee', candidatureResult.statut) || isStepCompleted('refusee', candidatureResult.statut)"
                     [class.current]="isStepCurrent('acceptee', candidatureResult.statut) || isStepCurrent('refusee', candidatureResult.statut)">
                  <div class="timeline-marker">
                    <i [class]="candidatureResult.statut === 'acceptee' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  </div>
                  <div class="timeline-content">
                    <h5>Décision finale</h5>
                    <p>Résultat de votre candidature</p>
                    <small *ngIf="candidatureResult.dateDecision">{{ candidatureResult.dateDecision | date:'medium' }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Détails de la candidature -->
            <div class="details-section">
              <h4 class="details-title">Détails de votre candidature</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Code de suivi</span>
                  <span class="detail-value">{{ candidatureResult.code || searchCode }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date de candidature</span>
                  <span class="detail-value">{{ candidatureResult.created_at | date:'mediumDate' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nom complet</span>
                  <span class="detail-value">{{ candidatureResult.fullName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Téléphone</span>
                  <span class="detail-value">{{ candidatureResult.telephone || 'Non renseigné' }}</span>
                </div>
              </div>
            </div>

            <!-- Lettre de motivation -->
            <div class="motivation-section" *ngIf="candidatureResult.motivationText || candidatureResult.lm_dl">
              <h4 class="motivation-title">Lettre de motivation</h4>
              <div class="motivation-content">
                <div *ngIf="candidatureResult.lm_dl; else textMotivation" class="file-motivation">
                  <i class="pi pi-file motivation-file-icon"></i>
                  <span>Lettre de motivation fournie en fichier</span>
                  <a [href]="candidatureResult.lm_dl" target="_blank" class="download-motivation-link">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
                <ng-template #textMotivation>
                  <div class="text-motivation">
                    {{ candidatureResult.motivationText }}
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- Fichiers joints -->
            <div class="files-section" *ngIf="candidatureResult.cv_dl || candidatureResult.lm_dl">
              <h4 class="files-title">Fichiers joints</h4>
              <div class="files-list">
                <div class="file-item" *ngIf="candidatureResult.cv_dl">
                  <i class="pi pi-file file-icon"></i>
                  <span class="file-name">CV</span>
                  <a [href]="candidatureResult.cv_dl" target="_blank" class="file-download">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
                <div class="file-item" *ngIf="candidatureResult.lm_dl">
                  <i class="pi pi-file file-icon"></i>
                  <span class="file-name">Lettre de motivation</span>
                  <a [href]="candidatureResult.lm_dl" target="_blank" class="file-download">
                    <i class="pi pi-download"></i>
                    Télécharger
                  </a>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions-section">
              <button pButton pRipple label="Renvoyer l'email" icon="pi pi-envelope" class="email-btn" (click)="resendConfirmationEmail()"></button>
              <button pButton pRipple label="Imprimer" icon="pi pi-print" class="print-btn" (click)="printCandidature()"></button>
              <button pButton pRipple label="Télécharger PDF" icon="pi pi-download" class="download-btn" (click)="downloadPDF()"></button>
            </div>
          </div>
        </div>
      </section>

      <!-- No Results -->
      <section class="no-results" *ngIf="searchPerformed && !candidatureResult">
        <div class="no-results-content">
          <i class="pi pi-search no-results-icon"></i>
          <h3 class="no-results-title">Candidature introuvable</h3>
          <p class="no-results-message">
            Aucune candidature ne correspond à ce code. Vérifiez votre saisie ou contactez notre support.
          </p>
          <div class="help-actions">
            <button pButton pRipple label="Réessayer" icon="pi pi-refresh" [text]="true" (click)="resetSearch()"></button>
            <button pButton pRipple label="Contacter le support" icon="pi pi-envelope" [outlined]="true" (click)="contactSupport()"></button>
          </div>
        </div>
      </section>
    </div>
    <app-footer-widget></app-footer-widget>
  `,
  styles: [`
    :host {
      --primary-blue: #111d9d;
      --accent-orange: #ff7104;
      --success-green: #0a6c34;
      --text-dark: #1e293b;
      --text-medium: #64748b;
      --text-light: #94a3b8;
      --bg-light: #f8fafc;
      --border-light: #e2e8f0;
      --white: #ffffff;
    }

    /* Animation globale */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .search-container, .candidature-card, .no-results-content {
      animation: fadeInUp 0.6s ease-out;
    }

    /* ===== HERO SECTION ===== */
    .hero-section {
      position: relative;
      min-height: 450px;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: var(--text-dark);
      overflow: hidden;
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 60%;
      height: 200%;
      background: linear-gradient(45deg, rgba(17, 29, 157, 0.05) 0%, rgba(255, 113, 4, 0.05) 100%);
      border-radius: 50%;
      transform: rotate(-15deg);
    }

    .hero-background {
      position: absolute;
      inset: 0;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem;
      text-align: center;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.1;
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-orange) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.35rem;
      line-height: 1.7;
      margin-bottom: 3rem;
      color: var(--text-medium);
      max-width: 750px;
      margin-left: auto;
      margin-right: auto;
      font-weight: 400;
    }

    .hero-info {
      display: flex;
      justify-content: center;
      gap: 3rem;
      flex-wrap: wrap;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border-radius: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .info-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
    }

    .info-icon {
      font-size: 1.35rem;
      color: var(--primary-blue);
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* ===== SEARCH SECTION ===== */
    .search-section {
      padding: 5rem 0;
      background: white;
      position: relative;
      margin-top: -50px;
      z-index: 10;
    }

    .search-container {
      text-align: center;
      max-width: 650px;
      margin: 0 auto;
      background: white;
      padding: 3rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.5);
    }

    .search-title {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, var(--text-dark) 0%, var(--primary-blue) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .search-subtitle {
      color: var(--text-medium);
      margin-bottom: 2.5rem;
      line-height: 1.6;
      font-size: 1.05rem;
    }

    .search-form {
      text-align: left;
    }

    .search-input-group {
      margin-bottom: 2.5rem;
    }

    .input-label {
      display: block;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
    }

    .input-container {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--primary-blue);
      z-index: 2;
      font-size: 1.1rem;
    }

    .search-input {
      width: 100% !important;
      padding: 1.25rem 1.25rem 1.25rem 3.5rem !important;
      border: 2px solid #e2e8f0 !important;
      border-radius: 1rem !important;
      font-size: 1.05rem !important;
      transition: all 0.3s ease !important;
      text-transform: uppercase;
      font-weight: 500;
      background: #f8fafc !important;
    }

    .search-input:hover {
      background: white !important;
      border-color: #cbd5e1 !important;
    }

    .search-input:focus {
      border-color: var(--primary-blue) !important;
      box-shadow: 0 0 0 4px rgba(17, 29, 157, 0.1) !important;
      background: white !important;
    }

    .input-help {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.75rem;
      display: block;
      font-weight: 500;
    }

    .search-btn {
      width: 100% !important;
      padding: 1.25rem 2rem !important;
      background: linear-gradient(135deg, var(--primary-blue) 0%, #1e3a8a 100%) !important;
      border: none !important;
      font-size: 1.05rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      border-radius: 1rem !important;
      box-shadow: 0 4px 15px rgba(17, 29, 157, 0.25) !important;
    }

    .search-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 30px rgba(17, 29, 157, 0.35) !important;
    }

    .search-btn:active {
      transform: translateY(0) !important;
    }

    /* ===== CANDIDATURE CARD ===== */
    .results-section {
      padding: 2rem 0 4rem 0;
    }

    .candidature-card {
      background: var(--white);
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .card-header {
      background: linear-gradient(135deg, var(--bg-light) 0%, var(--white) 100%);
      padding: 2rem;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .candidature-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 0.5rem 0;
    }

    .candidature-meta {
      color: var(--text-medium);
      font-size: 0.95rem;
    }

    .separator {
      margin: 0 0.5rem;
      opacity: 0.6;
    }

    /* ===== STATUS BADGES ===== */
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .status-badge.submitted {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }

    .status-badge.reviewing {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .status-badge.interview {
      background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
      color: #5b21b6;
      border: 1px solid #c4b5fd;
    }

    .status-badge.accepted {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .status-badge.rejected {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .status-badge.on-hold {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    /* ===== TIMELINE ===== */
    .timeline-section {
      padding: 2rem;
      border-bottom: 1px solid var(--border-light);
    }

    .timeline-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 2rem;
    }

    .timeline {
      position: relative;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 1rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border-light);
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      position: relative;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-marker {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--white);
      border: 2px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 2;
      position: relative;
    }

    .timeline-item.completed .timeline-marker {
      background: var(--success-green);
      border-color: var(--success-green);
      color: white;
    }

    .timeline-item.current .timeline-marker {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
    }

    .timeline-content h5 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-dark);
      margin: 0 0 0.25rem 0;
    }

    .timeline-content p {
      color: var(--text-medium);
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .timeline-content small {
      color: var(--text-light);
      font-size: 0.75rem;
    }

    /* ===== DETAILS SECTION ===== */
    .details-section {
      padding: 2rem;
      border-bottom: 1px solid var(--border-light);
    }

    .details-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 1.5rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-light);
      font-weight: 500;
    }

    .detail-value {
      font-weight: 600;
      color: var(--text-dark);
    }

    /* ===== MOTIVATION SECTION ===== */
    .motivation-section {
      padding: 2rem;
      border-bottom: 1px solid var(--border-light);
    }

    .motivation-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 1.5rem;
    }

    .motivation-content {
      background: var(--bg-light);
      border-radius: 0.75rem;
      padding: 1.5rem;
      border: 1px solid var(--border-light);
    }

    .file-motivation {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .motivation-file-icon {
      color: var(--primary-blue);
      font-size: 1.25rem;
    }

    .download-motivation-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      margin-left: auto;
    }

    .download-motivation-link:hover {
      text-decoration: underline;
    }

    .text-motivation {
      color: var(--text-dark);
      line-height: 1.6;
      white-space: pre-line;
    }

    /* ===== FILES SECTION ===== */
    .files-section {
      padding: 2rem;
      border-bottom: 1px solid var(--border-light);
    }

    .files-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 1.5rem;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--bg-light);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-light);
    }

    .file-icon {
      color: var(--success-green);
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .file-name {
      flex: 1;
      font-weight: 500;
      color: var(--text-dark);
    }

    .file-download {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      transition: background-color 0.3s ease;
    }

    .file-download:hover {
      background-color: rgba(17, 29, 157, 0.1);
      text-decoration: none;
    }

    /* ===== ACTIONS SECTION ===== */
    .actions-section {
      padding: 2.5rem;
      display: flex;
      gap: 1.25rem;
      justify-content: center;
      flex-wrap: wrap;
      background: linear-gradient(180deg, white 0%, #f8fafc 100%);
    }

    .print-btn, .download-btn, .email-btn {
      padding: 1rem 2rem !important;
      font-weight: 600 !important;
      border-radius: 0.75rem !important;
      font-size: 0.95rem !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    .email-btn {
      background: linear-gradient(135deg, var(--primary-blue) 0%, #1e3a8a 100%) !important;
      border: none !important;
      color: white !important;
    }

    .email-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(17, 29, 157, 0.3) !important;
    }

    .print-btn {
      background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
      border: none !important;
      color: white !important;
    }

    .print-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(71, 85, 105, 0.3) !important;
    }

    .download-btn {
      background: linear-gradient(135deg, var(--accent-orange) 0%, #dc2626 100%) !important;
      border: none !important;
      color: white !important;
    }

    .download-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(255, 113, 4, 0.3) !important;
    }

    /* ===== NO RESULTS ===== */
    .no-results {
      padding: 5rem 2rem;
      text-align: center;
    }

    .no-results-content {
      max-width: 550px;
      margin: 0 auto;
      background: white;
      padding: 3rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.5);
    }

    .no-results-icon {
      font-size: 5rem;
      color: #cbd5e1;
      margin-bottom: 2rem;
      display: inline-block;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(0.95); }
    }

    .no-results-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 1rem;
    }

    .no-results-message {
      color: var(--text-medium);
      line-height: 1.7;
      margin-bottom: 2.5rem;
      font-size: 1.05rem;
    }

    .help-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .help-actions button {
      transition: all 0.3s ease !important;
    }

    .help-actions button:hover {
      transform: translateY(-2px) !important;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-info {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .actions-section {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class SuiviCandidatureComponent implements OnInit {
  searchCode: string = '';
  searching: boolean = false;
  searchPerformed: boolean = false;
  candidatureResult: any = null;
  
  candidatures = signal<Candidature[]>([]);
  constructor(
    private messageService: MessageService,
    private router: Router,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    console.log('Composant Suivi Candidature initialisé');
  }

  searchCandidature(): void {
    if (!this.searchCode?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez saisir un code de candidature'
      });
      return;
    }

    console.log('Recherche candidature avec code:', this.searchCode.trim());

    this.searching = true;
    this.searchPerformed = false;

    // Appel réel à l'API via votre service
    this.candidatureService.findByCode(this.searchCode.trim()).subscribe({
      next: (data:Candidature) => {
        console.log('Candidature trouvée:', data);
        this.candidatureResult = data;
        this.searchPerformed = true;
        this.searching = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Candidature trouvée',
          detail: `Candidature de ${data.fullName} pour le poste de ${data.offreTitre}`,
          life: 3000
        });
      },
      error: (error:any) => {
        console.error('Erreur recherche candidature:', error);
        this.candidatureResult = null;
        this.searchPerformed = true;
        this.searching = false;
        
        // Afficher le message d'erreur approprié
        let errorMessage = error.message || 'Une erreur est survenue lors de la recherche';
        let errorSummary = 'Erreur';
        
        if (error.code === 'NOT_FOUND') {
          errorSummary = 'Candidature introuvable';
          errorMessage = 'Aucune candidature ne correspond à ce code. Vérifiez votre saisie.';
        } else if (error.code === 'INVALID_FORMAT') {
          errorSummary = 'Code invalide';
          errorMessage = 'Le format du code est incorrect. Format attendu: CAND-ANNÉE-XXXXXX';
        } else if (error.code === 'NETWORK_ERROR') {
          errorSummary = 'Erreur de connexion';
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: errorSummary,
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  // Fonction pour renvoyer l'email de confirmation
  resendConfirmationEmail(): void {
    if (!this.candidatureResult?.code) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune candidature sélectionnée'
      });
      return;
    }

    console.log('Renvoi email pour code:', this.candidatureResult.code);

    this.candidatureService.resendEmail(this.candidatureResult.code).subscribe({
      next: (response:any) => {
        console.log('Email renvoyé:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Email envoyé',
          detail: response.message || 'L\'email de confirmation a été renvoyé avec succès',
          life: 3000
        });
      },
      error: (error:any) => {
        console.error('Erreur renvoi email:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message || 'Impossible d\'envoyer l\'email',
          life: 5000
        });
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'submitted';
      case 'en_cours': return 'reviewing';
      case 'entretien': return 'interview';
      case 'acceptee': return 'accepted';
      case 'refusee': return 'rejected';
      default: return 'on-hold';
    }
  }

  getStatusIcon(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'pi pi-clock';
      case 'en_cours': return 'pi pi-eye';
      case 'entretien': return 'pi pi-users';
      case 'acceptee': return 'pi pi-check-circle';
      case 'refusee': return 'pi pi-times-circle';
      default: return 'pi pi-question-circle';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours d\'examen';
      case 'entretien': return 'Entretien programmé';
      case 'acceptee': return 'Candidature acceptée';
      case 'refusee': return 'Candidature refusée';
      default: return 'Statut inconnu';
    }
  }

  isStepCompleted(step: string, currentStatus: string): boolean {
    const statusOrder = ['en_attente', 'en_cours', 'entretien', 'acceptee', 'refusee'];
    const stepIndex = statusOrder.indexOf(step);
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex > stepIndex;
  }

  isStepCurrent(step: string, currentStatus: string): boolean {
    return step === currentStatus;
  }

  resetSearch(): void {
    this.searchCode = '';
    this.candidatureResult = null;
    this.searchPerformed = false;
  }

  contactSupport(): void {
    window.open('mailto:support@alertemploi.com?subject=Aide pour le suivi de candidature', '_blank');
  }

  printCandidature(): void {
    window.print();
  }

async downloadPDF(): Promise<void> {
  if (!this.candidatureResult) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Aucune candidature à exporter',
      life: 3000
    });
    return;
  }

  try {
    this.messageService.add({
      severity: 'info',
      summary: 'Génération PDF',
      detail: 'Création du document...',
      life: 5000
    });

    // Créer le PDF avec du texte natif pour une qualité maximale
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const leftMargin = 20;
    const rightMargin = 20;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    let yPosition = 20;

    // ===== EN-TÊTE =====
    // Logo ou titre principal
    pdf.setFontSize(24);
    pdf.setTextColor(17, 29, 157); // primary-blue
    pdf.setFont('helvetica', 'bold');
    pdf.text('Suivi de Candidature', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date de génération
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Généré le ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Ligne de séparation
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 15;

    // ===== INFORMATIONS DE L'OFFRE =====
    // Titre de l'offre avec badge de statut
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.candidatureResult.offreTitre || 'Poste non spécifié', leftMargin, yPosition);
    
    // Badge de statut (à droite)
    const statusText = this.getStatusLabel(this.candidatureResult.statut);
    const statusColor = this.getStatusColor(this.candidatureResult.statut);
    pdf.setFontSize(10);
    pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
    pdf.setFont('helvetica', 'bold');
    
    // Dessiner le badge
    const statusWidth = pdf.getTextWidth(statusText) + 10;
    const statusX = pageWidth - rightMargin - statusWidth;
    pdf.setFillColor(statusColor.bg.r, statusColor.bg.g, statusColor.bg.b);
    pdf.roundedRect(statusX, yPosition - 6, statusWidth, 8, 2, 2, 'F');
    pdf.text(statusText, statusX + statusWidth/2, yPosition - 1, { align: 'center' });
    yPosition += 10;

    // Informations du candidat
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${this.candidatureResult.fullName} • ${this.candidatureResult.email || 'Email non renseigné'}`, leftMargin, yPosition);
    yPosition += 15;

    // ===== TIMELINE =====
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Suivi de votre candidature', leftMargin, yPosition);
    yPosition += 10;

    // Étapes du processus
    const steps = [
      {
        title: 'Candidature envoyée',
        description: 'Votre dossier a été reçu avec succès',
        date: this.candidatureResult.created_at,
        status: this.getStepStatus('en_attente', this.candidatureResult.statut),
        icon: '✓'
      },
      {
        title: 'Examen du dossier',
        description: 'Nos recruteurs analysent votre profil',
        date: this.candidatureResult.dateExamen,
        status: this.getStepStatus('en_cours', this.candidatureResult.statut),
        icon: '⚬'
      },
      {
        title: 'Entretien',
        description: 'Rencontre avec l\'équipe de recrutement',
        date: this.candidatureResult.dateEntretien,
        status: this.getStepStatus('entretien', this.candidatureResult.statut),
        icon: '⚬'
      },
      {
        title: 'Décision finale',
        description: 'Résultat de votre candidature',
        date: this.candidatureResult.dateDecision,
        status: this.getStepStatus('acceptee', this.candidatureResult.statut),
        icon: this.candidatureResult.statut === 'acceptee' ? '✓' : '✗'
      }
    ];

    steps.forEach((step, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      // Dessiner le marqueur
      const markerX = leftMargin + 5;
      if (step.status === 'completed') {
        pdf.setFillColor(10, 108, 52); // success-green
        pdf.setTextColor(255, 255, 255);
      } else if (step.status === 'current') {
        pdf.setFillColor(17, 29, 157); // primary-blue
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setFillColor(226, 232, 240); // border-light
        pdf.setTextColor(148, 163, 184);
      }
      
      pdf.circle(markerX, yPosition, 3, 'F');
      pdf.setFontSize(8);
      pdf.text(step.icon, markerX, yPosition + 1, { align: 'center' });

      // Ligne de connexion (sauf pour le dernier)
      if (index < steps.length - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.5);
        pdf.line(markerX, yPosition + 3, markerX, yPosition + 20);
      }

      // Texte de l'étape
      const textX = leftMargin + 15;
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(step.title, textX, yPosition);
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(step.description, textX, yPosition + 5);
      
      if (step.date) {
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const formattedDate = new Date(step.date).toLocaleDateString('fr-FR');
        pdf.text(formattedDate, textX, yPosition + 10);
      }
      
      yPosition += 25;
    });

    yPosition += 10;

    // ===== DÉTAILS DE LA CANDIDATURE =====
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Détails de votre candidature', leftMargin, yPosition);
    yPosition += 10;

    // Créer un tableau de détails
    const details = [
      { label: 'Code de suivi', value: this.candidatureResult.code || this.searchCode },
      { label: 'Date de candidature', value: new Date(this.candidatureResult.created_at).toLocaleDateString('fr-FR') },
      { label: 'Nom complet', value: this.candidatureResult.fullName },
      { label: 'Téléphone', value: this.candidatureResult.telephone || 'Non renseigné' }
    ];

    // Dessiner le tableau
    pdf.setFontSize(10);
    const colWidth = contentWidth / 2;
    
    details.forEach((detail, index) => {
      const x = leftMargin + (index % 2) * colWidth;
      const y = yPosition + Math.floor(index / 2) * 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(detail.label, x, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(detail.value, x, y + 5);
    });

    yPosition += 35;

    // ===== LETTRE DE MOTIVATION =====
    if (this.candidatureResult.motivationText || this.candidatureResult.lm_dl) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lettre de motivation', leftMargin, yPosition);
      yPosition += 8;

      if (this.candidatureResult.lm_dl) {
        // Fichier joint
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 15, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(17, 29, 157);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📎 Lettre de motivation fournie en fichier', leftMargin + 5, yPosition + 2);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition + 2);
        yPosition += 20;
      } else if (this.candidatureResult.motivationText) {
        // Texte
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(this.candidatureResult.motivationText, contentWidth);
        pdf.text(lines, leftMargin, yPosition);
        yPosition += lines.length * 4 + 10;
      }
    }

    // ===== FICHIERS JOINTS =====
    if (this.candidatureResult.cv_dl || this.candidatureResult.lm_dl) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fichiers joints', leftMargin, yPosition);
      yPosition += 10;

      if (this.candidatureResult.cv_dl) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 12, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(10, 108, 52);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📄 CV', leftMargin + 5, yPosition);
        
        pdf.setTextColor(17, 29, 157);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition);
        yPosition += 15;
      }

      if (this.candidatureResult.lm_dl) {
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(leftMargin, yPosition - 5, contentWidth, 12, 2, 2, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(10, 108, 52);
        pdf.setFont('helvetica', 'normal');
        pdf.text('📄 Lettre de motivation', leftMargin + 5, yPosition);
        
        pdf.setTextColor(17, 29, 157);
        pdf.text('Télécharger', pageWidth - rightMargin - 25, yPosition);
        yPosition += 15;
      }
    }

    // ===== PIED DE PAGE SUR TOUTES LES PAGES =====
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Ligne de séparation
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(leftMargin, pageHeight - 20, pageWidth - rightMargin, pageHeight - 20);
      
      // Numéro de page
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Copyright
      pdf.setFontSize(8);
      pdf.text('© 2025 Alerte Emploi - Document confidentiel', pageWidth / 2, pageHeight - 7, { align: 'center' });
    }

    // Sauvegarder le PDF
    const fileName = this.candidatureResult.code 
      ? `candidature-${this.candidatureResult.code}.pdf`
      : `candidature-${new Date().getTime()}.pdf`;
    
    pdf.save(fileName);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF généré',
      detail: `Document ${fileName} téléchargé avec succès`,
      life: 3000
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de générer le PDF',
      life: 5000
    });
  }
}

// Méthodes helper pour le PDF
private getStatusColor(statut: string): any {
  switch (statut) {
    case 'en_attente':
      return { r: 55, g: 48, b: 163, bg: { r: 224, g: 231, b: 255 } };
    case 'en_cours':
      return { r: 146, g: 64, b: 14, bg: { r: 254, g: 243, b: 199 } };
    case 'acceptee':
      return { r: 22, g: 101, b: 52, bg: { r: 220, g: 252, b: 231 } };
    case 'refusee':
      return { r: 220, g: 38, b: 38, bg: { r: 254, g: 226, b: 226 } };
    default:
      return { r: 71, g: 85, b: 105, bg: { r: 241, g: 245, b: 249 } };
  }
}

private getStepStatus(step: string, currentStatus: string): string {
  const statusOrder = ['en_attente', 'en_cours', 'entretien', 'acceptee', 'refusee'];
  const stepIndex = statusOrder.indexOf(step);
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentIndex > stepIndex) return 'completed';
  if (currentIndex === stepIndex) return 'current';
  return 'pending';
}
}