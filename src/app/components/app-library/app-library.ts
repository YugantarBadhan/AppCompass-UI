import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService, Application } from '../../services/application.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-library.html',
  styleUrls: ['./app-library.css']
})
export class AppLibraryComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  isSearching: boolean = false;
  error: string | null = null;
  Math = Math;

  // Search debounce subject
  private searchSubject = new Subject<string>();

  // Enhanced Pagination Properties
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  totalPages: number = 0;
  jumpToPage: number | null = null;

  // Card flip functionality
  flippedCardId: number | null = null;

  // Backend capability flags
  private supportsPagination: boolean = true;
  private supportsSearch: boolean = true;

  constructor(private applicationService: ApplicationService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /**
   * Setup search debounce to avoid too many API calls
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only emit if value is different from previous
      )
      .subscribe(searchTerm => {
        this.performBackendSearch(searchTerm);
      });
  }

  /**
   * Load applications from backend with pagination and search
   */
  loadApplications(page: number = 1, search: string = ''): void {
    this.isLoading = page === 1; // Show main loading only for first page
    this.isSearching = search.length > 0;
    this.error = null;

    const params = {
      page: page,
      limit: this.itemsPerPage,
      search: search.trim()
    };

    // Use the enhanced service method that handles fallbacks
    this.applicationService.getApplicationsWithPagination(params).subscribe({
      next: (response) => {
        this.applications = response.data || [];
        this.totalItems = response.total || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || page;
        this.isLoading = false;
        this.isSearching = false;
        
        // Update capability flags based on response
        this.supportsPagination = response.totalPages > 0;
        
        console.log('Component: Loaded applications successfully', {
          totalItems: this.totalItems,
          totalPages: this.totalPages,
          currentPage: this.currentPage,
          applicationsCount: this.applications.length
        });
      },
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  /**
   * Handle loading errors with fallback strategies
   */
  private handleLoadError(error: any): void {
    console.error('Component: Error loading applications', error);
    
    // Try fallback to getAll if pagination fails
    if (this.supportsPagination && this.searchTerm.trim() === '') {
      console.log('Component: Attempting fallback to getAll');
      this.fallbackToGetAll();
    } else {
      // Show error to user
      this.error = error.error?.message || 'Failed to load applications';
      this.applications = [];
      this.totalItems = 0;
      this.totalPages = 0;
      this.isLoading = false;
      this.isSearching = false;
      this.supportsPagination = false;
    }
  }

  /**
   * Fallback to getAll when pagination fails
   */
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
        this.supportsPagination = false; // Disable pagination since we're using getAll
        
        console.log('Component: Fallback to getAll successful', {
          totalItems: this.totalItems,
          applicationsCount: this.applications.length
        });
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load applications';
        this.applications = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.isLoading = false;
        this.isSearching = false;
        console.error('Component: Fallback to getAll also failed', error);
      }
    });
  }

  /**
   * Handle search input with debounce
   */
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Handle search button click (immediate search)
   */
  onSearch(): void {
    this.performBackendSearch(this.searchTerm);
  }

  /**
   * Perform backend search and reset pagination
   */
  private performBackendSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    
    if (searchTerm.trim() === '') {
      // Empty search - load all applications
      this.loadApplications(1, '');
    } else {
      // Perform search
      this.loadApplications(1, searchTerm);
    }
  }

  /**
   * Refresh applications - reset everything and reload
   */
  refreshApplications(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.jumpToPage = null;
    this.flippedCardId = null;
    this.supportsPagination = true; // Reset capability flags
    this.supportsSearch = true;
    this.loadApplications(1, '');
  }

  /**
   * Clear search and reset to show all applications
   */
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

  // Enhanced Pagination Methods

  /**
   * Get current page applications
   */
  get paginatedApplications(): Application[] {
    if (this.supportsPagination) {
      // Backend pagination - return as is
      return this.applications;
    } else {
      // Client-side pagination for getAll fallback
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.applications.slice(startIndex, endIndex);
    }
  }

  /**
   * Generate smart pagination items (pages + ellipsis)
   */
  get paginationItems(): Array<{type: 'page' | 'ellipsis', value: number}> {
    const items: Array<{type: 'page' | 'ellipsis', value: number}> = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        items.push({type: 'page', value: i});
      }
    } else {
      // Smart pagination for more than 7 pages
      if (currentPage <= 4) {
        // Near the beginning: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          items.push({type: 'page', value: i});
        }
        items.push({type: 'ellipsis', value: 0});
        items.push({type: 'page', value: totalPages});
      } else if (currentPage >= totalPages - 3) {
        // Near the end: 1, ..., last-4, last-3, last-2, last-1, last
        items.push({type: 'page', value: 1});
        items.push({type: 'ellipsis', value: 0});
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push({type: 'page', value: i});
        }
      } else {
        // In the middle: 1, ..., current-1, current, current+1, ..., last
        items.push({type: 'page', value: 1});
        items.push({type: 'ellipsis', value: 0});
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push({type: 'page', value: i});
        }
        items.push({type: 'ellipsis', value: 0});
        items.push({type: 'page', value: totalPages});
      }
    }
    return items;
  }

  /**
   * Navigate to a specific page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.flippedCardId = null; // Reset flipped card when changing pages
      this.jumpToPage = null; // Reset jump input
      
      if (this.supportsPagination) {
        // Backend pagination
        this.loadApplications(page, this.searchTerm);
      } else {
        // Client-side pagination
        this.currentPage = page;
      }
    }
  }

  /**
   * Go to the first page
   */
  goToFirstPage(): void {
    this.changePage(1);
  }

  /**
   * Go to the last page
   */
  goToLastPage(): void {
    this.changePage(this.totalPages);
  }

  /**
   * Go to the previous page
   */
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  /**
   * Go to the next page
   */
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  /**
   * Jump to a specific page using the input field
   */
  performPageJump(): void {
    if (this.jumpToPage && this.jumpToPage >= 1 && this.jumpToPage <= this.totalPages) {
      this.changePage(this.jumpToPage);
    }
  }

  /**
   * Check if any card is currently flipped
   */
  isAnyCardFlipped(): boolean {
    return this.flippedCardId !== null;
  }

  /**
   * Handle card click - only flip if no other card is flipped
   */
  handleCardClick(cardId: number): void {
    // Only allow flipping if no card is currently flipped
    if (this.flippedCardId === null) {
      this.flippedCardId = cardId;
    }
    // If the same card is clicked while it's flipped, do nothing
    // User must use the X button to close
  }

  /**
   * Close the flipped card using the X button
   */
  closeFlip(event: Event): void {
    event.stopPropagation();
    this.flippedCardId = null;
  }

  /**
   * Get the start index for results summary
   */
  get resultsStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  /**
   * Get the end index for results summary
   */
  get resultsEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  /**
   * Check if pagination should be shown
   */
  get shouldShowPagination(): boolean {
    return this.totalPages > 1 && !this.isLoading && !this.error;
  }
}