import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, ForgotPasswordRequest, LoginCredentials } from '../models/auth/auth.models';
import { PermissionService } from './permission.service';

// Add this interface for forgot password response
export interface ForgotPasswordResponse {
  message: string;
}

// Add this interface for logout response
export interface LogoutResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {  // Make sure this class is exported
  private readonly TOKEN_KEY = 'auth_token';
  private baseUrl = environment.apiUrl + '/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError((error) => this.handleError(error, 'login'))
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.put<ForgotPasswordResponse>(`${this.baseUrl}/forgot-password`, data, {
      withCredentials: true
    }).pipe(
      catchError((error) => this.handleError(error, 'forgotPassword'))
    );
  }

  logoutFromServer(): Observable<LogoutResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<LogoutResponse>(`${this.baseUrl}/logout`, {}, {
      headers,
      withCredentials: true
    }).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError((error) => {
        // Even if server logout fails, clear local data
        this.clearAuthData();
        return this.handleError(error, 'logout');
      })
    );
  }

  logout(): void {
    this.clearAuthData();
  }

  private clearAuthData(): void {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  public get token(): string | null {
    return this.getToken();
  }

  private setToken(token: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse, context: 'login' | 'forgotPassword' | 'logout') {
    console.error(`Auth Service Error (${context}):`, error);

    let message = 'An unknown error occurred. Please try again.';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      message = error.error.message;
    } else if (error.error?.message) {
      // Backend returned an error message
      message = error.error.message;
    } else {
      // Handle specific HTTP status codes based on context
      switch (error.status) {
        case 0:
          message = 'Unable to connect to the server. Please check your network connection.';
          break;
        case 400:
          if (context === 'login') {
            message = 'Invalid request. Please check your credentials.';
          } else if (context === 'forgotPassword') {
            message = 'Invalid request. Please check the provided information.';
          } else if (context === 'logout') {
            message = 'Invalid logout request.';
          }
          break;
        case 401:
          if (context === 'login') {
            message = 'Invalid username or password.';
          } else if (context === 'forgotPassword') {
            message = 'Invalid credentials provided.';
          } else if (context === 'logout') {
            message = 'Session expired. You have been logged out.';
          }
          break;
        case 403:
          message = 'Access denied. Please contact support.';
          break;
        case 404:
          if (context === 'login') {
            message = 'Login service not found. Please contact support.';
          } else if (context === 'forgotPassword') {
            message = 'User not found or password reset service unavailable.';
          } else if (context === 'logout') {
            message = 'Logout service not found.';
          }
          break;
        case 422:
          if (context === 'forgotPassword') {
            message = 'Invalid password format. Please ensure passwords match and meet requirements.';
          } else {
            message = 'Invalid data provided. Please check your input.';
          }
          break;
        case 429:
          message = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          if (context === 'login') {
            message = 'Login failed. Please try again.';
          } else if (context === 'forgotPassword') {
            message = 'Password reset failed. Please try again.';
          } else if (context === 'logout') {
            message = 'Logout failed. Please try again.';
          }
      }
    }

    return throwError(() => ({ error: { message } }));
  }
}