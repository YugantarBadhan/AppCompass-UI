import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApplicationService,
  Application,
} from '../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-library.html',
  styleUrls: ['./app-library.css'],
})
export class AppLibraryComponent implements OnInit, OnDestroy {
  applications: Application[] = []; // List of applications to render
  searchTerm: string = ''; // User input for search
  isLoading: boolean = true; // Loading spinner for first load
  isSearching: boolean = false; // Show spinner while searching
  error: string | null = null; // Error message for failed loads
  Math = Math; // To use Math in template

  isSearchAnimating: boolean = false; // Search animation trigger
  private searchSubject = new Subject<string>(); // Debounce subject for search

  // Pagination state
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;
  jumpToPage: number | null = null;

  flippedCardId: number | null = null; // Card flip state

  // Spoc contact state
  showSpocPopup: boolean = false;
  spocPopupMessage: string = '';

  private supportsPagination: boolean = true; // Whether backend supports pagination
  private supportsSearch: boolean = true; // Whether backend supports search

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadApplications(); // Initial load
  }

  ngOnDestroy(): void {
    this.searchSubject.complete(); // Clean up
  }

  /**
   * Toggle favorite status of an application using the isFavorite flag from backend
   */
  toggleFavorite(event: Event, app: Application): void {
    event.stopPropagation();

    app.favorite = !app.favorite; // toggle locally for UI

    const apiCall = app.favorite
      ? this.applicationService.addToFavorites(app.appId)
      : this.applicationService.removeFromFavorites(app.appId);

    apiCall.subscribe({
      next: () => {
        console.log(
          `Application ${app.appId} favorite status updated to ${app.favorite}`
        );
      },
      error: (error) => {
        console.error('Error updating favorite status:', error);
        app.favorite = !app.favorite; // rollback on failure
      },
    });
  }

  /**
   * Check if application is favorite - uses backend-provided field
   */
  isFavorite(app: Application): boolean {
    return app.favorite === true;
  }

  /**
   * Handle Contact Spoc button click
   */
  contactSpoc(event: Event, app: Application): void {
    event.stopPropagation();

    // Check if email array exists and has emails
    if (!app.email || !Array.isArray(app.email) || app.email.length === 0) {
      // Show popup for no emails
      this.spocPopupMessage = 'No Spoc assigned to this application.';
      this.showSpocPopup = true;
      return;
    }

    // Filter out empty emails and create comma-separated string
    const validEmails = app.email.filter(
      (email) => email && email.trim() !== ''
    );

    if (validEmails.length === 0) {
      this.spocPopupMessage =
        'No valid Spoc email assigned to this application.';
      this.showSpocPopup = true;
      return;
    }

    // Create mailto link with comma-separated emails
    const emailList = validEmails.join(',');
    const subject = encodeURIComponent(`Regarding ${app.appName} Application`);
    const mailtoUrl = `mailto:${emailList}?subject=${subject}`;

    // Open default email client
    window.location.href = mailtoUrl;
  }

  /**
   * Close the Spoc popup
   */
  closeSpocPopup(): void {
    this.showSpocPopup = false;
    this.spocPopupMessage = '';
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.performBackendSearch(searchTerm);
      });
  }

  loadApplications(page: number = 1, search: string = ''): void {
    this.isLoading = page === 1;
    this.isSearching = search.length > 0;
    this.error = null;

    const params = {
      page: page,
      limit: this.itemsPerPage,
      search: search.trim(),
    };

    this.applicationService.getApplicationsWithPagination(params).subscribe({
      next: (response) => {
        this.applications = response.data || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || page;
        this.isLoading = false;
        this.isSearching = false;
        this.supportsPagination = response.totalPages > 0;
      },
      error: (error) => {
        this.handleLoadError(error);
      },
    });
  }

  private handleLoadError(error: any): void {
    console.error('Component: Error loading applications', error);

    if (this.supportsPagination && this.searchTerm.trim() === '') {
      console.log('Component: Attempting fallback to getAll');
      this.fallbackToGetAll();
    } else {
      this.error = error.error?.message || 'Failed to load applications';
      this.applications = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.isLoading = false;
      this.isSearching = false;
      this.supportsPagination = false;
    }
  }

  private fallbackToGetAll(): void {
    console.log('Component: Using getAll fallback');
    this.applicationService.getAllApplications().subscribe({
      next: (applications) => {
        this.applications = applications || [];
        this.totalItems = this.applications.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.isLoading = false;
        this.isSearching = false;
        this.supportsPagination = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load applications';
        this.applications = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.isSearching = false;
        console.error('Component: Fallback to getAll also failed', error);
      },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.triggerSearchAnimation();
    this.performBackendSearch(this.searchTerm);
  }

  private triggerSearchAnimation(): void {
    this.isSearchAnimating = true;
    setTimeout(() => {
      this.isSearchAnimating = false;
    }, 600);
  }

  private performBackendSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;

    if (searchTerm.trim() === '') {
      this.loadApplications(1, '');
    } else {
      this.loadApplications(1, searchTerm);
    }
  }

  refreshApplications(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.supportsPagination = true;
    this.supportsSearch = true;
    this.loadApplications(1, '');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.loadApplications(1, '');
  }

  getApplicationIcon(app: Application): string {
    return app.icon || app.initials || app.appName.charAt(0).toUpperCase();
  }

  getApplicationGradient(app: Application): string {
    if (app.gradientColors && app.gradientColors.length >= 2) {
      return `linear-gradient(135deg, ${app.gradientColors[0]}, ${app.gradientColors[1]})`;
    }
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  get paginatedApplications(): Application[] {
    if (this.supportsPagination) {
      return this.applications;
    } else {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.applications.slice(startIndex, endIndex);
    }
  }

  get paginationItems(): Array<{ type: 'page' | 'ellipsis'; value: number }> {
    const items: Array<{ type: 'page' | 'ellipsis'; value: number }> = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', value: i });
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          items.push({ type: 'page', value: i });
        }
        items.push({ type: 'ellipsis', value: 0 });
        items.push({ type: 'page', value: totalPages });
      } else if (currentPage >= totalPages - 3) {
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis', value: 0 });
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push({ type: 'page', value: i });
        }
      } else {
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis', value: 0 });
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push({ type: 'page', value: i });
        }
        items.push({ type: 'ellipsis', value: 0 });
        items.push({ type: 'page', value: totalPages });
      }
    }
    return items;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.flippedCardId = null;
      this.jumpToPage = null;

      if (this.supportsPagination) {
        this.loadApplications(page, this.searchTerm);
      } else {
        this.currentPage = page;
      }
    }
  }

  goToFirstPage(): void {
    this.changePage(1);
  }

  goToLastPage(): void {
    this.changePage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  performPageJump(): void {
    if (
      this.jumpToPage &&
      this.jumpToPage >= 1 &&
      this.jumpToPage <= this.totalPages
    ) {
      this.changePage(this.jumpToPage);
    }
  }

  isAnyCardFlipped(): boolean {
    return this.flippedCardId !== null;
  }

  handleCardClick(cardId: number): void {
    if (this.flippedCardId === null) {
      this.flippedCardId = cardId;
    }
  }

  closeFlip(event: Event): void {
    event.stopPropagation();
    this.flippedCardId = null;
  }

  get resultsStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get resultsEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get shouldShowPagination(): boolean {
    return this.totalPages > 1 && !this.isLoading && !this.error;
  }
}
