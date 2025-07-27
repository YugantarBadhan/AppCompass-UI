import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Helper method to get authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return new HttpHeaders(headers);
  }

  // Helper method to get HTTP options with auth headers
  private get httpOptions() {
    return {
      headers: this.getAuthHeaders(),
      withCredentials: true,
    };
  }

  // Fetch current user profile from API
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http
      .get<any>(`${this.baseUrl}/profile`, this.httpOptions)
      .pipe(
        map((response) => {
          const profile: UserProfile = {
            id: response.id,
            username: response.username,
            role: response.role,
            isActive: response.active || response.isActive || true
          };
          this.userProfileSubject.next(profile);
          return profile;
        }),
        catchError(this.handleError)
      );
  }

  // Get cached user profile
  getCachedUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  // Clear user profile (for logout)
  clearUserProfile(): void {
    this.userProfileSubject.next(null);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  private handleError = (error: HttpErrorResponse) => {
    let userMessage = 'An unexpected error occurred while fetching user profile.';

    if (error.error instanceof ErrorEvent) {
      userMessage = 'A network error occurred. Please check your connection and try again.';
    } else {
      switch (error.status) {
        case 0:
          userMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 401:
          userMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          userMessage = 'You do not have permission to access this information.';
          break;
        case 404:
          userMessage = 'User profile not found.';
          break;
        case 500:
          userMessage = 'Internal server error. Please try again later.';
          break;
        default:
          userMessage = error.error?.message || `Service error (${error.status}). Please try again.`;
      }
    }

    return throwError(() => ({
      status: error.status,
      error: { message: userMessage },
    }));
  };
}