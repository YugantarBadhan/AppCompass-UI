import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService, UserPermissions } from '../../services/permission.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class DashboardComponent implements OnInit, OnDestroy {
  isUserMenuOpen = false;
  permissions$: Observable<UserPermissions>;
  userRole: string = '';
  username: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private permissionService: PermissionService
  ) {
    this.permissions$ = this.permissionService.permissions$;
  }

  ngOnInit(): void {
    // Subscribe to permission changes to update user info
    this.permissions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateUserInfo();
    });

    // Initial load of user info
    this.updateUserInfo();

    // Refresh user profile to ensure we have the latest data
    this.permissionService.refreshUserProfile().subscribe({
      next: () => {
        this.updateUserInfo();
      },
      error: (error) => {
        console.error('Failed to refresh user profile:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateUserInfo(): void {
    this.userRole = this.permissionService.getUserRoleDisplayName();
    this.username = this.permissionService.getUsername();
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