import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';


@Component({
  selector: 'topbar-widget',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, RippleModule, StyleClassModule],
  template: `
    <header class="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-surface-900/95 backdrop-blur">
      <div class="w-full h-[72px] px-4 md:px-6 lg:px-8 flex items-center">
        <a class="flex items-center gap-3 cursor-pointer shrink-0" (click)="router.navigate(['/'])">
          <img src="assets/images/LOGO.png" alt="Logo" class="h-12 md:h-14 lg:h-16" />
          <span class="logo-type">
            <span class="brand-blue">ALERTE&nbsp;EMPLOI</span>
            <span class="brand-orange">&nbsp;&</span>
            <span class="brand-green">OFFRES</span>
          </span>
        </a>

        <div class="ml-auto hidden lg:flex items-center gap-10">
          <nav class="flex items-center gap-8">
            <a (click)="router.navigate(['/landing'])" class="nav-link" [class.active]="isActiveRoute('/landing') || isActiveRoute('/')">Accueil</a>
            <a (click)="router.navigate(['/offres'])" class="nav-link" [class.active]="isActiveRoute('/offres')">Offres</a>
            <a (click)="router.navigate(['/suivre-candidature'])" class="nav-link" [class.active]="isActiveRoute('/suivre-candidature')">Suivre candidature</a>
            <a (click)="router.navigate(['/about'])" class="nav-link" [class.active]="isActiveRoute('/about')">À propos</a>
          </nav>

          <div class="flex items-center gap-2">
            <button pButton pRipple label="Se connecter" [rounded]="true" class="brand-outline" (click)="router.navigate(['/connexion'])"></button>
            <button pButton pRipple label="S'inscrire"   [rounded]="true" class="brand-solid"   (click)="router.navigate(['/register'])"></button>
          </div>
        </div>

        <!-- Burger -->
        <a pButton [text]="true" severity="secondary" [rounded]="true" pRipple
           class="lg:!hidden ml-auto"
           pStyleClass="@next" enterClass="hidden" leaveToClass="hidden"
           [hideOnOutsideClick]="true">
          <i class="pi pi-bars !text-2xl"></i>
        </a>
      </div>

      <!-- Ligne bleue décorative -->
      <div class="blue-decorative-line"></div>

      <!-- Menu mobile -->
      <div class="hidden lg:hidden absolute left-0 right-0 top-full z-50 bg-white dark:bg-surface-900 border-b px-4 md:px-6 py-4 shadow-md">
        <ul class="list-none m-0 p-0 flex flex-col gap-4">
          <li><a (click)="router.navigate(['/landing'])" class="nav-link" [class.active]="isActiveRoute('/landing') || isActiveRoute('/')">Accueil</a></li>
          <li><a (click)="router.navigate(['/offres'])" class="nav-link" [class.active]="isActiveRoute('/offres')">Offres</a></li>
          <li><a (click)="router.navigate(['/candidatures'])" class="nav-link" [class.active]="isActiveRoute('/suivre-candidature')">Suivre candidature</a></li>
          <li><a (click)="router.navigate(['/about'])" class="nav-link" [class.active]="isActiveRoute('/about')">À propos</a></li>
          <li><a (click)="createOffer.emit()" class="nav-link">Publier une offre</a></li>
          <li class="flex gap-2 pt-2">
            <button pButton pRipple label="Se connecter" [rounded]="true" class="brand-outline" (click)="router.navigate(['/connexion'])"></button>
            <button pButton pRipple label="S'inscrire"   [rounded]="true" class="brand-solid"   (click)="router.navigate(['/register'])"></button>
          </li>
        </ul>
      </div>
    </header>

    <div class="h-[72px]"></div>

    <style>
      :host { 
        --brand-blue: #111d9d; 
        --brand-orange: #ff7104; 
        --brand-green: #0a6c34; 
      }
      
      .brand-blue { color: var(--brand-blue) } 
      .brand-orange { color: var(--brand-orange) } 
      .brand-green { color: var(--brand-green) }
      
      .logo-type {
        display: flex;
        gap: .25rem;
        font-weight: 800;
        line-height: 1;
        font-size: clamp(1.05rem, 1.4vw, 1.35rem);
        letter-spacing: .02em;
      }
      
      .nav-link {
        color: rgba(0,0,0,.85);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }
      
      .nav-link:hover {
        color: var(--brand-blue);
      }
      
      .nav-link::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--brand-blue);
        transition: width 0.3s ease;
      }
      
      .nav-link:hover::after {
        width: 100%;
      }
      
      /* Style pour la page active */
      .nav-link.active {
        color: var(--brand-blue);
        font-weight: 700;
      }
      
      .nav-link.active::after {
        width: 100%;
      }
      
      .brand-outline.p-button {
        background: transparent;
        border-color: var(--brand-blue);
        color: var(--brand-blue);
        transition: all 0.3s ease;
      }
      
      .brand-outline.p-button:hover {
        background: var(--brand-blue);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(17, 29, 157, 0.2);
      }
      
      .brand-solid.p-button {
        background: var(--brand-green);
        border-color: var(--brand-green);
        color: #fff;
        transition: all 0.3s ease;
      }
      
      .brand-solid.p-button:hover {
        background: #095a2e;
        border-color: #095a2e;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(10, 108, 52, 0.3);
      }
      
      .p-button:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-green) 25%, transparent);
      }
      
      /* Ligne bleue uniforme en bas */
      .blue-decorative-line {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: var(--brand-blue);
      }
    </style>
  `
})
export class TopbarWidget {
  /** Ouvre le suivi de candidature (modal) */
  @Output() openReservationModalEvent = new EventEmitter<void>();
  /** NEW: demande au parent d'ouvrir le p-dialog de création d'offre */
  @Output() publish = new EventEmitter<void>();
  @Output() createOffer = new EventEmitter<void>();
  
  constructor(public router: Router) {}

  openTrackModal(): void { 
    this.openReservationModalEvent.emit(); 
  }

  /** Vérifie si la route actuelle correspond au chemin donné */
  isActiveRoute(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }
}