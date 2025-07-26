import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService, UserPermissions } from '../../services/permission.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  isUserMenuOpen = false;
  permissions$: Observable<UserPermissions>;
  userRole: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private permissionService: PermissionService
  ) {
    this.permissions$ = this.permissionService.permissions$;
    this.updateUserRole();
  }

  private updateUserRole(): void {
    this.userRole = this.permissionService.getUserRoleDisplayName();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    
    // Close menu when clicking outside
    if (this.isUserMenuOpen) {
      document.addEventListener('click', this.closeUserMenu.bind(this), { once: true });
    }
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  navigateToUserManagement() {
    if (this.permissionService.canAccessUserManagement()) {
      this.router.navigate(['/dashboard/user-management']);
      this.closeUserMenu();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeUserMenu();
  }

  // Helper method to check if user can access management features
  canAccessManagementFeatures(): boolean {
    const permissions = this.permissionService.getCurrentUserPermissions();
    return permissions.canAccessApplicationManagement || 
           permissions.canAccessTeamManagement || 
           permissions.canAccessSpocManagement || 
           permissions.canAccessUserManagement;
  }
}