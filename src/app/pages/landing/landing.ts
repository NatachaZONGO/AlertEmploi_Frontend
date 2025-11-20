import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TopbarWidget } from './components/topbarwidget.component';
import { Accueil } from './components/accueil';

import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { DividerModule } from 'primeng/divider';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { FormsModule, NgForm } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

// === Services + modèles ===
import { OffreService } from '../crud/offre/offre.service';
import { Offre, enrichOffreForUi } from '../crud/offre/offre.model';
import { Publiciteservice } from '../crud/publicite/publicite.service';
import { Publicite } from '../crud/publicite/publicite.model';
import { ConseilService } from '../crud/conseil/conseil.service';
import { Conseil } from '../crud/conseil/conseil.model';
import { CandidatureService } from '../crud/candidature/candidature.service';
import { User } from '../crud/user/user.model';
import { Pays } from '../crud/pays/pays.model';
import { PaysService } from '../crud/pays/pays.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendURL } from '../../Share/const';
import { OffreCreateDialogComponent } from "../crud/offre/offre-create-dialog.component";
import { AuthService } from '../auth/auth.service'; // ✅ AJOUTÉ
import { ProfileService } from '../crud/profil/profil.service'; // ✅ AJOUTÉ
import { FooterWidget } from './components/footerwidget';

type CountryOption = { label: string; value: string; flag?: string; code: string };

type Offer = {
  id: number;
  titre: string;
  entreprise: string;
  ville: string;
  type: string;
  resume: string;
  publie_le: Date;
};

type Ad = {
  id: number;
  titre: string;
  description?: string;
  image?: string;
  video?: string;
  lien?: string;
};

type Tip = {
  id: number;
  titre: string;
  extrait: string;
  categorie?: string;
  niveau?: string;
  publie_le?: Date | null;
};

type LMChoice = 'upload' | 'text' | 'none';

@Component({
  selector: 'app-landing',
  standalone: true,
  providers: [
    OffreService, MessageService, Publiciteservice, ConseilService,
    ConfirmationService, CandidatureService
  ],
  imports: [
    CommonModule, RouterModule, TopbarWidget, Accueil, ButtonModule, RippleModule,
    StyleClassModule, DividerModule, CarouselModule, TagModule, DialogModule,
    ConfirmDialog, ToastModule, FormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, RadioButtonModule, CheckboxModule,
    OffreCreateDialogComponent, FooterWidget
  ],
  templateUrl: './landing.html',
})
export class Landing implements OnInit {
  
  constructor(
    private router: Router,
    private offreApi: OffreService,
    private pubApi: Publiciteservice,
    private conseilApi: ConseilService,
    private candidatureApi: CandidatureService,
    private messages: MessageService,
    private paysApi: PaysService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private authService: AuthService, // ✅ AJOUTÉ
    private profileService: ProfileService // ✅ AJOUTÉ
  ) {
    console.log('🏗️ Landing component construit');
  }

  adsResponsive = [
    { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
    { breakpoint: '767px',  numVisible: 1, numScroll: 1 }
  ];

  detailsVisible = false;
  selectedOffre?: Offre;
  private offresById = new Map<number, Offre>();

  newOffreVisible = false;
  onPublishClicked(){ this.newOffreVisible = true; }
  onOffreSaved(){ this.loadOffres(); }
  onOfferCreated(_o: any) { this.loadOffres(); }

  pubDialogVisible = false;
  currentPub: any = null;
  // Vitrines
  recentOffers: Offer[] = [];
  featuredJobs: Offer[] = [];
  adsRow: Ad[] = [];
  adsCol2: Ad[] = [];
  adsCol4: Ad[] = [];
  tipsRow: Tip[] = [];

  // ====== POSTULER ======
  applyVisible = false;
  isAuth = false;
  userRole = '';
  isCandidat = false;
  candidatProfile: any = null; // ✅ AJOUTÉ
  currentUser?: User;

  paysOptions: CountryOption[] = [];
  paysLoading = false;

  niveauEtudeOptions = [
    { label: 'Sans diplôme', value: 'Sans diplôme' },
    { label: 'BEPC', value: 'BEPC' },
    { label: 'BAC', value: 'BAC' },
    { label: 'Licence', value: 'Licence' },
    { label: 'Master', value: 'Master' },
    { label: 'Doctorat', value: 'Doctorat' },
    { label: 'Autre', value: 'Autre' },
  ];

  conseilDialogVisible = false;
  loadingConseil = false;
  currentConseil: any | null = null;
  conseilHtml: SafeHtml | null = null;
  conseilSafeHtml: SafeHtml | null = null;

  apply: {
    nom: string; prenom: string; email: string; phone: string;
    pays: string | ''; experience: number | null;
    ville: string; sexe: string; niveau_etude: string;
    cvChoice: 'existing' | 'upload';
    motivation: string; reviewNow: boolean;
    disponibilite: string; disponibilite_autre: string;
    date_naissance: string;
    lmChoice: LMChoice;
  } = {
    nom:'', prenom:'', email:'', phone:'',
    pays:'', experience:0,
    ville:'', sexe:'', niveau_etude:'',
    cvChoice:'upload', motivation:'', reviewNow:true,
    disponibilite: 'immediate',
    disponibilite_autre: '',
    date_naissance: '',
    lmChoice: 'text'
  };

  cvFile: File | null = null;
  lmFile: File | null = null;
  today: string = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    console.log('🚀 Landing ngOnInit');
    this.initAuth(); // ✅ MODIFIÉ
    this.loadOffres();
    this.loadPublicites();
    this.loadConseils();
    this.loadPays();
  }

  /**
   * ✅ NOUVELLE VERSION : Utilise AuthService + ProfileService
   */
  private initAuth(): void {
    console.log('🔍 Initialisation auth (landing)');
    
    this.isAuth = this.authService.isAuthenticated();
    console.log('  - isAuth:', this.isAuth);
    
    if (!this.isAuth) {
      console.log('❌ Pas authentifié');
      return;
    }

    this.userRole = (this.authService.getCurrentUserRole() || '').toLowerCase().trim();
    this.isCandidat = this.userRole === 'candidat';
    
    console.log('  - userRole:', this.userRole);
    console.log('  - isCandidat:', this.isCandidat);

    // Charger le profil si candidat
    if (this.isCandidat) {
      console.log('📥 Chargement profil candidat (landing)...');
      this.profileService.getProfile().subscribe({
        next: (response) => {
          console.log('✅ Profil reçu (landing):', response);
          const profile = response?.data ?? response;
          this.candidatProfile = profile;
          
          // Compatibilité : aussi stocker dans currentUser
          if (profile.user) {
            this.currentUser = profile.user;
          }
          
          console.log('Profil stocké:', {
            hasUser: !!profile.user,
            hasCandidat: !!profile.candidat
          });
        },
        error: (err) => {
          console.error('❌ Erreur profil (landing):', err);
        }
      });
    }
  }

   openPubDialog(pub: any): void {
    this.currentPub = pub;
    this.pubDialogVisible = true;
    console.log('📢 Publicité ouverte:', pub);
  }

  /**
   * ✅ MÉTHODE SUPPRIMÉE : prefillFromUser()
   * Maintenant on pré-remplit directement dans postuler()
   */

  private loadOffres(): void {
    this.offreApi.getAdminOffres().subscribe({
      next: (rows: Offre[]) => {
        const enriched: Offre[] = (rows || []).map(enrichOffreForUi);
        this.offresById = new Map(enriched.filter(x => x?.id != null).map(x => [x.id!, x]));
        const published = enriched.filter(o => o.statut === 'publiee' && !o.isExpired);
        const featured = published.filter(o => this.isFeaturedOffre(o));
        const normal = published.filter(o => !this.isFeaturedOffre(o));

        const featuredSorted = [...featured].sort((a, b) => {
          const lvlA = Number((a as any).sponsored_level ?? 0);
          const lvlB = Number((b as any).sponsored_level ?? 0);
          if (lvlB !== lvlA) return lvlB - lvlA;
          const pa = new Date(a.date_publication as any).getTime() || 0;
          const pb = new Date(b.date_publication as any).getTime() || 0;
          return pb - pa;
        });

        const normalSorted = [...normal].sort((a, b) => {
          const pa = new Date(a.date_publication as any).getTime() || 0;
          const pb = new Date(b.date_publication as any).getTime() || 0;
          return pb - pa;
        });

        this.featuredJobs = featuredSorted.slice(0, 6).map(o => this.toOfferView(o));
        this.recentOffers = normalSorted.slice(0, 4).map(o => this.toOfferView(o));
      },
      error: () => {
        this.recentOffers = [];
        this.featuredJobs = [];
      }
    });
  }

  private loadPublicites(): void {
    this.pubApi.getPublicitesByStatus('active').subscribe({
      next: (rows: Publicite[]) => {
        const now = Date.now();
        const actives = (rows || []).filter(p => {
          const start = p.date_debut ? new Date(p.date_debut).getTime() : -Infinity;
          const end = p.date_fin ? new Date(p.date_fin).getTime() : Infinity;
          const statusOk = (p.statut || '').toLowerCase() === 'active';
          return statusOk && now >= start && now <= end;
        });

        this.adsRow = actives.map(p => ({
          id: p.id!, titre: p.titre || 'Publicité',
          description: p.description || '',
          image: p.image || undefined,
          video: p.video || undefined,
          lien: p.lien_externe || undefined
        }));
      },
      error: () => { this.adsRow = []; }
    });
  }

  private excerpt(html: string, max = 160): string {
    const txt = this.plain(html);
    return txt.length <= max ? txt : txt.slice(0, max - 1).trimEnd() + '…';
  }

  private loadConseils(): void {
    this.conseilApi.getConseils(1, 12).subscribe({
      next: (res) => {
        const list: Conseil[] = res.content || [];
        const publies = list.filter(c => (c.statut || '').toLowerCase() === 'publie');
        this.tipsRow = publies
          .map<Tip>(c => ({
            id: c.id!, titre: c.titre || 'Conseil',
            extrait: this.excerpt(c.contenu || '', 180),
            categorie: c.categorie || undefined,
            niveau: c.niveau || undefined,
            publie_le: c.date_publication ? new Date(c.date_publication as any) : null
          }))
          .sort((a,b)=> (b.publie_le?.getTime()||0) - (a.publie_le?.getTime()||0))
          .slice(0,6);
      },
      error: () => { this.tipsRow = []; }
    });
  }

  // Navigation
  goAllConseils() { this.router.navigate(['/conseils']); }
  goToJob(id: number) { this.router.navigate(['/offres', id]); }
  goAllJobs() { this.router.navigate(['/offres']); }
  goLogin() { 
    this.applyVisible = false;
    this.router.navigate(['/connexion'], { queryParams: { returnUrl: this.router.url } }); 
  }

  private plain(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\d+\.\s*/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  openOffreDetails(id: number) {
    const apiOffre = this.offresById.get(id);
    if (apiOffre) { 
      this.selectedOffre = apiOffre; 
      this.detailsVisible = true; 
    } else { 
      this.goToJob(id); 
    }
  }

  /**
   * ✅ MÉTHODE CORRIGÉE : Pré-remplissage complet comme offres-list
   */
  postuler(offre: Offre | number) {
    console.log('📝 === POSTULER (landing) ===');
    
    const o = typeof offre === 'number' ? this.offresById.get(offre) : offre;
    if (!o) return;
    
    this.selectedOffre = o;

    // Réinitialiser le formulaire
    this.apply = {
      nom: '', prenom: '', email: '', phone: '',
      pays: '', experience: 0,
      ville: '', sexe: '', niveau_etude: '',
      disponibilite: 'immediate',
      disponibilite_autre: '',
      date_naissance: '',
      cvChoice: this.isAuth ? 'existing' : 'upload',
      motivation: '',
      reviewNow: true,
      lmChoice: 'text',
    };

    this.cvFile = null;
    this.lmFile = null;

    // ✅ PRÉ-REMPLISSAGE si candidat connecté
    if (this.isAuth && this.isCandidat && this.candidatProfile) {
      console.log('🔄 PRÉ-REMPLISSAGE LANDING');
      
      const user = this.candidatProfile.user;
      const candidat = this.candidatProfile.candidat;
      
      console.log('Données:', { user, candidat });
      
      if (user) {
        this.apply.nom = user.nom || '';
        this.apply.prenom = user.prenom || '';
        this.apply.email = user.email || '';
        this.apply.phone = user.telephone || '';
        console.log('✅ User rempli');
      }
      
      if (candidat) {
        this.apply.ville = candidat.ville || '';
        this.apply.sexe = candidat.sexe || '';
        this.apply.niveau_etude = candidat.niveau_etude || '';
        this.apply.disponibilite = candidat.disponibilite || 'immediate';
        this.apply.experience = candidat.experience || 0;
        
        if (candidat.date_naissance) {
          try {
            this.apply.date_naissance = new Date(candidat.date_naissance).toISOString().slice(0, 10);
            console.log('✅ Date naissance:', this.apply.date_naissance);
          } catch (e) {
            console.warn('⚠️ Erreur date');
          }
        }
        
        if (candidat.pays_id) {
          this.apply.pays = candidat.pays_id;
        }
        
        if (candidat.cv) {
          this.apply.cvChoice = 'existing';
        }
        
        console.log('✅ Candidat rempli');
      }
      
      console.log('État final apply:', this.apply);
      
      this.messages.add({
        severity: 'success',
        summary: 'Pré-remplissage',
        detail: `Données chargées : ${this.apply.prenom} ${this.apply.nom}`,
        life: 3000
      });
    } else {
      console.log('ℹ️ Pas de pré-remplissage:', {
        isAuth: this.isAuth,
        isCandidat: this.isCandidat,
        hasProfile: !!this.candidatProfile
      });
    }

    this.applyVisible = true;
  }

  // ... Reste des méthodes identiques (onApplyFile, onApplyLmFile, submitApplication, loadPays, etc.)
  
  private readonly MAX_FILE_BYTES = 5 * 1024 * 1024;

  onApplyFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f && f.size > this.MAX_FILE_BYTES) {
      this.cvFile = null;
      input.value = '';
      this.messages.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'Le CV ne doit pas dépasser 5 Mo.'
      });
      return;
    }
    this.cvFile = f;
  }

  onApplyLmFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    if (f && f.size > this.MAX_FILE_BYTES) {
      this.lmFile = null;
      input.value = '';
      this.messages.add({
        severity: 'warn',
        summary: 'Fichier trop volumineux',
        detail: 'La lettre de motivation ne doit pas dépasser 5 Mo.'
      });
      return;
    }
    this.lmFile = f;
  }

  submitApplication(form: NgForm) {
    if (!form.valid || !this.selectedOffre) return;

    const fd = new FormData();
    fd.append('offre_id', String(this.selectedOffre.id));

    const lmChoice: LMChoice = this.apply.lmChoice;
    if (lmChoice === 'upload' && this.lmFile) {
      fd.append('lm_source', 'upload');
      fd.append('lettre_motivation_file', this.lmFile);
    } else if (lmChoice === 'text' && this.apply.motivation?.trim()) {
      fd.append('lm_source', 'text');
      fd.append('lettre_motivation', this.apply.motivation.trim());
    } else {
      fd.append('lm_source', 'none');
    }

    fd.append('cv_source', this.apply.cvChoice);
    if (this.apply.cvChoice === 'upload' && this.cvFile) {
      fd.append('cv', this.cvFile);
    }

    if (this.isAuth) {
      this.candidatureApi.create(fd).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Candidature envoyée' });
          this.applyVisible = false; 
          this.detailsVisible = false;
        },
        error: (e: any) => this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible')
        })
      });
    } else {
      fd.append('nom', this.apply.nom);
      fd.append('prenom', this.apply.prenom);
      fd.append('email', this.apply.email);

      if (this.apply.phone) fd.append('telephone', this.apply.phone);
      if (this.apply.pays) fd.append('pays_code', (this.apply.pays || '').slice(0, 2).toUpperCase());
      if (this.apply.experience != null) fd.append('experience', String(this.apply.experience));

      const dispo = this.apply.disponibilite === 'autre'
        ? (this.apply.disponibilite_autre?.trim() || 'autre')
        : (this.apply.disponibilite || 'immediate');
      fd.append('disponibilite', dispo);

      fd.append('ville', (this.apply.ville || '').trim());
      if (this.apply.sexe) fd.append('sexe', this.apply.sexe);
      if (this.apply.niveau_etude) fd.append('niveau_etude', this.apply.niveau_etude);
      if (this.apply.date_naissance) fd.append('date_naissance', this.apply.date_naissance);

      this.candidatureApi.createGuest(fd).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Candidature envoyée' });
          this.applyVisible = false; 
          this.detailsVisible = false;
        },
        error: (e: any) => this.messages.add({
          severity: 'error',
          summary: 'Erreur',
          detail: String(e?.error?.message ?? e?.message ?? 'Envoi impossible')
        })
      });
    }
  }

  private loadPays(): void {
    this.paysLoading = true;
    this.paysApi.getPays().subscribe({
      next: (res) => {
        const raw: any[] =
          (Array.isArray(res) && res) ||
          (Array.isArray((res as any)?.data) && (res as any).data) ||
          [];

        const mapFlag = (code?: string, fallback?: string) =>
          fallback || (code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : undefined);

        this.paysOptions = raw
          .map((p: Pays) => {
            const code = (p.code || '').toUpperCase();
            return {
              label: p.nom,
              value: code,
              code,
              flag: mapFlag(p.code, p.flagImage),
            } as CountryOption;
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => { this.paysOptions = []; },
      complete: () => (this.paysLoading = false),
    });
  }

  // ... Reste du code (conseils, markdown, etc.) identique
  openConseilDialog(t: any) {
    this.currentConseil = t;
    this.conseilDialogVisible = true;
    const htmlInline = t?.contenu_html ?? t?.html ?? null;
    if (htmlInline) {
      this.conseilSafeHtml = this.buildConseilHtml(String(htmlInline));
      return;
    }
    const mdInline = t?.contenu_markdown ?? t?.markdown ?? t?.contenu ?? t?.description ?? t?.texte ?? null;
    if (mdInline) {
      const html = this.markdownToHtml(String(mdInline));
      this.conseilSafeHtml = this.buildConseilHtml(html);
      return;
    }
    if (!t?.id) return;
    this.loadingConseil = true;
    this.http.get<any>(`${BackendURL}conseils/${t.id}`).subscribe({
      next: (res) => {
        const d = res?.data ?? res;
        this.currentConseil = { ...t, ...d };
        const raw = d?.contenu_html ?? d?.html ?? this.markdownToHtml(String(d?.contenu_markdown ?? d?.markdown ?? d?.contenu ?? d?.description ?? d?.texte ?? ''));
        this.conseilSafeHtml = this.buildConseilHtml(String(raw));
        this.loadingConseil = false;
      },
      error: () => {
        this.loadingConseil = false;
        this.messages.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le conseil.' });
        this.conseilDialogVisible = false;
      }
    });
  }

  goToConseil(id?: number) {
    if (!id) return;
    this.router.navigate(['/conseils', id]);
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';
    const esc = (s: string): string => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let s = esc(md);
    s = s.replace(/^(#{3})\s?(.+)$/gmi, '<h3>$2</h3>');
    s = s.replace(/^(#{2})\s?(.+)$/gmi, '<h2>$2</h2>');
    s = s.replace(/^(#{1})\s?(.+)$/gmi, '<h1>$2</h1>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/(\n|^)(\d+)\.\s+(.+)(?=(\n\d+\.|\n\n|$))/gms, (_m: string, pfx: string, _n: string, block: string): string => {
      const items = block.split(/\n\d+\.\s+/).map((it: string) => it.trim()).filter((x: string): x is string => Boolean(x));
      return `${pfx}<ol>${items.map((i: string) => `<li>${i}</li>`).join('')}</ol>`;
    });
    s = s.replace(/(\n|^)[\-\*]\s+(.+)(?=(\n[\-\*]\s+|\n\n|$))/gms, (_m: string, pfx: string, block: string): string => {
      const items = block.split(/\n[\-\*]\s+/).map((it: string) => it.trim()).filter((x: string): x is string => Boolean(x));
      return `${pfx}<ul>${items.map((i: string) => `<li>${i}</li>`).join('')}</ul>`;
    });
    s = s.split(/\n{2,}/).map((par: string) => par.trim().match(/^<h[1-3]|^<ul>|^<ol>/) ? par : `<p>${par}</p>`).join('\n');
    s = s.replace(/(?<!>)\n(?!<)/g, '<br/>');
    return s;
  }

  private decodeHtmlEntities(s: string): string {
    const ta = document.createElement('textarea');
    ta.innerHTML = s ?? '';
    return ta.value;
  }

  buildConseilHtml(raw: string): SafeHtml {
    let s = String(raw ?? '');
    s = this.decodeHtmlEntities(s).replace(/\u00A0/g, ' ').replace(/[ \t]{2,}/g, ' ');
    const hasListTags = /<(ol|ul)\b/i.test(s);
    s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m: string, inner: string) => {
      const converted = this.convertInlineList(inner);
      return converted;
    });
    if (!/<p\b/i.test(s) && !hasListTags && /\b1\.\s+/.test(s)) {
      s = this.convertInlineList(s);
    }
    if (!/<(p|ol|ul|li|h\d|br)\b/i.test(s)) {
      s = s.split(/\n{2,}/).map(p => `<p>${p.trim()}</p>`).join('');
    }
    return this.sanitizer.bypassSecurityTrustHtml(s);
  }

  private convertInlineList(block: string): string {
    const inner = block.trim();
    let idx = inner.search(/\b\d+\.\s+/);
    if (idx >= 0) {
      const intro = inner.slice(0, idx).trim();
      const listPart = inner.slice(idx);
      const items = listPart.split(/\b\d+\.\s+/).map(x => x.trim()).filter(Boolean);
      if (items.length >= 2) {
        const ol = `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
        return intro ? `<p>${intro}</p>${ol}` : ol;
      }
    }
    idx = inner.search(/(?:^|\s)(?:\-|\*|•)\s+/);
    if (idx >= 0) {
      const intro = inner.slice(0, idx).trim();
      const listPart = inner.slice(idx);
      const items = listPart.split(/(?:^|\s)(?:\-|\*|•)\s+/).map(x => x.trim()).filter(Boolean);
      if (items.length >= 2) {
        const ul = `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
        return intro ? `<p>${intro}</p>${ul}` : ul;
      }
    }
    return `<p>${inner}</p>`;
  } 

  private isFeaturedOffre(o: Offre): boolean {
    const lvl = Number((o as any).sponsored_level ?? 0);
    const until = (o as any).featured_until ? new Date((o as any).featured_until) : null;
    const future = until instanceof Date && !isNaN(until.getTime()) && until > new Date();
    return lvl > 0 || future;
  }

  private toOfferView(o: Offre): Offer {
    const pub = o.date_publication instanceof Date ? o.date_publication : new Date(o.date_publication as any);
    return {
      id: o.id!,
      titre: o.titre,
      entreprise: o.entreprise?.nom_entreprise ?? 'Entreprise',
      ville: o.localisation ?? '—',
      type: (o as any).type_contrat ?? '-',
      resume: this.plain(o.description || ''),
      publie_le: isNaN(pub.getTime()) ? new Date() : pub
    };
  }
}