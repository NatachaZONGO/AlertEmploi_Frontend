import { TooltipModule } from 'primeng/tooltip';
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { Publiciteservice} from './publicite.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Publicite } from './publicite.model';
import { Entreprise } from '../entreprise/entreprise.model';
import { EntrepriseService } from '../entreprise/entreprise.service';
import { forkJoin, Observable, of } from 'rxjs';
import { EditorModule } from 'primeng/editor';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Tag, TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../auth/auth.service';
import { CanSeeDirective } from '../../../Share/can_see/can_see.directive';




interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}
interface PaymentMethod {
    label: string;
    value: string;
    icon: string;
    color?: string;
    description?: string;
}

interface PricingTier {
    duree: string;
    prix: number;
    label: string;
}

@Component({
    selector: 'app-publicite',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DropdownModule,
        CalendarModule,
        TableModule,
        EditorModule,
        RadioButtonModule,
        TooltipModule,
        InputIconModule,
        IconFieldModule,
        TagModule,
        DropdownModule,
        SelectModule, 
        CanSeeDirective
    ],
    templateUrl: './publicite.component.html',
    providers: [MessageService, Publiciteservice, ConfirmationService],
})
export class PubliciteComponent implements OnInit {

    userRole: string = '';
    isRecruteur: boolean = false;
    isAdmin: boolean = false;
    entrepriseRecruteur?: Entreprise;
    isCommunityManager: boolean = false;
    entrepriseCM?: Entreprise;

    activationDialog = false;
    publiciteDialog = false;
    detailsDialog = false;
    codeActivationDialog = false;
    publicites: Publicite[] = [];
    publicite: Publicite = { media_request: 'image', imageFile: null, videoFile: null };
    selectedPublicites: Publicite[] = [];
    submitted = false;
    entreprises: Entreprise[] = [];
    minDate = new Date();
    activationCode = '';

    mediaModes = [
        { label: 'Image', value: 'image' },
        { label: 'Vidéo', value: 'video' },
        { label: 'Image + Vidéo', value: 'both' },
    ];

    // Activation data
    selectedPubliciteForActivation?: Publicite;
    activationForm = {
        duree: '',
        date_debut: null as Date | null,
        moyen_paiement: '',
        prix_calcule: 0
    };

    selectedPubliciteForDetails?: Publicite;
    // Tarification (à adapter selon vos prix)
    pricingTiers: PricingTier[] = [];
    paymentMethods: PaymentMethod[] = [];

    // Code de paiement généré
    generatedPaymentCode = '';

    // Préviews
    previewImage?: string;
    previewVideo?: string;

    @ViewChild('dt') dt!: Table;

    cols!: Column[];
    exportColumns!: ExportColumn[];

    constructor(
        private publiciteService: Publiciteservice,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private entrepriseService: EntrepriseService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.detectUserRole();
        this.loadData();
        this.initColumns();
        this.loadPricingAndPaymentOptions();
        if (this.isCommunityManager) {
        this.subscribeToEntrepriseChanges();
    }
    }

    loadPricingAndPaymentOptions() {
        this.pricingTiers = this.publiciteService.getPricingTiers();
        this.paymentMethods = this.publiciteService.getPaymentMethods(); // ← Ici on récupère du service
    }

    private ymd(d: Date): string {
    // évite les décalages de fuseau (timezone-safe)
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
    }

    loadData() {
  // Récupérer le rôle et le nettoyer
  const rawRole = this.authService.getUserRole();
  const role = rawRole?.toLowerCase()?.trim();
  
  // Log pour déboguer
  console.log('🔍 Rôle de l\'utilisateur (publicités):', rawRole, '-> normalisé:', role);
  
  // ✅ Récupérer l'entreprise_id sélectionnée (pour CM)
  const entrepriseId = this.entrepriseService.getSelectedEntrepriseId();
  console.log('🏢 Entreprise sélectionnée:', entrepriseId);
  
  // ✅ Sélectionner le bon endpoint selon le rôle
  let publicites$: Observable<any[]>;
  
  if (role === 'recruteur' || role === 'community_manager') {
    // Recruteur ou CM : mes publicités (avec filtre entreprise pour CM)
    publicites$ = this.publiciteService.getMesPublicites(entrepriseId !== null ? entrepriseId : undefined);
    console.log('📡 Endpoint utilisé: mes-publicites' + (entrepriseId ? ` (entreprise ${entrepriseId})` : ''));
  } else if (role === 'administrateur' || role === 'admin') {
    // Admin : toutes les publicités
    publicites$ = this.publiciteService.getPublicites();
    console.log('📡 Endpoint utilisé: publicites (admin)');
  } else {
    // Rôle non reconnu
    console.warn('⚠️ Rôle non reconnu, aucune publicité chargée');
    publicites$ = of([]);
  }

  forkJoin({
    entreprises: this.entrepriseService.getEntreprises({ page: 1, per_page: 1000 }),
    publicites: publicites$
  }).subscribe({
    next: ({ entreprises, publicites }) => {
      console.log('📦 Entreprises récupérées:', entreprises?.data?.data?.length || 0);
      console.log('📦 Publicités récupérées:', publicites?.length || 0);
      console.log('✅ Données publicités:', publicites);
      
      this.entreprises = entreprises?.data?.data ?? [];
      this.publicites = publicites.map(p => ({
        ...p,
        // Normaliser les URLs utilisables dans l'UI
        image: p.image_url || p.image || '',
        video: p.video_url || p.video || '',
      }));
      
      console.log('🎯 Publicités finales affichées:', this.publicites.length);
      
      // ✅ Message informatif pour le CM
      if (role === 'community_manager' && entrepriseId) {
        const entrepriseNom = this.entreprises.find(e => e.id === entrepriseId)?.nom_entreprise;
        if (entrepriseNom) {
          this.messageService.add({
            severity: 'info',
            summary: 'Entreprise sélectionnée',
            detail: `Affichage des publicités de : ${entrepriseNom}`,
            life: 3000
          });
        }
      }
    },
    error: (err) => {
      console.error('❌ Erreur lors du chargement des données:', err);
      console.error('Détails de l\'erreur:', {
        status: err.status,
        message: err.message,
        error: err.error
      });
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors du chargement des données'
      });
    }
  });
}

   initColumns() {
    this.cols = [
      { field: 'titre', header: 'Titre' },
      { field: 'entreprise.nom_entreprise', header: 'Entreprise' },
      { field: 'lien_externe', header: 'Lien' },
      { field: 'date_debut', header: 'Date de début' },
      { field: 'date_fin', header: 'Date de fin' },
      { field: 'statut', header: 'Statut' }
    ];
    this.exportColumns = this.cols.map(col => ({ title: col.header, dataKey: col.field }));
  }

    // === GESTION DES PUBLICITÉS (création/édition) ===
    
  openNew() {
    this.publicite = { 
        media_request: 'image',
        type: 'banniere',
        imageFile: null, 
        videoFile: null,
        entreprise_id: undefined,
        titre: '', // ✅ AJOUTÉ
        description: '', // ✅ AJOUTÉ
        lien_externe: '' // ✅ AJOUTÉ
    };

    // ✅ AUTO-REMPLISSAGE pour recruteur
    if (this.isRecruteur && this.entrepriseRecruteur) {
        this.publicite.entreprise_id = this.entrepriseRecruteur.id;
        this.publicite.entreprise = this.entrepriseRecruteur.id;
        console.log('✅ Entreprise recruteur pré-remplie:', this.entrepriseRecruteur.nom_entreprise);
    }
    
    // ✅ AUTO-REMPLISSAGE pour CM
    if (this.isCommunityManager && this.entrepriseCM) {
        this.publicite.entreprise_id = this.entrepriseCM.id;
        this.publicite.entreprise = this.entrepriseCM.id;
        console.log('✅ Entreprise CM pré-remplie:', this.entrepriseCM.nom_entreprise);
    }
    
    // ✅ Si ni recruteur ni CM avec entreprise : avertir
    if (!this.publicite.entreprise_id) {
        console.warn('⚠️ Aucune entreprise pré-remplie');
    }

    this.previewImage = undefined;
    this.previewVideo = undefined;
    this.submitted = false;
    this.publiciteDialog = true;
    
    // ✅ AJOUTÉ : Log pour vérifier l'état initial
    console.log('🆕 Dialog ouvert, publicite initiale:', this.publicite);
}

    private requireCreationFields(): string | null {
    const p = this.publicite;
    
    if (!p.titre) return 'Le titre est requis.';
    
    // ✅ Vérification entreprise avec fallback pour CM
    if (!p.entreprise_id) {
        // Fallback recruteur
        if (this.isRecruteur && this.entrepriseRecruteur) {
            p.entreprise_id = this.entrepriseRecruteur.id;
            console.log('✅ Entreprise recruteur assignée automatiquement');
        }
        // Fallback CM
        else if (this.isCommunityManager && this.entrepriseCM) {
            p.entreprise_id = this.entrepriseCM.id;
            console.log('✅ Entreprise CM assignée automatiquement');
        }
        // Sinon : erreur
        else {
            return "L'entreprise est requise. Veuillez d'abord sélectionner une entreprise à gérer.";
        }
    }
    
    if (!p.media_request) return 'Le type de média est requis.';
    
    // ❌ ENLEVER CES LIGNES (duree et date_debut sont maintenant optionnels)
    // if (!p.duree) return 'La durée est requise.';
    // if (!p.date_debut) return 'La date de début est requise.';

    const mr = p.media_request;
    if ((mr === 'image' || mr === 'both') && !(p.image || p.imageFile)) {
        return 'Une image est requise.';
    }
    if ((mr === 'video' || mr === 'both') && !(p.video || p.videoFile)) {
        return 'Une vidéo est requise.';
    }
    
    return null;
}


    editPublicite(pub: Publicite) {
        // Vérifier que le recruteur édite bien SA publicité
        if (this.isRecruteur && this.entrepriseRecruteur) {
            if (pub.entreprise_id !== this.entrepriseRecruteur.id) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Accès refusé',
                    detail: 'Vous ne pouvez modifier que les publicités de votre entreprise'
                });
                return;
            }
        }

        this.publicite = { ...pub, imageFile: null, videoFile: null };
        
        if (pub.entreprise && pub.entreprise.id) {
            this.publicite.entreprise_id = pub.entreprise.id;
            this.publicite.entreprise = pub.entreprise.id;
        } else if (pub.entreprise_id) {
            this.publicite.entreprise_id = pub.entreprise_id;
            this.publicite.entreprise = pub.entreprise_id;
        }
        
        this.previewImage = undefined;
        this.previewVideo = undefined;
        this.publiciteDialog = true;
    }

    onImageSelected(evt: Event) {
        const file = (evt.target as HTMLInputElement).files?.[0];
        if (file) {
            this.publicite.imageFile = file;
            this.publicite.image = undefined;
            this.previewImage = URL.createObjectURL(file);
        }
        else {
            // rien sélectionné -> nettoyer
            this.publicite.imageFile = null;
            this.previewImage = undefined;
        }
    }

    onVideoSelected(evt: Event) {
        const file = (evt.target as HTMLInputElement).files?.[0];
        if (file) {
            this.publicite.videoFile = file;
            this.publicite.video = undefined;
            this.previewVideo = URL.createObjectURL(file);
        }
        else {
            // rien sélectionné -> nettoyer
            this.publicite.videoFile = null;
            this.previewVideo = undefined;
        }
    }

    onMediaModeChange() {
        // Plus besoin de dual_unlock_code à la création
        // Ce sera géré lors de l'activation
    }


   deleteSelectedPublicites() {
        this.confirmationService.confirm({
            message: 'Êtes-vous sûr de vouloir supprimer les publicités sélectionnées ?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const toDelete = this.selectedPublicites.filter(p => p.id).map(p => this.publiciteService.deletePublicite(p.id!));
                forkJoin(toDelete).subscribe({
                    next: () => {
                        this.publicites = this.publicites.filter(v => !this.selectedPublicites.includes(v));
                        this.selectedPublicites = [];
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Publicités supprimées', life: 3000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue', life: 3000 })
                });
            }
        });
    }

    deletePublicite(publicite: Publicite) {
        this.confirmationService.confirm({
            message: `Supprimer la publicité "${publicite.titre}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (publicite.id) {
                    this.publiciteService.deletePublicite(publicite.id).subscribe({
                        next: () => {
                            this.publicites = this.publicites.filter(v => v.id !== publicite.id);
                            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Publicité supprimée', life: 3000 });
                        },
                        error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression', life: 3000 })
                    });
                }
            }
        });
    }

  private validateForm(): string | null {
    const p = this.publicite;

    if (!p.titre) return 'Le titre est obligatoire.';
    if (!p.lien_externe) return 'Le lien externe est obligatoire.';
    if (!p.date_debut) return 'La date de début est obligatoire.';

    // media obligatoires selon le mode
    if (p.media_request === 'image' || p.media_request === 'both') {
      if (!p.imageFile && !p.image) return "Une image (fichier ou URL) est obligatoire.";
    }
    if (p.media_request === 'video' || p.media_request === 'both') {
      if (!p.videoFile && !p.video) return "Une vidéo (fichier ou URL) est obligatoire.";
    }
    if (p.media_request === 'both' && !p.dual_unlock_code) {
      return "Le code de double média est obligatoire.";
    }

    return null;
  }

savePublicite() {
  this.submitted = true;

  // ✅ AJOUTÉ : Logs de débogage
  console.log('=== SAUVEGARDE PUBLICITE ===');
  console.log('📦 Données this.publicite:', this.publicite);
  console.log('  - titre:', this.publicite.titre);
  console.log('  - media_request:', this.publicite.media_request);
  console.log('  - entreprise_id:', this.publicite.entreprise_id);
  console.log('  - type:', this.publicite.type);
  console.log('  - lien_externe:', this.publicite.lien_externe);
  console.log('  - imageFile:', this.publicite.imageFile);
  console.log('  - videoFile:', this.publicite.videoFile);
  console.log('  - image (URL):', this.publicite.image);
  console.log('  - video (URL):', this.publicite.video);

  const error = this.requireCreationFields();
  if (error) {
    console.error('❌ Validation échouée:', error);
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: error });
    return;
  }

  const useMultipart = !!(this.publicite.imageFile || this.publicite.videoFile);
  console.log('📤 Mode d\'envoi:', useMultipart ? 'FormData (multipart)' : 'JSON');
  
  let payload: any | FormData;

  if (useMultipart) {
    const fd = new FormData();
    fd.append('titre', this.publicite.titre!);
    fd.append('description', this.publicite.description ?? '');
    if (this.publicite.lien_externe) fd.append('lien_externe', this.publicite.lien_externe);
    fd.append('type', this.publicite.type ?? 'banniere');
    fd.append('media_request', this.publicite.media_request!);
    fd.append('entreprise_id', String(this.publicite.entreprise_id));
    
    // ✅ duree et date_debut sont maintenant optionnels
    if (this.publicite.duree) fd.append('duree', String(this.publicite.duree));
    if (this.publicite.date_debut) {
      const ymd = this.publicite.date_debut instanceof Date
        ? this.publicite.date_debut.toISOString().slice(0,10)
        : (this.publicite.date_debut as string);
      fd.append('date_debut', ymd);
    }

    if (this.publicite.imageFile) fd.append('image', this.publicite.imageFile);
    else if (this.publicite.image) fd.append('image', this.publicite.image);
    if (this.publicite.videoFile) fd.append('video', this.publicite.videoFile);
    else if (this.publicite.video) fd.append('video', this.publicite.video);

    payload = fd;
    
    // ✅ AJOUTÉ : Log FormData
    console.log('📦 FormData créé (contenu):');
    fd.forEach((value, key) => {
      console.log(`  - ${key}:`, value);
    });
  } else {
    payload = {
      titre: this.publicite.titre,
      description: this.publicite.description ?? '',
      lien_externe: this.publicite.lien_externe ?? null,
      type: this.publicite.type ?? 'banniere',
      media_request: this.publicite.media_request,
      entreprise_id: this.publicite.entreprise_id,
      ...(this.publicite.duree ? { duree: this.publicite.duree } : {}),
      ...(this.publicite.date_debut ? { 
        date_debut: this.publicite.date_debut instanceof Date
          ? this.publicite.date_debut.toISOString().slice(0,10)
          : this.publicite.date_debut 
      } : {}),
      ...(this.publicite.image ? { image: this.publicite.image } : {}),
      ...(this.publicite.video ? { video: this.publicite.video } : {}),
    };
    
    console.log('📦 Payload JSON:', payload);
  }

  const req = this.publicite.id
    ? this.publiciteService.updatePublicite(this.publicite.id!, payload)
    : this.publiciteService.createPublicite(payload);

  console.log('📡 Envoi de la requête...');

  req.subscribe({
    next: (response) => {
      console.log('✅ Réponse reçue:', response);
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: this.publicite.id ? 'Publicité modifiée' : 'Publicité créée'
      });
      this.loadData();
      this.publiciteDialog = false;
      this.publicite = { media_request: 'image' };
    },
    error: (err: HttpErrorResponse) => {
      console.error('❌ Erreur serveur:', err);
      console.error('Détails:', err.error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: err?.error?.message || 'Opération échouée'
      });
    }
  });
}
    // === SYSTÈME D'ACTIVATION ===
    // Dialog de saisie du code d'activation
    
    openActivationDialog(publicite: Publicite) {
        this.selectedPubliciteForActivation = publicite;
        this.activationForm = {
            duree: '',
            date_debut: null,
            moyen_paiement: '',
            prix_calcule: 0
        };
        this.generatedPaymentCode = '';
        this.activationDialog = true;
    }

    onDurationChange() {
        const selectedTier = this.pricingTiers.find(t => t.duree === this.activationForm.duree);
        this.activationForm.prix_calcule = selectedTier ? selectedTier.prix : 0;
        this.updatePaymentCode();
    }

    onPaymentMethodChange() {
        this.updatePaymentCode();
    }

    updatePaymentCode() {
        if (this.activationForm.moyen_paiement && this.activationForm.prix_calcule > 0) {
            this.generatedPaymentCode = this.publiciteService.generatePaymentCode(
                this.activationForm.moyen_paiement,
                this.activationForm.prix_calcule
            );
        }
    }


    validateActivation() {
        if (!this.activationForm.duree || !this.activationForm.date_debut || !this.activationForm.moyen_paiement) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Erreur', 
                detail: 'Veuillez remplir tous les champs requis.' 
            });
            return;
        }

        // Simuler l'envoi de la demande d'activation
        const activationData = {
            publicite_id: this.selectedPubliciteForActivation!.id,
            duree: this.activationForm.duree,
            date_debut: this.activationForm.date_debut,
            moyen_paiement: this.activationForm.moyen_paiement,
            montant: this.activationForm.prix_calcule,
            code_paiement: this.generatedPaymentCode
        };

        // TODO: Remplacer par un vrai service d'activation
        console.log('Données d\'activation:', activationData);
        
        this.messageService.add({ 
            severity: 'info', 
            summary: 'Demande envoyée', 
            detail: `Effectuez le paiement avec le code fourni. Vous recevrez le code d'activation par SMS après validation.`,
            life: 8000
        });

        // Fermer le dialog d'activation et ouvrir celui du code
        this.activationDialog = false;
        
        // Simuler l'attente du paiement puis ouverture du dialog de code
        setTimeout(() => {
            this.openCodeActivationDialog();
        }, 2000);
    }

    // Copier le code de paiement dans le presse-papiers
    copyPaymentCode() {
        if (navigator.clipboard && this.generatedPaymentCode) {
            navigator.clipboard.writeText(this.generatedPaymentCode).then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Code copié',
                    detail: 'Le code de paiement a été copié dans le presse-papiers',
                    life: 3000
                });
            }).catch(() => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Impossible de copier',
                    detail: 'Veuillez copier le code manuellement',
                    life: 3000
                });
            });
        }
    }

    // Ouvrir le dialog de saisie du code d'activation
    openCodeActivationDialog() {
        this.activationCode = '';
        this.codeActivationDialog = true;
    }

    // Finaliser l'activation avec le code reçu par SMS
    finalizeActivation() {
        if (!this.activationCode || this.activationCode.length < 6) {
            this.messageService.add({
            severity: 'error',
            summary: 'Code invalide',
            detail: 'Veuillez saisir un code d\'activation valide'
            });
            return;
        }

        if (!this.selectedPubliciteForActivation) {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Aucune publicité sélectionnée' });
            return;
        }
        if (!this.activationForm.duree || !this.activationForm.date_debut) {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Durée et date sont requises' });
            return;
        }

        const id = this.selectedPubliciteForActivation.id!;
        // ➜ APPEL DU NOUVEL ENDPOINT DÉDIÉ (pas updatePublicite)
        this.publiciteService
            .activatePubliciteV2(id, String(this.activationForm.duree), this.activationForm.date_debut)
            .subscribe({
            next: () => {
                this.messageService.add({
                severity: 'success',
                summary: 'Publicité activée',
                detail: 'La publicité est maintenant active'
                });
                this.loadData();
                this.hideCodeActivationDialog();
            },
            error: (err) => {
                this.messageService.add({
                severity: 'error',
                summary: 'Activation échouée',
                detail: err?.error?.message || 'Vérifiez le paiement et les dates'
                });
            }
        });
}



    private isPubliciteValid(): boolean {
        return !!(
            this.publicite.titre?.trim() && 
            this.publicite.image?.trim() && 
            this.publicite.lien_externe?.trim() && 
            this.publicite.date_debut && 
            this.publicite.date_fin && 
            this.publicite.description?.trim() && 
            this.publicite.entreprise?.id
        );
    }

   hideDialog() {
        this.publiciteDialog = false;
        this.submitted = false;
    }

    hideActivationDialog() {
        this.activationDialog = false;
        this.selectedPubliciteForActivation = undefined;
    }

    hideCodeActivationDialog() {
        this.codeActivationDialog = false;
        this.activationCode = '';
        this.selectedPubliciteForActivation = undefined;
    }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  // Méthodes utilitaires pour l'affichage
    getStatusColor(statut?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (statut) {
      case 'active': return 'success';
      case 'en_attente': return 'warn';
      case 'brouillon': return 'secondary';
      case 'rejetee': return 'danger';
      case 'expiree': return 'contrast';
      default: return 'secondary';
    }
  }

    canActivate(publicite: Publicite): boolean {
        return publicite.statut === 'brouillon' || publicite.statut === 'en_attente';
    }

        // Ouvrir les détails
    viewPubliciteDetails(publicite: Publicite) {
    this.selectedPubliciteForDetails = { ...publicite };
    this.detailsDialog = true;
    }

    // Fermer les détails
    hideDetailsDialog() {
    this.detailsDialog = false;
    this.selectedPubliciteForDetails = undefined;
    }

   private detectUserRole(): void {
    const rawRole = this.authService.getUserRole();
    this.userRole = rawRole?.toLowerCase()?.trim() || '';
    this.isRecruteur = this.userRole === 'recruteur';
    this.isAdmin = this.userRole === 'administrateur' || this.userRole === 'admin';
    this.isCommunityManager = this.userRole === 'community_manager'; // ✅ AJOUTÉ
    
    console.log('🔍 Rôle détecté:', this.userRole, {
        isRecruteur: this.isRecruteur,
        isAdmin: this.isAdmin,
        isCommunityManager: this.isCommunityManager // ✅ AJOUTÉ
    });

    // Si recruteur, charger son entreprise
    if (this.isRecruteur) {
        this.loadEntrepriseRecruteur();
    }
    
    // ✅ AJOUTÉ : Si CM, charger l'entreprise sélectionnée
    if (this.isCommunityManager) {
        this.loadEntrepriseCM();
    }
}

    private loadEntrepriseRecruteur(): void {
        const userId = this.authService.getCurrentUserId();
        
        if (!userId) {
            console.warn('⚠️ Impossible de récupérer l\'ID utilisateur');
            return;
        }

        // Récupérer toutes les entreprises et filtrer celle du recruteur
        this.entrepriseService.getEntreprises({ page: 1, per_page: 1000 }).subscribe({
            next: (response) => {
                const entreprises = response?.data?.data ?? [];
                
                // Trouver l'entreprise dont le user_id correspond
                this.entrepriseRecruteur = entreprises.find(
                    (e: Entreprise) => e.user_id === userId
                );
                
                if (this.entrepriseRecruteur) {
                    console.log('✅ Entreprise du recruteur chargée:', this.entrepriseRecruteur.nom_entreprise);
                } else {
                    console.warn('⚠️ Aucune entreprise trouvée pour ce recruteur');
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Attention',
                        detail: 'Aucune entreprise associée à votre compte. Veuillez contacter l\'administrateur.',
                        life: 8000
                    });
                }
            },
            error: (err) => {
                console.error('❌ Erreur chargement entreprise recruteur:', err);
            }
        });
    }
    
    private loadEntrepriseCM(): void {
    // Récupérer l'entreprise depuis le service (via Observable ou valeur actuelle)
    const entrepriseId = this.entrepriseService.getSelectedEntrepriseId();
    
    console.log('🏢 Entreprise CM (ID):', entrepriseId);
    
    if (!entrepriseId) {
        console.warn('⚠️ Aucune entreprise sélectionnée pour le CM');
        this.messageService.add({
            severity: 'warn',
            summary: 'Aucune entreprise sélectionnée',
            detail: 'Veuillez d\'abord sélectionner une entreprise depuis la page "Entreprises"',
            life: 8000
        });
        return;
    }
    
    // ✅ Récupérer l'objet entreprise complet
    const entreprisesFull = this.entrepriseService.getEntreprisesFromMemory();
    this.entrepriseCM = entreprisesFull.find(e => e.id === entrepriseId);
    
    if (this.entrepriseCM) {
        console.log('✅ Entreprise CM chargée:', this.entrepriseCM.nom_entreprise);
    } else {
        // Fallback : charger depuis l'API
        this.entrepriseService.getEntreprise(entrepriseId).subscribe({
            next: (response) => {
                this.entrepriseCM = response.data;
                console.log('✅ Entreprise CM chargée (API):', this.entrepriseCM?.nom_entreprise);
            },
            error: (err) => {
                console.error('❌ Erreur chargement entreprise CM:', err);
            }
        });
    }
}

private subscribeToEntrepriseChanges(): void {
    this.entrepriseService.selectedEntreprise$.subscribe({
        next: (entreprise) => {
            if (entreprise) {
                console.log('🔄 Changement d\'entreprise détecté:', entreprise.nom_entreprise);
                this.entrepriseCM = entreprise;
                
                // Recharger les publicités
                this.loadData();
            }
        },
        error: (err) => {
            console.error('❌ Erreur subscription entreprise:', err);
        }
    });
}
}