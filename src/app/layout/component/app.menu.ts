import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../pages/auth/auth.service';
import { Subscription } from 'rxjs';
import { User } from '../../pages/service/product.service';


@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem 
                *ngIf="!item.separator && canShow(item['roles'])" 
                [item]="item" 
                [index]="i" 
                [root]="true">
            </li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul>`,
})
export class AppMenu {
    model: MenuItem[] = [];
    isMenuOpen = signal(true);
    userMenuItems: MenuItem[] | undefined;
    utilisateur: User | null = null;
    subscriptions: Subscription[] = [];

    constructor(private authService: AuthService, private router: Router) {}

    canShow(roles: string[]|undefined): boolean{
        if(!roles) return true;
        
        const userRole = this.authService.rolesNames();
        let contain = undefined;
        for (let i = 0; i < roles.length; i++) {
            contain = userRole.find(r => r==roles[i]);
            if(contain) return true;
        }
        return false;
    }

    switchMenu() {
        console.log("SWITCH");
        
        this.isMenuOpen.update((val) => !val);
    }

   ngOnInit() {
    console.log('=== DEBUG ROLES ===');
    console.log('Roles utilisateur:', this.authService.rolesNames());
    console.log('==================');
    
    const role = this.authService.getUserRole();

    this.userMenuItems = [
        {
            label: 'Se deconnecter',
            icon: 'pi pi-power-off',
            command: () => {
                this.router.navigateByUrl('login');
            }
        }
    ];

    this.model = [
        {
            label: 'Dashboard',
            icon: 'pi pi-fw pi-home',
            routerLink: ['/dashboard'],
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
            ],
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            routerLink: ['/pages'],
            items: [
                {
                    label: 'Mon Entreprise',
                    icon: 'pi pi-fw pi-building',
                    routerLink: ['/pages/mon-entreprise'],
                    roles: ['Recruteur']  
                     
                },
                {
                    label: 'Offres',
                    icon: 'pi pi-fw pi-tags',
                    routerLink: ['/pages/offre'],
                    roles: ['Administrateur', 'Recruteur']  // ← Changez "canSee" en "roles"
                },
                {
                    label: 'Candidatures',
                    icon: 'pi pi-fw pi-file',
                    routerLink: ['/pages/candidature'],
                    roles: ['Administrateur', 'Recruteur', 'Candidat']  // ← Ajoutez les rôles requis
                },
                
                {
                    label: 'Entreprises',
                    icon: 'pi pi-fw pi-building',
                    routerLink: ['/pages/entreprise'],
                    roles: ['Administrateur']
                },
                {
                    label: 'Catégories',
                    icon: 'pi pi-fw pi-folder',
                    routerLink: ['/pages/categorie'],
                    roles: ['Administrateur']
                },
                {
                    label: 'Pays',
                    icon: 'pi pi-fw pi-globe',
                    routerLink: ['/pages/pays'],
                    roles: ['Administrateur']
                },
                {
                    label: 'Utilisateurs',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/pages/user'],
                    roles: ['Administrateur']
                },
                {
                    label: 'Roles',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/pages/role'],
                    roles: ['Administrateur']
                },
                {
                    label: 'Publicités',
                    icon: 'pi pi-fw pi-book',
                    routerLink: ['/pages/publicite'],
                    roles: ['Administrateur', 'Recruteur']
                },
                {
                    label: 'Conseils',
                    icon: 'pi pi-fw pi-building',
                    routerLink: ['/pages/conseil'],
                    roles: ['Administrateur']
                    
                },
                {
                    label: 'Notifications',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/pages/notification'],
                    
                },
                {
                    label: 'Mon CV',
                    icon: 'pi pi-fw pi-calendar',
                    routerLink: ['/pages/cv'],
                    roles: ['Candidat']  // ← Visible pour les candidats
                },
                {
                    label: 'Landing Page',
                    icon: 'pi pi-fw pi-globe',
                    routerLink: ['/landing'],
                    // Pas de roles = visible pour tous
                },
                {
                    label: 'Profil',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/pages/profil'],
                    // Pas de roles = visible pour tous
                },
                {
                    label: 'Authentication',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Connexion',
                            icon: 'pi pi-fw pi-sign-in',
                            routerLink: ['/connexion'],
                        },
                        {
                            label: 'Déconnexion',
                            icon: 'pi pi-fw pi-lock',
                            routerLink: ['/deconnexion'],
                            command: () => this.authService.logout(),
                        },
                    ],
                },
            ],
        },
    ];

    // ✨ FILTRER LES SOUS-ITEMS SELON LES RÔLES
    this.model = this.model.map(item => {
        if (item.items) {
            return {
                ...item,
                items: item.items
                    .filter(subItem => this.canShow(subItem['roles']))
                    .map(subItem => {
                        // Filtrer aussi les sous-sous-items (comme Authentication)
                        if (subItem.items) {
                            return {
                                ...subItem,
                                items: subItem.items.filter(subSubItem => 
                                    this.canShow(subSubItem['roles'])
                                )
                            };
                        }
                        return subItem;
                    })
            };
        }
        return item;
    });

    const subs = this.authService.utilisateurConnecte$.subscribe({
        next: (user) => this.utilisateur = user,
        error: err => console.log(err),
    });
    this.subscriptions.push(subs);

    }
    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
    