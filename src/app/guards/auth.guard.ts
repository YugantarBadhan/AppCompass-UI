import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.token;

    // 📝 1. No token at all → go to login
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // 📝 2. Expired token → clear & redirect
    if (this.isExpired(token)) {
      this.authService.logout(); // make sure you clear storage in logout()
      this.router.navigate(['/login']);
      return false;
    }

    // 📝 3. Valid token → let the route load
    return true;
  }

  private isExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return !exp || Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }
}
