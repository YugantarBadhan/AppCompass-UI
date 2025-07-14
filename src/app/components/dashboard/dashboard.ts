import { Component, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // ✅ Needed for router-outlet and routerLink
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // ✅ Required for <router-outlet> and routerLink in HTML
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnDestroy {
  isUserMenuOpen = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.isUserMenuOpen = false;

    this.authService
      .logoutFromServer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          this.router.navigate(['/login']);
        },
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }
}
