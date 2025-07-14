import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { AuthGuard } from './guards/auth.guard';
import { AppLibraryComponent } from './components/app-library/app-library';
import { SelectionsComponent } from './components/selections/selections';

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
    ],
  },

  // Catch-all route
  { path: '**', redirectTo: '/login' },
];
