import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Application {
  appId: number;
  appName: string;
  appDescription: string;
  active: boolean;
  icon?: string;
  initials?: string;
  gradientColors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private baseUrl = environment.apiUrl + '/applications';
  
  constructor(
    private http: HttpClient
  ) {}

  private get httpOptions() {
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return {
      headers: new HttpHeaders(headers),
      withCredentials: true
    };
  }

  getAllApplications(): Observable<Application[]> {
    const url = `${this.baseUrl}/getAll`;
    console.log('ApplicationService: Making API call to:', url);
    
    return this.http.get<Application[]>(url, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: API Response:', response);
        console.log('ApplicationService: Response type:', typeof response);
        console.log('ApplicationService: Is array:', Array.isArray(response));
      }),
      catchError(this.handleError)
    );
  }

  searchApplications(query: string): Observable<Application[]> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    console.log('ApplicationService: Making search API call to:', url);
    
    return this.http.get<Application[]>(url, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Search API Response:', response);
      }),
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('ApplicationService: HTTP Error occurred:', error);
    console.error('ApplicationService: Error status:', error.status);
    console.error('ApplicationService: Error message:', error.message);
    console.error('ApplicationService: Error body:', error.error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Cannot connect to server. Please check your network connection.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          // Optionally remove token on 401
          localStorage.removeItem('auth_token');
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'API endpoint not found. Please check the backend API configuration.';
          break;
        case 422:
          errorMessage = 'Invalid data provided. Please check your input.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please check the backend logs.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE html>')) {
            errorMessage = 'Received HTML instead of JSON. This indicates a routing/proxy configuration issue.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
          }
      }
    }
    
    console.error('ApplicationService: Final error message:', errorMessage);
    return throwError(() => ({ error: { message: errorMessage } }));
  };
}