import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer-elegant">
      <div class="footer-content">
        <div class="footer-grid">
          <!-- Colonne 1: À propos -->
          <div class="footer-column">
            <div class="footer-logo-section">
              <img src="assets/images/AEO WITHE LOGO.png" alt="Logo" class="footer-logo" />
            </div>
            <p class="footer-description">
              Votre partenaire de confiance pour trouver l'emploi idéal. 
              Nous connectons les talents avec les meilleures opportunités professionnelles 
              au Burkina Faso et en Afrique de l'Ouest.
            </p>
            <div class="social-icons">
              <a href="https://www.facebook.com/share/1BC8vUQG6Y/" target="_blank" rel="noopener" class="social-icon facebook" aria-label="Facebook">
                <i class="pi pi-facebook"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener" class="social-icon youtube" aria-label="YouTube">
                <i class="pi pi-youtube"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" class="social-icon instagram" aria-label="Instagram">
                <i class="pi pi-instagram"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener" class="social-icon linkedin" aria-label="LinkedIn">
                <i class="pi pi-linkedin"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener" class="social-icon tiktok" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Colonne 2: Navigation -->
          <div class="footer-column">
            <h3 class="footer-title">Navigation</h3>
            <ul class="footer-links">
              <li>
                <a routerLink="/" class="footer-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                  <i class="pi pi-home"></i>
                  <span>Accueil</span>
                </a>
              </li>
              <li>
                <a routerLink="/offres" class="footer-link" routerLinkActive="active">
                  <i class="pi pi-briefcase"></i>
                  <span>Offres d'emploi</span>
                </a>
              </li>
              <li>
                <a routerLink="/suivre-candidature" class="footer-link" routerLinkActive="active">
                  <i class="pi pi-search"></i>
                  <span>Suivre ma candidature</span>
                </a>
              </li>
              <li>
                <a routerLink="/connexion" class="footer-link" routerLinkActive="active">
                  <i class="pi pi-sign-in"></i>
                  <span>Se connecter</span>
                </a>
              </li>
              <li>
                <a routerLink="/inscription" class="footer-link" routerLinkActive="active">
                  <i class="pi pi-user-plus"></i>
                  <span>S'inscrire</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Colonne 3: Ressources & Support -->
          <div class="footer-column">
            <h3 class="footer-title">Ressources</h3>
            <ul class="footer-links">
              <li>
                <a routerLink="/conseils" class="footer-link" routerLinkActive="active">
                  <i class="pi pi-lightbulb"></i>
                  <span>Conseils carrière</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@example.com" class="footer-link">
                  <i class="pi pi-envelope"></i>
                  <span>Nous contacter</span>
                </a>
              </li>
              <li>
                <a routerLink="/aide" class="footer-link">
                  <i class="pi pi-question-circle"></i>
                  <span>Centre d'aide</span>
                </a>
              </li>
              <li>
                <a routerLink="/cgu" class="footer-link">
                  <i class="pi pi-file"></i>
                  <span>Conditions d'utilisation</span>
                </a>
              </li>
              <li>
                <a routerLink="/confidentialite" class="footer-link">
                  <i class="pi pi-shield"></i>
                  <span>Politique de confidentialité</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Colonne 4: Contact -->
          <div class="footer-column">
            <h3 class="footer-title">Besoin d'aide ?</h3>
            <p class="footer-contact">
              <strong>Appelez-nous :</strong>
              <a href="tel:+22671775858" class="phone-link">+226 71 77 58 58</a>
            </p>
            <p class="footer-contact">
              <strong>Email :</strong>
              <a href="mailto:contact@example.com" class="email-link">contact.com</a>
            </p>
            <p class="footer-text">
              <i class="pi pi-clock"></i>
              Lundi - Vendredi : 8h00 - 18h00<br>
              Samedi : 9h00 - 13h00
            </p>
            <div class="stats-footer">
              <div class="stat-footer">
                <span class="stat-number">500+</span>
                <span class="stat-label">Offres actives</span>
              </div>
              <div class="stat-footer">
                <span class="stat-number">1000+</span>
                <span class="stat-label">Candidats inscrits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright Bar -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p class="copyright">
            Copyright © {{ currentYear }} <strong>JobPlatform</strong> - Tous droits réservés
          </p>
          <div class="footer-bottom-links">
            <a routerLink="/mentions-legales" class="bottom-link">Mentions légales</a>
            <span class="separator">•</span>
            <a routerLink="/confidentialite" class="bottom-link">Confidentialité</a>
            <span class="separator">•</span>
            <a routerLink="/cookies" class="bottom-link">Cookies</a>
          </div>
          <p class="powered-by">
            Développé avec <i class="pi pi-heart"></i> par <span class="brand">Tacha</span>
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* ===== VARIABLES ===== */
    :host {
      --footer-bg: #3d3d8e;
      --footer-bg-dark: #2d2d6e;
      --footer-text: #e5e7eb;
      --footer-text-muted: #cbd5e1;
      --footer-heading: #ff7104;
      --footer-link-hover: #ffffff;
      --footer-border: rgba(255, 255, 255, 0.1);
      --social-bg: #ff7104;
      --social-hover: #ff8c2e;
    }

    /* ===== FOOTER PRINCIPAL ===== */
    .footer-elegant {
      background: var(--footer-bg);
      color: var(--footer-text);
      width: 100%;
      margin-top: 4rem;
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 4rem 2rem 3rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 3rem;
    }

    /* ===== COLONNES ===== */
    .footer-column {
      display: flex;
      flex-direction: column;
    }

    /* Logo et description */
    .footer-logo-section {
      margin-bottom: 1.5rem;
      
    }

    .footer-logo {
      height: 100px;
      width: auto;
      object-fit: contain;
    }

    .footer-description {
      font-size: 0.95rem;
      line-height: 1.7;
      color: var(--footer-text-muted);
      margin-bottom: 1.5rem;
      font-weight: 400;
    }

    /* Réseaux sociaux */
    .social-icons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .social-icon {
      width: 2.75rem;
      height: 2.75rem;
      background: var(--social-bg);
      color: white;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .social-icon:hover {
      background: var(--social-hover);
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(255, 113, 4, 0.4);
    }

    .social-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Titres */
    .footer-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--footer-heading);
      margin-bottom: 1.5rem;
      letter-spacing: -0.01em;
    }

    /* Quick Links */
    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .footer-link {
      color: var(--footer-text);
      text-decoration: none;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-weight: 400;
      padding: 0.375rem 0;
    }

    .footer-link i {
      font-size: 0.875rem;
      color: var(--footer-heading);
      transition: transform 0.3s ease;
    }

    .footer-link:hover,
    .footer-link.active {
      color: var(--footer-link-hover);
      transform: translateX(4px);
    }

    .footer-link:hover i,
    .footer-link.active i {
      transform: scale(1.2);
    }

    /* Contact */
    .footer-contact {
      font-size: 0.95rem;
      line-height: 1.7;
      margin-bottom: 1rem;
      color: var(--footer-text-muted);
    }

    .footer-contact strong {
      display: block;
      color: var(--footer-text);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .phone-link,
    .email-link {
      color: var(--footer-heading);
      text-decoration: none;
      font-size: 1.125rem;
      font-weight: 700;
      display: block;
      transition: color 0.3s ease;
      letter-spacing: 0.5px;
    }

    .phone-link:hover,
    .email-link:hover {
      color: var(--social-hover);
    }

    .footer-text {
      font-size: 0.95rem;
      line-height: 1.7;
      color: var(--footer-text-muted);
      margin-top: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .footer-text i {
      color: var(--footer-heading);
      margin-top: 0.25rem;
      font-size: 1rem;
    }

    /* Stats Footer */
    .stats-footer {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--footer-border);
    }

    .stat-footer {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--footer-heading);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      color: var(--footer-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ===== COPYRIGHT BAR ===== */
    .footer-bottom {
      background: var(--footer-bg-dark);
      border-top: 1px solid var(--footer-border);
    }

    .footer-bottom-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .copyright,
    .powered-by {
      font-size: 0.875rem;
      color: var(--footer-text-muted);
      margin: 0;
      font-weight: 400;
    }

    .copyright strong {
      color: var(--footer-text);
      font-weight: 600;
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .bottom-link {
      color: var(--footer-text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.3s ease;
    }

    .bottom-link:hover {
      color: var(--footer-text);
    }

    .separator {
      color: var(--footer-text-muted);
      font-size: 0.75rem;
    }

    .powered-by {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .powered-by i {
      color: #ef4444;
      animation: heartbeat 1.5s ease-in-out infinite;
    }

    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .brand {
      color: var(--footer-heading);
      font-weight: 700;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .footer-content {
        padding: 3rem 1.5rem 2rem;
      }

      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }

      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .footer-bottom-links {
        justify-content: center;
      }

      .footer-title {
        font-size: 1.25rem;
      }

      .phone-link,
      .email-link {
        font-size: 1rem;
      }

      .social-icons {
        justify-content: center;
      }

      .stats-footer {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .footer-logo {
        height: 40px;
      }

      .social-icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.125rem;
      }

      .stat-number {
        font-size: 1.25rem;
      }
    }
  `]
})
export class FooterWidget {
  currentYear = new Date().getFullYear();

  constructor(private router: Router) {}
}