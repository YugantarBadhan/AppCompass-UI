import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserProfileService, UserProfile } from './user-profile.service';

export interface UserPermissions {
  canAccessApplicationManagement: boolean;
  canAccessTeamManagement: boolean;
  canAccessSpocManagement: boolean;
  canAccessUserManagement: boolean;
  canAccessAppLibrary: boolean;
  canAccessSelections: boolean;
  canAccessExplores: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<UserPermissions>(this.getDefaultPermissions());
  public permissions$ = this.permissionsSubject.asObservable();
  private currentUserProfile: UserProfile | null = null;

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService
  ) {
    // Subscribe to authentication changes
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadUserProfileAndUpdatePermissions();
      } else {
        this.resetPermissions();
        this.currentUserProfile = null;
      }
    });

    // Initialize permissions if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.loadUserProfileAndUpdatePermissions();
    }
  }

  private getDefaultPermissions(): UserPermissions {
    return {
      canAccessApplicationManagement: false,
      canAccessTeamManagement: false,
      canAccessSpocManagement: false,
      canAccessUserManagement: false,
      canAccessAppLibrary: true,
      canAccessSelections: true,
      canAccessExplores: true,
    };
  }

  private loadUserProfileAndUpdatePermissions(): void {
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.currentUserProfile = profile;
        const permissions = this.calculatePermissions(profile.role);
        this.permissionsSubject.next(permissions);
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        this.resetPermissions();
        this.currentUserProfile = null;
      }
    });
  }

  private resetPermissions(): void {
    this.permissionsSubject.next(this.getDefaultPermissions());
    this.userProfileService.clearUserProfile();
  }

  getCurrentUserRole(): string | null {
    return this.currentUserProfile?.role || null;
  }

  getCurrentUserPermissions(): UserPermissions {
    return this.permissionsSubject.value;
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfile;
  }

  // Method to refresh user profile and permissions
  refreshUserProfile(): Observable<UserProfile> {
    return this.userProfileService.getCurrentUserProfile().pipe(
      tap((profile) => {
        this.currentUserProfile = profile;
        const permissions = this.calculatePermissions(profile.role);
        this.permissionsSubject.next(permissions);
      }),
      catchError((error) => {
        console.error('Failed to refresh user profile:', error);
        this.resetPermissions();
        this.currentUserProfile = null;
        return of(null as any);
      })
    );
  }

  private calculatePermissions(role: string | null): UserPermissions {
    const defaultPermissions = this.getDefaultPermissions();

    if (!role) {
      return defaultPermissions;
    }

    // Admin role has access to everything (case-insensitive check)
    const normalizedRole = role.toLowerCase().trim();
    if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
      return {
        canAccessApplicationManagement: true,
        canAccessTeamManagement: true,
        canAccessSpocManagement: true,
        canAccessUserManagement: true,
        canAccessAppLibrary: true,
        canAccessSelections: true,
        canAccessExplores: true,
      };
    }

    // Manager role has access to some management features
    if (normalizedRole === 'manager') {
      return {
        canAccessApplicationManagement: true,
        canAccessTeamManagement: true,
        canAccessSpocManagement: true,
        canAccessUserManagement: false,
        canAccessAppLibrary: true,
        canAccessSelections: true,
        canAccessExplores: true,
      };
    }

    // All other roles (user, read, etc.) only have access to basic functionalities
    return {
      canAccessApplicationManagement: false,
      canAccessTeamManagement: false,
      canAccessSpocManagement: false,
      canAccessUserManagement: false,
      canAccessAppLibrary: true,
      canAccessSelections: true,
      canAccessExplores: true,
    };
  }

  // Helper methods for checking specific permissions
  canAccessApplicationManagement(): boolean {
    return this.getCurrentUserPermissions().canAccessApplicationManagement;
  }

  canAccessTeamManagement(): boolean {
    return this.getCurrentUserPermissions().canAccessTeamManagement;
  }

  canAccessSpocManagement(): boolean {
    return this.getCurrentUserPermissions().canAccessSpocManagement;
  }

  canAccessUserManagement(): boolean {
    return this.getCurrentUserPermissions().canAccessUserManagement;
  }

  canAccessAppLibrary(): boolean {
    return this.getCurrentUserPermissions().canAccessAppLibrary;
  }

  canAccessSelections(): boolean {
    return this.getCurrentUserPermissions().canAccessSelections;
  }

  canAccessExplores(): boolean {
    return this.getCurrentUserPermissions().canAccessExplores;
  }

  // Check if user is admin
  isAdmin(): boolean {
    const role = this.getCurrentUserRole();
    if (!role) return false;
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole === 'admin' || normalizedRole === 'administrator';
  }

  // Check if user is manager
  isManager(): boolean {
    const role = this.getCurrentUserRole();
    if (!role) return false;
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole === 'manager';
  }

  // Get user role display name
  getUserRoleDisplayName(): string {
    const profile = this.getCurrentUserProfile();
    return profile?.role || 'Unknown';
  }

  // Get username
  getUsername(): string {
    const profile = this.getCurrentUserProfile();
    return profile?.username || 'Unknown User';
  }
}