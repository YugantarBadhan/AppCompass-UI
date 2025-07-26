import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

export interface UserPermissions {
  canAccessApplicationManagement: boolean;
  canAccessTeamManagement: boolean;
  canAccessSpocManagement: boolean;
  canAccessUserManagement: boolean;
  canAccessAppLibrary: boolean;
  canAccessSelections: boolean;
  canAccessExplores: boolean;
}

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<UserPermissions>(this.getDefaultPermissions());
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private authService: AuthService) {
    // Initialize permissions when service is created
    this.updatePermissions();
    
    // Subscribe to authentication changes
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.updatePermissions();
      } else {
        this.resetPermissions();
      }
    });
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

  private updatePermissions(): void {
    const userRole = this.getCurrentUserRole();
    const permissions = this.calculatePermissions(userRole);
    this.permissionsSubject.next(permissions);
  }

  private resetPermissions(): void {
    this.permissionsSubject.next(this.getDefaultPermissions());
  }

  getCurrentUserRole(): string | null {
    const token = this.authService.token;
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getCurrentUserPermissions(): UserPermissions {
    return this.permissionsSubject.value;
  }

  private calculatePermissions(role: string | null): UserPermissions {
    const defaultPermissions = this.getDefaultPermissions();

    if (!role) {
      return defaultPermissions;
    }

    // Admin role has access to everything
    if (role.toLowerCase() === 'admin') {
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

    // All other roles only have access to basic functionalities
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
    return role?.toLowerCase() === 'admin';
  }

  // Get user role display name
  getUserRoleDisplayName(): string {
    const role = this.getCurrentUserRole();
    return role || 'Unknown';
  }
}