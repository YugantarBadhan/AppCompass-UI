import { Component, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppLibraryComponent } from '../app-library/app-library';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AppLibraryComponent],
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

    // Call server logout first
    this.authService
      .logoutFromServer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Server logout successful, navigate to login
          this.router.navigate(['/login']);
        },
        error: (error) => {
          // Even if server logout fails, still navigate to login
          // as local data has been cleared
          console.error('Logout error:', error);
          this.router.navigate(['/login']);
        },
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown when clicking outside
    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }
}
