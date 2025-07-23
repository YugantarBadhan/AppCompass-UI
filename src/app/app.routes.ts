import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { AuthGuard } from './guards/auth.guard';
import { AppLibraryComponent } from './components/app-library/app-library';
import { SelectionsComponent } from './components/selections/selections';
import { ExploresComponent } from './components/explores/explores';
import { ApplicationsComponent } from './components/applications-management/applications-management';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'app-library', pathMatch: 'full' },
      { path: 'app-library', component: AppLibraryComponent },
      { path: 'selections', component: SelectionsComponent },
      { path: 'explores', component: ExploresComponent },
      { path: 'applications', component: ApplicationsComponent },
    ],
  },

  // Catch-all route
  { path: '**', redirectTo: '/login' },
];
