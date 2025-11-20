import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TopbarWidget } from "../landing/components/topbarwidget.component";
import { FooterWidget } from "../landing/components/footerwidget";
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    TagModule,
    TopbarWidget,
    FooterWidget,
],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

  constructor(private router: Router) {}

  // 📊 Statistiques
  stats = [
    { label: 'Offres d\'emploi', value: '1000+', icon: 'pi-briefcase', color: 'blue' },
    { label: 'Candidats inscrits', value: '10000+', icon: 'pi-users', color: 'green' },
    { label: 'Entreprises partenaires', value: '100+', icon: 'pi-building', color: 'purple' },
    { label: 'Taux de placement', value: '85%', icon: 'pi-chart-line', color: 'orange' }
  ];

  // 🎯 Valeurs
  values = [
    {
      icon: 'pi-eye',
      title: 'Transparence',
      description: 'Des processus clairs et honnêtes pour tous nos utilisateurs',
      color: 'blue'
    },
    {
      icon: 'pi-users',
      title: 'Accessibilité',
      description: 'Rendre l\'emploi accessible à tous, partout au Burkina Faso',
      color: 'green'
    },
    {
      icon: 'pi-sparkles',
      title: 'Innovation',
      description: 'Des solutions technologiques pour moderniser le recrutement',
      color: 'purple'
    },
    {
      icon: 'pi-heart',
      title: 'Engagement',
      description: 'Un accompagnement personnalisé pour chaque candidat',
      color: 'red'
    }
  ];

  getColorClass(color: string): string {
    const colors: any = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color] || 'bg-gray-500';
  }

  getIconColorClass(color: string): string {
    const colors: any = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    };
    return colors[color] || 'text-gray-600';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  imageMission = '/assets/images/mission.jpg';
}