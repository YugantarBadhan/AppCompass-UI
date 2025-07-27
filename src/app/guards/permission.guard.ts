import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // If we don't have user profile yet, fetch it first
    const currentProfile = this.permissionService.getCurrentUserProfile();
    if (!currentProfile) {
      return this.permissionService.refreshUserProfile().pipe(
        map(() => this.checkRoutePermission(route)),
        catchError(() => {
          this.router.navigate(['/unauthorized']);
          return of(false);
        })
      );
    }

    return this.checkRoutePermission(route);
  }

  private checkRoutePermission(route: ActivatedRouteSnapshot): boolean {
    // Get the route path to determine required permission
    const routePath = route.routeConfig?.path;
    
    switch (routePath) {
      case 'applications-management':
        if (!this.permissionService.canAccessApplicationManagement()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'teams-management':
        if (!this.permissionService.canAccessTeamManagement()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'spocs-management':
        if (!this.permissionService.canAccessSpocManagement()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'user-management':
        if (!this.permissionService.canAccessUserManagement()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'app-library':
        if (!this.permissionService.canAccessAppLibrary()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'selections':
        if (!this.permissionService.canAccessSelections()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      case 'explores':
        if (!this.permissionService.canAccessExplores()) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        break;
      
      default:
        // Allow access to unknown routes (they'll be handled by other guards)
        return true;
    }

    return true;
  }
}