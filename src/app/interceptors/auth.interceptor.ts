import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode'; // npm i jwt-decode

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Endpoints that must **never** carry a Bearer header
  private readonly authFree = ['/login', '/authenticate', '/refresh-token'];

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // 📝 1. Leave auth‑free calls untouched (login, refresh, register …)
    if (this.authFree.some((url) => req.url.includes(url))) {
      return next.handle(req);
    }

    // 📝 2. Grab the *latest* token from storage every time
    const token = this.authService.token; // getter in AuthService

    // 📝 3. Attach the header only when a non‑expired token exists
    if (token && !this.isExpired(token)) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // 📝 4. Forward (either with or without the header)
    return next.handle(req);
  }

  /**
   * Decodes the JWT and checks the exp claim (seconds since epoch).
   * Returns true when the token is missing, malformed, or already expired.
   */
  private isExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return !exp || Date.now() >= exp * 1000;
    } catch {
      return true; // malformed -> treat as expired
    }
  }
}
