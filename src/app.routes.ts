import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { Landing } from './app/pages/landing/landing';
import { ConnexionComponent } from './app/pages/auth/connexion/connexion.component';
import { RegisterComponent } from './app/pages/auth/register/register.component';
import { DashboardComponent } from './app/pages/dashboard/dashboard';
import { OffreComponent } from './app/pages/crud/offre/offre';
import { OffresListComponent } from './app/pages/landing/components/offres_list/offres-list.component';
import { SuiviCandidatureComponent } from './app/pages/crud/candidature/suivre_candidature';
import { PublishOffreComponent } from './app/pages/landing/components/publish-offre';
import { authGuard } from './app/pages/auth/auth.guard';
import { ForgotPasswordComponent } from './app/pages/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './app/pages/auth/reset-password/reset-password.component';
import { AboutComponent } from './app/pages/about/about.component';

export const appRoutes: Routes = [
  { path: '', component: Landing },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard], // Protéger toutes les routes sous AppLayout
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
      { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
    ],
  },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'landing', component: Landing },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent,
    title: 'Mot de passe oublié'
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent,
    title: 'Réinitialiser le mot de passe'
  },
  // Route protégée pour recruteurs et admins uniquement
  { 
    path: 'publier-offre', 
    component: PublishOffreComponent, 
    canActivate: [authGuard], 
    data: { roles: ['Recruteur', 'Administrateur'] } // ← Utiliser 'admin' et non 'administrateur'
  },
  
  { path: 'offres', component: OffresListComponent },
  
  // Protéger aussi le suivi des candidatures ?
  { 
    path: 'suivre-candidature', 
    component: SuiviCandidatureComponent,
  },

  {
    path: 'about',
    component: AboutComponent
  },

  { 
    path: 'acces-refuse', 
    component: Notfound // Ou créez un composant AccesRefuseComponent
  },
  
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' },
];