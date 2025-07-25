import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
}

// Internal interface for API response
interface UserApiResponse {
  id: number;
  username: string;
  role: string;
  active: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  username: string;
  password?: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

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

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<UserApiResponse[]>(`${this.baseUrl}/getAllUsers`, this.httpOptions)
      .pipe(
        map((apiUsers) => {
          // Map API response to internal User interface
          return apiUsers.map((apiUser) => ({
            id: apiUser.id,
            username: apiUser.username,
            role: apiUser.role,
            isActive: Boolean(apiUser.active), // Map 'active' to 'isActive'
          }));
        }),
        catchError(this.handleError)
      );
  }

  createUser(request: CreateUserRequest): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/register/user`, request, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateUser(userId: number, request: UpdateUserRequest): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/update/user/${userId}`, request, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/deactivate/user/${userId}`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  reactivateUser(userId: number): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/reactivate/user/${userId}`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Centralized error handler with user-friendly messages
  private handleError = (error: HttpErrorResponse) => {
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      userMessage =
        'A network error occurred. Please check your connection and try again.';
    } else {
      // Server-side error - provide user-friendly messages
      switch (error.status) {
        case 0:
          userMessage =
            'Unable to connect to the server. Please check your internet connection.';
          break;
        case 400:
          // Handle specific user creation errors
          if (error.error?.error) {
            const errorMsg = error.error.error;
            if (errorMsg.includes('Username already exists')) {
              userMessage =
                'This username is already taken. Please choose a different username.';
            } else if (errorMsg.includes('Invalid role')) {
              userMessage =
                'Invalid role selected. Please choose a valid role.';
            } else if (
              errorMsg.includes(
                'Username must contain only letters and numbers'
              )
            ) {
              userMessage =
                'Username must contain only letters and numbers (no special characters).';
            } else if (
              errorMsg.includes(
                'Password must contain at least one uppercase letter'
              )
            ) {
              userMessage =
                'Password must contain at least one uppercase letter, one number, and one special character.';
            } else if (errorMsg.includes('User role must be specified')) {
              userMessage = 'Please select a role for the user.';
            } else {
              userMessage = errorMsg;
            }
          } else {
            userMessage =
              error.error?.message ||
              'Invalid request. Please check your input.';
          }
          break;
        case 401:
          userMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'The requested user was not found.';
          break;
        case 409:
          userMessage =
            error.error?.message ||
            'A conflict occurred. This user may already exist.';
          break;
        case 422:
          userMessage =
            error.error?.message ||
            'Invalid data provided. Please check your input.';
          break;
        case 429:
          userMessage =
            'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          userMessage = 'Internal server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          userMessage =
            'Service temporarily unavailable. Please try again later.';
          break;
        default:
          // Check if it's an HTML response (likely a routing issue)
          if (
            typeof error.error === 'string' &&
            error.error.includes('<!DOCTYPE html>')
          ) {
            userMessage =
              'Service configuration error. Please contact support.';
          } else if (error.error?.message) {
            userMessage = error.error.message;
          } else {
            userMessage = `Service error (${error.status}). Please try again or contact support.`;
          }
      }
    }

    return throwError(() => ({
      status: error.status,
      error: { message: userMessage },
    }));
  };
}
