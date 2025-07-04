import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  // Add this catch-all route at the end, but make sure it doesn't interfere with API calls
  { path: '**', redirectTo: '/login' }
];