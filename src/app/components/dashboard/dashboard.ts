import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  isUserMenuOpen = false;
  role: string | null;
  username: string | null;

  constructor(private authService: AuthService, private router: Router) {
    this.role = localStorage.getItem('role');
    this.username = localStorage.getItem('username');
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;

    // Close menu when clicking outside
    if (this.isUserMenuOpen) {
      document.addEventListener('click', this.closeUserMenu.bind(this), {
        once: true,
      });
    }
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  navigateToUserManagement(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = false; // Close dropdown immediately
    this.router.navigate(['/dashboard/user-management']);
  }

  logout(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = false; // Close dropdown immediately
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
