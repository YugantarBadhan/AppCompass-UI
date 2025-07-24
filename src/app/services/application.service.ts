import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/* =====================================================
   ▸  Interfaces
   ===================================================== */
export interface Application {
  appId: number;
  appName: string;
  appDescription: string;
  active: boolean;
  favorite?: boolean;
  icon?: string;
  initials?: string;
  gradientColors?: string[];
  email?: string[];
}

export interface ApplicationDetails {
  applicationName: string;
  description: string;
  spocName: string;
  teamName: string;
  active: boolean;
}

export interface FavoriteApp {
  appId: number;
  appName: string;
  appDescription: string;
  isActive: boolean;
  spocName: string;
  teamName: string;
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

/** ▸ Team & AppSpoc interfaces for Explore tab */
export interface Team {
  teamId: number;
  teamName: string;
  teamDescription: string;
  active: boolean;
}

export interface AppSpoc {
  spocId: number;
  spocName: string;
  spocDesignation: string;
  email: string;
  teamId: number;
  teamName: string;
  active: boolean;
}

/* =====================================================
   ▸  Service
   ===================================================== */
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly baseUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  /* -------------------------------------------------- */
  /* Helpers                                            */
  /* -------------------------------------------------- */

  /** Raw JWT (or null) */
  private getAccessToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /** HTTP options (adds bearer token if present) */
  private get httpOptions() {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return { headers: new HttpHeaders(headers), withCredentials: true };
  }

  /* -------------------------------------------------- */
  /* CRUD & listing                                     */
  /* -------------------------------------------------- */

  getAllApplications(): Observable<Application[]> {
    return this.http
      .get<Application[]>(`${this.baseUrl}/getAll`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getApplicationsWithPagination(
    params: PaginationParams
  ): Observable<PaginatedApplicationResponse> {
    let p = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());
    if (params.search?.trim()) p = p.set('search', params.search.trim());

    return this.http
      .get<PaginatedApplicationResponse>(`${this.baseUrl}/paginated`, {
        ...this.httpOptions,
        params: p,
      })
      .pipe(catchError(() => this.fallbackToClientSidePagination(params)));
  }

  private fallbackToClientSidePagination(
    params: PaginationParams
  ): Observable<PaginatedApplicationResponse> {
    const src$ = params.search?.trim()
      ? this.searchApplications(params.search.trim())
      : this.getAllApplications();

    return src$.pipe(
      map((apps) => {
        const start = (params.page - 1) * params.limit;
        const data = apps.slice(start, start + params.limit);
        return {
          data,
          total: apps.length,
          totalPages: Math.ceil(apps.length / params.limit),
          currentPage: params.page,
          itemsPerPage: params.limit,
        } as PaginatedApplicationResponse;
      }),
      catchError(this.handleError)
    );
  }

  searchApplications(query: string): Observable<Application[]> {
    const params = new HttpParams().set('query', query.trim());
    return this.http
      .get<Application[]>(`${this.baseUrl}/search`, {
        ...this.httpOptions,
        params,
      })
      .pipe(catchError(() => this.fallbackToClientSideSearch(query)));
  }

  private fallbackToClientSideSearch(q: string): Observable<Application[]> {
    return this.getAllApplications().pipe(
      map((apps) => {
        const term = q.toLowerCase();
        return apps.filter(
          (a) =>
            a.appName.toLowerCase().includes(term) ||
            a.appDescription.toLowerCase().includes(term)
        );
      })
    );
  }

  getApplicationById(id: number) {
    return this.http
      .get<Application>(`${this.baseUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // Keep the old method for backward compatibility
  toggleApplicationStatus(id: number) {
    return this.http
      .patch<Application>(
        `${this.baseUrl}/${id}/toggle-status`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  addToFavorites(appId: number): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/favoriteApp/${appId}`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  removeFromFavorites(appId: number): Observable<unknown> {
    return this.http
      .delete(`${this.baseUrl}/remove/favoriteApp/${appId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  /** Get favorite applications with full info by app name*/
  getApplicationDetailsByName(appName: string): Observable<ApplicationDetails> {
    const params = new HttpParams().set('name', appName);
    return this.http
      .get<ApplicationDetails>(`${this.baseUrl}/detailsByName`, {
        ...this.httpOptions,
        params,
      })
      .pipe(catchError(this.handleError));
  }

  /** ▸ Get all teams for "View Teams" */
  getAllTeams(): Observable<Team[]> {
    return this.http
      .get<Team[]>(`${this.baseUrl}/getAll/teams`, this.httpOptions)
      .pipe(
        tap((data) => console.log('Teams API Response:', data)),
        catchError((error) => {
          console.error('Error in getAllTeams:', error);
          return this.handleError(error);
        })
      );
  }

  /** ▸ Get all application SPOCs for "View Application Spocs" */
  getAllAppSpocs(): Observable<AppSpoc[]> {
    return this.http
      .get<AppSpoc[]>(`${this.baseUrl}/appspoc`, this.httpOptions)
      .pipe(
        tap((data) => console.log('AppSpocs API Response:', data)),
        catchError((error) => {
          console.error('Error in getAllAppSpocs:', error);
          return this.handleError(error);
        })
      );
  }

  //** ▸ Get all applications for a specific team: "View Applications by Team" */
  getAllAppByTeam(teamName: string): Observable<any> {
    const url = `${this.baseUrl}/filterByTeamName?name=${encodeURIComponent(
      teamName
    )}`;

    return this.http.get(url, this.httpOptions).pipe(
      tap((data) =>
        console.log('Filtered Applications by Team Response:', data)
      ),
      catchError((error) => {
        console.error('Error in getAllAppByTeam:', error);
        return this.handleError(error);
      })
    );
  }

  //** ▸ Get all applications for a specific spocs: "View Applications by SPOCs" */
  getAllAppBySpocs(appSpocName: string): Observable<any> {
    const url = `${this.baseUrl}/filterBySpocName?name=${encodeURIComponent(
      appSpocName
    )}`;

    return this.http.get(url, this.httpOptions).pipe(
      tap((data) =>
        console.log('Filtered Applications by Spoc Response:', data)
      ),
      catchError((error) => {
        console.error('Error in getAllAppBySpocs:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Applications Management
   */
  // Register a new application
  registerApplication(applicationData: {
    appName: string;
    appDescription: string;
  }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/register`, applicationData, this.httpOptions)
      .pipe(
        tap((response) =>
          console.log('Register Application Response:', response)
        ),
        catchError(this.handleError)
      );
  }

  //  Update an existing application
  updateApplication(
    appId: number,
    applicationData: { appName: string; appDescription: string }
  ): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/update/${appId}`, applicationData, this.httpOptions)
      .pipe(
        tap((response) =>
          console.log('Update Application Response:', response)
        ),
        catchError(this.handleError)
      );
  }

  // Method for deactivate application
  deactivateApplication(id: number): Observable<Application> {
    return this.http
      .patch<Application>(
        `${this.baseUrl}/deactivate/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  // Method for reactivate application
  reactivateApplication(id: number): Observable<Application> {
    return this.http
      .patch<Application>(
        `${this.baseUrl}/reactivate/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Teams Management
   */
  // Register a new team
  registerTeam(teamData: {
    teamName: string;
    teamDescription: string;
  }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/register/teams`, teamData, this.httpOptions)
      .pipe(
        tap((response) => console.log('Register Team Response:', response)),
        catchError(this.handleError)
      );
  }

  //  Update an existing team
  updateTeam(
    teamId: number,
    teamData: { teamName: string; teamDescription: string }
  ): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/update/team/${teamId}`, teamData, this.httpOptions)
      .pipe(
        tap((response) => console.log('Update Team Response:', response)),
        catchError(this.handleError)
      );
  }

  // Method for deactivate team
  deactivateTeam(id: number): Observable<Team> {
    return this.http
      .patch<Team>(
        `${this.baseUrl}/deactivate/team/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  // Method for reactivate application
  reactivateTeam(id: number): Observable<Team> {
    return this.http
      .patch<Team>(
        `${this.baseUrl}/reactivate/team/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * SPOC Management
   */
  // Register a new SPOC
  registerSpoc(spocData: {
    spocName: string;
    spocDesignation: string;
    email: string;
    teamId: number;
  }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/register/spoc`, spocData, this.httpOptions)
      .pipe(
        tap((response) => console.log('Register SPOC Response:', response)),
        catchError(this.handleError)
      );
  }

  // Update an existing SPOC
  updateSpoc(
    spocId: number,
    spocData: {
      spocName: string;
      spocDesignation: string;
      email: string;
      teamId: number;
    }
  ): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/update/spoc/${spocId}`, spocData, this.httpOptions)
      .pipe(
        tap((response) => console.log('Update SPOC Response:', response)),
        catchError(this.handleError)
      );
  }

  // Method for deactivate SPOC
  deactivateSpoc(id: number): Observable<AppSpoc> {
    return this.http
      .patch<AppSpoc>(
        `${this.baseUrl}/deactivate/spoc/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  // Method for reactivate SPOC
  reactivateSpoc(id: number): Observable<AppSpoc> {
    return this.http
      .patch<AppSpoc>(
        `${this.baseUrl}/reactivate/spoc/${id}`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  // Method to assign SPOC to application
  assignSpocToApplication(appId: number, spocId: number): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/${appId}/spoc/${spocId}`, {}, this.httpOptions)
      .pipe(
        tap((response) =>
          console.log('Assign SPOC to App Response:', response)
        ),
        catchError(this.handleError)
      );
  }

  /* -------------------------------------------------- */
  /* Error handler                                      */
  /* -------------------------------------------------- */

  private handleError = (error: HttpErrorResponse) => {
    let message = 'An unknown error occurred.';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      switch (error.status) {
        case 0:
          message = 'Cannot connect to server.';
          break;
        case 401:
          message = 'Unauthorized. Please log in again.';
          // localStorage.removeItem('auth_token');
          break;
        case 403:
          message = 'Access denied.';
          break;
        case 404:
          message = 'Endpoint not found.';
          break;
        case 422:
          message = 'Invalid data provided.';
          break;
        case 429:
          message = 'Too many requests. Try again later.';
          break;
        case 500:
          message = 'Internal server error.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable.';
          break;
        default:
          message =
            typeof error.error === 'string' &&
            error.error.includes('<!DOCTYPE html>')
              ? 'HTML response received – likely a routing/proxy issue.'
              : error.error?.message ||
                `Server Error: ${error.status} - ${error.statusText}`;
      }
    }
    return throwError(() => ({ error: { message } }));
  };
}
