import { Routes } from '@angular/router';
import { ExploresComponent } from './explores';

export const exploresRoutes: Routes = [
  {
    path: '',
    component: ExploresComponent,
    children: [
      {
        path: 'view-teams',
        loadComponent: () =>
          import('./view-teams/view-teams').then((m) => m.ViewTeamsComponent),
      },
      {
        path: 'view-app-spocs',
        loadComponent: () =>
          import('./view-app-spocs/view-app-spocs').then(
            (m) => m.ViewAppSpocsComponent
          ),
      },
      {
        path: '',
        redirectTo: 'view-teams',
        pathMatch: 'full',
      },
    ],
  },
];
