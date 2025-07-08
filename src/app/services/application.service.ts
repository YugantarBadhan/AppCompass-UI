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

  /** Raw JWT (or null) */
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
  createApplication(app: Omit<Application, 'appId'>) {
    return this.http
      .post<Application>(this.baseUrl, app, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  updateApplication(id: number, app: Partial<Application>) {
    return this.http
      .put<Application>(`${this.baseUrl}/${id}`, app, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  deleteApplication(id: number) {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  toggleApplicationStatus(id: number) {
    return this.http
      .patch<Application>(
        `${this.baseUrl}/${id}/toggle-status`,
        {},
        this.httpOptions
      )
      .pipe(catchError(this.handleError));
  }

  /* -------------------------------------------------- */
  /* Favourites (no user‑id in URL)                      */
  /* -------------------------------------------------- */

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

  getFavoriteApplications(): Observable<number[]> {
    return this.http
      .get<number[]>(`${this.baseUrl}/favoriteApp`, this.httpOptions)
      .pipe(catchError(this.handleError));
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
          localStorage.removeItem('auth_token');
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
