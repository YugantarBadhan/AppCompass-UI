import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { AppLibraryComponent } from './components/app-library/app-library';
import { SelectionsComponent } from './components/selections/selections';
import { ExploresComponent } from './components/explores/explores';
import { ApplicationsManagementComponent } from './components/applications-management/applications-management';
import { TeamsManagementComponent } from './components/teams-management/teams-management';
import { SpocsManagementComponent } from './components/spocs-management/spocs-management';
import { UserManagementComponent } from './components/user-management/user-management';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'app-library', pathMatch: 'full' },
      { 
        path: 'app-library', 
        component: AppLibraryComponent,
        canActivate: [PermissionGuard]
      },
      { 
        path: 'selections', 
        component: SelectionsComponent,
        canActivate: [PermissionGuard]
      },
      { 
        path: 'explores', 
        component: ExploresComponent,
        canActivate: [PermissionGuard]
      },
      {
        path: 'applications-management',
        component: ApplicationsManagementComponent,
        canActivate: [AuthGuard, PermissionGuard],
      },
      { 
        path: 'teams-management', 
        component: TeamsManagementComponent,
        canActivate: [AuthGuard, PermissionGuard]
      },
      { 
        path: 'spocs-management', 
        component: SpocsManagementComponent,
        canActivate: [AuthGuard, PermissionGuard]
      },
      { 
        path: 'user-management', 
        component: UserManagementComponent,
        canActivate: [AuthGuard, PermissionGuard]
      },
    ],
  },

  // Catch-all route
  { path: '**', redirectTo: '/login' },
];
