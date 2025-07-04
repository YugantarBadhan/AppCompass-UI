import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
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

export interface PaginatedApplicationResponse {
  data: Application[];
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
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

  /**
   * Get all applications without pagination (legacy method)
   */
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

  /**
   * Get applications with pagination and search
   * Falls back to client-side pagination if backend doesn't support paginated endpoint
   */
  getApplicationsWithPagination(params: PaginationParams): Observable<PaginatedApplicationResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    // Try paginated endpoint first
    const paginatedUrl = `${this.baseUrl}/paginated`;
    console.log('ApplicationService: Making paginated API call to:', paginatedUrl);
    console.log('ApplicationService: Params:', params);
    
    return this.http.get<PaginatedApplicationResponse>(paginatedUrl, {
      ...this.httpOptions,
      params: httpParams
    }).pipe(
      tap(response => {
        console.log('ApplicationService: Paginated API Response:', response);
        console.log('ApplicationService: Total items:', response.total);
        console.log('ApplicationService: Current page:', response.currentPage);
        console.log('ApplicationService: Total pages:', response.totalPages);
      }),
      catchError(error => {
        console.warn('ApplicationService: Paginated endpoint failed, falling back to getAll with client-side pagination');
        return this.fallbackToClientSidePagination(params);
      })
    );
  }

  /**
   * Fallback to client-side pagination when backend doesn't support paginated endpoint
   */
  private fallbackToClientSidePagination(params: PaginationParams): Observable<PaginatedApplicationResponse> {
    // If search is provided, use search endpoint, otherwise use getAll
    const dataObservable = params.search && params.search.trim() 
      ? this.searchApplications(params.search.trim())
      : this.getAllApplications();

    return dataObservable.pipe(
      map(applications => {
        // Client-side pagination
        const startIndex = (params.page - 1) * params.limit;
        const endIndex = startIndex + params.limit;
        const paginatedData = applications.slice(startIndex, endIndex);
        
        const totalPages = Math.ceil(applications.length / params.limit);
        
        return {
          data: paginatedData,
          total: applications.length,
          totalPages: totalPages,
          currentPage: params.page,
          itemsPerPage: params.limit
        };
      }),
      tap(response => {
        console.log('ApplicationService: Client-side paginated response:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search applications with enhanced error handling
   */
  searchApplications(query: string): Observable<Application[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${this.baseUrl}/search?query=${encodedQuery}`;
    console.log('ApplicationService: Making search API call to:', url);
    
    return this.http.get<Application[]>(url, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Search API Response:', response);
      }),
      catchError(error => {
        console.warn('ApplicationService: Search endpoint failed, falling back to getAll with client-side filtering');
        return this.fallbackToClientSideSearch(query);
      })
    );
  }

  /**
   * Fallback to client-side search when backend search fails
   */
  private fallbackToClientSideSearch(query: string): Observable<Application[]> {
    return this.getAllApplications().pipe(
      map(applications => {
        const searchTerm = query.toLowerCase();
        return applications.filter(app => 
          app.appName.toLowerCase().includes(searchTerm) ||
          app.appDescription.toLowerCase().includes(searchTerm)
        );
      }),
      tap(filteredApps => {
        console.log('ApplicationService: Client-side search results:', filteredApps);
      })
    );
  }

  /**
   * Get a single application by ID
   */
  getApplicationById(id: number): Observable<Application> {
    const url = `${this.baseUrl}/${id}`;
    console.log('ApplicationService: Making get by ID API call to:', url);
    
    return this.http.get<Application>(url, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Get by ID API Response:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new application
   */
  createApplication(application: Omit<Application, 'appId'>): Observable<Application> {
    const url = `${this.baseUrl}`;
    console.log('ApplicationService: Making create API call to:', url);
    
    return this.http.post<Application>(url, application, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Create API Response:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing application
   */
  updateApplication(id: number, application: Partial<Application>): Observable<Application> {
    const url = `${this.baseUrl}/${id}`;
    console.log('ApplicationService: Making update API call to:', url);
    
    return this.http.put<Application>(url, application, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Update API Response:', response);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete an application
   */
  deleteApplication(id: number): Observable<void> {
    const url = `${this.baseUrl}/${id}`;
    console.log('ApplicationService: Making delete API call to:', url);
    
    return this.http.delete<void>(url, this.httpOptions).pipe(
      tap(() => {
        console.log('ApplicationService: Delete API call completed');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Toggle application active status
   */
  toggleApplicationStatus(id: number): Observable<Application> {
    const url = `${this.baseUrl}/${id}/toggle-status`;
    console.log('ApplicationService: Making toggle status API call to:', url);
    
    return this.http.patch<Application>(url, {}, this.httpOptions).pipe(
      tap(response => {
        console.log('ApplicationService: Toggle status API Response:', response);
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