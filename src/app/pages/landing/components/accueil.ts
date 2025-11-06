import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  template: `
    <section class="relative overflow-hidden px-6 lg:px-20 py-8 md:py-12">
      <!-- Fond image : on affiche l'intégralité avec bg-contain -->
      <div
        class="absolute inset-0 bg-no-repeat bg-center md:bg-right bg-contain"
        [style.backgroundImage]="'url(' + backgroundImage + ')'"
      ></div>
      
      <!-- Overlay dégradé lisibilité -->
      <div class="absolute inset-0"
           style="background: linear-gradient(180deg, rgba(10,0,19,.35) 0%, rgba(10,0,19,.15) 30%, rgba(10,0,19,0) 100%);">
      </div>
      
      <!-- Contenu -->
      <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <!-- Texte -->
        <div class="order-2 md:order-1">
          <h1 class="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-2">
            <span class="inline-flex items-baseline gap-2 whitespace-nowrap">
              <span class="brand-blue">AlertEmploi</span>
              <span class="brand-orange">&</span>
              <span class="brand-green">Offres</span>
            </span>
            <!-- Texte principal avec couleur professionnelle -->
            <span class="block font-normal text-opportunity mt-3">
              Trouve l'opportunité qui te correspond
            </span>
          </h1>
          
          <!-- Paragraphe avec couleur professionnelle -->
          <p class="text-base md:text-lg mt-4 text-description leading-relaxed">
            Explore les offres, suis tes candidatures et publie des annonces facilement.
          </p>
          
          <div class="flex flex-wrap gap-4 mt-8">
            <button 
              pButton 
              pRipple 
              [rounded]="true" 
              label="Voir les offres" 
              class="btn-primary"
              (click)="router.navigate(['/offres'])">
            </button>
            <button 
              pButton 
              pRipple 
              [rounded]="true" 
              [outlined]="true"
              label="Publier une offre"
              class="btn-secondary"
              (click)="router.navigate(['/publier-offre'])">
            </button>
          </div>
        </div>
        
        <!-- Visuel (logo) -->
        <div class="order-1 md:order-2 flex justify-center md:justify-end">
          <img
            [src]="heroImage"
            alt="Logo AlertEmploi & Offres"
            class="h-auto object-contain logo-animation
                   w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px] xl:w-[340px]"
          />
        </div>
      </div>
      
      <!-- Styles professionnels -->
      <style>
        /* Couleurs de marque */
        .brand-blue   { color: #111d9d; }
        .brand-orange { color: #ff7104; }
        .brand-green  { color: #0a6c34; }
        
        /* Textes professionnels - nets et visibles */
        .text-opportunity {
          color: #1a1a1a;
          font-weight: 500;
        }
        
        .text-description {
          color: #333333;
        }
        
        /* Animation du logo */
        .logo-animation {
          transition: transform 0.3s ease;
        }
        
        .logo-animation:hover {
          transform: scale(1.05);
        }
        
        /* Bouton principal - simplifié */
        :host ::ng-deep .btn-primary {
          background-color: #111d9d;
          border-color: #111d9d;
          color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          transition: all 0.3s ease;
        }
        
        :host ::ng-deep .btn-primary:hover {
          background-color: #0d1784;
          border-color: #0d1784;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(17, 29, 157, 0.3);
        }
        
        :host ::ng-deep .btn-primary:active {
          transform: translateY(0);
        }
        
        /* Bouton secondaire - simplifié */
        :host ::ng-deep .btn-secondary {
          border: 2px solid #111d9d;
          color: #111d9d;
          background-color: white;
          font-weight: 600;
          padding: 0.75rem 2rem;
          transition: all 0.3s ease;
        }
        
        :host ::ng-deep .btn-secondary:hover {
          background-color: #111d9d;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(17, 29, 157, 0.2);
        }
        
        :host ::ng-deep .btn-secondary:active {
          transform: translateY(0);
        }
        
        /* Animation d'apparition */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .order-2 > * {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .order-2 h1 {
          animation-delay: 0.1s;
        }
        
        .order-2 p {
          animation-delay: 0.2s;
        }
        
        .order-2 div {
          animation-delay: 0.3s;
        }
      </style>
    </section>
  `
})
export class Accueil {
  backgroundImage = '/assets/images/Hero.jpg';
  heroImage = '/assets/images/LOGO.png';
  
  constructor(public router: Router) {}
}
