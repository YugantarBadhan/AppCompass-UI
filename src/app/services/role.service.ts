import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Role {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Internal interface for API response
interface RoleApiResponse {
  id: number;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
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

  getAllRoles(): Observable<Role[]> {
    return this.http
      .get<RoleApiResponse[]>(`${this.baseUrl}/getAllRoles`, this.httpOptions)
      .pipe(
        map((apiRoles) => {
          // Map API response to internal Role interface
          return apiRoles.map((apiRole) => ({
            id: apiRole.id,
            name: apiRole.name,
            isActive: Boolean(apiRole.active), // Map 'active' to 'isActive'
            createdAt: apiRole.createdAt,
            updatedAt: apiRole.updatedAt,
          }));
        }),
        catchError(this.handleError)
      );
  }

  createRole(request: CreateRoleRequest): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/create/role`, request, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateRole(roleId: number, request: UpdateRoleRequest): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/update/role/${roleId}`, request, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deactivateRole(roleId: number): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/deactivate/role/${roleId}`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  reactivateRole(roleId: number): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/reactivate/role/${roleId}`, {}, this.httpOptions)
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
          userMessage =
            error.error?.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          userMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          break;
        case 409:
          userMessage =
            error.error?.message ||
            'A conflict occurred. This item may already exist.';
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
