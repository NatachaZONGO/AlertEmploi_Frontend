// register.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../auth.service';
import { CompteType } from './user.model';
import { BackendURL } from '../../../Share/const';

interface Cat { id: number; nom: string; }
interface Pays { id: number; nom: string; }

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    CalendarModule,
    RadioButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  formulaireInscription!: FormGroup;
  isSubmitting = signal(false);

  // Type de compte
  typeOptions = [
    { label: 'Candidat', value: 'candidat' },
    { label: 'Recruteur', value: 'recruteur' }
  ];

  // Dropdowns dynamiques
  categories: Cat[] = [];
  paysList: Pays[] = [];

  // Options niveau d’étude
  niveauEtudeOptions = [
    { label: 'Sans diplôme', value: 'Sans diplôme' },
    { label: 'BEPC',         value: 'BEPC' },
    { label: 'BAC',          value: 'BAC' },
    { label: 'Licence',      value: 'Licence' },
    { label: 'Master',       value: 'Master' },
    { label: 'Doctorat',     value: 'Doctorat' },
    { label: 'Autre',        value: 'Autre' },
  ];

  disponibiliteOptions = [
  { label: 'Immédiate',       value: 'immediate' },
  { label: 'Sous 1 semaine',  value: 'sous_1_semaine' },
  { label: 'Sous 2 semaines', value: 'sous_2_semaines' },
  { label: 'Sous 1 mois',     value: 'sous_1_mois' },
  { label: 'Autre',           value: 'autre' },
];

  // Secteurs d’activité
  secteursActivite = [
    { label: 'Primaire',     value: 'primaire' },
    { label: 'Secondaire',   value: 'secondaire' },
    { label: 'Tertiaire',    value: 'tertiaire' },
    { label: 'Quaternaire',  value: 'quaternaire' }
  ];

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private messages: MessageService
  ) {}

  ngOnInit(): void {
    this.formulaireInscription = this.fb.group(
      {
        type: ['candidat' as CompteType, [Validators.required]],

        // commun
        nom: ['', Validators.required],
        prenom: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],

        // candidat
        sexe: ['Homme'],
        date_naissance: [null],
        categorie_id: [null],          // <- value = id (dropdown)
        ville: [''],
        niveau_etude: [null],          // <- value = string (dropdown)
        disponibilite: ['immediate'],  // <- value = string (radios)
        disponibilite_autre: [''],
        pays_id: [null],               // <- value = id (dropdown)

        // recruteur
        nom_entreprise: [''],
        secteur_activite: [null],      // <- value = string (dropdown)
        pays_id_recruteur: [null],     // <- value = id (dropdown)
        description: [''],
        site_web: ['']
      },
      { validators: this.passwordsMatchValidator }
    );

    

    // Ajuste validators selon type
    this.formulaireInscription.get('type')!.valueChanges.subscribe((t: CompteType) => {
      this.toggleValidators(t);
    });
    this.toggleValidators(this.formulaireInscription.value.type);

    // Charger listes
    this.loadCategories();
    this.loadPays();
  }

  // --- Chargements ---
  private loadCategories(): void {
    // adapte l’URL si différent: `${BackendURL}categories`
    this.http.get<{success?: boolean; data?: Cat[]; }>(`${BackendURL}categories`)
      .subscribe({
        next: (res) => {
          const list = (res?.data ?? []) as Cat[];
          this.categories = Array.isArray(list) ? list : [];
        },
        error: () => { this.categories = []; }
      });
  }

  private loadPays(): void {
    // adapte l’URL si différent: `${BackendURL}pays`
    this.http.get<{success?: boolean; data?: Pays[]; }>(`${BackendURL}pays`)
      .subscribe({
        next: (res) => {
          const list = (res?.data ?? []) as Pays[];
          this.paysList = Array.isArray(list) ? list : [];
        },
        error: () => { this.paysList = []; }
      });
  }

  // --- Validators dynamiques ---
  private toggleValidators(t: CompteType) {
    const setReq = (c: AbstractControl | null, req: boolean) => {
      if (!c) return;
      c.clearValidators();
      if (req) c.addValidators(Validators.required);
      c.updateValueAndValidity({ emitEvent: false });
    };

    // CANDIDAT requis
    const candRequired = t === 'candidat';
    setReq(this.formulaireInscription.get('sexe'), candRequired);
    setReq(this.formulaireInscription.get('date_naissance'), candRequired);
    setReq(this.formulaireInscription.get('categorie_id'), candRequired);
    setReq(this.formulaireInscription.get('ville'), candRequired);
    setReq(this.formulaireInscription.get('niveau_etude'), candRequired);
    setReq(this.formulaireInscription.get('disponibilite'), candRequired);
    setReq(this.formulaireInscription.get('pays_id'), candRequired);

    // Si “autre” => le champ “disponibilite_autre” devient requis
    const dispo = this.formulaireInscription.get('disponibilite')?.value;
    setReq(this.formulaireInscription.get('disponibilite_autre'), candRequired && dispo === 'autre');

    // RECRUTEUR requis
    const recRequired = t === 'recruteur';
    setReq(this.formulaireInscription.get('nom_entreprise'), recRequired);
    setReq(this.formulaireInscription.get('secteur_activite'), recRequired);
    setReq(this.formulaireInscription.get('pays_id_recruteur'), recRequired);
  }

  private passwordsMatchValidator(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p && c && p === c ? null : { mismatch: true };
  }

  // --- Soumission ---
  async register(): Promise<void> {
    if (this.formulaireInscription.invalid) {
      this.formulaireInscription.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const v = this.formulaireInscription.value;
    try {
      if (v.type === 'candidat') {
        const dateStr = this.asISODate(v.date_naissance);
        if (!dateStr) {
          this.messages.add({
            severity: 'warn',
            summary: 'Date manquante',
            detail: 'Veuillez renseigner une date de naissance valide.',
          });
          return;
        }

        // Si "autre", on remplace disponibilite par le texte saisi
        const dispoFinal = v.disponibilite === 'autre'
          ? (v.disponibilite_autre || 'autre')
          : v.disponibilite;

        await this.auth.registerCandidat({
          nom: v.nom,
          prenom: v.prenom,
          email: v.email,
          telephone: v.telephone,
          password: v.password,
          confirmPassword: v.confirmPassword,

          sexe: v.sexe,
          date_naissance: dateStr,
          categorie_id: Number(v.categorie_id),
          ville: v.ville,
          niveau_etude: v.niveau_etude,
          disponibilite: dispoFinal,
          pays_id: Number(v.pays_id)
        });
      } else {
        await this.auth.registerRecruteur({
          nom: v.nom,
          prenom: v.prenom,
          email: v.email,
          telephone: v.telephone,
          password: v.password,
          confirmPassword: v.confirmPassword,

          nom_entreprise: v.nom_entreprise,
          secteur_activite: v.secteur_activite,
          pays_id: Number(v.pays_id_recruteur),
          description: v.description || null,
          site_web: v.site_web || null
        });
      }

      this.messages.add({ severity: 'success', summary: 'Inscription réussie', detail: 'Bienvenue sur Alerte Emploi !' });
      this.router.navigateByUrl('/connexion');
    } catch (e: any) {
      const msg = e?.error?.message || 'Inscription impossible';
      this.messages.add({ severity: 'error', summary: 'Erreur', detail: msg });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private asISODate(d: any): string | null {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  navigateToConnexion() {
    this.router.navigate(['/connexion']);
  }

  // Ajoutez cette méthode dans votre component (optionnel)
setAccountType(type: 'candidat' | 'recruteur'): void {
  this.formulaireInscription.patchValue({ type });
}
}