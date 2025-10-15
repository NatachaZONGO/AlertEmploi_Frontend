import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Candidature } from './candidature.model';
import { CandidatureService } from './candidature.service';
import { CanSeeDirective } from '../../../Share/can_see/can_see.directive';
import { AuthService } from '../../auth/auth.service';

interface Column { 
  field: string; 
  header: string; 
}

@Component({
  selector: 'app-candidature',
  standalone: true,
  templateUrl: './candidature.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    // PrimeNG
    TableModule,
    ToolbarModule,
    ToastModule,
    ProgressBarModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    ConfirmDialogModule,
    InputIconModule,
    IconFieldModule,
    TextareaModule,
    CanSeeDirective
  ],
  providers: [MessageService, ConfirmationService]
})
export class CandidaturesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI
  loading = signal(false);
  @ViewChild('dt') dt!: Table;

  // Data
  candidatures = signal<any[]>([]);
  offresOptions: { label: string; value: number }[] = [];
  selectedOffreId: number | null = null;

  // User role
  userRole = '';
  isRecruteur = false;
  isCandidat = false;
  isAdmin = false;

  // Table columns
  cols: Column[] = [
    { field: 'fullName', header: 'Candidat' },
    { field: 'email', header: 'Email' },
    { field: 'telephone', header: 'Téléphone' },
    { field: 'offre', header: 'Offre' },
    { field: 'created_at', header: 'Soumise le' },
    { field: 'statut', header: 'Statut' }
  ];

  statutOptions = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'Acceptée', value: 'acceptee' },
    { label: 'Refusée', value: 'refusee' }
  ];

  // Dialogs
  detailDialog = false;
  current: any;
  modifyDialog = false;
  currentToModify?: any;
  nouveauStatut?: string;
  motifRefus = '';

  constructor(
    private candService: CandidatureService,
    private authService: AuthService,
    private message: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Détecter le rôle
    this.userRole = this.authService.getCurrentUserRole()?.toLowerCase() || '';
    this.isRecruteur = this.userRole === 'recruteur';
    this.isCandidat = this.userRole === 'candidat';
    this.isAdmin = this.userRole === 'administrateur' || this.userRole === 'admin';

    console.log('🔍 Rôle détecté:', {
      userRole: this.userRole,
      isRecruteur: this.isRecruteur,
      isCandidat: this.isCandidat,
      isAdmin: this.isAdmin
    });

    this.loadOffresAndData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CHARGEMENT ====================

  private loadOffresAndData(): void {
    this.loading.set(true);

    this.candService.getOffresLight()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (offres: any) => {
          const offresList = Array.isArray(offres) ? offres : (offres?.data || []);
          this.offresOptions = offresList.map((o: any) => ({ 
            label: o.titre, 
            value: o.id 
          }));
          this.loadCandidatures();
        },
        error: () => {
          this.loadCandidatures();
        }
      });
  }

  loadCandidatures(): void {
    this.loading.set(true);
    console.log('📡 Chargement candidatures...');

    const source$ = this.selectedOffreId
      ? this.candService.getByOffre(this.selectedOffreId)
      : this.candService.getCandidaturesByRole();

    source$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.set(false);
          console.log('🏁 Fin chargement');
        })
      )
      .subscribe({
        next: (rows: any[]) => {
          console.log('✅ Données reçues:', rows);
          console.log('📊 Nombre de candidatures:', rows.length);
          
          if (Array.isArray(rows)) {
            const mapped = this.mapForView(rows);
            this.candidatures.set(mapped);
            console.log('✅ Candidatures mappées:', mapped.length);
            console.log('📦 Première candidature:', mapped[0]);
          } else {
            console.error('❌ Les données ne sont pas un tableau');
            this.candidatures.set([]);
          }
        },
        error: (e) => {
          console.error('❌ Erreur loadCandidatures:', e);
          const msg =
            e?.status === 401 ? 'Non authentifié (merci de vous reconnecter)' :
            e?.status === 403 ? 'Accès refusé' :
            'Erreur lors du chargement des candidatures';
          this.toastError(msg);
          this.candidatures.set([]);
        }
      });
  }

  // ==================== MAPPING ====================

  /**
   * Transforme les données backend pour l'affichage
   * Le backend renvoie maintenant : candidat_nom, candidat_email, candidat_telephone, offre_titre, etc.
   */
  private mapForView(list: any[]): any[] {
    return list.map((c: any) => {
      console.log('🔄 Mapping candidature:', c.id);

      // Le backend renvoie déjà les bonnes propriétés
      const fullName = c.candidat_nom || c.fullName || '—';
      const email = c.candidat_email || c.email || '—';
      const telephone = c.candidat_telephone || c.telephone || '—';
      const offreTitre = c.offre_titre || c.offreTitre || '—';
      
      // URLs de téléchargement (déjà fournies par le backend)
      const cv_dl = c.cv_url || null;
      const lm_dl = c.lm_url || null;

      // Texte de la lettre de motivation
      const motivationText = c.lettre_motivation && !c.lettre_motivation.startsWith('[file]')
        ? c.lettre_motivation
        : '';

      // Date formatée
      const created_at = c.created_at 
        ? new Date(c.created_at).toLocaleDateString('fr-FR')
        : '—';

      return {
        ...c, // Garde toutes les propriétés originales
        fullName,
        email,
        telephone,
        offreTitre,
        created_at,
        motivationText,
        cv_dl,
        lm_dl
      };
    });
  }

  // ==================== FILTRES ====================

  onOffreChange(): void {
    this.loadCandidatures();
  }

  onGlobalFilter(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  // ==================== DÉTAILS ====================

  openDetail(c: any): void {
    console.log('👁️ Ouvrir détails:', c);
    this.current = c;
    this.detailDialog = true;
  }

  // ==================== TÉLÉCHARGEMENTS ====================

  openInNewTab(url?: string): void {
    if (!url) return;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null;
  }

  downloadCV(c: any): void {
    if (!c?.cv_dl) {
      return this.toastError('Aucun CV disponible');
    }
    console.log('📥 Téléchargement CV:', c.cv_dl);
    this.openInNewTab(c.cv_dl);
  }

  downloadLM(c: any): void {
    if (!c?.lm_dl) {
      return this.toastError('Aucune lettre (fichier) disponible');
    }
    console.log('📥 Téléchargement LM:', c.lm_dl);
    this.openInNewTab(c.lm_dl);
  }

  downloadWPForm(c: any): void {
    const esc = (s: any) =>
      (s ?? '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://alerte-emploi.example';

    const hasLmFile = !!c?.lm_dl;
    const lmBlock = hasLmFile
      ? `<div class="value">
           <a href="${c.lm_dl}" target="_blank" rel="noopener" class="file-link">
             Télécharger la lettre de motivation
           </a>
         </div>`
      : `<div class="value pre">${esc(c?.motivationText || '—')}</div>`;

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Candidature - ${esc(c?.fullName || 'Candidat')}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; background:#eceff3; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111827; }
  .wrap { max-width:800px; margin:32px auto; padding:0 16px; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:6px; padding:28px; }
  .row { margin-bottom:28px; }
  .label { font-weight:600; }
  .value { margin-top:10px; }
  .sep { height:1px; background:#e5e7eb; margin:22px 0; }
  a { color:#2563eb; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .email { color:#ea580c; }
  .muted { color:#6b7280; }
  .pre { white-space:pre-wrap; line-height:1.6; }
  .files ul { margin:8px 0 0 18px; padding:0; }
  .files li { margin:6px 0; }
  .file-link { color:#2563eb; }
  .footer { text-align:center; margin-top:18px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="row">
        <div class="label">Nom & Prénom(s)</div>
        <div class="value">${esc(c?.fullName || '—')}</div>
      </div>
      <div class="sep"></div>
      <div class="row">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${esc(c?.email || '')}" class="email">${esc(c?.email || '—')}</a></div>
      </div>
      <div class="sep"></div>
      <div class="row">
        <div class="label">Numéro de téléphone</div>
        <div class="value">${esc(c?.telephone || '—')}</div>
      </div>
      <div class="sep"></div>
      <div class="row">
        <div class="label">Offre</div>
        <div class="value">${esc(c?.offreTitre || '—')}</div>
      </div>
      <div class="sep"></div>
      <div class="row">
        <div class="label">Lettre de motivation</div>
        ${lmBlock}
      </div>
      <div class="sep"></div>
      <div class="row files">
        <div class="label">Fichiers</div>
        <ul>
          ${c?.cv_dl ? `<li><a href="${c.cv_dl}" target="_blank" rel="noopener" class="file-link">CV</a></li>` : ''}
          ${c?.lm_dl ? `<li><a href="${c.lm_dl}" target="_blank" rel="noopener" class="file-link">Lettre de motivation</a></li>` : ''}
          ${!c?.cv_dl && !c?.lm_dl ? '<li class="muted">Aucun fichier joint</li>' : ''}
        </ul>
      </div>
      <div class="sep"></div>
      <div class="footer muted">
        Envoyé depuis
        <a href="${origin}" target="_blank" rel="noopener">AlerteEmploi&Offres</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) win.opener = null;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ==================== EXPORTS ====================

  exportCSV(): void {
    this.dt?.exportCSV();
  }

  exportPDF(): void {
    const doc = new jsPDF();
    doc.text('Candidatures', 14, 10);

    const head = [['Candidat', 'Email', 'Téléphone', 'Offre', 'Soumise le', 'Statut']];
    const body = this.candidatures().map((c: any) => [
      c.fullName ?? '',
      c.email ?? '',
      c.telephone ?? '',
      c.offreTitre ?? '',
      c.created_at ?? '',
      c.statut ?? ''
    ]);

    autoTable(doc, { head, body, startY: 20 });
    doc.save('candidatures.pdf');
  }

  // ==================== ACTIONS ====================

  changerStatut(candidature: any, nouveauStatut: 'acceptee' | 'refusee'): void {
    if (!candidature.id) return;

    console.log(`🔄 Changement statut ${candidature.id} vers ${nouveauStatut}`);

    this.loading.set(true);
    this.candService.updateStatut(candidature.id, nouveauStatut)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.toastSuccess(`Candidature ${nouveauStatut === 'acceptee' ? 'acceptée' : 'refusée'}`);
          this.detailDialog = false;
          this.loadCandidatures();
        },
        error: () => this.toastError('Erreur lors de la mise à jour du statut')
      });
  }

  openModifyDialog(candidature: any): void {
    this.currentToModify = candidature;
    this.nouveauStatut = candidature.statut;
    this.motifRefus = '';
    this.modifyDialog = true;
  }

  confirmModifyStatut(): void {
    if (!this.currentToModify || !this.nouveauStatut) return;

    this.loading.set(true);
    this.candService.updateStatut(this.currentToModify.id, this.nouveauStatut, this.motifRefus)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.toastSuccess(`Statut modifié vers "${this.nouveauStatut}"`);
          this.modifyDialog = false;
          this.loadCandidatures();
        },
        error: () => this.toastError('Erreur lors de la modification du statut')
      });
  }

  deleteCandidature(candidature: any): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la candidature de ${candidature.fullName} ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.loading.set(true);
        this.candService.delete(candidature.id)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: () => {
              this.toastSuccess('Candidature supprimée');
              this.loadCandidatures();
            },
            error: () => this.toastError('Erreur lors de la suppression')
          });
      }
    });
  }

  // ==================== HELPERS ====================

  getSeverity(statut?: string): string {
    switch (statut?.toLowerCase()) {
      case 'acceptee':
        return 'success';
      case 'en_attente':
      case 'en attente':
        return 'warn';
      case 'refusee':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private toastError(detail: string): void {
    this.message.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail, 
      life: 5000 
    });
  }

  private toastSuccess(detail: string): void {
    this.message.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail, 
      life: 3000 
    });
  }
}